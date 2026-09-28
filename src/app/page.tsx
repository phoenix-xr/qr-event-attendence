'use client';

import React, { useState, useRef } from 'react';
import { MobileScanner } from '../components/MobileScanner';
import { soundManager } from '../utils/audioFeedback';
import { getParticipantByEmail, ParticipantDetails } from './actions/getParticipant';
import { updateAttendanceStatus, getAttendanceStatus } from './actions/updateAttendance';
import {
  Camera,
  X,
  Copy,
  Check,
  QrCode,
  Clock,
  Trash2,
  Sparkles,
  CameraIcon,
  User,
  GraduationCap,
  Building,
  Hash,
  BookOpen,
  Phone,
  Mail,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedResultRecord {
  id: string;
  rawText: string;
  timestamp: string;
  participant?: ParticipantDetails;
  attendance?: 'PRESENT' | 'ABSENT';
  error?: string;
  latencyMs?: number;
  source?: 'cache' | 'neon';
}

export default function MobileScannerPage() {
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ScannedResultRecord | null>(null);
  const [history, setHistory] = useState<ScannedResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState<boolean>(false);
  const [attendanceNotice, setAttendanceNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessingSnap, setIsProcessingSnap] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleScan = async (decodedText: string) => {
    soundManager.playSuccess();
    soundManager.vibrate(100);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setIsLoading(true);
    setAttendanceNotice(null);

    try {
      const res = await getParticipantByEmail(decodedText);
      let initialAttendance: 'PRESENT' | 'ABSENT' = 'ABSENT';

      if (res.success && res.participant) {
        // Fetch current attendance status from Google Sheet in background
        getAttendanceStatus(res.participant.email).then((att) => {
          if (att) {
            setCurrentResult((prev) => (prev && prev.participant?.email === res.participant?.email ? { ...prev, attendance: att } : prev));
          }
        });
      }

      const record: ScannedResultRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        rawText: decodedText,
        timestamp,
        participant: res.success ? res.participant : undefined,
        attendance: initialAttendance,
        error: !res.success ? res.message : undefined,
        latencyMs: res.latencyMs,
        source: res.source,
      };

      if (!res.success) {
        soundManager.playWarning();
      }

      setCurrentResult(record);
      setHistory((prev) => [record, ...prev.slice(0, 19)]);
    } catch {
      setCurrentResult({
        id: `${Date.now()}`,
        rawText: decodedText,
        timestamp,
        error: 'Failed to query database.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = async (newStatus: 'PRESENT' | 'ABSENT') => {
    if (!currentResult?.participant?.email) return;

    const email = currentResult.participant.email;
    const previousStatus = currentResult.attendance;

    // Instant optimistic update (zero animation, instant response)
    setCurrentResult((prev) => (prev ? { ...prev, attendance: newStatus } : null));
    setHistory((prev) =>
      prev.map((item) =>
        item.participant?.email.toLowerCase() === email.toLowerCase()
          ? { ...item, attendance: newStatus }
          : item
      )
    );

    setIsUpdatingAttendance(true);
    setAttendanceNotice(null);

    try {
      const res = await updateAttendanceStatus(email, newStatus);
      if (res.success) {
        setAttendanceNotice(`Google Sheet updated: ${newStatus} (Row ${res.updatedRow})`);
      } else {
        // Revert on error
        setCurrentResult((prev) => (prev ? { ...prev, attendance: previousStatus } : null));
        alert(res.message || 'Failed to update Google Sheet.');
      }
    } catch (e) {
      console.error(e);
      setCurrentResult((prev) => (prev ? { ...prev, attendance: previousStatus } : null));
      alert('Error updating Google Sheet');
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleNativeCameraSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSnap(true);
    try {
      const tempScanner = new Html5Qrcode('qr-snap-dummy');
      const decodedText = await tempScanner.scanFile(file, true);
      await handleScan(decodedText);
    } catch {
      alert('Could not decode QR code. Please ensure the QR is well-lit and in focus.');
    } finally {
      setIsProcessingSnap(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      maxWidth: '480px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px 40px',
      gap: '18px',
    }}>
      {/* Hidden dummy container for image file decoding */}
      <div id="qr-snap-dummy" style={{ display: 'none' }} />

      {/* Mobile Header with HowToHackathon Attendance Portal title */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #991b1b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.45)',
            flexShrink: 0,
          }}>
            <QrCode size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
            }}>
              HowToHackathon Attendence Portal
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 500, marginTop: '2px' }}>
              Live QR Scanner &bull; Participant Verification
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              setCurrentResult(null);
              setHistory([]);
            }}
            title="Clear all scans"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              padding: '6px 10px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        )}
      </header>

      {/* Primary Action Buttons in Red-Black Theme */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Button 1: Live Video Scanner */}
        <button
          onClick={() => setIsScannerOpen(!isScannerOpen)}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '16px',
            border: isScannerOpen ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
            background: isScannerOpen
              ? 'rgba(239, 68, 68, 0.15)'
              : 'linear-gradient(135deg, #b91c1c, #ef4444)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: isScannerOpen ? 'none' : '0 6px 24px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {isScannerOpen ? (
            <>
              <X size={20} />
              <span>Close Camera Scanner</span>
            </>
          ) : (
            <>
              <Camera size={20} />
              <span>Open Scanner</span>
            </>
          )}
        </button>

        {/* Button 2: Direct Phone Camera Photo Shutter */}
        <label
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid var(--border-subtle)',
            color: '#fca5a5',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <CameraIcon size={18} color="#ef4444" />
          <span>{isProcessingSnap ? 'Reading QR code...' : 'Take Photo with Phone Camera'}</span>
          <input
            ref={hiddenFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeCameraSnap}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Mobile Scanner Viewport */}
      {isScannerOpen && (
        <div style={{ marginTop: '4px' }}>
          <MobileScanner onScan={handleScan} isOpen={isScannerOpen} />
        </div>
      )}

      {/* Participant Details & Attendance Action Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Participant Details
          </h2>
          {currentResult && (
            <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {currentResult.timestamp}
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#f87171',
            fontSize: '0.9rem',
          }}>
            <Loader2 size={20} className="animate-spin" />
            <span>Fetching participant from NeonDB...</span>
          </div>
        )}

        {/* Participant Found Card */}
        {!isLoading && currentResult?.participant && (
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              border: currentResult.attendance === 'PRESENT'
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: currentResult.attendance === 'PRESENT'
                ? '0 0 25px rgba(16, 185, 129, 0.25)'
                : 'var(--shadow-card)',
              position: 'relative',
            }}
          >
            {/* Top Status & Attendance Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}>
                  Verified
                </span>

                {currentResult.latencyMs !== undefined && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                  }}>
                    ⚡ {currentResult.latencyMs}ms
                  </span>
                )}
              </div>

              {/* Attendance Status Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: currentResult.attendance === 'PRESENT'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: currentResult.attendance === 'PRESENT' ? '#34d399' : '#f87171',
                border: currentResult.attendance === 'PRESENT'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.35)',
              }}>
                {currentResult.attendance === 'PRESENT' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{currentResult.attendance || 'ABSENT'}</span>
              </div>
            </div>

            {/* Participant Name & Team */}
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
                {currentResult.participant.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
                <Users size={14} color="#ef4444" />
                <span>Team: <strong>{currentResult.participant.team_name}</strong></span>
                <span style={{
                  fontSize: '0.7rem',
                  color: currentResult.participant.is_leader ? '#fbbf24' : '#94a3b8',
                  background: currentResult.participant.is_leader ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}>
                  {currentResult.participant.is_leader ? 'Leader' : 'Member'}
                </span>
              </div>
            </div>

            {/* Attendance Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
            }}>
              {/* Mark Present Button */}
              <button
                disabled={isUpdatingAttendance || currentResult.attendance === 'PRESENT'}
                onClick={() => handleMarkAttendance('PRESENT')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentResult.attendance === 'PRESENT'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: currentResult.attendance === 'PRESENT' ? 'default' : 'pointer',
                  boxShadow: currentResult.attendance === 'PRESENT' ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
                  opacity: isUpdatingAttendance ? 0.7 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {isUpdatingAttendance && currentResult.attendance !== 'PRESENT' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>{currentResult.attendance === 'PRESENT' ? 'Marked Present' : 'Mark Present'}</span>
              </button>

              {/* Mark Absent Button */}
              <button
                disabled={isUpdatingAttendance || currentResult.attendance === 'ABSENT'}
                onClick={() => handleMarkAttendance('ABSENT')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  background: currentResult.attendance === 'ABSENT'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: currentResult.attendance === 'ABSENT' ? 'default' : 'pointer',
                  opacity: isUpdatingAttendance ? 0.7 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {isUpdatingAttendance && currentResult.attendance !== 'ABSENT' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{currentResult.attendance === 'ABSENT' ? 'Marked Absent' : 'Mark Absent'}</span>
              </button>
            </div>

            {/* Sheet Update Confirmation Notice */}
            {attendanceNotice && (
              <div style={{
                marginBottom: '14px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <FileSpreadsheet size={14} />
                <span>{attendanceNotice}</span>
              </div>
            )}

            {/* Grid of participant details */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#070204',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              {/* Roll Number */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Hash size={14} color="#ef4444" /> Roll Number:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>
                  {currentResult.participant.roll_number}
                </span>
              </div>

              {/* Branch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={14} color="#ef4444" /> Branch:
                </span>
                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                  {currentResult.participant.branch}
                </span>
              </div>

              {/* Year */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <GraduationCap size={14} color="#fbbf24" /> Year:
                </span>
                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                  {currentResult.participant.college_year}
                </span>
              </div>

              {/* Institution */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Building size={14} color="#34d399" /> Institution:
                </span>
                <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>
                  {currentResult.participant.institution}
                </span>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Mail size={14} color="#94a3b8" /> Email:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {currentResult.participant.email}
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentResult.participant!.email, 'email')}
                    style={{ background: 'transparent', border: 'none', color: copiedField === 'email' ? '#34d399' : 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {copiedField === 'email' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Phone size={14} color="#94a3b8" /> Phone:
                </span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  {currentResult.participant.phone_number}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error / Not Found State */}
        {!isLoading && currentResult?.error && (
          <div
            className="glass-panel"
            style={{
              padding: '18px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>
                  Participant Not Found
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentResult.error}
                </p>
                <div style={{ marginTop: '8px', background: '#070204', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  Scanned: &quot;{currentResult.rawText}&quot;
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !currentResult && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.03)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '16px',
            padding: '28px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}>
            <User size={32} style={{ opacity: 0.35, margin: '0 auto 8px', color: '#ef4444' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Awaiting QR scan</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Scan the participant QR code or email to retrieve their registration details and mark attendance.
            </p>
          </div>
        )}

        {/* Previous Scans Log */}
        {history.length > 1 && (
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Previous Scans ({history.length - 1})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.slice(1).map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(18, 9, 12, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: item.participant ? '#f8fafc' : '#f87171',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.participant ? item.participant.name : item.rawText}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.participant ? `${item.participant.roll_number} • ${item.participant.branch}` : 'Not Found'} &bull; {item.timestamp}
                    </div>
                  </div>

                  {item.attendance && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.attendance === 'PRESENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: item.attendance === 'PRESENT' ? '#34d399' : '#f87171',
                      border: item.attendance === 'PRESENT' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    }}>
                      {item.attendance}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Testing simulator chips */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            <Sparkles size={12} color="#ef4444" />
            <span>Test sample emails from NeonDB:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleScan('sahilsharma3043@gmail.com')}
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Sahil Sharma (sahilsharma3043@gmail.com)
            </button>
            <button
              onClick={() => handleScan('anikachaurasia3816@gmail.com')}
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Anika (anikachaurasia3816@gmail.com)
            </button>
            <button
              onClick={() => handleScan('test@test.com')}
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              John Doe (test@test.com)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
