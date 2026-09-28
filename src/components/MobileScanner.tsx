'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Flashlight, RefreshCw, AlertCircle, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface MobileScannerProps {
  onScan: (decodedText: string) => void;
  isOpen: boolean;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({ onScan, isOpen }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isHttpInsecure, setIsHttpInsecure] = useState(false);
  const [isProcessingSnap, setIsProcessingSnap] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const elementId = 'mobile-qr-viewport';
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if browser supports mediaDevices
    if (typeof window !== 'undefined') {
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        setIsHttpInsecure(true);
        setErrorMsg('Mobile browsers require HTTPS for live video streaming. Use the Native Camera button below!');
        return;
      }
    }

    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startScanner = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setErrorMsg(null);

    // Double check getUserMedia availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsHttpInsecure(true);
      setErrorMsg('Live streaming requires HTTPS on mobile. Tap "Take Photo to Scan" below!');
      isTransitioningRef.current = false;
      return;
    }

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      if (scannerRef.current.isScanning) {
        isTransitioningRef.current = false;
        return;
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (w, h) => {
            const minEdge = Math.min(w, h);
            const size = Math.floor(minEdge * 0.75);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastScannedRef.current && now - lastScanTimeRef.current < 2000) {
            return;
          }
          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;
          onScan(decodedText);
        },
        () => {}
      );

      setIsStarted(true);

      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.error('Mobile scanner error:', err);
      const msg = (err as Error)?.message || '';
      if (msg.includes('streaming not supported') || msg.includes('NotSupportedError')) {
        setIsHttpInsecure(true);
        setErrorMsg('Mobile browsers block live streaming over HTTP. Use the Native Camera button below!');
      } else if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setErrorMsg('Camera permission denied. Allow camera in your browser address bar.');
      } else {
        setErrorMsg(msg || 'Failed to start camera.');
      }
      setIsStarted(false);
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      setIsStarted(false);
      setTorchOn(false);
      isTransitioningRef.current = false;
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const next = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSnap(true);
    try {
      const tempScanner = scannerRef.current || new Html5Qrcode(elementId);
      const decodedText = await tempScanner.scanFile(file, true);
      onScan(decodedText);
    } catch {
      alert('Could not decode QR code from the captured photo. Make sure the QR code is clear and in focus.');
    } finally {
      setIsProcessingSnap(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '380px',
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Scanner Viewport Box */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#040711',
        border: '2px solid rgba(6, 182, 212, 0.5)',
        boxShadow: '0 0 35px rgba(6, 182, 212, 0.25)',
      }}>
        {/* Html5Qrcode video target */}
        <div id={elementId} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* Animated Laser Scan Bar */}
        {isStarted && <div className="scanner-laser" />}

        {/* Corner Reticle Overlays */}
        {isStarted && (
          <div style={{
            position: 'absolute',
            inset: '14%',
            pointerEvents: 'none',
            border: '1.5px dashed rgba(6, 182, 212, 0.4)',
            borderRadius: '16px',
          }}>
            <div style={{ position: 'absolute', top: -3, left: -3, width: 22, height: 22, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', top: -3, right: -3, width: 22, height: 22, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', bottom: -3, left: -3, width: 22, height: 22, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', bottom: -3, right: -3, width: 22, height: 22, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 0 4px 0' }} />
          </div>
        )}

        {/* Torch Toggle on top of camera */}
        {hasTorch && isStarted && (
          <button
            onClick={toggleTorch}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: torchOn ? '#fbbf24' : 'rgba(0, 0, 0, 0.6)',
              color: torchOn ? '#000000' : '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
            }}
          >
            <Flashlight size={20} />
          </button>
        )}

        {/* Insecure Context or Error View with Native Camera Fallback */}
        {errorMsg && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(9, 13, 22, 0.96)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 18px',
            textAlign: 'center',
            gap: '14px',
            zIndex: 30,
          }}>
            {isHttpInsecure ? (
              <Camera size={40} color="#38bdf8" />
            ) : (
              <CameraOff size={36} color="#fb7185" />
            )}

            <div>
              <p style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, marginBottom: '4px' }}>
                {isHttpInsecure ? 'Snap with Mobile Camera' : 'Camera Streaming Issue'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {errorMsg}
              </p>
            </div>

            {/* Native Mobile Camera Button (Works on all mobile devices & HTTP) */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '12px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4)',
              width: '100%',
              maxWidth: '260px',
            }}>
              <Camera size={18} />
              <span>{isProcessingSnap ? 'Reading QR...' : 'Take Photo of QR Code'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapturePhoto}
                style={{ display: 'none' }}
              />
            </label>

            {!isHttpInsecure && (
              <button
                onClick={startScanner}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              >
                <RefreshCw size={13} />
                <span>Retry Stream</span>
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '10px',
      }}>
        Align QR code within the frame or take a photo
      </p>
    </div>
  );
};
