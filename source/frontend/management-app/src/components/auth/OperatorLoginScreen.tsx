import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const OperatorLoginScreen: React.FC = () => {
  const { login } = useKisanFlow();
  const [operatorId, setOperatorId] = useState('OP-SAMRALA-802');
  const [password, setPassword] = useState('mandi@2026');
  const [roleSelection, setRoleSelection] = useState<'operator' | 'analytics'>('operator');

  const handleOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorId && password) {
      login(roleSelection);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Header Banner */}
        <div className="bg-slate-50 p-8 text-center relative overflow-hidden border-b border-slate-200">
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xs mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-1 text-slate-900">
              Mandi Command Console
            </h1>
            <p className="text-slate-600 text-xs font-mono font-bold">
              KisanFlow • Department of Consumer Affairs
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <form onSubmit={handleOperatorSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Staff / Officer ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 text-sm bg-white text-slate-900 font-mono font-bold transition-colors"
                  placeholder="e.g. OP-SAMRALA-802"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 text-sm bg-white text-slate-900 font-mono transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Access Workspace Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoleSelection('operator')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    roleSelection === 'operator'
                      ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Mandi Yard Operator
                </button>
                <button
                  type="button"
                  onClick={() => setRoleSelection('analytics')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    roleSelection === 'analytics'
                      ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  DCA Intelligence
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-zinc-950 hover:bg-black text-white py-3 px-4 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer mt-2"
            >
              <span>Authenticate Staff Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Security Accreditation Footer */}
      <div className="mt-6 text-center space-y-1">
        <p className="text-xs font-bold text-slate-600 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Role-Based Access Control (RBAC) • Department of Consumer Affairs</span>
        </p>
        <p className="text-[11px] text-slate-500">
          All weighbridge slips and moisture ratings are cryptographically signed.
        </p>
      </div>
    </div>
  );
};
