'use client';

import React from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Attendee } from '../types/attendee';

interface StatsOverviewProps {
  attendees: Attendee[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ attendees }) => {
  const total = attendees.length;
  const checkedIn = attendees.filter(a => a.status === 'checked_in').length;
  const pending = attendees.filter(a => a.status === 'pending').length;
  const flagged = attendees.filter(a => a.status === 'flagged').length;
  const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  const vipCount = attendees.filter(a => a.ticketTier === 'VIP Access').length;
  const speakerCount = attendees.filter(a => a.ticketTier === 'Speaker').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
      {/* Total Registrations */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Total Registered
          </span>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
          }}>
            <Users size={18} />
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {total}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            attendees on roster
          </span>
        </div>
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="tier-badge tier-vip" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            VIP: {vipCount}
          </span>
          <span className="tier-badge tier-speaker" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            Speakers: {speakerCount}
          </span>
        </div>
      </div>

      {/* Checked In */}
      <div className="glass-panel" style={{
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Checked In
          </span>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
          }}>
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {checkedIn}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
            ({percent}%)
          </span>
        </div>
        {/* Progress Bar */}
        <div style={{
          marginTop: '14px',
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #059669, #10b981)',
            boxShadow: '0 0 10px #10b981',
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Awaiting Arrival */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Awaiting Arrival
          </span>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
          }}>
            <Clock size={18} />
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {pending}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            not checked in yet
          </span>
        </div>
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={14} color="#38bdf8" />
          <span>Live verification ready</span>
        </div>
      </div>

      {/* Flagged / Attention Needed */}
      <div className="glass-panel" style={{
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        border: flagged > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Attention / Flagged
          </span>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: flagged > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: flagged > 0 ? '#fb7185' : 'var(--text-muted)',
          }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: flagged > 0 ? '#fb7185' : '#ffffff' }}>
            {flagged}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            registration issues
          </span>
        </div>
        <div style={{ marginTop: '14px', fontSize: '0.75rem', color: flagged > 0 ? '#fb7185' : 'var(--text-muted)' }}>
          {flagged > 0 ? 'Requires desk verification' : 'Zero active flags'}
        </div>
      </div>
    </div>
  );
};
