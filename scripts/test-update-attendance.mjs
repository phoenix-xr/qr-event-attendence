import 'dotenv/config';
import { google } from 'googleapis';

const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const rawKey = process.env.GOOGLE_PRIVATE_KEY;
const private_key = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: { client_email, private_key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function test() {
  console.log('Fetching Row 2 before test...');
  const before = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A2:L2',
  });
  console.log('Row 2 before:', before.data.values);

  console.log('Updating Row 2 (Sahil Sharma) to PRESENT in Column L...');
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Sheet1!L2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['PRESENT']] },
  });

  const after = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A2:L2',
  });
  console.log('Row 2 after:', after.data.values);

  // Set back to ABSENT
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Sheet1!L2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['ABSENT']] },
  });
  console.log('Reset back to ABSENT.');
}

test();
