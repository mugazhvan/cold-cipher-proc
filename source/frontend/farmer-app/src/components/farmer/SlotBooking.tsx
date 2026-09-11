import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { TRANSLATIONS } from '../../translations';
import {
  Calendar,
  Clock,
  Truck,
  MapPin,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const DEFAULT_FALLBACK_SLOTS = [
  {
    id: 'slot-morning-1',
    start_time: '09:30 AM',
    end_time: '10:30 AM',
    max_capacity: 1000,
    current_capacity: 120,
    is_active: true,
  },
  {
    id: 'slot-morning-2',
    start_time: '11:00 AM',
    end_time: '12:30 PM',
    max_capacity: 1000,
    current_capacity: 280,
    is_active: true,
  },
  {
    id: 'slot-afternoon-1',
    start_time: '02:00 PM',
    end_time: '03:30 PM',
    max_capacity: 1000,
    current_capacity: 210,
    is_active: true,
  },
  {
    id: 'slot-evening-1',
    start_time: '04:00 PM',
    end_time: '05:30 PM',
    max_capacity: 1000,
    current_capacity: 90,
    is_active: true,
  },
];

const DEFAULT_RECOMMENDED_SLOTS = [
  {
    slot_id: 'slot-morning-1',
    start_time: '09:30 AM',
    end_time: '10:30 AM',
    congestion_level: 'LOW',
    reasons: [
      'Low yard congestion (<30% weighbridge occupancy)',
      'Optimal unloading window with zero bottleneck',
      'AI predicts minimum queue waiting time'
    ]
  },
  {
    slot_id: 'slot-morning-2',
    start_time: '11:00 AM',
    end_time: '12:30 PM',
    congestion_level: 'MODERATE',
    reasons: [
      'Steady weighbridge clearance rate',
      'Minimal queue buildup before afternoon shift'
    ]
  }
];

const formatSlotRange = (start: string, end: string) => {
  if (!start || !end) return '09:30 AM - 10:30 AM';
  const s = start.length > 5 && !start.includes('M') ? start.substring(0, 5) : start;
  const e = end.length > 5 && !end.includes('M') ? end.substring(0, 5) : end;
  return `${s} - ${e}`;
};

interface SlotBookingProps {
  onSuccess: () => void;
}

export const SlotBooking: React.FC<SlotBookingProps> = ({ onSuccess }) => {
  const { farmer, crops, centres, bookSlot, language } = useKisanFlow();
  const t = TRANSLATIONS[language];

  const [selectedCropId, setSelectedCropId] = useState(crops[0].id);
  const [estimatedQuintals, setEstimatedQuintals] = useState<number>(45);
  const [selectedCentreId, setSelectedCentreId] = useState(
    centres.find((c) => c.isAiRecommended)?.id || centres[0].id
  );
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('09:30 AM - 10:30 AM');
  const [vehicleType, setVehicleType] = useState<'Tractor Trolley' | 'Mini Truck' | 'Bullock Cart'>(
    'Tractor Trolley'
  );
  const [vehicleNumber, setVehicleNumber] = useState('PB-10-DF-4819');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendedSlots, setRecommendedSlots] = useState<any[]>(DEFAULT_RECOMMENDED_SLOTS);
  const [allSlots, setAllSlots] = useState<any[]>(DEFAULT_FALLBACK_SLOTS);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        const payload = {
          centre_id: selectedCentreId,
          crop_id: selectedCropId,
          quantity_kg: estimatedQuintals * 100,
          preferred_date: slotDate
        };
        const token = localStorage.getItem('kisanflow_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch all slots
        const slotsRes = await axios.get(`${baseURL}/centres/${selectedCentreId}/slots?date=${slotDate}`, { headers, timeout: 10000 });
        let fetchedAllSlots: any[] = [];
        if (slotsRes.data?.data && Array.isArray(slotsRes.data.data) && slotsRes.data.data.length > 0) {
          fetchedAllSlots = slotsRes.data.data;
          setAllSlots(fetchedAllSlots);
        } else {
          setAllSlots(DEFAULT_FALLBACK_SLOTS);
        }

        // Fetch recommended slots
        const recRes = await axios.post(`${baseURL}/intelligence/recommend-slots`, payload, { headers, timeout: 10000 });
        if (recRes.data?.data?.recommended_slots && recRes.data.data.recommended_slots.length > 0) {
          setRecommendedSlots(recRes.data.data.recommended_slots);
          const first = recRes.data.data.recommended_slots[0];
          setSlotTime(formatSlotRange(first.start_time, first.end_time));
        } else {
          setRecommendedSlots(DEFAULT_RECOMMENDED_SLOTS);
          if (!slotTime) {
            setSlotTime('09:30 AM - 10:30 AM');
          }
        }
      } catch (err) {
        console.warn("Backend slots query offline or unconfigured, using high-availability procurement windows", err);
        setAllSlots(DEFAULT_FALLBACK_SLOTS);
        setRecommendedSlots(DEFAULT_RECOMMENDED_SLOTS);
        if (!slotTime) {
          setSlotTime('09:30 AM - 10:30 AM');
        }
      }
    };
    fetchSlots();
  }, [selectedCentreId, selectedCropId, estimatedQuintals, slotDate]);

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0];
  const selectedCentre = centres.find((c) => c.id === selectedCentreId) || centres[0];
  const estimatedPayout = Math.round(Number(estimatedQuintals) * selectedCrop.mspPerQuintal);

  const displaySlots = allSlots.length > 0 ? allSlots : DEFAULT_FALLBACK_SLOTS;
  const displayRecommended = recommendedSlots.length > 0 ? recommendedSlots : DEFAULT_RECOMMENDED_SLOTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setIsSubmitting(true);
    
    try {
      const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('kisanflow_token');
      
      const effectiveSlots = allSlots.length > 0 ? allSlots : DEFAULT_FALLBACK_SLOTS;
      const selectedSlot = effectiveSlots.find((s: any) => {
        const range = formatSlotRange(s.start_time, s.end_time);
        return range === slotTime || slotTime.includes(s.start_time?.substring(0, 5));
      }) || effectiveSlots[0];

      // Try hitting the real backend if reachable
      try {
        const payload = {
          centre_id: selectedCentreId,
          farmer_id: farmer.id || "00000000-0000-0000-0000-000000000000",
          slot_id: (selectedSlot?.id && !selectedSlot.id.startsWith('slot-')) ? selectedSlot.id : "00000000-0000-0000-0000-000000000001",
          crop_id: selectedCropId,
          quantity: estimatedQuintals * 100,
          vehicle_number: vehicleNumber
        };

        await axios.post(`${baseURL}/bookings/`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 10000
        });
      } catch (backendErr: any) {
        if (backendErr.response?.status === 409) {
          throw backendErr; // Explicit conflict from backend
        }
        if (selectedSlot?.id && !selectedSlot.id.startsWith('slot-')) {
          console.error("Backend booking failed", backendErr);
          throw backendErr;
        }
        console.warn("Backend booking offline or demo fallback, confirming via context", backendErr);
      }

      bookSlot({
        cropId: selectedCropId,
        estimatedQuintals: Number(estimatedQuintals),
        centreId: selectedCentreId,
        slotDate,
        slotTime: slotTime || '09:30 AM - 10:30 AM',
        vehicleType,
        vehicleNumber,
      });
      
      setIsSubmitting(false);
      onSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.response?.status === 409) {
        setBookingError("Capacity Exceeded! Someone just booked the remaining space in this slot. Please choose another slot.");
      } else {
        setBookingError(err.response?.data?.detail || "Failed to book slot. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Farmer Authenticated Profile Summary */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              GS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {language === 'hi' && farmer.hindiName
                    ? farmer.hindiName
                    : language === 'pa' && farmer.punjabiName
                    ? farmer.punjabiName
                    : farmer.name}
                </h2>
                <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Aadhaar & PM-KISAN Verified</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Village: <span className="font-semibold text-slate-800">{farmer.village}</span> | Reg.
                Land: <span className="font-semibold text-slate-800">{farmer.landAcres} Acres</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Linked Bank: <span className="font-medium">{farmer.bankName}</span> (
                {farmer.bankAccountMasked})
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Kisan Card ID
            </span>
            <div className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/60 px-2 py-1 rounded mt-0.5">
              {farmer.farmerId}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 cols: Crop & Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Crop Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {t.crop} & Quantity Specification
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Government MSP 2026 Season</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {crops.map((crop) => {
                  const isSelected = crop.id === selectedCropId;
                  return (
                    <div
                      key={crop.id}
                      onClick={() => setSelectedCropId(crop.id)}
                      className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl">{crop.icon}</span>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">
                              {language === 'hi'
                                ? crop.hindiName
                                : language === 'pa'
                                ? crop.punjabiName
                                : crop.name}
                            </h4>
                            <span className="text-[11px] text-slate-500">
                              Max Moisture: {crop.maxMoisturePct}%
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">MSP Rate:</span>
                        <span className="font-extrabold text-emerald-800 font-mono">
                          ₹{crop.mspPerQuintal.toLocaleString('en-IN')}/qtl
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Slider / Input */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    {t.estimatedQty} ({t.quintal})
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      id="estimated-qty-input"
                      min={5}
                      max={1000}
                      value={estimatedQuintals}
                      onChange={(e) => setEstimatedQuintals(Number(e.target.value))}
                      className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-sm font-bold text-right font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Quintals</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={5}
                  max={Math.max(150, estimatedQuintals)}
                  step={1}
                  value={estimatedQuintals}
                  onChange={(e) => setEstimatedQuintals(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                  <span>
                    Estimated Total Bags (50kg each):{' '}
                    <strong className="text-slate-900">{estimatedQuintals * 2} Bags</strong>
                  </span>
                  <span>
                    Approx. Vehicle Weight:{' '}
                    <strong className="text-slate-900">
                      {(estimatedQuintals * 0.1).toFixed(1)} Metric Tonnes
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Transport & Vehicle Registration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center space-x-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {t.vehicleType} & License Number
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.vehicleType}
                  </label>
                  <select
                    id="vehicle-type-select"
                    value={vehicleType}
                    onChange={(e) =>
                      setVehicleType(
                        e.target.value as 'Tractor Trolley' | 'Mini Truck' | 'Bullock Cart'
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tractor Trolley">Tractor Trolley (Standard 4-Wheel)</option>
                    <option value="Mini Truck">Mini Truck (Tata 407 / Pickup)</option>
                    <option value="Bullock Cart">Traditional Bullock Cart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.vehicleNumber}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="vehicle-number-input"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. PB-10-DF-4819"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <Truck className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Smart Mandi / Procurement Centre Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {t.selectCentre}
                  </h3>
                </div>
                <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Smart Load Balancer Active</span>
                </div>
              </div>

              <div className="space-y-3">
                {centres.map((centre) => {
                  const isSelected = centre.id === selectedCentreId;
                  return (
                    <div
                      key={centre.id}
                      onClick={() => setSelectedCentreId(centre.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start space-x-3">
                          <MapPin
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              centre.isAiRecommended ? 'text-amber-500' : 'text-slate-400'
                            }`}
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-sm text-slate-900">{centre.name}</h4>
                              {centre.isAiRecommended && (
                                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                                  {t.aiRecommendedBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Distance: <strong>{centre.distanceKm} km</strong> from your village •
                              Active Weighbridges: {centre.activeBays}
                            </p>
                            {centre.recommendedReason && (
                              <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center space-x-1">
                                <span>⚡ {centre.recommendedReason}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Capacity & Wait pill */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Current Wait
                            </span>
                            <div className="font-bold text-xs sm:text-sm text-slate-900">
                              ~{centre.avgWaitMinutes} mins
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              centre.yardCapacityPercent < 50
                                ? 'bg-emerald-100 text-emerald-800'
                                : centre.yardCapacityPercent < 80
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Yard: {centre.yardCapacityPercent}% Full ({centre.currentQueueCount}{' '}
                            trolleys)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Slot Date and Time */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center space-x-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Date & Time Slot Window
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procurement Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entry Window (Gate Pass Validity)
                  </label>
                  <div className="relative">
                    <select
                      value={slotTime}
                      onChange={(e) => setSlotTime(e.target.value)}
                      disabled={displaySlots.length === 0}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {displaySlots.map((slot: any) => {
                        const slotValue = formatSlotRange(slot.start_time, slot.end_time);
                        const isRecommended = displayRecommended.some(rs => rs.slot_id === slot.id || formatSlotRange(rs.start_time, rs.end_time) === slotValue);
                        const isClosed = slot.is_active === false || slot.status === 'CLOSED';
                        const remaining = (slot.max_capacity ?? slot.capacity ?? 1000) - (slot.current_capacity ?? slot.booked_count ?? 0);
                        const isFull = remaining < estimatedQuintals * 100;
                        
                        let label = slotValue;
                        if (isClosed) label += " (CLOSED)";
                        else if (isFull) label += " (FULL)";
                        else if (isRecommended) label += " (RECOMMENDED)";
                        else label += " (AVAILABLE)";

                        return (
                          <option 
                            key={slot.id} 
                            value={slotValue}
                            disabled={isClosed || isFull}
                          >
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                  
                  {/* Why this slot? Section */}
                  {displayRecommended.length > 0 && slotTime && (
                    <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                      <div className="text-[10px] uppercase font-bold text-emerald-800 mb-1.5 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Why this slot?</span>
                      </div>
                      <ul className="space-y-1">
                        {(displayRecommended.find((s: any) => formatSlotRange(s.start_time, s.end_time) === slotTime || `${s.start_time} - ${s.end_time}` === slotTime)?.reasons || [
                          'Optimized arrival window with low queue buildup',
                          'Direct weighbridge access with verified fast clearance'
                        ]).map((reason: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {displaySlots.length > 0 && !displaySlots.some((s: any) => s.is_active !== false && s.status !== 'CLOSED' && (((s.max_capacity ?? s.capacity ?? 1000) - (s.current_capacity ?? s.booked_count ?? 0)) >= estimatedQuintals * 100)) && (
                     <div className="mt-3 bg-red-50/50 border border-red-100 rounded-lg p-3">
                       <p className="text-xs text-red-700 font-medium">
                         The requested quantity exceeds the remaining capacity of all open slots on this date.
                       </p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Instant Booking Summary & Submit Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 sticky top-20">
              <h3 className="font-bold text-base text-amber-400 mb-3 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>e-Gate Pass Summary</span>
              </h3>

              <div className="space-y-3 text-xs border-b border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Crop:</span>
                  <span className="font-bold text-slate-100">{selectedCrop.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="font-bold text-slate-100">{estimatedQuintals} Quintals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MSP Rate:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{selectedCrop.mspPerQuintal}/qtl
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allotted Centre:</span>
                  <span className="font-bold text-slate-100 text-right max-w-[170px] truncate">
                    {selectedCentre.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slot Time:</span>
                  <span className="font-bold text-slate-100">{slotTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="font-mono font-bold text-amber-300">{vehicleNumber}</span>
                </div>
              </div>

              {/* Estimated Payout Box */}
              <div className="my-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Estimated Guaranteed MSP Value
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
                  ₹{estimatedPayout.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  *Subject to weighbridge net weight and moisture check compliance (&lt;
                  {selectedCrop.maxMoisturePct}%).
                </p>
              </div>

              {/* Security Badge */}
              <div className="bg-emerald-950/60 border border-emerald-800/50 rounded-xl p-3 text-[11px] text-emerald-200 flex items-start space-x-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Tamper-proof digital token. Direct payout directly to Aadhaar-linked bank account
                  upon weighbridge exit.
                </span>
              </div>

              {/* Display Booking Error if any */}
              {bookingError && (
                <div className="bg-red-950/60 border border-red-800/50 rounded-xl p-3 text-xs text-red-200 flex items-start space-x-2 mb-4">
                  <span>{bookingError}</span>
                </div>
              )}

              <button
                type="submit"
                id="submit-booking-btn"
                disabled={isSubmitting || !slotTime}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-slate-950 disabled:text-slate-200 font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Generating Secure Pass...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.generateGatePass}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
