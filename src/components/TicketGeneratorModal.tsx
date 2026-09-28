'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, Check, Copy, ScanLine } from 'lucide-react';
import { Attendee } from '../types/attendee';

interface TicketGeneratorModalProps {
  attendees: Attendee[];
  isOpen: boolean;
  onClose: () => void;
  onTestScan: (qrPayload: string) => void;
}

export const TicketGeneratorModal: React.FC<TicketGeneratorModalProps> = ({
  attendees,
  isOpen,
  onClose,
  onTestScan,
}) => {
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string>(
    attendees[0]?.id || ''
  );
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentAttendee = attendees.find((a) => a.id === selectedAttendeeId);
  const activeQrPayload = customText.trim() || currentAttendee?.qrHash || 'REG-SAMPLE-101';

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      activeQrPayload,
      {
        width: 220,
        margin: 2,
        color: {
          dark: '#030712',
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) console.error('Error generating QR code:', err);
      }
    );
  }, [isOpen, activeQrPayload]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${currentAttendee ? currentAttendee.id : 'custom'}-qr.png`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeQrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          position: 'relative',
        }}
      >
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

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
          Test Badge & QR Ticket Generator
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Generate live scannable QR badges for testing cameras, barcode readers, or badge printing.
        </p>

        {/* Attendee Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Select Registered Attendee:
          </label>
          <select
            value={selectedAttendeeId}
            onChange={(e) => {
              setSelectedAttendeeId(e.target.value);
              setCustomText('');
            }}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            {attendees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.name} ({a.ticketTier} • {a.status})
              </option>
            ))}
          </select>
        </div>

        {/* Custom Text Option */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Or Custom QR String / JSON Payload:
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Override QR payload string..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
        </div>

        {/* Pass Card Preview with Embedded QR */}
        <div style={{
          background: 'linear-gradient(135deg, #090e17 0%, #111a2e 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          {currentAttendee && (
            <div style={{ marginBottom: '12px' }}>
              <span className="tier-badge tier-vip" style={{ marginBottom: '6px' }}>
                {currentAttendee.ticketTier}
              </span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                {currentAttendee.name}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {currentAttendee.organization}
              </p>
            </div>
          )}

          {/* QR Code Canvas */}
          <div style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'inline-block',
          }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
          </div>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {activeQrPayload}
            </span>
            <button
              onClick={handleCopy}
              title="Copy Payload String"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: copied ? '#34d399' : 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '22px' }}>
          <button
            onClick={() => {
              onTestScan(activeQrPayload);
              onClose();
            }}
            className="btn-primary"
            style={{ fontSize: '0.82rem' }}
          >
            <ScanLine size={16} />
            <span>Test Scan This Badge Now</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownload}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <Download size={15} />
              <span>Download PNG</span>
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <Printer size={15} />
              <span>Print Badge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
