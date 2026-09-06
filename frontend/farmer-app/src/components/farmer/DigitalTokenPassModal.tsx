import React, { useState } from 'react';
import { TokenRecord, FarmerProfile } from '../../types';
import {
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

interface DigitalTokenPassModalProps {
  token: TokenRecord;
  farmer: FarmerProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalTokenPassModal: React.FC<DigitalTokenPassModalProps> = ({
  token,
  farmer,
  isOpen,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const generatePassCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 1100);
      bgGradient.addColorStop(0, '#064e3b'); // Emerald-900
      bgGradient.addColorStop(0.3, '#042f2e'); // Teal-950
      bgGradient.addColorStop(1, '#0f172a'); // Slate-900
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 800, 1100);

      // Outer Decorative Border
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6;
      ctx.strokeRect(24, 24, 752, 1052);

      // Inner Border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(36, 36, 728, 1028);

      // Header Banner
      ctx.fillStyle = '#f59e0b'; // Amber-500
      ctx.font = 'bold 20px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS', 400, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('KISANFLOW DIGITAL GATE PASS', 400, 120);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '16px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Smart Procurement Coordination & Queue Priority Pass', 400, 150);

      // Horizontal Divider
      ctx.strokeStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(60, 175);
      ctx.lineTo(740, 175);
      ctx.stroke();

      // Pass Token Badge Card
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(60, 195, 680, 85);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 195, 680, 85);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('OFFICIAL TOKEN PASS NUMBER', 85, 230);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(token.tokenNumber, 85, 268);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`STATUS: ${token.status}`, 715, 235);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(`ISSUED: ${new Date(token.createdAt).toLocaleDateString('en-IN')}`, 715, 265);

      // Main Details Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(60, 305, 680, 360);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(60, 305, 680, 360);

      // Section 1: Farmer & Crop Details
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';

      const drawRow = (label: string, value: string, x: number, y: number, isMono = false) => {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 13px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(label.toUpperCase(), x, y);

        ctx.fillStyle = '#0f172a';
        ctx.font = isMono ? 'bold 18px monospace' : 'bold 17px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(value, x, y + 24);
      };

      drawRow('Farmer Name', token.farmerName, 85, 345);
      drawRow('PM-KISAN ID', farmer.farmerId, 420, 345, true);

      drawRow('Crop / Commodity', token.cropName, 85, 420);
      drawRow('Estimated Load', `${token.estimatedQuintals} Quintals`, 420, 420);

      drawRow('Vehicle Type & Reg No', `${token.vehicleType} • ${token.vehicleNumber}`, 85, 495, true);
      drawRow('Aadhaar (Masked)', farmer.aadhaarMasked, 420, 495, true);

      drawRow('Procurement Nodal Mandi', token.centreName, 85, 570);
      drawRow('Slot Time Window', token.slotTime, 420, 570);

      if (token.assignedBay) {
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`🚨 ASSIGNED BAY: ${token.assignedBay}`, 85, 635);
      }

      // QR Code Container Box
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(60, 690, 680, 240);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(60, 690, 680, 240);

      // Draw QR Mock matrix
      const qrStartX = 95;
      const qrStartY = 715;
      const qrSize = 190;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrStartX, qrStartY, qrSize, qrSize);

      // QR block pattern
      ctx.fillStyle = '#022c22';
      const gridSize = 8;
      const cellSize = qrSize / gridSize;
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if ((r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 0 && c === gridSize - 1) || (r === gridSize - 1 && c === 0)) {
            ctx.fillRect(qrStartX + c * cellSize + 2, qrStartY + r * cellSize + 2, cellSize - 4, cellSize - 4);
          }
        }
      }

      // QR Text details on the right
      ctx.textAlign = 'left';
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('MANDI GATE ADMISSION QR CODE', 315, 745);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Show this QR matrix at Mandi Security Gate 1 for automatic', 315, 775);
      ctx.fillText('ANPR barrier lift and gross weight weighbridge queuing.', 315, 795);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`VERIFICATION: KISANFLOW://${token.tokenNumber}`, 315, 840);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('• MSP Guaranteed Direct Benefit Transfer (DBT)', 315, 870);
      ctx.fillText('• 100% Free Government Transit & FAQ Testing', 315, 890);

      // Legal & Security Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Direct Benefit Transfer (DBT) Protected Under Section 7 • Department of Consumer Affairs, GoI', 400, 970);
      ctx.fillText('Toll Free Kisan Call Centre: 1800-180-1551 • Smart Procurement System SIH26032', 400, 995);

      resolve(canvas);
    });
  };

  const handleDownloadImage = async () => {
    try {
      setDownloading(true);
      const canvas = await generatePassCanvas();
      const imageUri = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `KisanFlow-Pass-${token.tokenNumber}.png`;
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to download image pass', e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">
              Official Digital Token Pass
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Pass Card Preview */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Visual Pass Card */}
          <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-emerald-500/40 p-6 shadow-xl relative overflow-hidden">
            {/* Top Pass Brand */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-800/60 pb-4 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  Government of India • Dept. of Consumer Affairs
                </span>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>KisanFlow Mandi Gate Pass</span>
                </h2>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-900/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-emerald-300">
                  {token.tokenNumber}
                </span>
              </div>
            </div>

            {/* Pass Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
              {/* QR Block */}
              <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-slate-900 shadow-inner">
                <div className="w-36 h-36 bg-slate-950 p-2 rounded-xl flex items-center justify-center relative">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-white">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${
                          i % 2 === 0 || i % 5 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                            ? 'bg-slate-950'
                            : 'bg-emerald-700'
                        } rounded-xs`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                      KF-PASS
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-600 mt-2 font-bold tracking-wider">
                  SCAN AT GATE 1
                </span>
              </div>

              {/* Farmer & Crop Data */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Farmer Name</span>
                    <span className="font-bold text-slate-100 text-sm">{token.farmerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">PM-KISAN Reg ID</span>
                    <span className="font-mono font-bold text-emerald-400">{farmer.farmerId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Crop / Commodity</span>
                    <span className="font-bold text-emerald-300">{token.cropName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Estimated Quantity</span>
                    <span className="font-bold text-slate-100">{token.estimatedQuintals} Qtl</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Mandi</span>
                    <span className="font-bold text-slate-200 truncate block">{token.centreName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Slot Window</span>
                    <span className="font-bold text-amber-300">{token.slotTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Vehicle Details</span>
                    <span className="font-mono font-bold text-slate-100">
                      {token.vehicleType} • {token.vehicleNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Aadhaar Masked</span>
                    <span className="font-mono text-slate-300">{farmer.aadhaarMasked}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Pass Notice */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>e-Token Verified • Direct Benefit Transfer Protected</span>
              </span>
              <span>Kisan Helpline: 1800-180-1551</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Pass / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Pass Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Generating...' : 'Download Image Pass (PNG)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
