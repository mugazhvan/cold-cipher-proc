import React, { useEffect, useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { TRANSLATIONS } from '../../translations';
import { Language } from '../../types';
import {
  Building2,
  BarChart3,
  LogOut,
  Radio,
  Globe,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const OperatorHeader: React.FC = () => {
  const {
    role,
    setRole,
    language,
    setLanguage,
    resetDemoData,
    startSimulation,
    isSimulating,
    isAuthenticated,
    logout,
  } = useKisanFlow();
  const t = TRANSLATIONS[language];
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-lg text-slate-900">
      {/* Top Gov/Hackathon Ribbon */}
      <div className="bg-slate-50 text-slate-500 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-mono font-bold tracking-wider text-[10px] border border-sky-200">
            STAFF TERMINAL
          </span>
          <span className="font-medium text-slate-800">
            Government of India • Department of Consumer Affairs
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-500">
            Mandi Operational Center & Quality Control Console
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-sky-700">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-mono text-[11px]">{timeStr} IST</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-300">
            <Globe className="w-3 h-3 text-slate-500" />
            {(['en', 'hi', 'pa'] as Language[]).map((lang) => (
              <button
                key={lang}
                id={`operator-lang-${lang}`}
                onClick={() => setLanguage(lang)}
                className={`px-1.5 py-0.5 rounded transition ${
                  language === lang
                    ? 'bg-sky-500 text-zinc-950 font-bold'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'ਪੰਜਾਬੀ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Brand & Operator Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Console Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-amber-700 flex items-center justify-center text-white shadow-sm ring-2 ring-sky-500/20">
            <Building2 className="w-6 h-6 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                KisanFlow Mandi Command
              </h1>
              <span className="bg-sky-100 text-sky-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-sky-200">
                OP-STATION
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Weighbridge, FAQ Lab & Immediate DBT Payout Disbursal
            </p>
          </div>
        </div>

        {/* Operator Role Navigation Pill */}
        {isAuthenticated && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300">
            <button
              id="operator-nav-console"
              onClick={() => setRole('operator')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                role === 'operator'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Yard & Weighbridge Console</span>
            </button>

            <button
              id="operator-nav-analytics"
              onClick={() => setRole('analytics')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                role === 'analytics'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>DCA District Intelligence</span>
            </button>
          </div>
        )}

        {/* Fast Actions: Notifications, SIH Demo Simulation & Reset */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && <NotificationBell />}

          <button
            id="run-demo-btn"
            onClick={startSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
              isSimulating
                ? 'bg-amber-500 text-zinc-950 animate-pulse ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950'
            }`}
            title="Launch interactive SIH end-to-end evaluation flow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.quickDemoTour}</span>
          </button>

          <button
            id="reset-demo-btn"
            onClick={resetDemoData}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-300 transition"
            title="Reset to default demonstration records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.resetDemo}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800 transition ml-2"
              title="Secure Staff Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
