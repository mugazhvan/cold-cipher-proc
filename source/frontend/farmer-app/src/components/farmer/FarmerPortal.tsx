import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { SlotBooking } from './SlotBooking';
import { LiveTokenTracker } from './LiveTokenTracker';
import { DigitalJForm } from './DigitalJForm';
import { NearbyMandiBoard } from './NearbyMandiBoard';
import { FarmerSidebar } from './FarmerSidebar';
import { DigitalTokenPassModal } from './DigitalTokenPassModal';
import { Language } from '../../types';
import {
  MapPin,
  CalendarCheck,
  ListTodo,
  Activity,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  FileText,
  Bell,
  ArrowRight,
  Building2,
  Download,
  Globe,
  CreditCard
} from 'lucide-react';

export const FarmerPortal: React.FC = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const {
    farmer,
    crops,
    centres,
    tokens,
    activeToken,
    notifications,
    markNotificationAsRead,
    language,
    setLanguage
  } = useKisanFlow();

  const farmerTokens = tokens.filter((tok) => tok.farmerId === farmer.id);
  const currentToken = activeToken || farmerTokens[0] || null;
  const currentCentre = centres.find((c) => c.id === currentToken?.centreId) || centres[0];
  const currentCrop = crops.find((c) => c.id === currentToken?.cropId) || crops[0];

  const estimatedMspValue = currentToken
    ? Math.round(currentToken.estimatedQuintals * (currentCrop?.mspPerQuintal || 2275))
    : 102375;

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Farmer Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Aadhaar & PM-KISAN Verified Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, {language === 'hi' && farmer.hindiName ? farmer.hindiName : language === 'pa' && farmer.punjabiName ? farmer.punjabiName : farmer.name}
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                    Village: <strong className="text-white">{farmer.village}</strong> • Registered Land: <strong className="text-white">{farmer.landAcres} Acres</strong> • Kisan ID: <span className="font-mono text-amber-300">{farmer.farmerId}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveItem('recommended-slots')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition shadow-lg shadow-amber-950/20 cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Book New Slot</span>
                  </button>
                  <button
                    onClick={() => setActiveItem('find-centre')}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition border border-white/20 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-300" />
                    <span>Nearby Mandis</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Quick Stat Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active Pass */}
              <div 
                onClick={() => setActiveItem(currentToken ? 'live-queue' : 'recommended-slots')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Gate Pass</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono font-extrabold text-base text-slate-900">
                  {currentToken ? currentToken.tokenNumber : 'No Active Pass'}
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold mt-2">
                  <span>{currentToken ? `Status: ${currentToken.status}` : 'Click to book slot'}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Card 2: Assigned Mandi */}
              <div 
                onClick={() => setActiveItem('find-centre')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Procurement Mandi</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-extrabold text-sm text-slate-900 truncate">
                  {currentCentre.name}
                </div>
                <div className="text-xs text-slate-500 mt-2 flex items-center space-x-1">
                  <span>Wait: ~{currentCentre.avgWaitMinutes || 20} mins</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">{currentCentre.yardCapacityPercent || 30}% Yard Full</span>
                </div>
              </div>

              {/* Card 3: Guaranteed MSP Value */}
              <div 
                onClick={() => setActiveItem('payment-status')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated MSP Value</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono font-extrabold text-base text-slate-900">
                  ₹{estimatedMspValue.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-amber-700 font-bold mt-2">
                  {currentToken?.estimatedQuintals || 45} Qtl @ ₹{currentCrop?.mspPerQuintal || 2275}/Qtl
                </div>
              </div>

              {/* Card 4: DBT Linked Bank */}
              <div 
                onClick={() => setActiveItem('profile')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct Benefit Transfer</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-extrabold text-sm text-slate-900 truncate">
                  {farmer.bankName}
                </div>
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  {farmer.bankAccountMasked} (Aadhaar Seeded)
                </div>
              </div>
            </div>

            {/* Live Queue & Action Banner */}
            {currentToken && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Live Gate Pass Active: Token #{currentToken.tokenNumber}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Slot: <strong>{currentToken.slotDate}</strong> ({currentToken.slotTime}) • Vehicle: <span className="font-mono font-bold text-slate-800">{currentToken.vehicleNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setIsPassModalOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Pass</span>
                  </button>
                  <button
                    onClick={() => setActiveItem('live-queue')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Track Queue</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions Shortcuts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveItem('recommended-slots')}
                className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition shadow-xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs text-slate-900">Book Procurement Slot</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Smart AI load-balanced windows</div>
              </button>

              <button
                onClick={() => setActiveItem('live-queue')}
                className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition shadow-xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs text-slate-900">Live Yard Queue</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Weighbridge bay calling status</div>
              </button>

              <button
                onClick={() => setActiveItem('find-centre')}
                className="p-4 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition shadow-xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs text-slate-900">Mandi Congestion</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Real-time waiting time matrix</div>
              </button>

              <button
                onClick={() => setActiveItem('receipts')}
                className="p-4 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition shadow-xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs text-slate-900">Form 'J' Receipts</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Official payment voucher record</div>
              </button>
            </div>
          </div>
        );

      case 'find-centre':
        return <NearbyMandiBoard onSelectCentreToBook={() => setActiveItem('recommended-slots')} />;

      case 'recommended-slots':
        return <SlotBooking onSuccess={() => setActiveItem('live-queue')} />;

      case 'my-bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">My Procurement Bookings</h2>
                <p className="text-xs text-slate-500">Track and manage all your scheduled procurement slots</p>
              </div>
              <button
                onClick={() => setActiveItem('recommended-slots')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book Another Slot</span>
              </button>
            </div>

            <div className="space-y-3">
              {farmerTokens.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <ListTodo className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-bold text-slate-700 text-sm">No Active Bookings Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not booked any slots yet. Choose a nearby procurement centre and book a slot to generate your e-Gate Pass.
                  </p>
                  <button
                    onClick={() => setActiveItem('recommended-slots')}
                    className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    Book First Slot
                  </button>
                </div>
              ) : (
                farmerTokens.map((tok) => (
                  <div
                    key={tok.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-emerald-800 text-sm">{tok.tokenNumber}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          tok.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          tok.status === 'WEIGHBRIDGE_IN' ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' :
                          'bg-sky-100 text-sky-800 border-sky-300'
                        }`}>
                          {tok.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {tok.cropName} • <span className="font-mono text-emerald-700">{tok.estimatedQuintals} Quintals</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Centre: <strong>{tok.centreName}</strong> | Date: <strong>{tok.slotDate}</strong> ({tok.slotTime})
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Vehicle: {tok.vehicleNumber} ({tok.vehicleType})
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setIsPassModalOpen(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>e-Pass</span>
                      </button>
                      <button
                        onClick={() => setActiveItem('live-queue')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'live-queue':
        return <LiveTokenTracker onViewReceipt={() => setActiveItem('receipts')} onBookNewSlot={() => setActiveItem('recommended-slots')} />;

      case 'procurement-status':
        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Procurement Process Status</h2>
                <p className="text-xs text-slate-500">End-to-end milestone tracker for your produce delivery</p>
              </div>
              <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl">
                Token: {currentToken?.tokenNumber || 'DEMO-01'}
              </span>
            </div>

            {/* Step-by-step Timeline Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {[
                { step: 1, title: 'Slot Booked & Gate Pass Issued', desc: 'Tamper-proof digital pass generated with QR verification code', status: 'done' },
                { step: 2, title: 'Gate 1 Security Clearance', desc: 'Vehicle admitted into mandi staging holding yard', status: currentToken?.status !== 'BOOKED' ? 'done' : 'current' },
                { step: 3, title: 'Gross Weighbridge Measurement', desc: 'Electronic load cell records loaded tractor weight', status: ['WEIGHBRIDGE_IN', 'QUALITY_INSPECTION', 'UNLOADING', 'WEIGHBRIDGE_OUT', 'COMPLETED'].includes(currentToken?.status || '') ? 'done' : 'pending' },
                { step: 4, title: 'Fair Average Quality (FAQ) Moisture Test', desc: 'Digital lab tests moisture (<12.0%) and grain luster', status: ['QUALITY_INSPECTION', 'UNLOADING', 'WEIGHBRIDGE_OUT', 'COMPLETED'].includes(currentToken?.status || '') ? 'done' : 'pending' },
                { step: 5, title: 'Bulk Grain Unloading at Storage Silo', desc: 'Produce unloaded into FCI / Warehouse receiving hopper', status: ['UNLOADING', 'WEIGHBRIDGE_OUT', 'COMPLETED'].includes(currentToken?.status || '') ? 'done' : 'pending' },
                { step: 6, title: 'Tare Weighment & Instant DBT Payout', desc: 'Empty tractor weighed, Form J generated, payment sent to Aadhaar bank account', status: currentToken?.status === 'COMPLETED' ? 'done' : 'pending' }
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    item.status === 'done' ? 'bg-emerald-600 text-white shadow-xs' :
                    item.status === 'current' ? 'bg-amber-500 text-slate-950 animate-pulse ring-4 ring-amber-100' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {item.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                  </div>
                  <div className="flex-1 pb-4 border-b border-slate-100 last:border-0">
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payment-status':
        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900">Direct Benefit Transfer (DBT) Payment Status</h2>
              <p className="text-xs text-slate-500">Government assured MSP direct credit details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-3 text-emerald-800">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-extrabold text-base text-slate-900">Payment Breakdown</h3>
                </div>
                <div className="divide-y divide-slate-100 text-xs space-y-2.5">
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Crop Type:</span>
                    <strong className="text-slate-800">{currentCrop?.name || 'Wheat'}</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Net Quantity:</span>
                    <strong className="text-slate-800">{currentToken?.estimatedQuintals || 45} Quintals</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Government MSP Rate:</span>
                    <strong className="text-slate-800 font-mono">₹{currentCrop?.mspPerQuintal || 2275} / Quintal</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Quality Grade Deductions:</span>
                    <strong className="text-emerald-700">₹0.00 (FAQ Grade A Passed)</strong>
                  </div>
                  <div className="flex justify-between pt-3 text-sm font-extrabold text-slate-900 bg-emerald-50/50 p-2.5 rounded-xl">
                    <span>Total Disbursed:</span>
                    <span className="font-mono text-emerald-800">₹{estimatedMspValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-3 text-sky-800">
                  <Building2 className="w-6 h-6 text-sky-600" />
                  <h3 className="font-extrabold text-base text-slate-900">Aadhaar Linked Bank Account</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Bank Name</p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">{farmer.bankName}</p>
                    <p className="text-xs text-slate-600 font-mono mt-1">A/C: {farmer.bankAccountMasked}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>PFMS / NPCI Aadhaar Bridge Enabled</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveItem('receipts')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Digital Form 'J' Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'e-pass':
        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Official Digital e-Gate Pass</h2>
                <p className="text-xs text-slate-500">Government of India • Mandi Security Priority Entry Permit</p>
              </div>
              <button
                onClick={() => setIsPassModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Open Full Pass Card</span>
              </button>
            </div>

            {currentToken ? (
              <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border-2 border-emerald-500/50 shadow-2xl space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Department of Consumer Affairs</span>
                    <h3 className="text-lg font-black text-white">e-Gate Entry Pass</h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs px-3 py-1 rounded-full border border-emerald-500/40">
                    {currentToken.tokenNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Farmer Name</span>
                    <strong className="text-white text-sm">{farmer.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Number</span>
                    <strong className="text-emerald-300 font-mono text-sm">{currentToken.vehicleNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Crop & Quantity</span>
                    <strong className="text-white">{currentToken.cropName} ({currentToken.estimatedQuintals} Qtl)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Allotted Mandi</span>
                    <strong className="text-white">{currentToken.centreName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Slot Date</span>
                    <strong className="text-amber-300">{currentToken.slotDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Time Window</span>
                    <strong className="text-amber-300">{currentToken.slotTime}</strong>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Present this QR code at Security Gate #1</span>
                  <button
                    onClick={() => setIsPassModalOpen(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer"
                  >
                    Download / Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">No Active Gate Pass</h3>
                <p className="text-xs text-slate-500">Book a slot to generate your official electronic gate pass.</p>
                <button
                  onClick={() => setActiveItem('recommended-slots')}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Book Slot Now
                </button>
              </div>
            )}
          </div>
        );

      case 'receipts':
        return <DigitalJForm />;

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">SMS & Mandi Notifications</h2>
                <p className="text-xs text-slate-500">Real-time alerts, gate chimes, and payment updates</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                {notifications.length} Total Alerts
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition shadow-xs cursor-pointer ${
                    notif.read ? 'bg-white border-slate-200' : 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        (notif.priority as string) === 'URGENT' ? 'bg-red-100 text-red-700' :
                        (notif.priority as string) === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{notif.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(notif.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • SMS Delivered
                        </span>
                      </div>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900">Farmer Government Registration & KYC Profile</h2>
              <p className="text-xs text-slate-500">Aadhaar verified records synced with Ministry of Agriculture</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
                  {farmer.name.split(' ').map(n => n[0]).join('').substring(0, 3)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{farmer.name}</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>KYC Verified</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">Kisan ID: {farmer.farmerId} | Aadhaar: {farmer.aadhaarMasked}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Village / Location</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{farmer.village}, Tehsil Samrala, Ludhiana, Punjab</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Land Holding</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{farmer.landAcres} Acres (Survey Plot #481/A)</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Primary Registered Crop</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">Wheat (Kanak) & Paddy (Basmati)</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">PM-KISAN Status</span>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">Active Beneficiary (Installment #16 Disbursed)</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900">Application & Notification Preferences</h2>
              <p className="text-xs text-slate-500">Configure language, accessibility, and alert delivery channels</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Display Language / भाषा / ਭਾਸ਼ਾ</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'en', label: 'English', desc: 'Default' },
                    { id: 'hi', label: 'हिन्दी', desc: 'Hindi' },
                    { id: 'pa', label: 'ਪੰਜਾਬੀ', desc: 'Punjabi' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id as Language)}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                        language === l.id ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-sm font-extrabold">{l.label}</div>
                      <div className="text-[10px] text-slate-400">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="divide-y divide-slate-100 text-xs space-y-3">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="font-bold text-slate-900">SMS Notification Gate Pass Delivery</h4>
                    <p className="text-slate-500 text-[11px]">Receive gate entry token and bay chime via SMS</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                </div>
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="font-bold text-slate-900">Audio Voice Announcements</h4>
                    <p className="text-slate-500 text-[11px]">Play audio voice alerts when weighbridge bay is called</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                </div>
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h4 className="font-bold text-slate-900">High Contrast Sunlight Mode</h4>
                    <p className="text-slate-500 text-[11px]">Optimized bold contrast for bright sunlight in mandi fields</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto min-h-[calc(100vh-120px)]">
      {/* Mobile/Tablet Horizontal Scroll Bar */}
      <div className="lg:hidden flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2 mb-6 hide-scrollbar px-2">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'find-centre', label: 'Find Mandi' },
          { id: 'recommended-slots', label: 'Book Slot' },
          { id: 'my-bookings', label: 'My Bookings' },
          { id: 'live-queue', label: 'Live Queue' },
          { id: 'procurement-status', label: 'Procurement' },
          { id: 'payment-status', label: 'Payment' },
          { id: 'e-pass', label: 'e-Pass' },
          { id: 'receipts', label: 'Receipts' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'profile', label: 'Profile' },
          { id: 'settings', label: 'Settings' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeItem === item.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <FarmerSidebar activeItem={activeItem} setActiveItem={setActiveItem} />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl lg:max-w-none">
        {renderContent()}
      </div>

      {/* Digital e-Gate Pass Modal */}
      {currentToken && (
        <DigitalTokenPassModal
          token={currentToken}
          farmer={farmer}
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
        />
      )}
    </div>
  );
};

