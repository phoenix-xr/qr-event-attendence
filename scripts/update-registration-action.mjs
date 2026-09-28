import fs from 'fs';
import path from 'path';

const targetPath = path.resolve('../registrationWebsite/app/actions/register.ts');
if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf8');
  if (!content.includes("'ABSENT'")) {
    content = content.replace(
      /dateStr,\s*\r?\n\s*token\s*\r?\n\s*\]\);/,
      "dateStr,\n        token,\n        'ABSENT'\n      ]);"
    );
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Successfully updated registrationWebsite/app/actions/register.ts with "ABSENT" default for new registrations.');
  } else {
    console.log('register.ts already includes "ABSENT".');
  }
} else {
  console.log('registrationWebsite not found at', targetPath);
}
