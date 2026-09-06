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
      <div className="w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden text-slate-100">
        {/* Header Banner - Slate & Sky Theme */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden border-b border-slate-700">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Building2 className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-sky-500/20 text-sky-400 p-3 rounded-2xl border border-sky-400/30 shadow-sm mb-3">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-100">
              Mandi Command Console
            </h1>
            <p className="text-sky-300 text-xs font-mono font-medium">
              KisanFlow • Department of Consumer Affairs
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <form onSubmit={handleOperatorSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-slate-900/90 text-slate-100 font-mono transition-colors"
                  placeholder="e.g. OP-SAMRALA-802"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
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
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm bg-slate-900/90 text-slate-100 font-mono transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Access Workspace Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoleSelection('operator')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    roleSelection === 'operator'
                      ? 'bg-sky-600 border-sky-500 text-white shadow-xs'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mandi Yard Operator
                </button>
                <button
                  type="button"
                  onClick={() => setRoleSelection('analytics')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    roleSelection === 'analytics'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  DCA Intelligence
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer mt-2"
            >
              <span>Authenticate Staff Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Security Accreditation Footer */}
      <div className="mt-6 text-center space-y-1">
        <p className="text-xs font-semibold text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Role-Based Access Control (RBAC) • Department of Consumer Affairs</span>
        </p>
        <p className="text-[11px] text-slate-500">
          All weighbridge slips and moisture ratings are cryptographically signed.
        </p>
      </div>
    </div>
  );
};
