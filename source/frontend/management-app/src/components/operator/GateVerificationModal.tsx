import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { QRScanner } from './QRScanner';
import { QRVerificationResult } from '../../services/api';

interface GateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedSuccess?: (result: QRVerificationResult) => void;
  centreName?: string;
  centreCode?: string;
}

export const GateVerificationModal: React.FC<GateVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerifiedSuccess,
  centreName = 'Nodal Procurement Mandi',
  centreCode = 'MDC001',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-300 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>KisanFlow QR Scanner</span>
                  <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-600/50">
                    Gate Ingress
                  </span>
                </h2>
                <span className="bg-sky-100 text-sky-300 text-[10px] font-mono px-2 py-0.5 rounded border border-sky-200">
                  {centreCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">{centreName} • Cryptographic Ingress Station</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          <QRScanner
            onVerificationComplete={(result) => {
              if (result.success && onVerifiedSuccess) {
                onVerifiedSuccess(result);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GateVerificationModal;
