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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>KisanFlow QR Scanner</span>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Gate Ingress
                  </span>
                </h2>
                <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300">
                  {centreCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">{centreName} • Cryptographic Ingress Station</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
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
