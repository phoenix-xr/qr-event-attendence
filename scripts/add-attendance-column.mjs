import 'dotenv/config';
import { google } from 'googleapis';

async function fixAndInitializeAttendance() {
  console.log('Connecting to Google Sheets API...');

  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const private_key = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!client_email || !private_key || !spreadsheetId) {
    console.error('Missing credentials');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetName = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    // 1. Ensure Column B is 'ROLE', Column K is 'TOKEN', Column L is 'ATTENDANCE'
    const headersUpdate = [
      ['TEAM NAME', 'ROLE', 'NAME', 'EMAIL', 'PHONE NO', 'ROLL NO', 'INSTITUTION', 'YEAR', 'BRANCH', 'TIME', 'TOKEN', 'ATTENDANCE']
    ];

    console.log('Updating headers in A1:L1...');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:L1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: headersUpdate },
    });

    // 2. Get all row data to know row count
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:L`,
    });

    const rows = response.data.values || [];
    console.log(`Total rows in sheet: ${rows.length}`);

    if (rows.length > 1) {
      const attendanceValues = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // If column L (index 11) is already present and not empty, preserve it, else 'ABSENT'
        const currentAtt = row[11];
        if (!currentAtt || currentAtt.trim() === '') {
          attendanceValues.push(['ABSENT']);
        } else {
          attendanceValues.push([currentAtt]);
        }
      }

      console.log(`Writing "ABSENT" to column L (L2:L${rows.length})...`);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!L2:L${rows.length}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: attendanceValues },
      });

      console.log(`Successfully initialized Column L (ATTENDANCE) with "ABSENT" across ${attendanceValues.length} rows.`);
    }

    // 3. Also check registrationWebsite to see if future registrations should append 'ABSENT'
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixAndInitializeAttendance();
