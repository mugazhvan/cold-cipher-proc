import React from 'react';
import { KisanFlowProvider, useKisanFlow } from './context/KisanFlowContext';
import { Header } from './components/common/Header';
import { FarmerPortal } from './components/farmer/FarmerPortal';
import { SimulationModal } from './components/common/SimulationModal';
import { FarmerLoginScreen } from './components/auth/FarmerLoginScreen';
import { ShieldCheck, PhoneCall } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isAuthenticated } = useKisanFlow();

  if (!isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <FarmerLoginScreen />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <FarmerPortal />
      <SimulationModal />
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <KisanFlowProvider>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <Header />
        <div className="flex-1">
          <MainContent />
        </div>

        {/* Official Footer */}
        <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-sm">KisanFlow</span>
              <span>•</span>
              <span>Intelligent Procurement-Centre & Smart Queue Coordination System</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center space-x-1 text-slate-700">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kisan Helpline: <strong>1800-180-1551</strong> (Toll Free)</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center space-x-1 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Benefit Transfer (DBT) Protected (Simulated)</span>
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
