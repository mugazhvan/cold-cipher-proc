import React, { useState, useEffect, useMemo } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import {
  Building2,
  MapPin,
  Sparkles,
  CloudRain,
  ArrowRight,
  Navigation,
  Crosshair,
  Compass,
  Radio,
  ExternalLink,
  Truck,
  Clock,
} from 'lucide-react';
import {
  calculateHaversineDistance,
  estimateTransitTimeMinutes,
  getGoogleMapsDirectionsUrl,
  calculateSmartScore,
  getUserGeolocation,
  GeoLocationCoords,
  PUNJAB_FARM_HUBS,
} from '../../utils/geoUtils';

interface NearbyMandiBoardProps {
  onSelectCentreToBook: (centreId: string) => void;
}

export const NearbyMandiBoard: React.FC<NearbyMandiBoardProps> = ({
  onSelectCentreToBook,
}) => {
  const { centres } = useKisanFlow();

  // GPS & Location State
  const [userCoords, setUserCoords] = useState<GeoLocationCoords>({
    latitude: PUNJAB_FARM_HUBS[0].latitude,
    longitude: PUNJAB_FARM_HUBS[0].longitude,
    accuracy: 15,
    source: 'REGISTERED_VILLAGE',
    locationName: PUNJAB_FARM_HUBS[0].name,
  });
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // Filter & View State
  const [radiusFilterKm, setRadiusFilterKm] = useState<number>(50);
  const [sortBy, setSortBy] = useState<'smart' | 'distance' | 'wait'>('smart');
  const [vehicleType, setVehicleType] = useState<string>('Tractor Trolley');
  const [selectedMandiId, setSelectedMandiId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'radar' | 'list'>('radar');

  // Request real GPS location on click
  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsStatusMessage('Accessing device GPS hardware & satellite lock...');
    try {
      const coords = await getUserGeolocation();
      setUserCoords(coords);
      if (coords.source === 'GPS_LIVE') {
        setGpsStatusMessage(
          `GPS Fixed: ±${coords.accuracy || 12}m accuracy (${coords.latitude.toFixed(4)}° N, ${coords.longitude.toFixed(4)}° E)`
        );
      } else {
        setGpsStatusMessage('GPS permission unavailable. Set to Samrala farm coordinates.');
      }
    } catch (e: any) {
      setGpsStatusMessage('Using registered farm village location.');
    } finally {
      setIsDetectingGps(false);
      setTimeout(() => setGpsStatusMessage(null), 6000);
    }
  };

  // Handle manual village selection
  const handleSelectVillage = (hubId: string) => {
    const hub = PUNJAB_FARM_HUBS.find((h) => h.id === hubId);
    if (hub) {
      setUserCoords({
        latitude: hub.latitude,
        longitude: hub.longitude,
        accuracy: 50,
        source: 'MANUAL_SELECTION',
        locationName: hub.name,
      });
      setGpsStatusMessage(`Farm location updated to ${hub.name}.`);
      setTimeout(() => setGpsStatusMessage(null), 4000);
    }
  };

  // Calculate live distances, transit times, and smart scores
  const calculatedCentres = useMemo(() => {
    return centres.map((centre) => {
      const cLat = centre.latitude || 30.8359;
      const cLon = centre.longitude || 76.1914;
      const distance = calculateHaversineDistance(
        userCoords.latitude,
        userCoords.longitude,
        cLat,
        cLon
      );
      const transitTime = estimateTransitTimeMinutes(distance, vehicleType);
      const smartMetric = calculateSmartScore(
        distance,
        centre.avgWaitMinutes || 20,
        centre.yardCapacityPercent || 30
      );
      const navUrl = getGoogleMapsDirectionsUrl(cLat, cLon, centre.name);

      return {
        ...centre,
        liveDistanceKm: distance,
        liveTransitMinutes: transitTime,
        smartScore: smartMetric.score,
        smartBadge: smartMetric.badge,
        smartReason: smartMetric.reason,
        liveNavUrl: navUrl,
      };
    });
  }, [centres, userCoords, vehicleType]);

  // Filter and sort centres
  const filteredCentres = useMemo(() => {
    let list = calculatedCentres.filter((c) => c.liveDistanceKm <= radiusFilterKm);

    if (sortBy === 'distance') {
      list.sort((a, b) => a.liveDistanceKm - b.liveDistanceKm);
    } else if (sortBy === 'wait') {
      list.sort((a, b) => a.avgWaitMinutes - b.avgWaitMinutes);
    } else {
      // Smart AI Score: lowest total delay first
      list.sort((a, b) => a.smartScore - b.smartScore);
    }
    return list;
  }, [calculatedCentres, radiusFilterKm, sortBy]);

  // Auto-select nearest or recommended centre
  useEffect(() => {
    if (filteredCentres.length > 0 && !selectedMandiId) {
      setSelectedMandiId(filteredCentres[0].id);
    }
  }, [filteredCentres, selectedMandiId]);

  const activeCentre =
    calculatedCentres.find((c) => c.id === selectedMandiId) || filteredCentres[0];

  return (
    <div className="space-y-6">
      {/* Top Location Command Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Crosshair className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Real-Time GPS & Haversine Mandi Locator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Nearby Mandi Congestion & Distance Radar
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Detects your live farm GPS coordinates, computes actual road travel distance, and
              identifies the optimal procurement centre with minimum queue waiting times.
            </p>
          </div>

          {/* GPS Detector & Manual Hub Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDetectGps}
              disabled={isDetectingGps}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm transition shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
              <span>{isDetectingGps ? 'Locking GPS Satellite...' : '📍 Detect My Location'}</span>
            </button>

            {/* Quick Farm Hub Dropdown */}
            <select
              value={
                PUNJAB_FARM_HUBS.find(
                  (h) =>
                    Math.abs(h.latitude - userCoords.latitude) < 0.001 &&
                    Math.abs(h.longitude - userCoords.longitude) < 0.001
                )?.id || 'hub-samrala'
              }
              onChange={(e) => handleSelectVillage(e.target.value)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              {PUNJAB_FARM_HUBS.map((hub) => (
                <option key={hub.id} value={hub.id} className="text-slate-900 bg-white">
                  📍 {hub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live GPS Coordinates & Status Pill */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-200">Current Position:</span>
            <strong className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold">
              {userCoords.latitude.toFixed(4)}° N, {userCoords.longitude.toFixed(4)}° E
            </strong>
            <span className="text-[11px] text-emerald-300">
              ({userCoords.source === 'GPS_LIVE' ? 'Live Mobile GPS' : 'Farm Village Geocode'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Truck className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-slate-300 text-xs font-medium">Vehicle Mode:</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
            >
              <option value="Tractor Trolley" className="text-slate-900">
                Tractor Trolley (25 km/h)
              </option>
              <option value="Mini Truck" className="text-slate-900">
                Mini Truck (40 km/h)
              </option>
              <option value="Bullock Cart" className="text-slate-900">
                Bullock Cart (8 km/h)
              </option>
            </select>
          </div>
        </div>

        {gpsStatusMessage && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
            <Compass className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{gpsStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Control Bar: Radar vs List Toggle & Sorting */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Interactive Radar</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'list'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Mandi List ({filteredCentres.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Radius Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">Search Radius:</span>
            <div className="flex items-center space-x-1">
              {[15, 30, 50].map((radius) => (
                <button
                  key={radius}
                  onClick={() => setRadiusFilterKm(radius)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition border cursor-pointer ${
                    radiusFilterKm === radius
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="smart">⚡ AI Smart Score (Distance + Queue)</option>
              <option value="distance">📍 Distance (Nearest First)</option>
              <option value="wait">⏱️ Shortest Mandi Wait Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Distance Radar View */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Radar Visualizer (7 Columns) */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Radar Scope Header */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 relative z-10">
              <span className="flex items-center space-x-1 font-mono">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">RADAR RANGE: {radiusFilterKm} KM</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                PULSE: LIVE 360° • VEHICLE: {vehicleType.toUpperCase()}
              </span>
            </div>

            {/* SVG Radar Graphic */}
            <div className="relative w-full max-w-[380px] aspect-square my-2 flex items-center justify-center">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Outer Glow Ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="190"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeOpacity="0.2"
                />

                {/* Range Rings: 10km, 25km, 50km */}
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.3"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="120"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.4"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="60"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.5"
                />

                {/* Crosshairs */}
                <line
                  x1="200"
                  y1="10"
                  x2="200"
                  y2="390"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                />
                <line
                  x1="10"
                  y1="200"
                  x2="390"
                  y2="200"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                />

                {/* Range Labels */}
                <text x="205" y="145" fill="#34d399" fontSize="9" fontFamily="monospace" opacity="0.7">
                  10 KM
                </text>
                <text x="205" y="85" fill="#34d399" fontSize="9" fontFamily="monospace" opacity="0.7">
                  25 KM
                </text>
                <text x="205" y="25" fill="#34d399" fontSize="9" fontFamily="monospace" opacity="0.7">
                  50 KM
                </text>

                {/* Radar Rotating Sweep Line */}
                <line
                  x1="200"
                  y1="200"
                  x2="380"
                  y2="200"
                  stroke="url(#radarSweep)"
                  strokeWidth="2"
                  className="origin-center animate-[spin_8s_linear_infinite]"
                />

                <defs>
                  <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Farmer Position Center Marker */}
                <circle cx="200" cy="200" r="8" fill="#10b981" />
                <circle cx="200" cy="200" r="16" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
                <text
                  x="200"
                  y="228"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  YOU (Farm)
                </text>

                {/* Render Mandi Nodes */}
                {calculatedCentres.map((centre) => {
                  // Coordinate projection relative to user
                  const maxRadiusKm = Math.max(30, radiusFilterKm);
                  const scale = 175 / maxRadiusKm;
                  const deltaLat = ((centre.latitude || 30.8359) - userCoords.latitude) * 111; // 1 deg lat ~ 111 km
                  const deltaLon =
                    ((centre.longitude || 76.1914) - userCoords.longitude) *
                    111 *
                    Math.cos((userCoords.latitude * Math.PI) / 180);

                  // SVG Coordinates (Center is 200, 200)
                  // Notice: Screen Y is inverted (North is negative deltaLat)
                  const svgX = Math.min(375, Math.max(25, 200 + deltaLon * scale));
                  const svgY = Math.min(375, Math.max(25, 200 - deltaLat * scale));

                  const isSelected = centre.id === activeCentre?.id;
                  const isCongested = centre.yardCapacityPercent >= 80;
                  const isModerate = centre.yardCapacityPercent >= 50 && centre.yardCapacityPercent < 80;
                  const nodeColor = isCongested ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

                  return (
                    <g
                      key={centre.id}
                      onClick={() => setSelectedMandiId(centre.id)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={svgX}
                          cy={svgY}
                          r="18"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="animate-spin"
                        />
                      )}

                      {/* Mandi Pin Circle */}
                      <circle
                        cx={svgX}
                        cy={svgY}
                        r={isSelected ? 10 : 8}
                        fill={nodeColor}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition duration-150 hover:scale-125"
                      />

                      {/* Mandi Name Tag */}
                      <text
                        x={svgX}
                        y={svgY - 12}
                        fill={isSelected ? '#ffffff' : '#cbd5e1'}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {centre.name.split(' ')[0]} ({centre.liveDistanceKm}km)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Radar Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-2 text-slate-300">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Low Wait (&lt;30m)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Moderate Wait (30-60m)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span>Heavy Congestion (&gt;60m)</span>
              </span>
            </div>
          </div>

          {/* Active Mandi Spotlight Preview (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            {activeCentre ? (
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/50 shadow-xl space-y-5 text-slate-900">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      SELECTED MANDI • {activeCentre.code}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1.5">
                      {activeCentre.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCentre.address || `${activeCentre.district}, ${activeCentre.state}`}
                    </p>
                  </div>
                  {activeCentre.isAiRecommended && (
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-xl shadow-xs shrink-0">
                      ★ TOP CHOICE
                    </span>
                  )}
                </div>

                {/* 3 Key Geospatial Metrics */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Distance
                    </span>
                    <strong className="text-base font-black font-mono text-emerald-700">
                      {activeCentre.liveDistanceKm} km
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">From your farm</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Drive Time
                    </span>
                    <strong className="text-base font-black font-mono text-slate-900">
                      ~{activeCentre.liveTransitMinutes} min
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">By {vehicleType}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Mandi Wait
                    </span>
                    <strong
                      className={`text-base font-black font-mono ${
                        activeCentre.avgWaitMinutes > 60 ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      ~{activeCentre.avgWaitMinutes} min
                    </strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Queue turnaround</span>
                  </div>
                </div>

                {/* Yard Load & Weather */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Yard Capacity Occupancy:</span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {activeCentre.yardCapacityPercent}% ({activeCentre.currentQueueCount} Trolleys)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        activeCentre.yardCapacityPercent >= 80
                          ? 'bg-red-500'
                          : activeCentre.yardCapacityPercent >= 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${activeCentre.yardCapacityPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t border-slate-200/80">
                    <span className="flex items-center space-x-1">
                      <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                      <span>{activeCentre.weatherCondition}</span>
                    </span>
                    <span>Active Weighbridges: {activeCentre.activeBays} Bays</span>
                  </div>
                </div>

                {/* AI Traffic Advisory */}
                {activeCentre.recommendedReason && (
                  <div className="bg-emerald-50 text-emerald-950 p-3.5 rounded-2xl border border-emerald-200 text-xs flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium text-[11px]">
                      {activeCentre.recommendedReason}
                    </p>
                  </div>
                )}

                {/* Action Buttons: Navigate & Book */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={activeCentre.liveNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition flex items-center justify-center space-x-2 shadow-2xs cursor-pointer border border-slate-300"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                    <span>Get Driving Directions</span>
                  </a>

                  <button
                    onClick={() => onSelectCentreToBook(activeCentre.id)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-black text-white font-extrabold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-slate-950/20 cursor-pointer"
                  >
                    <span>Book Slot Here</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">Select a Mandi from the radar to inspect details and route.</p>
              </div>
            )}

            {/* Quick Mandi Switcher Pills */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">
                All Radar Mandis ({calculatedCentres.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {calculatedCentres.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedMandiId(c.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      c.id === selectedMandiId
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {c.name.split(' ')[0]} ({c.liveDistanceKm} km)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive List View */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {filteredCentres.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
              <Compass className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">
                No Mandis found within {radiusFilterKm} km
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Expand your search radius to 50 km or detect your location to view mandis in your
                region.
              </p>
              <button
                onClick={() => setRadiusFilterKm(50)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Expand Radius to 50 km
              </button>
            </div>
          ) : (
            filteredCentres.map((centre) => {
              const isHighCongestion = centre.yardCapacityPercent >= 80;
              const isModerate = centre.yardCapacityPercent >= 50 && centre.yardCapacityPercent < 80;

              return (
                <div
                  key={centre.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all hover:border-emerald-400/80 ${
                    centre.isAiRecommended
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Main Identity */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <Building2
                          className={`w-5 h-5 ${
                            centre.isAiRecommended ? 'text-amber-500' : 'text-slate-700'
                          }`}
                        />
                        <h4 className="font-extrabold text-base text-slate-900">{centre.name}</h4>
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {centre.code}
                        </span>
                        {centre.isAiRecommended && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            ★ BEST OPTION
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        {centre.address || `${centre.district}, ${centre.state}`}
                      </p>

                      {/* Travel & Distance Tags */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <span className="inline-flex items-center space-x-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{centre.liveDistanceKm} km from you</span>
                        </span>

                        <span className="inline-flex items-center space-x-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            ~{centre.liveTransitMinutes} mins travel ({vehicleType})
                          </span>
                        </span>

                        <span className="inline-flex items-center space-x-1 text-slate-600">
                          <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                          <span>{centre.weatherCondition}</span>
                        </span>
                      </div>
                    </div>

                    {/* Congestion Status & Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-500 font-medium">Current Queue Wait:</div>
                        <div className="text-base font-black font-mono text-slate-900">
                          ~{centre.avgWaitMinutes} mins
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                            isHighCongestion
                              ? 'bg-red-100 text-red-800'
                              : isModerate
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Yard: {centre.yardCapacityPercent}% ({centre.currentQueueCount} trolleys)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <a
                          href={centre.liveNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-2xs border border-slate-300"
                          title="Open Google Maps Driving Directions"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => onSelectCentreToBook(centre.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <span>Book Slot</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyMandiBoard;
