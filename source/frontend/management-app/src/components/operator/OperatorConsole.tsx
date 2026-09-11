import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { TokenRecord } from '../../types';
import { INITIAL_CENTRES, INITIAL_TOKENS } from '../../mockData';
import { getOperatorToken } from '../../services/api';
import { OperatorReceiptModal } from './OperatorReceiptModal';
import { GateVerificationModal } from './GateVerificationModal';
import { CentreManagement } from './CentreManagement';
import {
  Building2,
  Truck,
  CheckCircle2,
  Search,
  Scale,
  Volume2,
  Wheat,
  X,
  FileText,
  QrCode,
} from 'lucide-react';

export const OperatorConsole: React.FC = () => {
  const [tokens, setTokens] = useState<TokenRecord[]>(INITIAL_TOKENS);
  const [centres, setCentres] = useState<any[]>(INITIAL_CENTRES);
  const [selectedCentreId, setSelectedCentreId] = useState<string>(INITIAL_CENTRES[0]?.id || 'centre-samrala');
  const [isGateScannerOpen, setIsGateScannerOpen] = useState(false);

  const loadBookings = async () => {
    try {
      const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = await getOperatorToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch live centres if backend is available
      try {
        const cRes = await axios.get(`${baseURL}/centres`, { headers });
        const items = cRes.data?.data?.items || (Array.isArray(cRes.data?.data) ? cRes.data?.data : []);
        if (items && items.length > 0) {
          const mappedCentres = items.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code || 'PB-MDC-01',
            district: c.district || 'Ludhiana',
            state: c.state || 'Punjab',
            yardCapacityPercent: Math.min(95, Math.round(((c.current_queue_count || 3) / (c.total_daily_capacity || 50)) * 100) || 32),
            avgWaitMinutes: c.avg_wait_minutes || 18,
            activeBays: c.active_bays || 4,
          }));
          // Merge with initial centres to ensure rich names & codes
          setCentres(mappedCentres);
        }
      } catch (cErr) {
        console.warn("Using default procurement centres", cErr);
      }

      // Fetch live bookings for queue if available
      try {
        const bookingsRes = await axios.get(`${baseURL}/centres/${selectedCentreId}/bookings`, { headers });
        const bItems = bookingsRes.data?.data?.items || (Array.isArray(bookingsRes.data?.data) ? bookingsRes.data?.data : []);
        if (bItems && bItems.length > 0) {
          const mappedTokens: TokenRecord[] = bItems.map((b: any) => ({
            id: b.id,
            tokenNumber: b.booking_reference || b.id.substring(0, 8).toUpperCase(),
            farmerId: b.farmer_id || 'FARM-01',
            farmerName: b.farmer?.user?.full_name || 'Farmer',
            village: b.farmer?.village || 'Local Village',
            cropId: b.crop_id || 'crop-wheat',
            cropName: b.crop?.name || 'Wheat (Kanak / Gehu)',
            estimatedQuintals: (b.quantity / 100) || 50,
            centreId: b.centre_id,
            centreName: b.centre?.name || 'Procurement Depot',
            slotDate: b.slot_date || new Date().toISOString().split('T')[0],
            slotTime: b.slot_time || '09:00 AM - 10:00 AM',
            vehicleType: 'Tractor Trolley',
            vehicleNumber: 'PB-10-XX-1234',
            status: b.status === 'PENDING' ? 'BOOKED' : (b.status === 'ARRIVED' ? 'GATE_VERIFIED' : (b.status === 'CONFIRMED' ? 'GATE_VERIFIED' : b.status)),
            assignedBay: null,
            createdAt: b.created_at || new Date().toISOString(),
            updatedAt: b.updated_at || new Date().toISOString(),
            qrCodeValue: b.booking_reference || b.id,
            smsAlerts: [],
          }));

          setTokens(mappedTokens);
        } else {
          // If live API works but returns empty list, don't show mocks.
          setTokens([]);
        }
      } catch (bErr) {
        console.warn("Using default queue tokens", bErr);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }

  };

  // Fetch data on mount
  useEffect(() => {
    loadBookings();
  }, []);

  const updateTokenStatus = (id: string, newStatus: string) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
  };

  const callTokenToBay = (id: string, bayName: string) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, assignedBay: bayName, status: 'WEIGHBRIDGE_IN' } : t));
  };

  const submitQualityInspection = (id: string, _data: any) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, status: 'UNLOADING' } : t));
  };

  const completeWeighbridgeAndPayout = (id: string, _gross: number, _tare: number) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));
  };

  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [inspectionToken, setInspectionToken] = useState<TokenRecord | null>(null);
  const [receiptToken, setReceiptToken] = useState<TokenRecord | null>(null);
  const [moisturePct, setMoisturePct] = useState<number>(11.4);
  const [foreignMatterPct, setForeignMatterPct] = useState<number>(0.3);
  const [brokenGrainPct, setBrokenGrainPct] = useState<number>(0.8);
  const [inspectorNotes, setInspectorNotes] = useState<string>(
    'Clean golden luster, acceptable foreign matter and moisture below 12.0% Fair Average Quality standard.'
  );

  const [weighbridgeToken, setWeighbridgeToken] = useState<TokenRecord | null>(null);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(7920);
  const [tareWeightKg, setTareWeightKg] = useState<number>(3120);

  const currentCentre = centres.find((c) => c.id === selectedCentreId) || centres[0];

  // Filter tokens strictly for the selected centre
  const centreTokens = tokens.filter((tok) => tok.centreId === selectedCentreId);
  const filteredTokens = centreTokens.filter((tok) => {
    const matchesSearch =
      tok.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tok.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tok.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTabFilter === 'ALL') return true;
    if (activeTabFilter === 'QUEUED')
      return tok.status === 'BOOKED' || tok.status === 'GATE_VERIFIED' || tok.status === 'YARD_QUEUED';
    if (activeTabFilter === 'ACTIVE')
      return (
        tok.status === 'WEIGHBRIDGE_IN' ||
        tok.status === 'QUALITY_INSPECTION' ||
        tok.status === 'UNLOADING' ||
        tok.status === 'WEIGHBRIDGE_OUT'
      );
    if (activeTabFilter === 'COMPLETED') return tok.status === 'COMPLETED';
    return true;
  });

  // Dynamic metrics based on current selected centre
  const centreIntakeBase = selectedCentreId === 'centre-samrala' ? 4850 : (selectedCentreId === 'centre-khanna' ? 12800 : (selectedCentreId === 'centre-doraha' ? 3400 : 2600));
  const dynamicIntakeQtl = centreIntakeBase + centreTokens.reduce((sum, t) => sum + (t.estimatedQuintals || 0), 0);
  const dynamicMspPayoutCr = ((dynamicIntakeQtl * 2275) / 10000000).toFixed(2);
  const dynamicAvgTurnaround = currentCentre.avgWaitMinutes ? `${currentCentre.avgWaitMinutes} mins` : '18.4 mins';
  const dynamicActiveBays = `${currentCentre.activeBays || 4} / ${currentCentre.activeBays || 4} Operational`;

  const [queueNotice, setQueueNotice] = useState<{ type: 'info' | 'success' | 'warning'; message: string } | null>(null);
  const [isCallingNext, setIsCallingNext] = useState<boolean>(false);
  const [activeActionTokenId, setActiveActionTokenId] = useState<string | null>(null);

  // Action handlers
  const handleCallNextQueued = (bayName = 'Weighbridge Bay 2 (Electronic)') => {
    setIsCallingNext(true);
    const nextInLine = centreTokens.find(
      (tok) => tok.status === 'YARD_QUEUED' || tok.status === 'GATE_VERIFIED'
    );
    if (nextInLine) {
      callTokenToBay(nextInLine.id, bayName);
      setQueueNotice({
        type: 'success',
        message: `📢 Token #${nextInLine.tokenNumber} (${nextInLine.farmerName}) called to ${bayName}.`
      });
    } else {
      setQueueNotice({
        type: 'info',
        message: 'No vehicles currently waiting in the yard queue for this centre.'
      });
    }
    setTimeout(() => {
      setIsCallingNext(false);
    }, 600);
    setTimeout(() => {
      setQueueNotice(null);
    }, 4500);
  };

  const handleOpenInspection = (tok: TokenRecord) => {
    setInspectionToken(tok);
    setMoisturePct(11.4);
    setForeignMatterPct(0.3);
    setBrokenGrainPct(0.8);
  };

  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionToken) return;

    const isPassed = moisturePct <= 14.0;
    const grade = moisturePct <= 12.0 ? 'FAQ_GRADE_A' : 'GRADE_B';
    const deductions = moisturePct > 12.0 && moisturePct <= 14.0 ? 500 : 0;

    submitQualityInspection(inspectionToken.id, {
      moisturePct,
      foreignMatterPct,
      brokenGrainPct,
      grade,
      deductionsAppliedRs: deductions,
      inspectorName: 'Er. R. K. Sharma (QCO-IV)',
      passed: isPassed,
      notes: inspectorNotes,
    });
    setInspectionToken(null);
  };

  const handleOpenWeighbridge = (tok: TokenRecord) => {
    setWeighbridgeToken(tok);
    const approxGross = Math.round(tok.estimatedQuintals * 100 + 3120);
    setGrossWeightKg(approxGross);
    setTareWeightKg(3120);
  };

  const handleFinalizeWeighment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weighbridgeToken) return;
    completeWeighbridgeAndPayout(weighbridgeToken.id, grossWeightKg, tareWeightKg);
    setWeighbridgeToken(null);
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Console Stats Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl p-5 shadow-2xl border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-amber-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {currentCentre.name}
                </h2>
                <span className="bg-sky-950/80 text-sky-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-sky-700/60">
                  {currentCentre.code}
                </span>
                <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-700/60 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentCentre.yardCapacityPercent || 32}% Yard Occupancy</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Operator in Charge: <strong className="text-zinc-200">Er. R. K. Sharma</strong> (Procurement & QC Desk)
              </p>
            </div>
          </div>

          {/* Quick Centre Switcher */}
          <div className="flex items-center space-x-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-700/80 shadow-xs">
            <Building2 className="w-4 h-4 text-sky-400 ml-1.5 shrink-0" />
            <label className="text-xs text-zinc-300 font-semibold whitespace-nowrap">Active Mandi:</label>
            <select
              id="operator-switch-centre-select"
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="bg-zinc-950 border border-zinc-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.yardCapacityPercent || 32}% full)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 hover:border-sky-500/40 transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Today's Grain Intake
            </span>
            <div className="text-xl font-black text-sky-400 font-mono mt-1">
              {dynamicIntakeQtl.toLocaleString('en-IN')} Qtl
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1 mt-0.5">
              <span>↑ +12%</span>
              <span className="text-zinc-400 font-normal">vs yesterday</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 hover:border-emerald-500/40 transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Direct MSP Payout
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              ₹{dynamicMspPayoutCr} Cr
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
              100% DBT Aadhaar Linked
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 hover:border-amber-500/40 transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Avg. Turnaround Time
            </span>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {dynamicAvgTurnaround}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
              Reduced from 3.5 hrs
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 hover:border-amber-500/40 transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              Active Weighing Bays
            </span>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {dynamicActiveBays} Active
            </div>
            <span className="text-[10px] text-sky-400 font-semibold mt-0.5 block">
              IoT Load Cells Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* Notification / Dispatch Feedback Banner */}
      {queueNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md animate-in fade-in slide-in-from-top duration-200 ${
            queueNotice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : queueNotice.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
              : 'bg-sky-950/90 border-sky-500/50 text-sky-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{queueNotice.message}</span>
          </div>
          <button
            onClick={() => setQueueNotice(null)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Command Bar: Call Next, QR Scanner & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/95 p-4 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Token #, Farmer Name, Vehicle No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gate Verification & QR Scanner Button */}
          <button
            id="gate-qr-scanner-btn"
            onClick={() => setIsGateScannerOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-100" />
            <span>Gate Entry & QR Scanner</span>
          </button>

          {/* Quick Call Next Button */}
          <button
            id="call-next-bay-btn"
            disabled={isCallingNext}
            onClick={() => handleCallNextQueued()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-950/30 transition cursor-pointer"
          >
            <Volume2 className={`w-4 h-4 text-zinc-950 ${isCallingNext ? 'animate-bounce' : ''}`} />
            <span>{isCallingNext ? 'Calling Next...' : 'Call Next to Bay 2'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {['ALL', 'QUEUED', 'ACTIVE', 'COMPLETED', 'MANUAL BOOKING'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTabFilter(filter)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                  activeTabFilter === filter
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTabFilter === 'MANUAL BOOKING' ? (
        <CentreManagement centreId={selectedCentreId} />
      ) : (
      /* Main Orchestration Queue Table */
      <div className="bg-zinc-900/95 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-sky-400" />
            <h3 className="font-extrabold text-sm text-white tracking-tight">
              Live Mandi Queue & Gate Dispatch Workflow
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-medium font-mono">
            Showing <strong className="text-sky-400">{filteredTokens.length}</strong> active vehicle tokens
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/90 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Token #</th>
                <th className="p-3.5">Farmer & Village</th>
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Crop & Produce</th>
                <th className="p-3.5">Assigned Bay</th>
                <th className="p-3.5">Queue Status</th>
                <th className="p-3.5 text-right">Station Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 font-medium">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-500">
                    No tokens found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((tok) => {
                  return (
                    <tr key={tok.id} className="hover:bg-zinc-800/60 transition duration-150">
                      <td className="p-3.5 font-mono font-bold text-sky-300">
                        {tok.tokenNumber}
                        <span className="block text-[10px] text-zinc-400 font-sans font-normal mt-0.5">
                          Slot: {tok.slotTime.split('-')[0]}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs">{tok.farmerName}</div>
                        <span className="text-[11px] text-zinc-400">{tok.village}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-700/80">
                          {tok.vehicleNumber}
                        </span>
                        <span className="block text-[10px] text-zinc-400 mt-0.5">
                          {tok.vehicleType}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-zinc-200">{tok.cropName}</span>
                        <span className="block font-mono text-emerald-400 font-bold mt-0.5">
                          {tok.estimatedQuintals} Quintals
                        </span>
                      </td>

                      <td className="p-3.5">
                        {tok.assignedBay ? (
                          <span className="inline-flex items-center text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-amber-700/60">
                            {tok.assignedBay}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">— Unassigned —</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            tok.status === 'COMPLETED'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                              : tok.status === 'WEIGHBRIDGE_IN'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-600/50 animate-pulse'
                              : tok.status === 'GATE_VERIFIED'
                              ? 'bg-sky-950/80 text-sky-300 border-sky-600/50'
                              : tok.status === 'YARD_QUEUED'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                              : tok.status === 'REJECTED'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {tok.status}
                        </span>
                      </td>

                      {/* Operator Action Buttons */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {tok.status === 'BOOKED' && (
                          <button
                            disabled={activeActionTokenId === tok.id}
                            onClick={() => {
                              setActiveActionTokenId(tok.id);
                              setTimeout(() => {
                                updateTokenStatus(tok.id, 'GATE_VERIFIED');
                                setActiveActionTokenId(null);
                                setQueueNotice({
                                  type: 'success',
                                  message: `✅ Gate pass verified for ${tok.farmerName} (Token #${tok.tokenNumber}). Admitted to yard.`
                                });
                                setTimeout(() => setQueueNotice(null), 4000);
                              }, 350);
                            }}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Verify e-Gate Pass and admit vehicle to yard"
                          >
                            {activeActionTokenId === tok.id ? 'Admitting...' : 'Verify Gate Pass'}
                          </button>
                        )}

                        {(tok.status === 'GATE_VERIFIED' || tok.status === 'YARD_QUEUED') && (
                          <button
                            disabled={activeActionTokenId === tok.id}
                            onClick={() => {
                              setActiveActionTokenId(tok.id);
                              setTimeout(() => {
                                callTokenToBay(tok.id, 'Weighbridge Bay 2 (North)');
                                setActiveActionTokenId(null);
                                setQueueNotice({
                                  type: 'success',
                                  message: `📢 Called ${tok.farmerName} (Token #${tok.tokenNumber}) to Weighbridge Bay 2.`
                                });
                                setTimeout(() => setQueueNotice(null), 4000);
                              }, 350);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 text-zinc-950 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Call token to active weighing bay"
                          >
                            {activeActionTokenId === tok.id ? 'Calling...' : 'Call to Bay 2'}
                          </button>
                        )}

                        {tok.status === 'WEIGHBRIDGE_IN' && (
                          <button
                            onClick={() => handleOpenInspection(tok)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Perform moisture and FAQ quality test"
                          >
                            Quality Lab Test
                          </button>
                        )}

                        {tok.status === 'UNLOADING' && (
                          <button
                            onClick={() => handleOpenWeighbridge(tok)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Record gross/tare weighment and issue J-Form"
                          >
                            Record Tare & Pay
                          </button>
                        )}

                        {tok.status === 'COMPLETED' && (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-emerald-400 font-bold text-xs inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>DBT Disbursed</span>
                            </span>
                            <button
                              onClick={() => setReceiptToken(tok)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="View & Download Prototype J-Form Receipt"
                            >
                              <FileText className="w-3 h-3 text-emerald-400" />
                              <span>J-Form</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Operator J-Form & Payment Receipt Modal */}
      {receiptToken && (
        <OperatorReceiptModal
          token={receiptToken}
          isOpen={!!receiptToken}
          onClose={() => setReceiptToken(null)}
        />
      )}

      {/* Quality Inspection Modal */}
      {inspectionToken && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-700 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Wheat className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">
                  Fair Average Quality (FAQ) & Moisture Test
                </h3>
              </div>
              <button
                onClick={() => setInspectionToken(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Testing vehicle{' '}
              <strong className="text-sky-300">{inspectionToken.vehicleNumber}</strong> (Token #
              <span className="font-mono text-white">{inspectionToken.tokenNumber}</span>) for crop{' '}
              <strong className="text-emerald-400">{inspectionToken.cropName}</strong>.
            </p>

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              {/* Moisture Meter Slider */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-zinc-200">
                    Grain Moisture Content Percentage (%)
                  </label>
                  <span
                    className={`font-mono text-base font-extrabold px-2.5 py-0.5 rounded-lg border ${
                      moisturePct <= 12.0
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                        : moisturePct <= 14.0
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-rose-950 text-rose-300 border-rose-500/50'
                    }`}
                  >
                    {moisturePct.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={8.0}
                  max={18.0}
                  step={0.1}
                  value={moisturePct}
                  onChange={(e) => setMoisturePct(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Dry (&lt; 10%)</span>
                  <span className="font-bold text-emerald-400">Govt Std FAQ (&le; 12.0%)</span>
                  <span className="text-amber-400">Deduction (12-14%)</span>
                  <span className="text-rose-400">Rejection (&gt; 14%)</span>
                </div>
              </div>

              {/* Foreign Matter & Broken Grain */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <label className="font-bold text-zinc-300 block mb-1">
                    Foreign Matter (%)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={foreignMatterPct}
                    onChange={(e) => setForeignMatterPct(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Max allowed: 0.75%</span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <label className="font-bold text-zinc-300 block mb-1">
                    Broken Grain (%)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={brokenGrainPct}
                    onChange={(e) => setBrokenGrainPct(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Max allowed: 2.0%</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  Inspector Certificate Notes
                </label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectionToken(null)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Approve & Issue Quality Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Electronic Weighbridge Terminal Modal */}
      {weighbridgeToken && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-700 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">
                  Electronic Weighbridge Slip & Billing
                </h3>
              </div>
              <button
                onClick={() => setWeighbridgeToken(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeWeighment} className="space-y-4 text-xs">
              <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">Gross Weight (Loaded kg):</label>
                  <input
                    type="number"
                    value={grossWeightKg}
                    onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                    className="w-32 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono font-bold text-right text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label className="font-bold text-zinc-300">Tare Weight (Empty Vehicle kg):</label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(Number(e.target.value))}
                    className="w-32 px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono font-bold text-right text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between items-center">
                  <span className="font-bold text-zinc-200">Net Produce Weight:</span>
                  <span className="font-mono text-base font-extrabold text-amber-400">
                    {((grossWeightKg - tareWeightKg) / 100).toFixed(2)} Quintals (
                    {grossWeightKg - tareWeightKg} kg)
                  </span>
                </div>
              </div>

              {/* Settlement calculation */}
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-3.5 rounded-xl text-emerald-100 space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span>Guaranteed MSP Rate:</span>
                  <span className="font-mono font-bold text-white">₹2,275 / qtl</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Total Gross MSP Amount:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    ₹
                    {Math.round(
                      ((grossWeightKg - tareWeightKg) / 100) * 2275
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-emerald-800/80 pt-1.5 font-bold">
                  <span className="text-emerald-300">Direct Bank Transfer (DBT):</span>
                  <span className="font-mono text-emerald-400 text-sm">
                    ₹
                    {Math.round(
                      ((grossWeightKg - tareWeightKg) / 100) * 2275
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setWeighbridgeToken(null)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  Confirm Weighment & Disburse DBT Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Verification QR Scanner Modal */}
      <GateVerificationModal
        isOpen={isGateScannerOpen}
        onClose={() => setIsGateScannerOpen(false)}
        onVerifiedSuccess={() => {
          loadBookings();
        }}
        centreName={currentCentre.name}
        centreCode={currentCentre.code}
      />
    </div>
  );
};
