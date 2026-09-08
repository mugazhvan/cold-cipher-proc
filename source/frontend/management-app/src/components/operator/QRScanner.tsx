import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Search,
  ArrowRight,
  Video,
} from 'lucide-react';
import { verifyGateQR, QRVerificationResult } from '../../services/api';

export interface CameraDevice {
  id: string;
  label: string;
}

interface QRScannerProps {
  onVerificationComplete?: (result: QRVerificationResult) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onVerificationComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
  const [lastScannedPayload, setLastScannedPayload] = useState<string>('');

  // Hardware Camera / Webcam Selection state
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isEnumeratingCameras, setIsEnumeratingCameras] = useState<boolean>(false);

  // Manual fallback state
  const [manualCode, setManualCode] = useState('');
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const activeTracksRef = useRef<MediaStreamTrack[]>([]);
  const readerId = 'operator-qr-reader-portal';

  const forceStopAllCameraTracks = () => {
    // 1. Direct hardware release for all captured tracks
    if (activeTracksRef.current && activeTracksRef.current.length > 0) {
      activeTracksRef.current.forEach((track) => {
        try {
          if (track.readyState === 'live') {
            track.stop();
          }
        } catch (e) {
          // ignore
        }
      });
      activeTracksRef.current = [];
    }

    // 2. Stop and detach tracks on all video elements in DOM
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => {
              try {
                if (track.readyState === 'live') {
                  track.stop();
                }
              } catch (e) {}
            });
          }
          video.srcObject = null;
        }
      });
    } catch (e) {
      // ignore
    }
  };

  // Enumerate available camera input devices
  const fetchCameras = async () => {
    setIsEnumeratingCameras(true);
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        setSelectedCameraId((prev) => {
          if (prev && devices.some((d) => d.id === prev)) {
            return prev;
          }
          // Prioritize back/rear/usb/environment cameras
          const preferred = devices.find((d) =>
            /back|rear|environment|usb|external|webcam/i.test(d.label)
          );
          return preferred ? preferred.id : devices[0].id;
        });
      }
    } catch (err) {
      console.warn('Could not enumerate cameras:', err);
    } finally {
      setIsEnumeratingCameras(false);
    }
  };

  // Intercept getUserMedia and cleanup on unmount
  useEffect(() => {
    fetchCameras();

    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);

    if (navigator.mediaDevices && originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await originalGetUserMedia(constraints);
        stream.getTracks().forEach((track) => {
          activeTracksRef.current.push(track);
          track.addEventListener('ended', () => {
            activeTracksRef.current = activeTracksRef.current.filter((t) => t !== track);
          });
        });
        return stream;
      };
    }

    return () => {
      // Restore getUserMedia
      if (navigator.mediaDevices && originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      }
      // Force kill tracks immediately and synchronously
      forceStopAllCameraTracks();

      // Stop scanner instance
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  const stopCameraScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        const scanner = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        if (scanner.isScanning) {
          try {
            await scanner.stop();
          } catch (err) {
            console.warn('Error calling scanner.stop():', err);
          }
        }
        try {
          scanner.clear();
        } catch (err) {}
      }
    } catch (err) {
      console.warn('Error in stopCameraScanner:', err);
    } finally {
      forceStopAllCameraTracks();
      setIsScanning(false);
    }
  };

  const startCameraScanner = async (overrideCameraId?: string) => {
    setCameraError(null);
    setVerificationResult(null);

    try {
      // Ensure any previous scanner instance is cleanly stopped
      await stopCameraScanner();

      // Check available devices if not yet populated
      let activeCameraId = overrideCameraId || selectedCameraId;
      if (!activeCameraId) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
            activeCameraId = devices[0].id;
            setSelectedCameraId(activeCameraId);
          }
        } catch (e) {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(readerId);
      html5QrCodeRef.current = html5QrCode;

      // Use specific camera device ID if available, otherwise environment facingMode
      const cameraConfig = activeCameraId ? activeCameraId : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Pause/stop scanner upon finding a QR code
          await stopCameraScanner();
          handleVerifyQR(decodedText);
        },
        () => {
          // Ignore transient frame scanning failures
        }
      );

      setIsScanning(true);
      // Re-fetch cameras after permission grant to get human-readable device labels
      fetchCameras();
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      let msg = 'Unable to access camera.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        msg = 'Camera permission was denied. Please allow camera permissions in browser settings, or use the Manual Fallback.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera hardware found on this device. Please use Manual Fallback.';
      }
      setCameraError(msg);
      setIsScanning(false);
    }
  };

  const handleCameraChange = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      await stopCameraScanner();
      await startCameraScanner(newCameraId);
    }
  };

  const handleVerifyQR = async (payload: string) => {
    if (!payload.trim()) return;

    setVerifying(true);
    setLastScannedPayload(payload);

    try {
      const result = await verifyGateQR(payload);
      setVerificationResult(result);
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        state: 'ERROR',
        message: err.message || 'Unexpected verification failure',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyQR(manualCode);
  };

  const handleResetForNextScan = () => {
    setVerificationResult(null);
    setLastScannedPayload('');
    setManualCode('');
    if (activeMode === 'camera') {
      startCameraScanner();
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-zinc-100 shadow-xl space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <span>KisanFlow e-Pass QR Scanner</span>
            <span className="bg-sky-950/80 text-sky-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-sky-600/50">
              HMAC-SHA256
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Scan farmer digital e-Pass QR code or enter booking reference for cryptographic gate ingress
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('camera');
              if (!isScanning && !verificationResult) {
                startCameraScanner();
              }
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeMode === 'camera'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              setActiveMode('manual');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              activeMode === 'manual'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manual Fallback</span>
          </button>
        </div>
      </div>

      {/* Verification State Cards (Success, Invalid, Unauthorized, Already Verified, Expired) */}
      {verifying && (
        <div className="p-6 bg-zinc-800/80 border border-sky-500/40 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <div className="text-sm font-bold text-sky-200">Verifying e-Pass with Authority Server...</div>
          <div className="text-xs text-zinc-400 font-mono">Validating HMAC signature, slot validity & centre isolation</div>
        </div>
      )}

      {!verifying && verificationResult && (
        <div className="space-y-4">
          {/* 1. SUCCESS STATE */}
          {verificationResult.state === 'SUCCESS' && (
            <div className="p-5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-100 space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-emerald-300">
                    GATE ENTRY VERIFIED & RECORDED
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Cryptographic signature is valid. Booking has transitioned to{' '}
                    <strong className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded text-white">ARRIVED</strong>.
                  </p>
                </div>
              </div>

              {verificationResult.data && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-800/50 text-xs">
                  <div className="bg-emerald-900/40 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase text-emerald-400 font-semibold block">
                      Assigned Token #
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      #{verificationResult.data.token_number || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-emerald-900/40 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase text-emerald-400 font-semibold block">
                      Queue Status
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-300">
                      {verificationResult.data.status || 'WAITING'}
                    </span>
                  </div>
                  <div className="bg-emerald-900/40 p-2.5 rounded-lg col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase text-emerald-400 font-semibold block">
                      Booking Ref
                    </span>
                    <span className="text-xs font-mono text-zinc-200 truncate block">
                      {verificationResult.data.booking_id?.substring(0, 13) || 'Confirmed'}...
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-300/60 truncate max-w-xs">
                  Payload: {lastScannedPayload}
                </span>
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <span>Scan Next Farmer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. INVALID QR STATE */}
          {verificationResult.state === 'INVALID_QR' && (
            <div className="p-5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-100 space-y-3">
              <div className="flex items-start space-x-3">
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-300">INVALID OR TAMPERED QR CODE</h4>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {verificationResult.message || 'Cryptographic signature verification failed. The e-Pass QR code may be counterfeit or altered.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Retry Scan
                </button>
              </div>
            </div>
          )}

          {/* 3. UNAUTHORIZED CENTRE STATE */}
          {verificationResult.state === 'UNAUTHORIZED_CENTRE' && (
            <div className="p-5 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-100 space-y-3">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-300">WRONG PROCUREMENT CENTRE</h4>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {verificationResult.message || 'This booking is registered for another mandi centre. Centre isolation policy prevents gate admission here.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Scan Next Farmer
                </button>
              </div>
            </div>
          )}

          {/* 4. ALREADY VERIFIED STATE */}
          {verificationResult.state === 'ALREADY_VERIFIED' && (
            <div className="p-5 bg-sky-950/60 border border-sky-500/50 rounded-xl text-sky-100 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-sky-300">ALREADY GATE-VERIFIED</h4>
                  <p className="text-xs text-sky-200/90 leading-relaxed">
                    {verificationResult.message || 'This booking has already been gate-verified and admitted into the procurement holding yard.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}

          {/* 5. EXPIRED STATE */}
          {verificationResult.state === 'EXPIRED' && (
            <div className="p-5 bg-orange-950/60 border border-orange-500/50 rounded-xl text-orange-100 space-y-3">
              <div className="flex items-start space-x-3">
                <Clock className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-orange-300">EXPIRED e-PASS / SLOT</h4>
                  <p className="text-xs text-orange-200/90 leading-relaxed">
                    {verificationResult.message || 'The time window for this booking slot has expired. Farmer must book an updated slot.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}

          {/* 6. GENERAL ERROR STATE */}
          {verificationResult.state === 'ERROR' && (
            <div className="p-5 bg-zinc-800 border border-rose-500/50 rounded-xl text-zinc-100 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-300">VERIFICATION ERROR</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {verificationResult.message}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs rounded-xl transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 1: CAMERA SCANNER */}
      {activeMode === 'camera' && !verificationResult && !verifying && (
        <div className="space-y-3">
          {/* Webcam / Hardware Device Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                <Video className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Webcam Input Source:
                </label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none truncate w-full max-w-sm mt-0.5 cursor-pointer font-medium"
                >
                  {availableCameras.length === 0 ? (
                    <option value="">Default Camera / Environment</option>
                  ) : (
                    availableCameras.map((cam, idx) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${idx + 1} (${cam.id.slice(0, 8)}...)`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={fetchCameras}
                disabled={isEnumeratingCameras}
                title="Scan for connected USB webcams"
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEnumeratingCameras ? 'animate-spin' : ''}`} />
                <span className="text-[11px] font-semibold">Detect Devices</span>
              </button>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800/80 text-sky-400 border border-zinc-700/80 font-bold">
                {availableCameras.length} {availableCameras.length === 1 ? 'CAM' : 'CAMS'}
              </span>
            </div>
          </div>

          <div className="relative bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
            {/* Camera feed wrapper — fixed aspect ratio, centered */}
            <div className="relative w-full flex items-center justify-center" style={{ minHeight: '320px' }}>
              {/* HTML5 QR Container — fills the box, library injects <video> here */}
              <div
                id={readerId}
                className="w-full h-full absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&_img]:hidden"
                style={{ overflow: 'hidden' }}
              />

              {/* Scan target overlay — centered crosshair frame on top of the camera */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-56 h-56 relative">
                    {/* Top-left corner */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                    {/* Top-right corner */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                    {/* Bottom-left corner */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                    {/* Bottom-right corner */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />
                    {/* Scanning line animation */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" style={{ top: '50%' }} />
                  </div>
                </div>
              )}

              {/* Start scanner overlay — shown when camera is NOT active */}
              {!isScanning && (
                <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">Camera Scanner Ready</h4>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1">
                      {selectedCameraId && availableCameras.length > 0
                        ? `Ready to scan using ${availableCameras.find((c) => c.id === selectedCameraId)?.label || 'selected camera'}`
                        : 'Click Start Scanner to activate device camera and scan farmer e-Pass QR code'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCameraScanner()}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Scanner</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom control bar — inside the camera container */}
            {isScanning && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/95 border-t border-zinc-800">
                <div className="flex items-center space-x-2 text-xs text-sky-400 font-medium truncate max-w-[65%]">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
                  <span className="truncate">
                    Active: {availableCameras.find((c) => c.id === selectedCameraId)?.label || 'Camera Feed'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Scanner</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Camera Access Issue</span>
                <p className="text-[11px] leading-relaxed text-rose-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setActiveMode('manual')}
                  className="text-[11px] text-sky-300 underline font-semibold hover:text-sky-200 mt-1 block"
                >
                  Switch to Manual Fallback Verification
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: MANUAL FALLBACK */}
      {activeMode === 'manual' && !verificationResult && !verifying && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Manual Token / QR Reference Verification
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If camera scanning is unavailable or the printed QR code is damaged, paste the signed QR payload string or booking ID to verify authority record.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400">
                Gate Token Number, Booking Reference or QR Payload:
              </label>
              <textarea
                rows={3}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. KF-2026-5897, BK-0ED6E9A5, or scanned QR string"
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Verify Gate Entry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default QRScanner;
