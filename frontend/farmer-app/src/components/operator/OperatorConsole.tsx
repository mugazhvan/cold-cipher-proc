import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { TokenRecord } from '../../types';
import {
  Building2,
  Truck,
  CheckCircle2,
  Search,
  Scale,
  Volume2,
  Wheat,
  X,
} from 'lucide-react';

export const OperatorConsole: React.FC = () => {
  const {
    tokens,
    updateTokenStatus,
    callTokenToBay,
    submitQualityInspection,
    completeWeighbridgeAndPayout,
    centres,
  } = useKisanFlow();

  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCentreId, setSelectedCentreId] = useState('centre-samrala');

  // Modals state
  const [inspectionToken, setInspectionToken] = useState<TokenRecord | null>(null);
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

  // Filter tokens
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

  // Action handlers
  const handleCallNextQueued = (bayName = 'Weighbridge Bay 2 (Electronic)') => {
    const nextInLine = centreTokens.find(
      (tok) => tok.status === 'YARD_QUEUED' || tok.status === 'GATE_VERIFIED'
    );
    if (nextInLine) {
      callTokenToBay(nextInLine.id, bayName);
    } else {
      alert('No tokens currently queued in the holding yard for this centre.');
    }
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
    <div className="space-y-6">
      {/* Top Console Stats Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/30 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  {currentCentre.name}
                </h2>
                <span className="bg-sky-950 text-sky-300 text-[10px] font-mono px-2 py-0.5 rounded border border-sky-800">
                  {currentCentre.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as: <strong className="text-slate-200">Er. R. K. Sharma</strong> (Chief
                Procurement & Quality Control Officer)
              </p>
            </div>
          </div>

          {/* Quick Centre Switcher */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-medium">Switch Centre:</label>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.yardCapacityPercent}% full)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Today&apos;s Grain Intake
            </span>
            <div className="text-xl font-black text-sky-400 font-mono mt-0.5">4,850 Qtl</div>
            <span className="text-[10px] text-slate-400">+12% vs yesterday</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Direct MSP Payout Disbursed
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">₹1.10 Cr</div>
            <span className="text-[10px] text-emerald-400 font-medium">100% DBT Verified</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Avg. Turnaround Time
            </span>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">18.4 mins</div>
            <span className="text-[10px] text-emerald-400 font-medium">Reduced from 3.5 hrs</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Active Weighbridge Bays
            </span>
            <div className="text-xl font-black text-indigo-400 font-mono mt-0.5">
              4 / 4 Operational
            </div>
            <span className="text-[10px] text-slate-400">Electronic load cells online</span>
          </div>
        </div>
      </div>

      {/* Action Command Bar: Call Next & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Token #, Farmer Name, Vehicle No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Call Next Button */}
          <button
            id="call-next-bay-btn"
            onClick={() => handleCallNextQueued()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            <span>Call Next Token to Bay 2</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'QUEUED', 'ACTIVE', 'COMPLETED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTabFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  activeTabFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Orchestration Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Live Mandi Queue & Operational Workflow
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredTokens.length} active vehicle tokens
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3">Token #</th>
                <th className="p-3">Farmer & Village</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Crop & Quantity</th>
                <th className="p-3">Assigned Bay</th>
                <th className="p-3">Queue Status</th>
                <th className="p-3 text-right">Officer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No tokens found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((tok) => {
                  return (
                    <tr key={tok.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {tok.tokenNumber}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          Slot: {tok.slotTime.split('-')[0]}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{tok.farmerName}</div>
                        <span className="text-[11px] text-slate-500">{tok.village}</span>
                      </td>

                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {tok.vehicleNumber}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {tok.vehicleType}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-900">{tok.cropName}</span>
                        <span className="block font-mono text-emerald-700 font-bold">
                          {tok.estimatedQuintals} Quintals
                        </span>
                      </td>

                      <td className="p-3">
                        {tok.assignedBay ? (
                          <span className="inline-flex items-center text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-amber-200">
                            {tok.assignedBay}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">— Unassigned —</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tok.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tok.status === 'WEIGHBRIDGE_IN'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : tok.status === 'GATE_VERIFIED'
                              ? 'bg-sky-100 text-sky-800'
                              : tok.status === 'YARD_QUEUED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : tok.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tok.status}
                        </span>
                      </td>

                      {/* Operator Action Buttons */}
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {tok.status === 'BOOKED' && (
                          <button
                            onClick={() => updateTokenStatus(tok.id, 'GATE_VERIFIED')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition"
                            title="Verify e-Gate Pass and admit vehicle to yard"
                          >
                            Verify Gate Pass
                          </button>
                        )}

                        {(tok.status === 'GATE_VERIFIED' || tok.status === 'YARD_QUEUED') && (
                          <button
                            onClick={() => callTokenToBay(tok.id, 'Weighbridge Bay 2 (North)')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition shadow-2xs"
                            title="Call token to active weighing bay"
                          >
                            Call to Bay 2
                          </button>
                        )}

                        {tok.status === 'WEIGHBRIDGE_IN' && (
                          <button
                            onClick={() => handleOpenInspection(tok)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                            title="Perform moisture and FAQ quality test"
                          >
                            Quality Lab Test
                          </button>
                        )}

                        {tok.status === 'UNLOADING' && (
                          <button
                            onClick={() => handleOpenWeighbridge(tok)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                            title="Record gross/tare weighment and issue J-Form"
                          >
                            Record Tare & Pay
                          </button>
                        )}

                        {tok.status === 'COMPLETED' && (
                          <span className="text-emerald-700 font-bold text-xs inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>DBT Disbursed</span>
                          </span>
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

      {/* Quality Inspection Modal */}
      {inspectionToken && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Wheat className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Fair Average Quality (FAQ) & Moisture Test
                </h3>
              </div>
              <button
                onClick={() => setInspectionToken(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Testing vehicle{' '}
              <strong className="text-slate-900">{inspectionToken.vehicleNumber}</strong> (Token #
              {inspectionToken.tokenNumber}) for crop{' '}
              <strong className="text-slate-900">{inspectionToken.cropName}</strong>.
            </p>

            <form onSubmit={handleSubmitInspection} className="space-y-4 text-xs">
              {/* Moisture Meter Slider */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">
                    Grain Moisture Content Percentage (%)
                  </label>
                  <span
                    className={`font-mono text-base font-extrabold px-2 py-0.5 rounded ${
                      moisturePct <= 12.0
                        ? 'bg-emerald-100 text-emerald-800'
                        : moisturePct <= 14.0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
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
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Dry (&lt; 10%)</span>
                  <span className="font-bold text-emerald-700">Govt Std FAQ (&le; 12.0%)</span>
                  <span>Value Deduction (12-14%)</span>
                  <span className="text-red-600">Rejection (&gt; 14%)</span>
                </div>
              </div>

              {/* Foreign Matter & Broken Grain */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">
                    Foreign Matter (%)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={foreignMatterPct}
                    onChange={(e) => setForeignMatterPct(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Max allowed: 0.75%</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">
                    Broken Grain (%)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={brokenGrainPct}
                    onChange={(e) => setBrokenGrainPct(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Max allowed: 2.0%</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Inspector Certificate Notes
                </label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectionToken(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Electronic Weighbridge Slip & Billing
                </h3>
              </div>
              <button
                onClick={() => setWeighbridgeToken(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeWeighment} className="space-y-4 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Gross Weight (Loaded kg):</label>
                  <input
                    type="number"
                    value={grossWeightKg}
                    onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-right"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Tare Weight (Empty Vehicle kg):</label>
                  <input
                    type="number"
                    value={tareWeightKg}
                    onChange={(e) => setTareWeightKg(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-right"
                  />
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Net Produce Weight:</span>
                  <span className="font-mono text-base font-extrabold text-indigo-700">
                    {((grossWeightKg - tareWeightKg) / 100).toFixed(2)} Quintals (
                    {grossWeightKg - tareWeightKg} kg)
                  </span>
                </div>
              </div>

              {/* Settlement calculation */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>Guaranteed MSP Rate:</span>
                  <span className="font-mono font-bold text-slate-900">₹2,275 / qtl</span>
                </div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span>Total Gross MSP Amount:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹
                    {Math.round(
                      ((grossWeightKg - tareWeightKg) / 100) * 2275
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 border-t border-emerald-200 pt-1 font-bold">
                  <span className="text-emerald-900">Direct Bank Transfer (DBT):</span>
                  <span className="font-mono text-emerald-900 text-sm">
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
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Weighment & Disburse DBT Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
