'use client';

import React from 'react';
import { QrCode, Sparkles, Volume2, VolumeX, UserPlus, RefreshCw } from 'lucide-react';
import { ScannerSettings } from '../types/attendee';

interface HeaderProps {
  settings: ScannerSettings;
  onUpdateSettings: (newSettings: Partial<ScannerSettings>) => void;
  onOpenTicketGenerator: () => void;
  onOpenAddAttendee: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenTicketGenerator,
  onOpenAddAttendee,
  onResetData,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(6, 9, 17, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '14px 24px',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
          }}>
            <QrCode size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                AccessGate
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}>
                ADMIN EXTENSION
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Registration & Live QR Check-in Terminal
            </p>
          </div>
        </div>

        {/* Action Controls & Hardware Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Audio Chime Toggle */}
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            title={settings.soundEnabled ? 'Audio Feedback Enabled' : 'Audio Feedback Muted'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '9px',
              border: `1px solid ${settings.soundEnabled ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-subtle)'}`,
              background: settings.soundEnabled ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              color: settings.soundEnabled ? '#38bdf8' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{settings.soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>

          {/* Auto Check-in Toggle */}
          <button
            onClick={() => onUpdateSettings({ autoCheckIn: !settings.autoCheckIn })}
            title="Auto confirm scan or show verification modal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '9px',
              border: `1px solid ${settings.autoCheckIn ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              background: settings.autoCheckIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: settings.autoCheckIn ? '#34d399' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: settings.autoCheckIn ? '#10b981' : '#64748b',
              boxShadow: settings.autoCheckIn ? '0 0 8px #10b981' : 'none',
            }} />
            <span>{settings.autoCheckIn ? 'Auto-Confirm: ON' : 'Inspect Mode'}</span>
          </button>

          {/* Generate / Test Badges */}
          <button
            onClick={onOpenTicketGenerator}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <Sparkles size={15} color="#c084fc" />
            <span>Test Badges & QR</span>
          </button>

          {/* Add New Attendee */}
          <button
            onClick={onOpenAddAttendee}
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <UserPlus size={15} />
            <span>Add Attendee</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="Reset Mock Attendees"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
