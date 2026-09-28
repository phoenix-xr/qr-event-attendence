'use client';

import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Building2,
  Mail,
  Phone,
  Armchair,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Attendee } from '../types/attendee';
import { soundManager } from '../utils/audioFeedback';

export interface ScanResultPayload {
  raw: string;
  attendee: Attendee | null;
  status: 'valid' | 'already_checked_in' | 'flagged' | 'invalid';
}

interface ScanResultModalProps {
  result: ScanResultPayload | null;
  onClose: () => void;
  onConfirmCheckIn: (attendeeId: string) => void;
  onUndoCheckIn: (attendeeId: string) => void;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  result,
  onClose,
  onConfirmCheckIn,
  onUndoCheckIn,
  soundEnabled,
  vibrateEnabled,
}) => {
  useEffect(() => {
    if (!result) return;

    if (result.status === 'valid') {
      if (soundEnabled) soundManager.playSuccess();
      if (vibrateEnabled) soundManager.vibrate([100, 50, 100]);
      // Trigger confetti celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#fbbf24'],
        });
      } catch {
        // Confetti fallback
      }
    } else if (result.status === 'already_checked_in') {
      if (soundEnabled) soundManager.playWarning();
      if (vibrateEnabled) soundManager.vibrate([150, 80, 150]);
    } else {
      if (soundEnabled) soundManager.playError();
      if (vibrateEnabled) soundManager.vibrate([250]);
    }
  }, [result, soundEnabled, vibrateEnabled]);

  if (!result) return null;

  const { status, attendee, raw } = result;

  const getTierClass = (tier?: string) => {
    switch (tier) {
      case 'VIP Access':
        return 'tier-vip';
      case 'Speaker':
        return 'tier-speaker';
      case 'Delegate':
        return 'tier-delegate';
      case 'Staff / Crew':
        return 'tier-staff';
      default:
        return 'tier-general';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          position: 'relative',
          border:
            status === 'valid'
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : status === 'already_checked_in'
              ? '1px solid rgba(245, 158, 11, 0.4)'
              : '1px solid rgba(244, 63, 94, 0.4)',
          boxShadow:
            status === 'valid'
              ? 'var(--shadow-success)'
              : status === 'already_checked_in'
              ? '0 0 30px rgba(245, 158, 11, 0.25)'
              : 'var(--shadow-error)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Status Header Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          {status === 'valid' && (
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}>
              <CheckCircle2 size={30} />
            </div>
          )}

          {status === 'already_checked_in' && (
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
            }}>
              <AlertTriangle size={30} />
            </div>
          )}

          {status === 'flagged' && (
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185',
            }}>
              <AlertTriangle size={30} />
            </div>
          )}

          {status === 'invalid' && (
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185',
            }}>
              <XCircle size={30} />
            </div>
          )}

          <div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color:
                status === 'valid'
                  ? '#34d399'
                  : status === 'already_checked_in'
                  ? '#fbbf24'
                  : '#fb7185',
            }}>
              {status === 'valid' && 'ACCESS GRANTED'}
              {status === 'already_checked_in' && 'DUPLICATE ENTRY DETECTED'}
              {status === 'flagged' && 'FLAGGED REGISTRATION'}
              {status === 'invalid' && 'INVALID TICKET'}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {status === 'valid' && 'Verified Registration'}
              {status === 'already_checked_in' && 'Badge Already Scanned'}
              {status === 'flagged' && 'Verification Hold'}
              {status === 'invalid' && 'No Registration Found'}
            </h3>
          </div>
        </div>

        {/* Attendee Details Card */}
        {attendee ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            padding: '18px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              {attendee.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attendee.avatarUrl}
                  alt={attendee.name}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                }}>
                  {attendee.name[0]}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    {attendee.name}
                  </h4>
                  <span className={`tier-badge ${getTierClass(attendee.ticketTier)}`}>
                    {attendee.ticketTier}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building2 size={13} /> {attendee.organization}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} color="var(--text-muted)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attendee.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} color="var(--text-muted)" />
                <span>{attendee.phone}</span>
              </div>
              {attendee.seatNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Armchair size={13} color="#38bdf8" />
                  <span style={{ color: '#f8fafc', fontWeight: 500 }}>{attendee.seatNumber}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} color="#10b981" />
                <span style={{ fontFamily: 'var(--font-mono)' }}>{attendee.id}</span>
              </div>
            </div>

            {/* Check-In History / Notice */}
            {status === 'already_checked_in' && attendee.checkInTime && (
              <div style={{
                marginTop: '14px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: '#fbbf24',
              }}>
                <Clock size={15} />
                <span>Previously Checked In: {new Date(attendee.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}

            {attendee.notes && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
              }}>
                <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{attendee.notes}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}>
            <p style={{ color: '#fb7185', fontWeight: 600, marginBottom: '6px' }}>
              Unregistered Ticket Payload
            </p>
            <p style={{ fontSize: '0.8rem', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
              Scanned: &quot;{raw}&quot;
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              This QR code does not match any attendee in the registered database. Ensure this visitor is scanning an official pass.
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary">
            Dismiss
          </button>

          {status === 'valid' && attendee && (
            <button
              onClick={() => {
                onConfirmCheckIn(attendee.id);
                onClose();
              }}
              className="btn-success"
            >
              <span>Confirm & Issue Badge</span>
              <ArrowRight size={16} />
            </button>
          )}

          {status === 'already_checked_in' && attendee && (
            <button
              onClick={() => {
                onUndoCheckIn(attendee.id);
                onClose();
              }}
              className="btn-secondary"
              style={{ border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
            >
              <RotateCcw size={15} />
              <span>Reset Check-In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
