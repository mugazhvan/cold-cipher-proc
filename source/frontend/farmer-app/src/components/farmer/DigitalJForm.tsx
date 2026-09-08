import React, { useRef, useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Wheat,
} from 'lucide-react';

export const DigitalJForm: React.FC = () => {
  const { tokens, activeToken, farmer } = useKisanFlow();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  // Find completed token or fallback
  const completedToken =
    tokens.find((t) => t.id === activeToken?.id && t.status === 'COMPLETED') ||
    tokens.find((t) => t.status === 'COMPLETED') ||
    tokens[0];

  const payment = completedToken.paymentDetails || {
    grossWeightKg: 8420,
    tareWeightKg: 3220,
    netWeightQuintals: 52.0,
    mspRatePerQuintal: 2275,
    grossAmountRs: 118300,
    qualityDeductionsRs: 0,
    mandiFeesRs: 0,
    netPayableRs: 118300,
    utrNumber: 'RBI-DBT-20260905-99812401',
    paymentStatus: 'PAID_TO_BANK',
    paidAt: '09:35 AM',
    jFormNumber: 'JF-PB-SAM-2026-0814',
  };

  const handlePrint = () => {
    window.print();
  };

  const generateJFormCanvas = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clean White Paper Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1400);

      // Outer Formal Border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(25, 25, 950, 1350);

      // Inner Border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(35, 35, 930, 1330);

      // Header Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(50, 50, 900, 45);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS', 500, 78);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px "Times New Roman", Georgia, serif';
      ctx.fillText('FORM \'J\' — SALE SLIP FOR PRODUCER-SELLER', 500, 135);

      ctx.fillStyle = '#475569';
      ctx.font = '14px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('[See Rule 24(1) of State Agricultural Produce Markets Act & Rules]', 500, 160);

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Mandi Board Centralized Digital Electronic Procurement System (SIH26032)', 500, 185);

      // Meta Reference Bar
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(50, 205, 900, 40);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 205, 900, 40);

      ctx.fillStyle = '#0f172a';
      ctx.font = '13px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`J-FORM NO: `, 65, 230);
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${payment.jFormNumber}`, 160, 230);

      ctx.font = '13px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`GATE PASS REF: `, 420, 230);
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${completedToken.tokenNumber}`, 535, 230);

      ctx.font = '13px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`DATE: `, 750, 230);
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`${completedToken.slotDate} 09:35 AM IST`, 800, 230);

      // Procurement Centre & Farmer Details Box
      const drawBox = (title: string, lines: { label: string; val: string }[], x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title.toUpperCase(), x + 15, y + 25);

        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 33);
        ctx.lineTo(x + w - 15, y + 33);
        ctx.stroke();

        let curY = y + 55;
        lines.forEach((l) => {
          ctx.fillStyle = '#64748b';
          ctx.font = '13px "Segoe UI", Roboto, sans-serif';
          ctx.fillText(l.label + ':', x + 15, curY);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 13px "Segoe UI", Roboto, sans-serif';
          ctx.fillText(l.val, x + 120, curY);
          curY += 24;
        });
      };

      drawBox(
        'Procurement Centre Details',
        [
          { label: 'Centre', val: completedToken.centreName },
          { label: 'APMC Code', val: 'PB-LDH-042 (Samrala)' },
          { label: 'District / State', val: 'Ludhiana, Punjab' },
          { label: 'Agency', val: 'Food Corporation of India (FCI)' },
        ],
        50,
        260,
        435,
        155
      );

      drawBox(
        'Producer-Seller (Farmer)',
        [
          { label: 'Name', val: farmer.name },
          { label: 'PM-KISAN ID', val: farmer.farmerId },
          { label: 'Village', val: farmer.village },
          { label: 'Vehicle', val: `${completedToken.vehicleNumber} (${completedToken.vehicleType})` },
        ],
        515,
        260,
        435,
        155
      );

      // Produce Specification Table
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('COMMODITY & WEIGHMENT SPECIFICATION', 50, 445);

      // Table Header
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(50, 460, 900, 35);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(50, 460, 900, 35);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('COMMODITY / VARIETY', 65, 482);
      ctx.textAlign = 'right';
      ctx.fillText('GROSS WT (KG)', 390, 482);
      ctx.fillText('TARE WT (KG)', 530, 482);
      ctx.fillText('NET QUANTITY', 680, 482);
      ctx.fillText('MSP (₹/QTL)', 790, 482);
      ctx.fillText('TOTAL (₹)', 935, 482);

      // Table Body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, 495, 900, 60);
      ctx.strokeRect(50, 495, 900, 60);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(completedToken.cropName, 65, 520);
      ctx.font = '11px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText('FAQ Grade A • Moisture: 11.4% (Standard < 12.0%)', 65, 540);

      ctx.fillStyle = '#0f172a';
      ctx.font = '13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${payment.grossWeightKg.toLocaleString()} kg`, 390, 530);
      ctx.fillText(`${payment.tareWeightKg.toLocaleString()} kg`, 530, 530);
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${payment.netWeightQuintals.toFixed(2)} Qtl`, 680, 530);
      ctx.font = '13px monospace';
      ctx.fillText(`₹${payment.mspRatePerQuintal.toLocaleString()}`, 790, 530);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#047857';
      ctx.fillText(`₹${payment.grossAmountRs.toLocaleString('en-IN')}`, 935, 530);

      // Direct Bank Transfer (DBT) Box & Financial Settlement Box
      // DBT Box (Left)
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(50, 580, 435, 175);
      ctx.strokeStyle = '#6ee7b7';
      ctx.strokeRect(50, 580, 435, 175);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 14px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DIRECT BENEFIT TRANSFER (DBT) SETTLEMENT', 65, 610);

      ctx.fillStyle = '#334155';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Payment dispatched electronically to Farmer\'s verified bank account', 65, 635);
      ctx.fillText('without middleman or arhatiya deductions.', 65, 655);

      ctx.strokeStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.moveTo(65, 670);
      ctx.lineTo(470, 670);
      ctx.stroke();

      ctx.fillStyle = '#064e3b';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Credit Bank: ${farmer.bankName} (${farmer.bankAccountMasked})`, 65, 695);
      ctx.fillText(`RBI-UTR No: ${payment.utrNumber}`, 65, 718);
      ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Status: DIRECT BANK CREDIT CONFIRMED (09:35 AM)`, 65, 740);

      // Financial Calculation Box (Right)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(515, 580, 435, 175);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(515, 580, 435, 175);

      const drawCalcRow = (label: string, val: string, yPos: number, isBold = false, isEmerald = false) => {
        ctx.fillStyle = isBold ? '#0f172a' : '#475569';
        ctx.font = isBold ? 'bold 14px "Segoe UI", Roboto, sans-serif' : '13px "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, 530, yPos);

        ctx.textAlign = 'right';
        ctx.fillStyle = isEmerald ? '#047857' : isBold ? '#0f172a' : '#334155';
        ctx.font = isBold ? 'bold 16px monospace' : '14px monospace';
        ctx.fillText(val, 935, yPos);
      };

      drawCalcRow('Gross Value of Produce:', `₹${payment.grossAmountRs.toLocaleString('en-IN')}`, 615);
      drawCalcRow('Quality / Moisture Deductions:', '₹0.00 (FAQ Pass)', 645);
      drawCalcRow('Mandi Cess & Market Fees:', '₹0.00 (Exempt)', 675);

      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(530, 695);
      ctx.lineTo(935, 695);
      ctx.stroke();

      drawCalcRow('Total Net Payable to Farmer:', `₹${payment.netPayableRs.toLocaleString('en-IN')}`, 730, true, true);

      // Mandatory Legal Declaration
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(50, 780, 900, 75);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(50, 780, 900, 75);

      ctx.fillStyle = '#334155';
      ctx.font = '11px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('STATUTORY DECLARATION & AUDIT COMPLIANCE:', 65, 805);
      ctx.fillText('1. Certified that the agricultural produce described above has been weighed in accordance with Section 24 of the APMC Act.', 65, 825);
      ctx.fillText('2. Payment has been cleared directly through the RBI National Automated Clearing House (NACH-DBT) without intermediaries.', 65, 843);

      // Signatures & Official Seal
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(50, 880);
      ctx.lineTo(950, 880);
      ctx.stroke();

      // Seal Circle
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(110, 950, 45, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 9px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOVT OF INDIA', 110, 930);
      ctx.fillText('★ DCA ★', 110, 950);
      ctx.fillText('APPROVED', 110, 970);

      ctx.fillStyle = '#334155';
      ctx.font = '12px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Cryptographically Signed & Timestamped', 175, 935);
      ctx.fillText('SHA-256: 8f4a1b9c2026...dca01', 175, 955);
      ctx.fillText('Public Verification Portal: kisanflow.gov.in/verify', 175, 975);

      // Officer Signature
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'italic bold 18px "Times New Roman", Georgia, serif';
      ctx.fillText('Er. R. K. Sharma', 935, 935);

      ctx.font = 'bold 12px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Procurement Officer & Quality Inspector', 935, 955);
      ctx.font = '11px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Samrala Mandi • Punjab Mandi Board', 935, 975);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('This is a computer-generated statutory J-Form document under KisanFlow Smart Mandi Architecture SIH26032.', 500, 1030);

      resolve(canvas);
    });
  };

  const handleDownloadJForm = async () => {
    try {
      setDownloading(true);
      const canvas = await generateJFormCanvas();
      const imageUri = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = `KisanFlow-JForm-${payment.jFormNumber}.png`;
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Error generating J-Form download', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Official Form &apos;J&apos; (Digital Procurement Slip)
          </h2>
          <p className="text-xs text-slate-500">
            Statutory Sale Receipt under Agricultural Produce Markets Rules • Verified by DCA
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="print-jform-btn"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Receipt</span>
          </button>
          <button
            id="download-jform-btn"
            onClick={handleDownloadJForm}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Preparing Receipt...' : 'Download J-Form Receipt'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* The Printable J-Form Paper Document */}
      <div
        ref={receiptRef}
        id="printable-jform-receipt"
        className="bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-10 shadow-lg text-slate-900 font-serif relative overflow-hidden"
      >
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <Wheat className="w-96 h-96 text-slate-950" />
        </div>

        {/* Form Header */}
        <div className="text-center border-b-2 border-slate-800 pb-5 mb-6 relative">
          <div className="inline-block bg-slate-900 text-amber-300 text-[10px] font-mono uppercase px-3 py-0.5 rounded-full font-sans font-bold tracking-widest mb-2">
            GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900">
            FORM &apos;J&apos; — SALE SLIP FOR PRODUCER-SELLER
          </h1>
          <p className="text-xs font-sans text-slate-600 mt-1">
            [See Rule 24(1) of State Agricultural Produce Markets Rules]
          </p>
          <p className="text-xs font-sans font-semibold text-emerald-800 mt-0.5">
            Mandi Board Centralized Digital Electronic Procurement System (SIH26032)
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-sans text-slate-700 border-t border-slate-200 pt-2">
            <div>
              <strong>J-Form No:</strong>{' '}
              <span className="font-mono font-bold text-slate-950">{payment.jFormNumber}</span>
            </div>
            <div>
              <strong>Gate Pass Ref:</strong>{' '}
              <span className="font-mono font-bold text-slate-950">
                {completedToken.tokenNumber}
              </span>
            </div>
            <div>
              <strong>Date & Time:</strong>{' '}
              <span className="font-mono">{completedToken.slotDate} 09:35 AM IST</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Mandi Details & Farmer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans text-xs mb-6 border-b border-slate-200 pb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Procurement Centre Details</span>
            </h3>
            <div className="space-y-1 text-slate-600">
              <p>
                <strong>Centre:</strong> {completedToken.centreName}
              </p>
              <p>
                <strong>APMC Code:</strong> PB-LDH-042 (Samrala Division)
              </p>
              <p>
                <strong>District / State:</strong> Ludhiana, Punjab
              </p>
              <p>
                <strong>Procuring Agency:</strong> Food Corporation of India (FCI) / Pungrain
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center space-x-1.5">
              <Wheat className="w-3.5 h-3.5 text-emerald-700" />
              <span>Producer-Seller (Farmer) Details</span>
            </h3>
            <div className="space-y-1 text-slate-600">
              <p>
                <strong>Name:</strong> {farmer.name}
              </p>
              <p>
                <strong>Farmer ID:</strong> {farmer.farmerId}
              </p>
              <p>
                <strong>Village / District:</strong> {farmer.village}
              </p>
              <p>
                <strong>Vehicle Registration:</strong>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {completedToken.vehicleNumber}
                </span>{' '}
                ({completedToken.vehicleType})
              </p>
            </div>
          </div>
        </div>

        {/* Produce Specification Table */}
        <div className="font-sans text-xs mb-6">
          <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
            Commodity & Weighment Specification
          </h3>
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                  <th className="p-2.5">Commodity / Variety</th>
                  <th className="p-2.5 text-right">Gross Wt. (kg)</th>
                  <th className="p-2.5 text-right">Tare Wt. (kg)</th>
                  <th className="p-2.5 text-right">Net Quantity</th>
                  <th className="p-2.5 text-right">MSP Rate (₹/qtl)</th>
                  <th className="p-2.5 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">
                    {completedToken.cropName}
                    <div className="text-[10px] text-emerald-700 font-normal">
                      FAQ Grade A • Moisture: 11.4% (Standard &lt; 12.0%)
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {payment.grossWeightKg.toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    {payment.tareWeightKg.toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-950">
                    {payment.netWeightQuintals.toFixed(2)} Quintals
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    ₹{payment.mspRatePerQuintal.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                    ₹{payment.grossAmountRs.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Settlement & Deductions Breakdown */}
        <div className="font-sans text-xs grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Direct Benefit Transfer (DBT) Status</span>
              </div>
              <p className="text-slate-700 text-xs mt-1">
                Payment dispatched electronically to Farmer&apos;s verified bank account without
                middlemen or arhatiya deduction.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200 text-[11px] font-mono text-emerald-950 space-y-0.5">
              <div>
                <strong>Credit Bank:</strong> {farmer.bankName} ({farmer.bankAccountMasked})
              </div>
              <div>
                <strong>RBI-UTR Number:</strong> {payment.utrNumber}
              </div>
              <div>
                <strong>Status:</strong> DIRECT CREDIT CONFIRMED (09:35 AM)
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Gross Value of Produce:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{payment.grossAmountRs.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Quality / Moisture Deductions:</span>
              <span className="font-mono text-emerald-700">₹0.00 (FAQ Compliant)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Mandi Cess & Market Fees:</span>
              <span className="font-mono text-slate-500">₹0.00 (Exempt for Farmers)</span>
            </div>
            <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-950">
              <span>Total Net Payable to Farmer:</span>
              <span className="font-mono text-base font-extrabold text-emerald-800">
                ₹{payment.netPayableRs.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Signatures & Seal */}
        <div className="font-sans border-t-2 border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 border-2 border-emerald-700 rounded-full flex flex-col items-center justify-center text-center p-1 text-[8px] font-bold text-emerald-800 uppercase tracking-tighter">
              <span>GOVT OF INDIA</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600 my-0.5" />
              <span>DCA APPROVED</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              <p className="font-bold text-slate-900">Cryptographically Signed & Timestamped</p>
              <p>Certificate SHA-256: 8f4a1b9c2026...dca01</p>
              <p>Public Verification Portal: kisanflow.gov.in/verify</p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="font-serif italic text-sm font-bold text-slate-800">
              Er. R. K. Sharma
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Procurement Officer & Quality Inspector
            </div>
            <div className="text-[10px] text-slate-400">
              Samrala Mandi • Punjab Mandi Board
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
