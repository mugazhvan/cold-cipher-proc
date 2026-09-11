import React from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export const DepartmentAnalytics: React.FC = () => {
  const { centres, tokens } = useKisanFlow();

  const totalProcuredQuintals = tokens.reduce(
    (acc, tok) =>
      acc + (tok.paymentDetails?.netWeightQuintals || (tok.status === 'COMPLETED' ? tok.estimatedQuintals : 0)),
    4850
  );

  const totalDbtDisbursed = tokens.reduce(
    (acc, tok) => acc + (tok.paymentDetails?.netPayableRs || 0),
    11048000
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-zinc-900 to-zinc-950 text-white rounded-2xl p-6 shadow-lg border border-amber-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Government Oversight • SIH26032</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Department of Consumer Affairs Procurement Intelligence
            </h2>
            <p className="text-xs text-amber-200 mt-1">
              District Ludhiana Central Telemetry & Smart Yard Coordination Grid
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Telemetry Grid Active • 4 Mandis Connected</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Procured Today
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalProcuredQuintals.toLocaleString()} Qtl
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Wheat & Mustard Peak Influx</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Guaranteed MSP DBT Disbursed
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            ₹{(totalDbtDisbursed / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Directly credited to Farmer Accounts
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Avg Mandi Queue Waiting Time
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">21.4 mins</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            ↓ 84% reduction vs baseline (4.2 hrs)
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            AI Load Balancing Efficiency
          </span>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">94.8%</div>
          <span className="text-xs text-slate-400 mt-1 block">38 trolleys auto-diverted today</span>
        </div>
      </div>

      {/* SIH AI Load Balancing & Congestion Prevention Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Predictive AI Yard Balancing & Diversion Engine
              </h3>
              <p className="text-xs text-slate-400">
                Prevents bottlenecking at mega mandis by dynamically routing arrivals to low-load
                sub-centres.
              </p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            REAL-TIME OPTIMIZER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2">
              <span>⚠️ Congestion Alert: Khanna APMC Yard 1</span>
              <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[10px]">78% Full</span>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Khanna grain market experiencing a heavy influx of 19 tractor trolleys with ~85 mins
              estimated wait time.
            </p>
            <div className="mt-3 text-xs bg-white p-2.5 rounded-lg border border-amber-200 text-zinc-800 font-medium">
              <strong>AI Action Taken:</strong> Subsidized route diversion activated. New slot bookings
              from Bija & Samrala tehsils defaulted to Samrala Depot (8.4 km, 18 min wait).
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-2">
              <span>✅ Low Load Beneficiary: Samrala & Sahnewal</span>
              <span className="bg-emerald-200/80 px-2 py-0.5 rounded text-[10px]">32% Full</span>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Samrala Depot operating smoothly with 4 active electronic weighbridges and 18-minute
              median turnaround.
            </p>
            <div className="mt-3 text-xs bg-white p-2.5 rounded-lg border border-emerald-200 text-zinc-800 font-medium">
              <strong>Impact Metric:</strong> 142 vehicle-hours saved today; 680 liters of tractor diesel
              conserved through intelligent queue scheduling.
            </div>
          </div>
        </div>

        {/* Mandi Utilization Visual Bars */}
        <div className="space-y-3 pt-2">
          {centres.map((c) => (
            <div key={c.id} className="space-y-1 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-800 font-bold">{c.name}</span>
                <span className="font-mono text-slate-600">
                  {c.yardCapacityPercent}% utilized • {c.currentQueueCount} waiting • ~{c.avgWaitMinutes}m
                  turnaround
                </span>
              </div>
              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    c.yardCapacityPercent >= 80
                      ? 'bg-red-500'
                      : c.yardCapacityPercent >= 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${c.yardCapacityPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Audit Log & Fraud Prevention Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Department Transparency & Audit Compliance Trail
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Immutable Event Ledger</span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">09:35:12</span>
              <span className="text-emerald-700 font-bold">[DBT_SETTLED]</span>
              <span className="text-zinc-800">
                Token #KF-2026-0940 • Net: 52.0 Qtl Wheat • Payout: ₹1,18,300 • UTR:
                SIM-DBT-20260905-99812401
              </span>
            </div>
            <span className="text-emerald-600 text-[10px] font-bold">VERIFIED</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">09:15:00</span>
              <span className="text-sky-700 font-bold">[BAY_CALL]</span>
              <span className="text-zinc-800">
                Token #KF-2026-0942 called to Weighbridge Bay 2 (Tractor PB-10-DF-4819)
              </span>
            </div>
            <span className="text-sky-600 text-[10px] font-bold">ACTIVE</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">08:45:22</span>
              <span className="text-amber-700 font-bold">[GATE_SCAN]</span>
              <span className="text-zinc-800">
                Token #KF-2026-0945 verified at Samrala Gate 1 • Vehicle PB-10-EA-1922 admitted
              </span>
            </div>
            <span className="text-amber-600 text-[10px] font-bold">LOGGED</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">07:15:08</span>
              <span className="text-zinc-700 font-bold">[SLOT_BOOK]</span>
              <span className="text-zinc-800">
                Token #KF-2026-0942 issued to Gurpreet Singh Dhillon (PMK-2024-PB-99412)
              </span>
            </div>
            <span className="text-slate-400 text-[10px] font-bold">CONFIRMED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
