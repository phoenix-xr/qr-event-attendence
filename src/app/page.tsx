'use client';

import React, { useState, useRef } from 'react';
import { MobileScanner } from '../components/MobileScanner';
import { soundManager } from '../utils/audioFeedback';
import {
  Camera,
  X,
  Copy,
  Check,
  QrCode,
  Clock,
  Trash2,
  Sparkles,
  ExternalLink,
  CameraIcon
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannedRecord {
  id: string;
  content: string;
  timestamp: string;
}

export default function MobileScannerPage() {
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [latestScan, setLatestScan] = useState<ScannedRecord | null>(null);
  const [history, setHistory] = useState<ScannedRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessingSnap, setIsProcessingSnap] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleScan = (decodedText: string) => {
    soundManager.playSuccess();
    soundManager.vibrate(100);

    const record: ScannedRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: decodedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setLatestScan(record);
    setHistory((prev) => [record, ...prev.slice(0, 19)]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleNativeCameraSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSnap(true);
    try {
      const tempScanner = new Html5Qrcode('qr-snap-dummy');
      const decodedText = await tempScanner.scanFile(file, true);
      handleScan(decodedText);
    } catch {
      alert('Could not decode QR code. Please make sure the QR code is clearly visible and well-lit.');
    } finally {
      setIsProcessingSnap(false);
      e.target.value = '';
    }
  };

  const isUrl = (str: string) => {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
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

      {/* Mobile Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
          }}>
            <QrCode size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
              QR Scanner
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Admin Mobile Terminal
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              setLatestScan(null);
              setHistory([]);
            }}
            title="Clear all scans"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
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

      {/* Primary Mobile Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Button 1: Live Video Scanner */}
        <button
          onClick={() => setIsScannerOpen(!isScannerOpen)}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '16px',
            border: isScannerOpen ? '1px solid rgba(244, 63, 94, 0.4)' : 'none',
            background: isScannerOpen
              ? 'rgba(244, 63, 94, 0.15)'
              : 'linear-gradient(135deg, #0284c7, #06b6d4)',
            color: isScannerOpen ? '#fb7185' : '#ffffff',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: isScannerOpen ? 'none' : '0 6px 24px rgba(6, 182, 212, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          {isScannerOpen ? (
            <>
              <X size={20} />
              <span>Close Live Scanner</span>
            </>
          ) : (
            <>
              <Camera size={20} />
              <span>Open Scanner</span>
            </>
          )}
        </button>

        {/* Button 2: Direct Phone Camera Shutter (Works 100% on every mobile browser without HTTPS!) */}
        <label
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: '#38bdf8',
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
          <CameraIcon size={18} />
          <span>{isProcessingSnap ? 'Reading QR from Camera...' : 'Take Photo with Phone Camera'}</span>
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

      {/* Mobile Scanner Viewport (Active when open) */}
      {isScannerOpen && (
        <div style={{ marginTop: '4px' }}>
          <MobileScanner onScan={handleScan} isOpen={isScannerOpen} />
        </div>
      )}

      {/* Scanned Output Section (Directly Below Scanner) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scanned Result
          </h2>
          {latestScan && (
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {latestScan.timestamp}
            </span>
          )}
        </div>

        {latestScan ? (
          <div
            className="glass-panel"
            style={{
              padding: '18px',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
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
                Latest Decoded QR
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                {isUrl(latestScan.content) && (
                  <a
                    href={latestScan.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Open</span>
                  </a>
                )}

                <button
                  onClick={() => copyToClipboard(latestScan.content, latestScan.id)}
                  style={{
                    background: copiedId === latestScan.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: copiedId === latestScan.id ? '#34d399' : '#f8fafc',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === latestScan.id ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedId === latestScan.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Printed Scanned Output */}
            <div style={{
              background: '#040711',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.92rem',
                color: '#38bdf8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: 1.5,
              }}>
                {latestScan.content}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '16px',
            padding: '28px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}>
            <QrCode size={30} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
            <p>Nothing scanned yet.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Tap &quot;Open Scanner&quot; or &quot;Take Photo with Phone Camera&quot; above.
            </p>
          </div>
        )}

        {/* Previous Scans History */}
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
                    background: 'rgba(255, 255, 255, 0.03)',
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
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      color: '#f8fafc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.content}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.timestamp}
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(item.content, item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedId === item.id ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Testing simulator buttons */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            <Sparkles size={12} color="#38bdf8" />
            <span>Test sample scan payload:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleScan('REG-2026-9042')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Test REG-2026-9042
            </button>
            <button
              onClick={() => handleScan('https://example.com/checkin/8821')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Test URL
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
