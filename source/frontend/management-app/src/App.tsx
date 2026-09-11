import React from 'react';
import { KisanFlowProvider, useKisanFlow } from './context/KisanFlowContext';
import { OperatorHeader } from './components/common/OperatorHeader';
import { OperatorConsole } from './components/operator/OperatorConsole';
import { DepartmentAnalytics } from './components/analytics/DepartmentAnalytics';
import { SimulationModal } from './components/common/SimulationModal';
import { OperatorLoginScreen } from './components/auth/OperatorLoginScreen';
import { ShieldCheck, Building2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role, isAuthenticated } = useKisanFlow();

  if (!isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <OperatorLoginScreen />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {role === 'analytics' ? <DepartmentAnalytics /> : <OperatorConsole />}
      <SimulationModal />
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <KisanFlowProvider>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <OperatorHeader />
        <div className="flex-1">
          <MainContent />
        </div>

        {/* Operator Footer */}
        <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-sm">KisanFlow Operator Console</span>
              <span>•</span>
              <span>Mandi Operations, Weighbridge & Quality Control Suite</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center space-x-1 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Nodal Mandi Station: <strong>Samrala (PB-SAM-01)</strong></span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center space-x-1 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>e-KYC & Form 'J' Ledger Verified</span>
              </span>
              <span className="text-slate-300">|</span>
              <span>SIH26032 • Department of Consumer Affairs, GoI</span>
            </div>
          </div>
        </footer>
      </div>
    </KisanFlowProvider>
  );
};

export default App;
