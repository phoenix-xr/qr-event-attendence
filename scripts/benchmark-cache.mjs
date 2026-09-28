import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const cache = new Map();

async function getCached(email) {
  const key = email.toLowerCase().trim();
  if (cache.has(key)) {
    return { data: cache.get(key), source: 'cache' };
  }
  const rows = await sql`
    SELECT name, email, phone_number, roll_number, branch, college_year, institution, team_name, is_leader, token
    FROM participants
    WHERE email = ${key} OR LOWER(email) = ${key} OR token = ${email}
    LIMIT 1;
  `;
  if (rows.length > 0) {
    cache.set(key, rows[0]);
    if (rows[0].token) cache.set(rows[0].token, rows[0]);
    return { data: rows[0], source: 'db' };
  }
  return { data: null, source: 'db' };
}

async function run() {
  console.log('1st lookup (DB fetch):');
  const t0 = performance.now();
  const res1 = await getCached('sahilsharma3043@gmail.com');
  console.log(`Took: ${Math.round(performance.now() - t0)}ms (source: ${res1.source})`);

  console.log('2nd lookup of same or cached participant:');
  const t1 = performance.now();
  const res2 = await getCached('sahilsharma3043@gmail.com');
  console.log(`Took: ${(performance.now() - t1).toFixed(2)}ms (source: ${res2.source})`);
}

run();
