import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Tractor,
  Building2,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Wheat,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useKisanFlow();
  const [activeTab, setActiveTab] = useState<'farmer' | 'operator'>('farmer');
  
  // Farmer state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Operator state
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');

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

  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorId && password) {
      login('operator');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-emerald-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Wheat className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
              <Tractor className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">KisanFlow Platform</h1>
            <p className="text-emerald-100 text-sm font-medium">Smart Procurement System</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('farmer'); setOtpSent(false); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'farmer' 
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Tractor className="w-4 h-4" />
            <span>Farmer Login</span>
          </button>
          <button
            onClick={() => setActiveTab('operator')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center space-x-2 transition-colors ${
              activeTab === 'operator' 
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Mandi Operator</span>
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'farmer' ? (
            <form onSubmit={handleFarmerSubmit} className="space-y-5">
              {!otpSent ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50 text-slate-900 transition-colors"
                        placeholder="Enter your 10-digit number"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold shadow-sm transition-colors"
                  >
                    <span>Get OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700">Enter OTP</label>
                      <button 
                        type="button" 
                        onClick={() => setOtpSent(false)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ShieldCheck className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50 text-slate-900 text-center tracking-widest font-mono font-bold transition-colors"
                        placeholder="••••"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center pt-2">
                      Code sent to +91 {phoneNumber}
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold shadow-sm transition-colors"
                  >
                    <span>Verify & Login</span>
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleOperatorSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Operator ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50 text-slate-900 transition-colors"
                    placeholder="Enter Staff ID (e.g. OP-801)"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50 text-slate-900 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-bold shadow-sm transition-colors mt-2"
              >
                <span>Access Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs font-semibold text-slate-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured by Department of Consumer Affairs</span>
        </p>
      </div>
    </div>
  );
};
