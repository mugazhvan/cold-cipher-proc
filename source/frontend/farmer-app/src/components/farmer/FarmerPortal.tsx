import React, { useState } from 'react';

import { SlotBooking } from './SlotBooking';
import { LiveTokenTracker } from './LiveTokenTracker';
import { DigitalJForm } from './DigitalJForm';
import { NearbyMandiBoard } from './NearbyMandiBoard';
import { FarmerSidebar } from './FarmerSidebar';
import { LayoutDashboard, Settings } from 'lucide-react';

export const FarmerPortal: React.FC = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs h-full flex flex-col items-center justify-center">
            <LayoutDashboard className="w-16 h-16 text-emerald-600 mx-auto opacity-20" />
            <h2 className="text-2xl font-extrabold text-slate-800">Welcome to KisanFlow</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Manage your crop procurement, view live yard queues, and access your digital gate passes seamlessly from your dashboard. Select an option from the sidebar to begin.
            </p>
          </div>
        );
      case 'find-centre':
        return <NearbyMandiBoard onSelectCentreToBook={() => setActiveItem('recommended-slots')} />;
      case 'recommended-slots':
        return <SlotBooking onSuccess={() => setActiveItem('live-queue')} />;
      case 'live-queue':
        return <LiveTokenTracker onViewReceipt={() => setActiveItem('receipts')} onBookNewSlot={() => setActiveItem('recommended-slots')} />;
      case 'receipts':
        return <DigitalJForm />;
      
      // Placeholders for items without dedicated components
      case 'my-bookings':
      case 'procurement-status':
      case 'payment-status':
      case 'e-pass':
      case 'notifications':
      case 'profile':
      case 'settings':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs h-full flex flex-col items-center justify-center">
            <Settings className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-700 capitalize">{activeItem.replace('-', ' ')}</h2>
            <p className="text-slate-500">This section is currently under construction and will be available soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto min-h-[calc(100vh-120px)]">
      {/* Mobile/Tablet Tab Fallback (Hidden on Desktop) */}
      <div className="lg:hidden flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2 mb-6 hide-scrollbar">
        {['dashboard', 'find-centre', 'recommended-slots', 'live-queue', 'receipts'].map((item) => (
          <button
            key={item}
            onClick={() => setActiveItem(item)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeItem === item
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <FarmerSidebar activeItem={activeItem} setActiveItem={setActiveItem} />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-4xl lg:max-w-none">
        {renderContent()}
      </div>
    </div>
  );
};
