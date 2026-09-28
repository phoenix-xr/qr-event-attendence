import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function benchmark() {
  console.log('Testing query latency...');

  // 1. Initial connection / TLS handshake / cold start
  const t0 = performance.now();
  await sql`SELECT 1`;
  const t1 = performance.now();
  console.log(`1. Connection / TLS handshake time: ${Math.round(t1 - t0)}ms`);

  // 2. Direct exact match query (uses UNIQUE index)
  const t2 = performance.now();
  await sql`
    SELECT name, email, roll_number, branch, college_year, institution, team_name, is_leader
    FROM participants
    WHERE email = 'sahilsharma3043@gmail.com'
    LIMIT 1;
  `;
  const t3 = performance.now();
  console.log(`2. Exact email query: ${Math.round(t3 - t2)}ms`);

  // 3. Functional search query (bypasses index if not indexed)
  const t4 = performance.now();
  await sql`
    SELECT name, email, roll_number, branch, college_year, institution, team_name, is_leader
    FROM participants
    WHERE LOWER(TRIM(email)) = LOWER('sahilsharma3043@gmail.com')
    LIMIT 1;
  `;
  const t5 = performance.now();
  console.log(`3. LOWER(TRIM(email)) query: ${Math.round(t5 - t4)}ms`);

  // 4. Test prefetching all 188 participants in 1 query
  const t6 = performance.now();
  const all = await sql`
    SELECT name, email, roll_number, branch, college_year, institution, team_name, is_leader
    FROM participants;
  `;
  const t7 = performance.now();
  console.log(`4. Full roster fetch (${all.length} rows): ${Math.round(t7 - t6)}ms`);
}

benchmark();
