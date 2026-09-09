import React from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Building2,
  MapPin,
  Sparkles,
  CloudRain,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface NearbyMandiBoardProps {
  onSelectCentreToBook: (centreId: string) => void;
}

export const NearbyMandiBoard: React.FC<NearbyMandiBoardProps> = ({
  onSelectCentreToBook,
}) => {
  const { centres } = useKisanFlow();

  return (
    <div className="space-y-6">
      {/* Top Advisory Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Smart Dynamic Traffic & Yard Balancer</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold">
            Real-Time Mandi Congestion & Yard Waiting Times
          </h2>
          <p className="text-xs text-sky-200 mt-0.5">
            Ludhiana District Grain Mandis • Live Telemetry updated every 60 seconds
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2 rounded-xl text-center">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Smart Dynamic Traffic & Yard Balancer</span>
          </div>
        </div>
      </div>

      {/* List of Mandis */}
      <div className="space-y-4">
        {centres.map((centre) => {
          // Find current Wait Status
          const isHighCongestion = centre.yardCapacityPercent >= 80;
          const isModerate = centre.yardCapacityPercent >= 50 && centre.yardCapacityPercent < 80;

          return (
            <div
              key={centre.id}
              className={`relative bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                centre.isAiRecommended
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                  : 'border-slate-200'
              }`}
            >
              {/* Header: Name and Distance */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center space-x-2">
                    <Building2
                      className={`w-5 h-5 ${
                        centre.isAiRecommended ? 'text-amber-500' : 'text-slate-600'
                      }`}
                    />
                    <span>{centre.name}</span>
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mb-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.distanceKm} km away</span>
                    </span>
                    <span>Code: {centre.code}</span>
                    <span className="flex items-center space-x-1 text-slate-600">
                      <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                      <span>{centre.weatherCondition}</span>
                    </span>
                  </div>
                </div>
                {centre.isAiRecommended && (
                  <div className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-bl-lg rounded-tr-lg absolute top-0 right-0 shadow-xs">
                    ★ BEST RECOMMENDATION
                  </div>
                )}
              </div>

                {/* Meter Bars */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">Yard Capacity Utilization:</span>
                      <span
                        className={`font-bold font-mono ${
                          isHighCongestion
                            ? 'text-red-700'
                            : isModerate
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {centre.yardCapacityPercent}% ({centre.currentQueueCount} Trolleys Waiting)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isHighCongestion
                            ? 'bg-red-500'
                            : isModerate
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${centre.yardCapacityPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600">Avg. Weighbridge Turnaround:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      ~{centre.avgWaitMinutes} minutes
                    </span>
                  </div>
                </div>

                {centre.recommendedReason && (
                  <div
                    className={`text-xs p-2.5 rounded-lg mb-4 flex items-start space-x-1.5 ${
                      centre.isAiRecommended
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {centre.isAiRecommended ? (
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span className="text-[11px] font-medium leading-relaxed">
                      {centre.recommendedReason}
                    </span>
                  </div>
                )}
              {/* Meter bars and button wrapper */}
              <button
                onClick={() => onSelectCentreToBook(centre.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  centre.isAiRecommended
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <span>Book Slot at this Centre</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
