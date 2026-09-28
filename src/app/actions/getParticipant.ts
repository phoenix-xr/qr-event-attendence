'use server';

import { sql } from '@/lib/db';

export interface ParticipantDetails {
  name: string;
  email: string;
  phone_number: string;
  roll_number: string;
  branch: string;
  college_year: string;
  institution: string;
  team_name: string;
  is_leader: boolean;
  token?: string;
}

export interface GetParticipantResult {
  success: boolean;
  message?: string;
  participant?: ParticipantDetails;
  latencyMs?: number;
  source?: 'cache' | 'neon';
}

// In-memory server cache for instantaneous O(1) lookups
const participantCache = new Map<string, ParticipantDetails>();
let isCacheWarmed = false;
let warmPromise: Promise<void> | null = null;

// Preload participants in background to eliminate cross-continent round-trip delay
async function warmCache(): Promise<void> {
  if (isCacheWarmed) return;
  if (warmPromise) return warmPromise;

  warmPromise = (async () => {
    try {
      const rows = await sql`
        SELECT name, email, phone_number, roll_number, branch, college_year, institution, team_name, is_leader, token
        FROM participants;
      `;
      for (const row of rows) {
        const item: ParticipantDetails = {
          name: row.name as string,
          email: (row.email as string).trim(),
          phone_number: row.phone_number as string,
          roll_number: row.roll_number as string,
          branch: row.branch as string,
          college_year: row.college_year as string,
          institution: row.institution as string,
          team_name: row.team_name as string,
          is_leader: Boolean(row.is_leader),
          token: row.token as string,
        };
        participantCache.set(item.email.toLowerCase(), item);
        if (item.token) {
          participantCache.set(item.token.trim(), item);
        }
      }
      isCacheWarmed = true;
      console.log(`NeonDB cache warmed with ${rows.length} participants.`);
    } catch (err) {
      console.warn('Failed to pre-warm NeonDB cache:', err);
    } finally {
      warmPromise = null;
    }
  })();

  return warmPromise;
}

// Automatically trigger cache pre-warming
warmCache().catch(() => {});

export async function getParticipantByEmail(scannedText: string): Promise<GetParticipantResult> {
  const startTime = Date.now();

  if (!scannedText || typeof scannedText !== 'string' || !scannedText.trim()) {
    return { success: false, message: 'Invalid or empty scan input' };
  }

  const trimmed = scannedText.trim();

  // Extract email if payload is JSON or mailto:
  let searchKey = trimmed;
  if (trimmed.startsWith('mailto:')) {
    searchKey = trimmed.replace(/^mailto:/i, '').trim();
  } else {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.email) searchKey = parsed.email;
      else if (parsed.Email) searchKey = parsed.Email;
    } catch {
      // Plain text
    }
  }

  searchKey = searchKey.replace(/["']/g, '').trim().toLowerCase();

  // 1. FAST PATH: Instant in-memory cache lookup (< 1ms)
  if (participantCache.has(searchKey)) {
    return {
      success: true,
      participant: participantCache.get(searchKey),
      latencyMs: Date.now() - startTime,
      source: 'cache',
    };
  }

  // 2. If token lookup in cache
  if (participantCache.has(trimmed)) {
    return {
      success: true,
      participant: participantCache.get(trimmed),
      latencyMs: Date.now() - startTime,
      source: 'cache',
    };
  }

  try {
    // 3. Fallback to NeonDB single-shot query
    const rows = await sql`
      SELECT name, email, phone_number, roll_number, branch, college_year, institution, team_name, is_leader, token
      FROM participants
      WHERE email = ${searchKey} 
         OR LOWER(email) = ${searchKey}
         OR token = ${trimmed}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: `No participant found for "${searchKey}"`,
        latencyMs: Date.now() - startTime,
        source: 'neon',
      };
    }

    const row = rows[0];
    const participant: ParticipantDetails = {
      name: row.name as string,
      email: (row.email as string).trim(),
      phone_number: row.phone_number as string,
      roll_number: row.roll_number as string,
      branch: row.branch as string,
      college_year: row.college_year as string,
      institution: row.institution as string,
      team_name: row.team_name as string,
      is_leader: Boolean(row.is_leader),
      token: row.token as string,
    };

    // Store in cache for subsequent scans
    participantCache.set(participant.email.toLowerCase(), participant);
    if (participant.token) {
      participantCache.set(participant.token.trim(), participant);
    }

    return {
      success: true,
      participant,
      latencyMs: Date.now() - startTime,
      source: 'neon',
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      success: false,
      message: 'Database query failed. Please check network connection.',
      latencyMs: Date.now() - startTime,
    };
  }
}
