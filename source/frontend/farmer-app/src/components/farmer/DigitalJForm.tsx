import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Printer,
  Download,
  CheckCircle2,
  Building2,
  Wheat,
  AlertCircle
} from 'lucide-react';

export const DigitalJForm: React.FC = () => {
  const { tokens, activeToken, farmer } = useKisanFlow();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find completed token or fallback
  const completedToken =
    tokens.find((t) => t.id === activeToken?.id && t.status === 'COMPLETED') ||
    tokens.find((t) => t.status === 'COMPLETED');

  // Fallback to the first token if no completed token is found to avoid breaking UI entirely,
  // but we will disable download if it's not COMPLETED.
  const displayToken = completedToken || tokens[0];

  const payment = displayToken?.paymentDetails || {
    grossWeightKg: 0,
    tareWeightKg: 0,
    netWeightQuintals: 0,
    mspRatePerQuintal: 0,
    grossAmountRs: 0,
    netPayableRs: 0,
    paymentStatus: 'PENDING',
    jFormNumber: 'N/A',
    utrNumber: 'N/A'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    if (!completedToken) {
      setError("Procurement is not yet completed. Receipt is unavailable.");
      return;
    }
    
    try {
      setDownloading(true);
      setError(null);
      const jwtToken = localStorage.getItem('kisanflow_token');
      const backendUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';
      
      const res = await fetch(`${backendUrl}/bookings/receipt/${completedToken.tokenNumber}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 400) throw new Error("Procurement is not yet completed.");
        if (res.status === 403) throw new Error("Not authorized to download this receipt.");
        throw new Error("Failed to download Receipt.");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KisanFlow_Receipt_${completedToken.id.slice(0,8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e: any) {
      console.error('Error generating Receipt download', e);
      setError(e.message || "Failed to download Receipt.");
    } finally {
      setDownloading(false);
    }
  };

  if (!displayToken) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active tokens or procurements found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            KisanFlow Digital Procurement Receipt
          </h2>
          <p className="text-xs text-slate-500">
            KisanFlow Prototype • Digital Procurement Summary
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>
          <button
            id="download-receipt-btn"
            onClick={handleDownloadReceipt}
            disabled={downloading || !completedToken}
            className={`flex items-center space-x-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer ${!completedToken ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Downloading...' : 'Download PDF Receipt'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* The Printable Receipt UI */}
      <div
        id="printable-receipt"
        className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm text-slate-900 font-sans relative overflow-hidden"
      >
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <Wheat className="w-96 h-96 text-slate-950" />
        </div>

        {/* Form Header */}
        <div className="text-center border-b border-slate-200 pb-5 mb-6 relative">
          <div className="inline-block bg-slate-900 text-amber-300 text-[10px] font-mono uppercase px-3 py-0.5 rounded-full font-bold tracking-widest mb-2">
            KISANFLOW PROTOTYPE
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900">
            DIGITAL PROCUREMENT RECEIPT
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Simulated transaction record. Not a government-issued document.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-700 border-t border-slate-100 pt-2">
            <div>
              <strong>Receipt Ref:</strong>{' '}
              <span className="font-mono font-bold text-slate-950">{payment.jFormNumber || 'N/A'}</span>
            </div>
            <div>
              <strong>Gate Pass Ref:</strong>{' '}
              <span className="font-mono font-bold text-slate-950">
                {displayToken.tokenNumber}
              </span>
            </div>
            <div>
              <strong>Date:</strong>{' '}
              <span className="font-mono">{displayToken.slotDate || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Mandi Details & Farmer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6 border-b border-slate-100 pb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Procurement Centre</span>
            </h3>
            <div className="space-y-1 text-slate-600">
              <p>
                <strong>Centre:</strong> {displayToken.centreName}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center space-x-1.5">
              <Wheat className="w-3.5 h-3.5 text-emerald-700" />
              <span>Farmer Details</span>
            </h3>
            <div className="space-y-1 text-slate-600">
              <p>
                <strong>Name:</strong> {farmer?.name || 'N/A'}
              </p>
              <p>
                <strong>Village:</strong> {farmer?.village || 'N/A'}
              </p>
              <p>
                <strong>Vehicle:</strong>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {displayToken.vehicleNumber}
                </span>{' '}
                ({displayToken.vehicleType})
              </p>
            </div>
          </div>
        </div>

        {/* Produce Specification Table */}
        <div className="text-xs mb-6">
          <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
            Commodity & Weighment Specification
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                  <th className="p-2.5">Commodity / Variety</th>
                  <th className="p-2.5 text-right">Gross Wt. (kg)</th>
                  <th className="p-2.5 text-right">Tare Wt. (kg)</th>
                  <th className="p-2.5 text-right">Net Quantity</th>
                  <th className="p-2.5 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">
                    {displayToken.cropName}
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
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                    ₹{payment.grossAmountRs.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Settlement */}
        <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulated Payment Status</span>
              </div>
              <p className="text-slate-700 text-xs mt-1">
                Payment status is simulated for demonstration purposes.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200 text-[11px] font-mono text-emerald-950 space-y-0.5">
              <div>
                <strong>Status:</strong> {payment.paymentStatus}
              </div>
              <div>
                <strong>Ref Number:</strong> {payment.utrNumber}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-950">
              <span>Total Net Payable (Simulated):</span>
              <span className="font-mono text-base font-extrabold text-emerald-800">
                ₹{payment.netPayableRs.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center pt-6 text-slate-400 text-[10px]">
          Generated by KisanFlow Prototype
        </div>
      </div>
    </div>
  );
};
