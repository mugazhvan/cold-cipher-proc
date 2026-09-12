import React, { useState } from 'react';
import { TokenRecord } from '../../types';
import { CROPS_CATALOG } from '../../mockData';
import {
  Printer,
  Download,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';

interface OperatorReceiptModalProps {
  token: TokenRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorReceiptModal: React.FC<OperatorReceiptModalProps> = ({
  token,
  isOpen,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const cropMeta = CROPS_CATALOG.find(
    (c) => c.id === token.cropId || c.name.toLowerCase() === (token.cropName || '').toLowerCase()
  ) || CROPS_CATALOG[0];
  const mspRate = token.paymentDetails?.mspRatePerQuintal || cropMeta.mspPerQuintal || 2275;
  const netQuintals = token.paymentDetails?.netWeightQuintals || token.estimatedQuintals || 45.0;
  const grossAmount = Math.round(netQuintals * mspRate);

  const payment = token.paymentDetails || {
    grossWeightKg: Math.round(netQuintals * 100 + 3120),
    tareWeightKg: 3120,
    netWeightQuintals: netQuintals,
    mspRatePerQuintal: mspRate,
    grossAmountRs: grossAmount,
    qualityDeductionsRs: 0,
    mandiFeesRs: 0,
    netPayableRs: grossAmount,
    utrNumber: 'SIM-DBT-20260912-99812401',
    paymentStatus: 'PAID_TO_BANK',
    paidAt: '09:35 AM',
    jFormNumber: 'JF-PB-SAM-2026-0814',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      setDownloading(true);
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clean White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 900, 1200);

      // Outer Border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 860, 1160);

      // Header
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 40, 820, 40);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS', 450, 65);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px "Times New Roman", Georgia, serif';
      ctx.fillText('OFFICIAL J-FORM PAYMENT & WEIGHMENT RECEIPT', 450, 120);

      ctx.fillStyle = '#047857';
      ctx.font = '14px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Mandi Board Centralized Digital Electronic Procurement System • ${token.centreName}`, 450, 145);

      // Meta row
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, 170, 820, 35);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(40, 170, 820, 35);

      ctx.fillStyle = '#0f172a';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`J-FORM NO: ${payment.jFormNumber}`, 55, 192);
      ctx.fillText(`TOKEN REF: ${token.tokenNumber}`, 340, 192);
      ctx.fillText(`DATE: ${token.slotDate} 09:35 AM IST`, 620, 192);

      // Details block
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, 220, 820, 120);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(40, 220, 820, 120);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('PRODUCER-SELLER & VEHICLE PARTICULARS', 55, 245);

      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Farmer Name:', 55, 275);
      ctx.fillText('Commodity:', 55, 300);
      ctx.fillText('Vehicle Plate No:', 55, 325);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(token.farmerName, 170, 275);
      ctx.fillText(token.cropName, 170, 300);
      ctx.fillText(`${token.vehicleNumber} (${token.vehicleType})`, 170, 325);

      ctx.fillStyle = '#475569';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Procurement Centre:', 460, 275);
      ctx.fillText('Allotted Bay:', 460, 300);
      ctx.fillText('Verification Status:', 460, 325);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(token.centreName, 600, 275);
      ctx.fillText(token.assignedBay || 'Bay 2 (North)', 600, 300);
      ctx.fillStyle = '#047857';
      ctx.fillText('100% DBT SETTLED (SIMULATED)', 600, 325);

      // Weighment & Financial table
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(40, 360, 820, 30);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(40, 360, 820, 30);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('WEIGHMENT PARAMETER', 55, 380);
      ctx.textAlign = 'right';
      ctx.fillText('RECORDED VALUE', 840, 380);

      const drawRow = (label: string, val: string, yPos: number, isBold = false, isGreen = false) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(40, yPos - 18, 820, 28);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(40, yPos - 18, 820, 28);

        ctx.fillStyle = isBold ? '#0f172a' : '#475569';
        ctx.font = isBold ? 'bold 13px "Segoe UI", Roboto, sans-serif' : '12px "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, 55, yPos);

        ctx.textAlign = 'right';
        ctx.fillStyle = isGreen ? '#047857' : isBold ? '#0f172a' : '#334155';
        ctx.font = isBold ? 'bold 14px monospace' : '13px monospace';
        ctx.fillText(val, 840, yPos);
      };

      drawRow('Electronic Gross Weight (Loaded Vehicle):', `${payment.grossWeightKg.toLocaleString()} kg`, 415);
      drawRow('Tare Weight (Empty Trolley):', `${payment.tareWeightKg.toLocaleString()} kg`, 445);
      drawRow('Net Certified Agricultural Weight:', `${payment.netWeightQuintals.toFixed(2)} Quintals (${payment.grossWeightKg - payment.tareWeightKg} kg)`, 475, true);
      drawRow('Government Minimum Support Price (MSP):', `₹${payment.mspRatePerQuintal.toLocaleString()} / Quintal`, 505);
      drawRow('Gross MSP Disbursal Amount:', `₹${payment.grossAmountRs.toLocaleString('en-IN')}`, 535);
      drawRow('Fair Average Quality (FAQ) Deductions:', '₹0.00 (Nil)', 565);
      drawRow('Total Net Payout Credited via SIM-DBT:', `₹${payment.netPayableRs.toLocaleString('en-IN')}`, 595, true, true);

      // Bank UTR Settlement details
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(40, 640, 820, 90);
      ctx.strokeStyle = '#6ee7b7';
      ctx.strokeRect(40, 640, 820, 90);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 13px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DIRECT BENEFIT TRANSFER (DBT) TRANSACTION AUDIT', 55, 665);

      ctx.fillStyle = '#064e3b';
      ctx.font = '12px monospace';
      ctx.fillText(`RBI-UTR Number: ${payment.utrNumber}`, 55, 690);
      ctx.fillText(`Disbursal Status: PAID TO FARMER BANK ACCOUNT VIA NACH`, 55, 712);

      // Signatures
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 770);
      ctx.lineTo(860, 770);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '11px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Verified by Weighbridge Operator & Quality Lab Officer', 55, 800);
      ctx.fillText('Punjab State Agricultural Marketing Board', 55, 820);

      ctx.textAlign = 'right';
      ctx.font = 'italic bold 15px "Times New Roman", Georgia, serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Er. R. K. Sharma', 840, 800);
      ctx.font = '11px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Authorized Mandi Signatory', 840, 820);

      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Operator-Receipt-${payment.jFormNumber}.png`;
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Error generating operator receipt', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-base text-slate-900">
              Procurement & Payment Receipt • J-Form
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Preview */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Card Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                  Official Sale Slip (Rule 24)
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Form J: {payment.jFormNumber}
                </h4>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                ₹{payment.netPayableRs.toLocaleString('en-IN')} DBT Paid
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Farmer</span>
                <strong className="text-slate-900 font-bold text-xs">{token.farmerName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Token No</span>
                <strong className="text-slate-900 font-bold font-mono">{token.tokenNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Commodity & Produce</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-base" role="img" aria-label={token.cropName}>
                    {cropMeta.icon}
                  </span>
                  <strong className="text-slate-900 font-bold">{token.cropName || cropMeta.name}</strong>
                  <span className="text-[9px] bg-amber-50 text-amber-900 px-1.5 py-0.2 rounded font-bold border border-amber-200 uppercase">
                    {cropMeta.category}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Net Certified Produce</span>
                <strong className="text-slate-900 font-bold font-mono">{payment.netWeightQuintals} Qtl</strong>
                <span className="text-[10px] text-slate-500 block">
                  ~{Math.round((payment.netWeightQuintals * 100) / (cropMeta.standardBagWeightKg || 50))} Bags @ {cropMeta.standardBagWeightKg || 50}kg
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">Vehicle Particulars</span>
                <strong className="text-slate-900 font-bold font-mono">{token.vehicleNumber}</strong>
                <span className="text-[10px] text-slate-500 block">{token.vehicleType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-semibold">MSP Settlement Rate</span>
                <strong className="text-emerald-800 font-extrabold font-mono text-sm block">
                  ₹{payment.mspRatePerQuintal.toLocaleString('en-IN')} / Qtl
                </strong>
                <span className="text-[10px] text-slate-500 truncate block">{token.centreName}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-950">
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Automated Clearing House (SIMULATED)</span>
              </div>
              <p className="text-[11px] font-mono text-emerald-800 font-bold">
                UTR: {payment.utrNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-900 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Receipt Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Exporting...' : 'Download J-Form Receipt'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
