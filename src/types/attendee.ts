export type TicketTier = 'VIP Access' | 'Speaker' | 'Delegate' | 'General Admission' | 'Staff / Crew';

export type CheckInStatus = 'pending' | 'checked_in' | 'flagged';

export interface Attendee {
  id: string; // e.g. "REG-2026-9041"
  name: string;
  email: string;
  phone: string;
  organization: string;
  ticketTier: TicketTier;
  status: CheckInStatus;
  checkInTime: string | null;
  qrHash: string;
  seatNumber?: string;
  notes?: string;
  avatarUrl?: string;
}

export interface ScanLog {
  id: string;
  timestamp: string;
  rawPayload: string;
  parsedAttendeeId?: string;
  status: 'success' | 'already_checked_in' | 'invalid' | 'flagged';
  message: string;
  attendeeName?: string;
}

export interface ScannerSettings {
  continuousMode: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  autoCheckIn: boolean;
  activeCameraId: string | null;
}
