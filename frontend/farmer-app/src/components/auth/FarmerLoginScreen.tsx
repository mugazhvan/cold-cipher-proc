import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Tractor,
  Phone,
  ArrowRight,
  ShieldCheck,
  Wheat,
} from 'lucide-react';

export const FarmerLoginScreen: React.FC = () => {
  const { login } = useKisanFlow();
  
  // Farmer OTP login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleFarmerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      if (phoneNumber.length >= 10) {
        setOtpSent(true);
      }
    } else {
      if (otpCode.length >= 4) {
        login('farmer');
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner - Emerald Theme */}
        <div className="bg-emerald-600 p-6 sm:p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Wheat className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
              <Tractor className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">KisanFlow Farmer Portal</h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium">
              Aadhaar & PM-KISAN Linked Slot Procurement
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleFarmerSubmit} className="space-y-5">
            {!otpSent ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Farmer Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base bg-slate-50 text-slate-900 transition-colors"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Use your PM-KISAN registered mobile number for instant verification.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors cursor-pointer"
                >
                  <span>Get 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Enter Verification Code</label>
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <ShieldCheck className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base bg-slate-50 text-slate-900 text-center tracking-widest font-mono font-bold transition-colors"
                      placeholder="••••"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center pt-2">
                    Verification SMS sent to +91 {phoneNumber}
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-colors cursor-pointer"
                >
                  <span>Verify OTP & Enter Portal</span>
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-6 text-center space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Department of Consumer Affairs • MSP Guaranteed Procurement</span>
        </p>
      </div>
    </div>
  );
};
