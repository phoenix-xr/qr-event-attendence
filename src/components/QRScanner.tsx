'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Flashlight,
  Upload,
  Keyboard,
  CheckCircle,
  AlertCircle,
  Scan,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isScanningActive: boolean;
}

interface CameraDevice {
  id: string;
  label: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  isScanningActive,
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const readerElementId = 'qr-reader-viewport';

  // Discover cameras on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const formatted = devices.map((d) => ({
            id: d.id,
            label: d.label || `Camera ${d.id.substring(0, 5)}...`,
          }));
          setCameras(formatted);
          // Prefer environment/back camera if available
          const backCam = formatted.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : formatted[0].id);
        } else {
          setCameraError('No camera devices detected on this device.');
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras:', err);
        setCameraError('Camera access unavailable or permission not yet granted.');
      });

    return () => {
      stopCameraScanner();
    };
  }, []);

  // Manage scanner start/stop based on isScanningActive and selectedCameraId
  useEffect(() => {
    if (scanMode === 'camera' && isScanningActive && selectedCameraId) {
      startCameraScanner(selectedCameraId);
    } else {
      stopCameraScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode, isScanningActive, selectedCameraId]);

  const startCameraScanner = async (cameraId: string) => {
    if (isStartingRef.current || scannerRef.current?.isScanning) return;
    isStartingRef.current = true;
    setCameraError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      await scannerRef.current.start(
        cameraId,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.72);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {
          // Normal frame scanning progress, ignore frame errors
        }
      );

      setIsCameraRunning(true);

      // Check torch capability
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorchSupport(true);
        }
      } catch {
        setHasTorchSupport(false);
      }
    } catch (err: unknown) {
      console.error('Failed to start camera:', err);
      setCameraError(
        (err as Error)?.message ||
          'Failed to initialize camera. Ensure browser camera permissions are enabled.'
      );
      setIsCameraRunning(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsCameraRunning(false);
        setTorchActive(false);
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorchSupport) return;
    try {
      const nextTorch = !torchActive;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchActive(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      // Create a temporary scanner if needed for file scanning
      const tempScanner = scannerRef.current || new Html5Qrcode(readerElementId);
      const decodedText = await tempScanner.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch {
      alert('Could not detect a valid QR code in this image. Try another image or adjust lighting.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
      {/* Scanner Mode Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
        }}>
          <button
            onClick={() => setScanMode('camera')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: scanMode === 'camera' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: scanMode === 'camera' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Camera size={15} />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setScanMode('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: scanMode === 'upload' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: scanMode === 'upload' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Upload size={15} />
            <span>Upload Ticket</span>
          </button>

          <button
            onClick={() => setScanMode('manual')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: scanMode === 'manual' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: scanMode === 'manual' ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Keyboard size={15} />
            <span>Manual Code</span>
          </button>
        </div>

        {/* Camera Selector and Torch (Camera Mode) */}
        {scanMode === 'camera' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label}
                  </option>
                ))}
              </select>
            )}

            {hasTorchSupport && (
              <button
                onClick={toggleTorch}
                title="Toggle Torch/Flashlight"
                style={{
                  background: torchActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  color: torchActive ? '#fbbf24' : 'var(--text-muted)',
                  border: `1px solid ${torchActive ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Flashlight size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Camera Stream Viewport */}
      {scanMode === 'camera' && (
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          margin: '0 auto',
          aspectRatio: '1 / 1',
          background: '#040711',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '2px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* HTML5 QR Code Container */}
          <div
            id={readerElementId}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Glowing Animated Laser Sweep */}
          {isCameraRunning && <div className="scanner-laser" />}

          {/* Futuristic Viewfinder Reticle Corners */}
          <div style={{
            position: 'absolute',
            inset: '16%',
            pointerEvents: 'none',
            border: '2px dashed rgba(6, 182, 212, 0.5)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Viewfinder Corner Accents */}
            <div style={{ position: 'absolute', top: -3, left: -3, width: 20, height: 20, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', bottom: -3, left: -3, width: 20, height: 20, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 0 4px 0' }} />

            {!isCameraRunning && !cameraError && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                <Scan size={36} color="#38bdf8" style={{ marginBottom: '8px', opacity: 0.8 }} />
                <p style={{ fontSize: '0.82rem' }}>Activating Camera Sensor...</p>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div style={{
              position: 'absolute',
              inset: '16px',
              background: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              gap: '10px',
              zIndex: 20,
            }}>
              <CameraOff size={32} color="#fb7185" />
              <p style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                Camera Sensor Offline
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {cameraError}
              </p>
              <button
                onClick={() => selectedCameraId && startCameraScanner(selectedCameraId)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px', marginTop: '6px' }}
              >
                <RefreshCw size={13} />
                <span>Retry Permission</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Upload Mode */}
      {scanMode === 'upload' && (
        <div style={{
          width: '100%',
          maxWidth: '460px',
          margin: '0 auto',
          padding: '36px 20px',
          border: '2px dashed rgba(6, 182, 212, 0.35)',
          borderRadius: '20px',
          background: 'rgba(6, 182, 212, 0.02)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
            }}
          />
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'rgba(6, 182, 212, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#38bdf8',
          }}>
            <Upload size={26} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
            {isProcessingFile ? 'Decoding Ticket QR Code...' : 'Drop Ticket / QR Image Here'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
            Supports PNG, JPG, or Screenshots from mobile wallet passes
          </p>
          <div style={{ marginTop: '16px' }}>
            <span className="btn-secondary" style={{ fontSize: '0.8rem', pointerEvents: 'none' }}>
              Browse File System
            </span>
          </div>
        </div>
      )}

      {/* Manual Code Input Mode */}
      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{ maxWidth: '460px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Registration ID or QR String:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. REG-2026-1002"
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>
                Verify
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
              Use for manual lookup if visitor badge QR is damaged or camera is unavailable.
            </p>
          </div>
        </form>
      )}

      {/* Quick Interactive Simulator Chips (Test instant scans with 1-click) */}
      <div style={{ marginTop: '22px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            SIMULATE SCAN PAYLOAD (TESTING & DEMO):
          </span>
          <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> 1-Click Test
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => onScanSuccess('REG-2026-1002')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}
          >
            <CheckCircle size={13} color="#fbbf24" />
            <span>Valid VIP Pass (Alexander Cruz)</span>
          </button>

          <button
            onClick={() => onScanSuccess('REG-2026-1003')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', border: '1px solid rgba(6, 182, 212, 0.3)' }}
          >
            <CheckCircle size={13} color="#38bdf8" />
            <span>Valid Delegate Pass (Mei-Ling Zhou)</span>
          </button>

          <button
            onClick={() => onScanSuccess('REG-2026-1001')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            <AlertCircle size={13} color="#34d399" />
            <span>Already Checked-In (Dr. Sarah)</span>
          </button>

          <button
            onClick={() => onScanSuccess('REG-2026-1008')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', border: '1px solid rgba(244, 63, 94, 0.3)' }}
          >
            <AlertCircle size={13} color="#fb7185" />
            <span>Flagged Pass (Jordan Rivera)</span>
          </button>

          <button
            onClick={() => onScanSuccess('INVALID-QR-CODE-999')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', border: '1px solid rgba(244, 63, 94, 0.3)' }}
          >
            <AlertCircle size={13} color="#fb7185" />
            <span>Unknown / Forged QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
