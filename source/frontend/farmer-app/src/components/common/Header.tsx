import React, { useEffect, useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { TRANSLATIONS } from '../../translations';
import { Language } from '../../types';
import {
  Sparkles,
  RotateCcw,
  Globe,
  Radio,
  Wheat,
  LogOut,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const Header: React.FC = () => {
  const {
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Gov/Hackathon Ribbon */}
      <div className="bg-emerald-900 text-emerald-100 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-800 text-amber-300 font-bold tracking-wider text-[10px]">
            SIH26032
          </span>
          <span className="font-medium text-emerald-50">
            Government of India • Department of Consumer Affairs
          </span>
          <span className="hidden sm:inline text-emerald-400">|</span>
          <span className="hidden sm:inline text-emerald-200">
            Smart Procurement & Smart Queue Coordination System
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">{timeStr} IST</span>
          </div>

          <div className="flex items-center space-x-1 bg-emerald-800/80 px-2 py-0.5 rounded text-[11px]">
            <Globe className="w-3 h-3 text-emerald-300" />
            {(['en', 'hi', 'pa'] as Language[]).map((lang) => (
              <button
                key={lang}
                id={`lang-btn-${lang}`}
                onClick={() => setLanguage(lang)}
                className={`px-1.5 py-0.5 rounded transition ${
                  language === lang
                    ? 'bg-amber-400 text-emerald-950 font-bold'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'ਪੰਜਾਬੀ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Brand & Role Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* App Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
            <Wheat className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                {t.appTitle}
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                PROD v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{t.subTitle}</p>
          </div>
        </div>

        {/* Farmer Portal Identity Badge */}
        {isAuthenticated && (
          <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900">
            <Wheat className="w-4 h-4 text-emerald-600" />
            <span>Farmer Procurement Portal</span>
          </div>
        )}

        {/* Fast Actions: SIH Demo Simulation & Reset */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 mr-1">
            <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-3"
            >
              <option value="en">EN</option>
              <option value="hi">हिं</option>
              <option value="pa">ਪੰ</option>
            </select>
          </div>

          {/* Notification Alert Center */}
          {isAuthenticated && <NotificationBell />}

          <button
            id="run-demo-btn"
            onClick={startSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950'
            }`}
            title="Launch interactive SIH end-to-end evaluation flow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.quickDemoTour}</span>
          </button>

          <button
            id="reset-demo-btn"
            onClick={resetDemoData}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
            title="Reset to default demonstration records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.resetDemo}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition ml-2"
              title="Secure Logout"
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
