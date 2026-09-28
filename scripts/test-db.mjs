import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function test() {
  console.log('Querying participants from NeonDB...');
  try {
    const rows = await sql`
      SELECT name, email, roll_number, branch, college_year, institution, team_name, is_leader, token
      FROM participants
      LIMIT 3;
    `;
    console.log('Results:', rows);
  } catch (err) {
    console.error('NeonDB error:', err);
  }
}

test();
