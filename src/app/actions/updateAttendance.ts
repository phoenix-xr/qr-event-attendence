'use server';

import { google } from 'googleapis';

export interface UpdateAttendanceResult {
  success: boolean;
  message?: string;
  status?: 'PRESENT' | 'ABSENT';
  updatedRow?: number;
}

// In-memory cache for fast row index lookup: email (lowercase) -> rowIndex (1-indexed)
let emailToRowMap = new Map<string, number>();
let lastSheetFetch = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

function getSheetsClient() {
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const private_key = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!client_email || !private_key || !spreadsheetId) {
    throw new Error('Google service account credentials or sheet ID missing in .env');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

// Build index mapping for all rows in the sheet
async function ensureRowIndexMap() {
  const now = Date.now();
  if (emailToRowMap.size > 0 && now - lastSheetFetch < CACHE_TTL_MS) {
    return emailToRowMap;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!D:D', // Email column (Column D)
  });

  const emailRows = res.data.values || [];
  const map = new Map<string, number>();

  emailRows.forEach((row, idx) => {
    if (row && row[0]) {
      const email = String(row[0]).trim().toLowerCase();
      // Row index is 1-indexed in Google Sheets: row 0 is Row 1
      map.set(email, idx + 1);
    }
  });

  emailToRowMap = map;
  lastSheetFetch = now;
  return emailToRowMap;
}

export async function updateAttendanceStatus(
  email: string,
  newStatus: 'PRESENT' | 'ABSENT'
): Promise<UpdateAttendanceResult> {
  if (!email || !email.trim()) {
    return { success: false, message: 'Invalid email address' };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { sheets, spreadsheetId } = getSheetsClient();

    // 1. Find the row index for this email
    let map = await ensureRowIndexMap();
    let targetRow = map.get(cleanEmail);

    // If not found in cache, re-fetch fresh sheet data
    if (!targetRow) {
      lastSheetFetch = 0;
      map = await ensureRowIndexMap();
      targetRow = map.get(cleanEmail);
    }

    if (!targetRow) {
      return {
        success: false,
        message: `Email "${cleanEmail}" not found in Google Sheet.`,
      };
    }

    // 2. Update Column L (Attendance) for this specific row
    const cellRange = `Sheet1!L${targetRow}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newStatus]],
      },
    });

    console.log(`Updated Google Sheet: Row ${targetRow} (${cleanEmail}) set to ${newStatus}`);

    return {
      success: true,
      status: newStatus,
      updatedRow: targetRow,
      message: `Successfully marked ${newStatus}`,
    };
  } catch (error) {
    console.error('Error updating attendance in Google Sheets:', error);
    return {
      success: false,
      message: (error as Error)?.message || 'Failed to update Google Sheet',
    };
  }
}

export async function getAttendanceStatus(email: string): Promise<'PRESENT' | 'ABSENT' | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    const map = await ensureRowIndexMap();
    const targetRow = map.get(cleanEmail);

    if (!targetRow) return null;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!L${targetRow}`,
    });

    const val = res.data.values?.[0]?.[0];
    if (val === 'PRESENT' || val === 'ABSENT') {
      return val;
    }
    return 'ABSENT';
  } catch {
    return null;
  }
}
