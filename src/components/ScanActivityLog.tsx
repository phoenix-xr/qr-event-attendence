'use client';

import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { ScanLog } from '../types/attendee';

interface ScanActivityLogProps {
  logs: ScanLog[];
  onClearLogs: () => void;
}

export const ScanActivityLog: React.FC<ScanActivityLogProps> = ({
  logs,
  onClearLogs,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={17} color="#38bdf8" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
            Live Scan Audit Log
          </h4>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Clear Log
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingRight: '4px',
      }}>
        {logs.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 10px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontSize: '0.8rem',
            gap: '8px',
          }}>
            <Clock size={24} style={{ opacity: 0.5 }} />
            <span>Awaiting first QR scan... Point camera at badge or use quick simulator below.</span>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
              }}
            >
              <div>
                {log.status === 'success' && <CheckCircle2 size={16} color="#34d399" />}
                {log.status === 'already_checked_in' && <AlertTriangle size={16} color="#fbbf24" />}
                {log.status === 'flagged' && <AlertTriangle size={16} color="#fb7185" />}
                {log.status === 'invalid' && <XCircle size={16} color="#fb7185" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.attendeeName || log.parsedAttendeeId || 'Unknown Code'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {log.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
