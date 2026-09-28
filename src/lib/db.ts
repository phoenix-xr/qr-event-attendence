import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set in environment variables');
}

export const sql = neon(process.env.DATABASE_URL || '');
