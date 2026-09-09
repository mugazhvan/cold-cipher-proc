import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { TRANSLATIONS } from '../../translations';
import { SlotBooking } from './SlotBooking';
import { LiveTokenTracker } from './LiveTokenTracker';
import { DigitalJForm } from './DigitalJForm';
import { NearbyMandiBoard } from './NearbyMandiBoard';
import { Calendar, Clock, FileText, Building2 } from 'lucide-react';

export const FarmerPortal: React.FC = () => {
  const { language } = useKisanFlow();
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'booking' | 'tracker' | 'receipt' | 'mandis'>('booking');

  return (
    <div className="space-y-6">
      {/* Subnavigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          id="farmer-tab-booking"
          onClick={() => setActiveTab('booking')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'booking'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.bookSlot}</span>
        </button>

        <button
          id="farmer-tab-tracker"
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'tracker'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.liveTracker}</span>
        </button>

        <button
          id="farmer-tab-receipt"
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'receipt'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t.jFormReceipt}</span>
        </button>

        <button
          id="farmer-tab-mandis"
          onClick={() => setActiveTab('mandis')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'mandis'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.mandiStatus}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'booking' && (
        <SlotBooking onSuccess={() => setActiveTab('tracker')} />
      )}
      {activeTab === 'tracker' && (
        <LiveTokenTracker
          onViewReceipt={() => setActiveTab('receipt')}
          onBookNewSlot={() => setActiveTab('booking')}
        />
      )}
      {activeTab === 'receipt' && <DigitalJForm />}
      {activeTab === 'mandis' && (
        <NearbyMandiBoard
          onSelectCentreToBook={() => {
            setActiveTab('booking');
          }}
        />
      )}
    </div>
  );
};
