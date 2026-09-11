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
  UserCheck,
  FileCheck,
} from 'lucide-react';
import {
  verifyGateQR,
  lookupBooking,
  verifyBookingArrival,
  QRVerificationResult,
} from '../../services/api';

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
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [verifyingArrival, setVerifyingArrival] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const activeTracksRef = useRef<MediaStreamTrack[]>([]);
  const readerId = 'operator-qr-reader-portal';

  const forceStopAllCameraTracks = () => {
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
      if (navigator.mediaDevices && originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      }
      forceStopAllCameraTracks();

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
      await stopCameraScanner();

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

      const cameraConfig = activeCameraId ? activeCameraId : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopCameraScanner();
          handleVerifyQR(decodedText);
        },
        () => {
          // Ignore transient frame scanning failures
        }
      );

      setIsScanning(true);
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
      if (onVerificationComplete && result.success) {
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

  const handleFindBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupData(null);

    try {
      const res = await lookupBooking(manualCode.trim());
      if (res?.success && res.data) {
        setLookupData(res.data);
      } else {
        setLookupError(res?.detail || res?.message || 'No booking found with this reference.');
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Could not contact server.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleConfirmManualArrival = async () => {
    if (!lookupData) return;
    setVerifyingArrival(true);
    setLookupError(null);

    try {
      const res = await verifyBookingArrival(lookupData.id);
      if (res?.success && res.data) {
        const vResult: QRVerificationResult = {
          success: true,
          state: 'SUCCESS',
          message: 'Farmer arrival verified successfully. Admitted to holding yard.',
          data: {
            token_id: res.data.token_id,
            token_number: res.data.token_number,
            status: 'ARRIVED',
            booking_id: lookupData.booking_reference,
            farmer_name: lookupData.farmer_name,
            centre_id: lookupData.centre_id,
          },
        };
        setVerificationResult(vResult);
        if (onVerificationComplete) {
          onVerificationComplete(vResult);
        }
      } else {
        setLookupError(res?.detail || res?.message || 'Failed to verify arrival.');
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Server error during arrival verification.');
    } finally {
      setVerifyingArrival(false);
    }
  };

  const handleResetForNextScan = () => {
    setVerificationResult(null);
    setLastScannedPayload('');
    setManualCode('');
    setLookupData(null);
    setLookupError(null);
    if (activeMode === 'camera') {
      startCameraScanner();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-xl space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <span>KisanFlow Gate Pass Verification</span>
            <span className="bg-sky-50 text-sky-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-sky-300">
              SECURE
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan farmer e-Pass QR code or use manual lookup fallback to verify arrivals
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('camera');
              setLookupData(null);
              setLookupError(null);
              if (!isScanning && !verificationResult) {
                startCameraScanner();
              }
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              activeMode === 'camera'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              setActiveMode('manual');
              setVerificationResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Can't scan? Use Manual Fallback</span>
          </button>
        </div>
      </div>

      {/* Verifying Spinner */}
      {verifying && (
        <div className="p-6 bg-slate-200 border border-sky-500/40 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-700 animate-spin" />
          <div className="text-sm font-bold text-sky-200">Verifying e-Pass with Authority Server...</div>
          <div className="text-xs text-slate-500 font-mono">Validating signature, expiry, and centre isolation</div>
        </div>
      )}

      {/* Verification State Cards */}
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
                    Farmer verified successfully. Booking status transitioned to{' '}
                    <strong className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded text-white">ARRIVED</strong> in PostgreSQL.
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
                    <span className="text-xs font-mono text-slate-800 truncate block">
                      {verificationResult.data.booking_id || 'Confirmed'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-300/60 truncate max-w-xs">
                  {lastScannedPayload ? `Scanned: ${lastScannedPayload}` : 'Manual Verification'}
                </span>
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Verify Next Farmer</span>
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
                    {verificationResult.message || 'This QR code is not valid.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
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
                    {verificationResult.message || 'This farmer is assigned to another procurement centre.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Scan Next Farmer
                </button>
              </div>
            </div>
          )}

          {/* 4. ALREADY VERIFIED STATE */}
          {verificationResult.state === 'ALREADY_VERIFIED' && (
            <div className="p-5 bg-sky-100/60 border border-sky-500/50 rounded-xl text-sky-100 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-sky-300">ALREADY VERIFIED</h4>
                  <p className="text-xs text-sky-200/90 leading-relaxed">
                    {verificationResult.message || 'This farmer has already been checked in.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
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
                  <h4 className="text-sm font-bold text-orange-300">EXPIRED GATE PASS</h4>
                  <p className="text-xs text-orange-200/90 leading-relaxed">
                    {verificationResult.message || 'This gate pass has expired.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}

          {/* 6. NOT FOUND STATE */}
          {verificationResult.state === 'NOT_FOUND' && (
            <div className="p-5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 space-y-3">
              <div className="flex items-start space-x-3">
                <XCircle className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">NO BOOKING FOUND</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {verificationResult.message || 'No booking was found.'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-slate-200 hover:bg-zinc-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* 7. GENERAL / STATE ERROR */}
          {(verificationResult.state === 'INVALID_STATE' || verificationResult.state === 'ERROR') && (
            <div className="p-5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-100 space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-300">VERIFICATION ERROR</h4>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {verificationResult.message}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-4 py-2 bg-slate-200 hover:bg-zinc-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900/40 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-700 flex items-center justify-center shrink-0 border border-sky-500/30">
                <Video className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Webcam Input Source:
                </label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none truncate w-full max-w-sm mt-0.5 cursor-pointer font-medium"
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
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-white border border-slate-300 text-xs flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEnumeratingCameras ? 'animate-spin' : ''}`} />
                <span className="text-[11px] font-semibold">Detect Devices</span>
              </button>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-200 text-sky-700 border border-slate-300/80 font-bold">
                {availableCameras.length} {availableCameras.length === 1 ? 'CAM' : 'CAMS'}
              </span>
            </div>
          </div>

          <div className="relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
            {/* Camera feed wrapper */}
            <div className="relative w-full flex items-center justify-center" style={{ minHeight: '320px' }}>
              <div
                id={readerId}
                className="w-full h-full absolute inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&_img]:hidden"
                style={{ overflow: 'hidden' }}
              />

              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-56 h-56 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" style={{ top: '50%' }} />
                  </div>
                </div>
              )}

              {!isScanning && (
                <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-sky-600/20 text-sky-700 flex items-center justify-center border border-sky-500/30">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Camera Scanner Ready</h4>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
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

            {isScanning && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/95 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-xs text-sky-700 font-medium truncate max-w-[65%]">
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

      {/* Mode 2: MANUAL FALLBACK — STRICT 2-STEP WORKFLOW */}
      {activeMode === 'manual' && !verificationResult && !verifying && (
        <div className="space-y-4">
          <form onSubmit={handleFindBooking} className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-800" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Manual Fallback: Booking Lookup
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter farmer's booking reference or booking ID. The system will look up and validate authority records before allowing arrival verification.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">
                Booking Reference:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    setLookupError(null);
                  }}
                  placeholder="e.g. KF-2026-4103, 4103, or vehicle number"
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  required
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || lookupLoading}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-black disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  {lookupLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Finding...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Find Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {lookupError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{lookupError}</span>
              </div>
            )}
          </form>

          {/* Safe Booking Details Card (shown ONLY after backend lookup succeeds) */}
          {lookupData && (
            <div className="p-5 bg-white border border-slate-300 rounded-xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Validated Authority Booking Record
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  lookupData.status === 'ARRIVED'
                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                    : lookupData.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {lookupData.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Farmer Name</span>
                  <span className="font-bold text-slate-900 text-sm">{lookupData.farmer_name || 'N/A'}</span>
                  <span className="text-[11px] text-slate-600 block">{lookupData.village || ''}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Booking Reference</span>
                  <span className="font-mono font-extrabold text-slate-900">{lookupData.booking_reference}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Procurement Centre</span>
                  <span className="font-bold text-slate-900">{lookupData.centre_name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Crop & Produce</span>
                  <span className="font-bold text-slate-900">{lookupData.crop_name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Allocated Slot</span>
                  <span className="font-mono font-bold text-slate-900">{lookupData.slot_date}</span>
                  <span className="text-[10px] text-slate-600 block">{lookupData.slot_time}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Quantity</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    {lookupData.quantity ? (lookupData.quantity / 100).toFixed(0) : '0'} Quintals
                  </span>
                </div>
              </div>

              {/* Verify Arrival Action — enabled ONLY if not already arrived/completed */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">
                  {lookupData.status === 'ARRIVED'
                    ? '⚠️ Farmer already arrived and recorded in queue.'
                    : lookupData.status === 'COMPLETED'
                    ? '⚠️ Procurement already completed for this booking.'
                    : 'Confirm arrival to admit farmer and generate yard token.'}
                </span>

                <button
                  type="button"
                  onClick={handleConfirmManualArrival}
                  disabled={verifyingArrival || lookupData.status === 'ARRIVED' || lookupData.status === 'COMPLETED'}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-black disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  {verifyingArrival ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Verify Arrival</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;
