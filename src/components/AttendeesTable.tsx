'use client';

import React, { useState } from 'react';
import {
  Search,
  Download,
  CheckCircle,
  RotateCcw,
  QrCode,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import { Attendee, CheckInStatus } from '../types/attendee';

interface AttendeesTableProps {
  attendees: Attendee[];
  onToggleStatus: (attendeeId: string) => void;
  onOpenBadge: (attendeeId: string) => void;
}

export const AttendeesTable: React.FC<AttendeesTableProps> = ({
  attendees,
  onToggleStatus,
  onOpenBadge,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckInStatus | 'vip'>('all');

  const filtered = attendees.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'vip') return a.ticketTier === 'VIP Access';
    return a.status === statusFilter;
  });

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

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Organization', 'Tier', 'Status', 'CheckInTime', 'SeatNumber'];
    const rows = filtered.map((a) => [
      a.id,
      `"${a.name.replace(/"/g, '""')}"`,
      a.email,
      a.phone,
      `"${a.organization.replace(/"/g, '""')}"`,
      a.ticketTier,
      a.status,
      a.checkInTime || '',
      `"${(a.seatNumber || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
      {/* Header controls & filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
            Roster & Registration Verification
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing {filtered.length} of {attendees.length} total registered guests
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            minWidth: '240px',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, ID, org..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportCSV}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '14px',
        marginBottom: '16px',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            background: statusFilter === 'all' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
            color: statusFilter === 'all' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          All ({attendees.length})
        </button>

        <button
          onClick={() => setStatusFilter('checked_in')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            background: statusFilter === 'checked_in' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
            color: statusFilter === 'checked_in' ? '#34d399' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Checked In ({attendees.filter((a) => a.status === 'checked_in').length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
            color: statusFilter === 'pending' ? '#fbbf24' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Pending ({attendees.filter((a) => a.status === 'pending').length})
        </button>

        <button
          onClick={() => setStatusFilter('flagged')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            background: statusFilter === 'flagged' ? 'rgba(244, 63, 94, 0.18)' : 'transparent',
            color: statusFilter === 'flagged' ? '#fb7185' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Flagged ({attendees.filter((a) => a.status === 'flagged').length})
        </button>

        <button
          onClick={() => setStatusFilter('vip')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            background: statusFilter === 'vip' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
            color: statusFilter === 'vip' ? '#fbbf24' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          VIP Only ({attendees.filter((a) => a.ticketTier === 'VIP Access').length})
        </button>
      </div>

      {/* Attendees Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 14px' }}>Guest Details</th>
              <th style={{ padding: '12px 14px' }}>Ticket & Seat</th>
              <th style={{ padding: '12px 14px' }}>Tier</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Check-In Time</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No matching attendees found.
                </td>
              </tr>
            ) : (
              filtered.map((attendee) => (
                <tr
                  key={attendee.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Guest Details */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {attendee.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={attendee.avatarUrl}
                          alt={attendee.name}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(6, 182, 212, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                        }}>
                          {attendee.name[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>
                          {attendee.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {attendee.organization} • {attendee.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Ticket ID & Seat */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>
                      {attendee.id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {attendee.seatNumber || 'Unassigned'}
                    </div>
                  </td>

                  {/* Tier */}
                  <td style={{ padding: '14px' }}>
                    <span className={`tier-badge ${getTierClass(attendee.ticketTier)}`}>
                      {attendee.ticketTier}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px' }}>
                    {attendee.status === 'checked_in' && (
                      <span className="status-badge status-checked-in">
                        <CheckCircle size={13} />
                        <span>Checked In</span>
                      </span>
                    )}
                    {attendee.status === 'pending' && (
                      <span className="status-badge status-pending">
                        <Clock size={13} />
                        <span>Pending</span>
                      </span>
                    )}
                    {attendee.status === 'flagged' && (
                      <span className="status-badge status-flagged">
                        <AlertTriangle size={13} />
                        <span>Flagged</span>
                      </span>
                    )}
                  </td>

                  {/* Check-In Time */}
                  <td style={{ padding: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {attendee.checkInTime ? (
                      <div>
                        <div>{new Date(attendee.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(attendee.checkInTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => onOpenBadge(attendee.id)}
                        title="View / Generate QR Badge"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: '#38bdf8',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        <QrCode size={14} />
                        <span>QR Pass</span>
                      </button>

                      {attendee.status === 'checked_in' ? (
                        <button
                          onClick={() => onToggleStatus(attendee.id)}
                          title="Undo check-in"
                          style={{
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: '8px',
                            color: '#fb7185',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>Undo</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(attendee.id)}
                          title="Manually check in"
                          className="btn-success"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <CheckCircle size={14} />
                          <span>Check In</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
