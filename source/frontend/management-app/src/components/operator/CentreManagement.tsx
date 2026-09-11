import { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Package,
  Settings,
  Edit2,
  CheckCircle,
  XCircle,
  Plus,
  Zap,
  Users,
  ArrowRightLeft,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  searchFarmers,
  getCrops,
  getCentreSlots,
  createManualBooking,
  updateSlotCapacity,
  createSingleSlotApi,
  createBatchSlotsApi,
  getSlotBookingsApi,
  reassignBookingApi,
} from '../../services/api';

interface CentreManagementProps {
  centreId: string;
  initialTab?: 'booking' | 'management';
}

export function CentreManagement({ centreId, initialTab = 'management' }: CentreManagementProps) {
  const [activeTab, setActiveTab] = useState<'booking' | 'management'>(initialTab);

  // Walk-in Booking State
  const [phoneQuery, setPhoneQuery] = useState('');
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

  // General Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Create Single Slot Modal State
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [newSlotStartTime, setNewSlotStartTime] = useState('09:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('10:00');
  const [newSlotCropId, setNewSlotCropId] = useState('');
  const [newSlotCapacity, setNewSlotCapacity] = useState(20);
  const [newSlotStatus, setNewSlotStatus] = useState('OPEN');
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);

  // Create Routine Modal State
  const [isRoutineOpen, setIsRoutineOpen] = useState(false);
  const [routineCropId, setRoutineCropId] = useState('');
  const [routineStartTime, setRoutineStartTime] = useState('08:00');
  const [routineEndTime, setRoutineEndTime] = useState('16:00');
  const [routineDuration, setRoutineDuration] = useState(60);
  const [routineCapacity, setRoutineCapacity] = useState(20);
  const [routineBreakStart, setRoutineBreakStart] = useState('12:00');
  const [routineBreakEnd, setRoutineBreakEnd] = useState('13:00');
  const [isSubmittingRoutine, setIsSubmittingRoutine] = useState(false);

  // View Farmers in Slot State
  const [viewingSlot, setViewingSlot] = useState<any | null>(null);
  const [slotBookings, setSlotBookings] = useState<any[]>([]);
  const [isLoadingSlotBookings, setIsLoadingSlotBookings] = useState(false);

  // Reassign Booking State
  const [reassigningBooking, setReassigningBooking] = useState<any | null>(null);
  const [targetSlotId, setTargetSlotId] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (date && centreId) {
      fetchSlots();
    }
  }, [date, centreId]);

  const fetchCrops = async () => {
    try {
      const res = await getCrops();
      const cropList = res?.data || [];
      setCrops(cropList);
      if (cropList.length > 0) {
        if (!selectedCrop) setSelectedCrop(cropList[0].id);
        if (!newSlotCropId) setNewSlotCropId(cropList[0].id);
        if (!routineCropId) setRoutineCropId(cropList[0].id);
      }
    } catch (e) {
      console.warn('Could not fetch crops', e);
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await getCentreSlots(centreId, date);
      if (res?.success) {
        setSlots(res.data || []);
      } else {
        setSlots([]);
      }
    } catch (e) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (phoneQuery.length < 3) return;
    setLoading(true);
    const res = await searchFarmers(phoneQuery);
    if (res?.success) {
      setFarmers(res.data || []);
      if (!res.data || res.data.length === 0) {
        setMessage({ type: 'error', text: 'No farmers found with this phone number.' });
      } else {
        setMessage(null);
      }
    } else {
      setMessage({ type: 'error', text: res?.message || 'Search failed.' });
    }
    setLoading(false);
  };

  const handleBooking = async () => {
    if (!selectedFarmer || !selectedCrop || !quantity || !selectedSlot) {
      setMessage({ type: 'error', text: 'Please fill in all fields to create a booking.' });
      return;
    }

    setLoading(true);
    const payload = {
      centre_id: centreId,
      slot_id: selectedSlot,
      crop_id: selectedCrop,
      quantity: parseFloat(quantity) * 100, // convert quintals to kg
    };

    const res = await createManualBooking(centreId, selectedFarmer.id, payload);
    if (res?.success) {
      setMessage({
        type: 'success',
        text: `Manual booking created successfully! Token # ${res.data?.booking_reference || res.data?.id?.substring(0, 8)}`,
      });
      setSelectedFarmer(null);
      setPhoneQuery('');
      setFarmers([]);
      setQuantity('');
      setSelectedSlot('');
      await fetchSlots();
    } else {
      setMessage({ type: 'error', text: res?.detail || res?.message || 'Booking failed.' });
    }
    setLoading(false);
  };

  const handleUpdateSlot = async (slotId: string, capacity?: number, status?: string) => {
    setLoading(true);
    const payload: { capacity?: number; status?: string } = {};
    if (capacity !== undefined) payload.capacity = capacity;
    if (status !== undefined) payload.status = status;

    const res = await updateSlotCapacity(slotId, payload);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Slot updated successfully.' });
      await fetchSlots();
    } else {
      setMessage({ type: 'error', text: res?.detail || res?.message || 'Failed to update slot.' });
    }
    setLoading(false);
  };

  const handleCreateSingleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotCropId) {
      setMessage({ type: 'error', text: 'Please select a crop for this slot.' });
      return;
    }
    if (newSlotStartTime >= newSlotEndTime) {
      setMessage({ type: 'error', text: 'Start time must be strictly before end time.' });
      return;
    }
    if (newSlotCapacity <= 0) {
      setMessage({ type: 'error', text: 'Capacity must be greater than 0.' });
      return;
    }

    setIsSubmittingSlot(true);
    try {
      const payload = {
        crop_id: newSlotCropId,
        slot_date: date,
        start_time: newSlotStartTime.length === 5 ? `${newSlotStartTime}:00` : newSlotStartTime,
        end_time: newSlotEndTime.length === 5 ? `${newSlotEndTime}:00` : newSlotEndTime,
        capacity: newSlotCapacity,
        status: newSlotStatus,
      };

      const res = await createSingleSlotApi(centreId, payload);
      if (res?.success) {
        setMessage({ type: 'success', text: `Slot created successfully for ${date} (${newSlotStartTime} - ${newSlotEndTime}).` });
        setIsCreateSlotOpen(false);
        await fetchSlots();
      } else {
        setMessage({ type: 'error', text: res?.detail || res?.message || 'Failed to create slot.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error creating slot.' });
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  const handleGenerateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineCropId) {
      setMessage({ type: 'error', text: 'Please select a crop for the routine.' });
      return;
    }

    setIsSubmittingRoutine(true);
    try {
      const payload = {
        crop_id: routineCropId,
        slot_date: date,
        capacity: routineCapacity,
        start_time: routineStartTime.length === 5 ? `${routineStartTime}:00` : routineStartTime,
        end_time: routineEndTime.length === 5 ? `${routineEndTime}:00` : routineEndTime,
        slot_duration_minutes: routineDuration,
        break_start_time: routineBreakStart.length === 5 ? `${routineBreakStart}:00` : routineBreakStart,
        break_end_time: routineBreakEnd.length === 5 ? `${routineBreakEnd}:00` : routineBreakEnd,
      };

      const res = await createBatchSlotsApi(centreId, payload);
      if (res?.success) {
        const count = res.data?.length || 0;
        setMessage({
          type: 'success',
          text: `Routine generated successfully! ${count} standard procurement slots created for ${date}.`,
        });
        setIsRoutineOpen(false);
        await fetchSlots();
      } else {
        setMessage({
          type: 'info',
          text: res?.detail || res?.message || 'Slots for this schedule already exist.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error generating slot routine.' });
    } finally {
      setIsSubmittingRoutine(false);
    }
  };

  const handleOpenViewFarmers = async (slot: any) => {
    setViewingSlot(slot);
    setIsLoadingSlotBookings(true);
    setSlotBookings([]);
    try {
      const res = await getSlotBookingsApi(slot.id);
      if (res?.success) {
        setSlotBookings(res.data || []);
      }
    } catch (err) {
      console.warn('Could not fetch slot bookings', err);
    } finally {
      setIsLoadingSlotBookings(false);
    }
  };

  const handleConfirmReassignment = async () => {
    if (!reassigningBooking || !targetSlotId) return;

    setIsSubmittingReassign(true);
    try {
      const res = await reassignBookingApi(reassigningBooking.id, targetSlotId);
      if (res?.success) {
        setMessage({
          type: 'success',
          text: `Farmer ${reassigningBooking.farmer_name} successfully reassigned to slot ${res.data?.new_slot_time || ''}.`,
        });
        setReassigningBooking(null);
        setTargetSlotId('');
        // Refresh bookings for current slot modal
        if (viewingSlot) {
          const bRes = await getSlotBookingsApi(viewingSlot.id);
          setSlotBookings(bRes?.data || []);
        }
        await fetchSlots();
      } else {
        setMessage({
          type: 'error',
          text: res?.detail || res?.message || 'Failed to reassign booking.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error during reassignment.' });
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  const renderBooking = () => (
    <>
      {/* 1. Search Farmer */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-slate-900">1. Select Farmer</h3>
        <div className="flex space-x-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone number..."
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || phoneQuery.length < 3}
            className="bg-zinc-950 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            Search
          </button>
        </div>

        {farmers.length > 0 && !selectedFarmer && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {farmers.map((farmer: any) => (
                  <tr key={farmer.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-900 font-bold">{farmer.name || farmer.user?.full_name || 'Farmer'}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{farmer.user?.phone || farmer.user?.phone_number || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedFarmer(farmer)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer underline underline-offset-2"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedFarmer && (
          <div className="bg-emerald-50/90 p-4 rounded-xl flex justify-between items-center border border-emerald-200">
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{selectedFarmer.name || selectedFarmer.user?.full_name}</p>
              <p className="text-xs text-emerald-800 font-mono font-bold mt-0.5">{selectedFarmer.user?.phone || selectedFarmer.user?.phone_number}</p>
            </div>
            <button
              onClick={() => setSelectedFarmer(null)}
              className="text-slate-600 hover:text-slate-950 text-xs font-semibold underline underline-offset-2 cursor-pointer"
            >
              Change Farmer
            </button>
          </div>
        )}
      </div>

      {/* 2. Crop Details */}
      {selectedFarmer && (
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-slate-900 flex items-center">
            <Package className="w-4 h-4 mr-2 text-slate-700" />
            2. Crop & Quantity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="">Select Crop</option>
                {crops.map((crop: any) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Estimated Quantity (Quintals)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Slot Selection */}
      {selectedFarmer && selectedCrop && quantity && (
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-slate-900 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-700" />
            3. Select Slot
          </h3>
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {slots.map((slot: any) => {
              const capacity = slot.capacity || 20;
              const bookedCount = slot.booked_count || 0;
              const remaining = capacity - bookedCount;
              const isSelected = selectedSlot === slot.id;
              const isFull = remaining <= 0;

              return (
                <div
                  key={slot.id}
                  onClick={() => !isFull && setSelectedSlot(slot.id)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isFull
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer text-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-mono font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {String(slot.start_time).substring(0, 5)} - {String(slot.end_time).substring(0, 5)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFull
                          ? 'bg-rose-100 text-rose-800'
                          : isSelected
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isFull ? 'Full' : `${remaining} spots left`}
                    </span>
                  </div>
                  <div className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    Crop: {slot.crop?.name || 'General'}
                  </div>
                </div>
              );
            })}
          </div>

          {slots.length === 0 && (
            <p className="text-xs text-slate-500 italic">No available slots for this date.</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleBooking}
              disabled={loading || !selectedSlot}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Booking...' : 'Confirm Walk-in Booking'}
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderManagement = () => (
    <div className="mb-8 space-y-5">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-900" />
            <span>Procurement Slot Schedule</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live mandi capacity, create single windows, or generate automated daily routines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-600 font-bold">Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-900 outline-none cursor-pointer"
            />
          </div>

          {/* Create Slot Button */}
          <button
            onClick={() => setIsCreateSlotOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Slot</span>
          </button>

          {/* Create Routine Button */}
          <button
            onClick={() => setIsRoutineOpen(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center space-x-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate Routine</span>
          </button>
        </div>
      </div>

      {/* Slots Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3.5">Slot Window</th>
              <th className="px-4 py-3.5">Crop</th>
              <th className="px-4 py-3.5">Capacity & Bookings</th>
              <th className="px-4 py-3.5">Remaining</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Station Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {slots.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No slots found for {date}. Click <strong>Create Slot</strong> or <strong>Generate Routine</strong> to add database windows.
                </td>
              </tr>
            ) : (
              slots.map((slot: any) => {
                const capacity = slot.capacity || 20;
                const bookedCount = slot.booked_count || 0;
                const remaining = Math.max(0, capacity - bookedCount);
                const isFull = bookedCount >= capacity;
                const isOpen = slot.status === 'OPEN';

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono text-slate-900 font-bold text-xs">
                      {String(slot.start_time).substring(0, 5)} - {String(slot.end_time).substring(0, 5)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium">
                      {slot.crop?.name || 'Wheat (Kanak / Gehu)'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-slate-900 text-xs">
                        <strong className={isFull ? 'text-amber-700 font-extrabold' : 'text-emerald-700 font-extrabold'}>{bookedCount}</strong> / {capacity}
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full ${isFull ? 'bg-amber-500' : 'bg-emerald-600'}`}
                          style={{ width: `${Math.min(100, (bookedCount / capacity) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {remaining} spots
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          slot.status === 'CLOSED'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isFull
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View Farmers */}
                        <button
                          onClick={() => handleOpenViewFarmers(slot)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-900 rounded-lg text-xs font-bold flex items-center space-x-1 border border-slate-300 transition cursor-pointer shadow-2xs"
                          title="View assigned farmers"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-700" />
                          <span>Farmers ({bookedCount})</span>
                        </button>

                        {/* Edit Capacity */}
                        <button
                          onClick={() => {
                            const val = prompt(`Enter new capacity for this slot (currently ${capacity}):`, String(capacity));
                            if (val !== null && !isNaN(parseInt(val, 10))) {
                              const newCap = parseInt(val, 10);
                              if (newCap < bookedCount) {
                                alert(`Cannot set capacity below current booked count (${bookedCount}).`);
                                return;
                              }
                              handleUpdateSlot(slot.id, newCap, undefined);
                            }
                          }}
                          disabled={loading}
                          className="p-1.5 bg-white hover:bg-slate-50 text-amber-700 rounded-lg border border-slate-300 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                          title="Change Capacity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Publish / Close */}
                        <button
                          onClick={() => {
                            const nextStatus = isOpen ? 'CLOSED' : 'OPEN';
                            handleUpdateSlot(slot.id, undefined, nextStatus);
                          }}
                          disabled={loading}
                          className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-50 shadow-2xs ${
                            isOpen
                              ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}
                          title={isOpen ? 'Close Slot' : 'Publish / Open Slot'}
                        >
                          {isOpen ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Create Single Slot */}
      {isCreateSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-slate-900" />
                <span>Create Slot Window</span>
              </h3>
              <button
                onClick={() => setIsCreateSlotOpen(false)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop</label>
                <select
                  value={newSlotCropId}
                  onChange={(e) => setNewSlotCropId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium cursor-pointer focus:ring-2 focus:ring-slate-900"
                  required
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity (Trolley Spots)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSlotCapacity}
                    onChange={(e) => setNewSlotCapacity(parseInt(e.target.value, 10) || 20)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newSlotStatus}
                    onChange={(e) => setNewSlotStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="OPEN">OPEN (Published)</option>
                    <option value="CLOSED">CLOSED (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSlotOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSlot}
                  className="px-5 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSlot ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Routine */}
      {isRoutineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Generate Daily Slot Routine</h3>
                  <p className="text-[11px] text-slate-500">Standard Procurement Day: 08:00–16:00 (Break: 12:00–13:00)</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoutineOpen(false)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateRoutine} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop</label>
                <select
                  value={routineCropId}
                  onChange={(e) => setRoutineCropId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium cursor-pointer"
                  required
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={routineStartTime}
                    onChange={(e) => setRoutineStartTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift End</label>
                  <input
                    type="time"
                    value={routineEndTime}
                    onChange={(e) => setRoutineEndTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slot Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={routineDuration}
                    onChange={(e) => setRoutineDuration(parseInt(e.target.value, 10) || 60)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity Per Slot</label>
                  <input
                    type="number"
                    min="1"
                    value={routineCapacity}
                    onChange={(e) => setRoutineCapacity(parseInt(e.target.value, 10) || 20)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Break Start (Skip Window)</label>
                  <input
                    type="time"
                    value={routineBreakStart}
                    onChange={(e) => setRoutineBreakStart(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Break End</label>
                  <input
                    type="time"
                    value={routineBreakEnd}
                    onChange={(e) => setRoutineBreakEnd(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRoutineOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoutine}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRoutine ? 'Generating...' : 'Generate Real Slots in DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Farmers in Slot & Reassign */}
      {viewingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-slate-900" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Slot Bookings: {String(viewingSlot.start_time).substring(0, 5)} - {String(viewingSlot.end_time).substring(0, 5)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Capacity: {viewingSlot.capacity} • Booked: {slotBookings.length} • Remaining: {Math.max(0, viewingSlot.capacity - slotBookings.length)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSlot(null)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              {isLoadingSlotBookings ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Loading live bookings from database...</span>
                </div>
              ) : slotBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No farmers have booked into this slot yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Farmer</th>
                      <th className="px-4 py-2.5">Booking Ref</th>
                      <th className="px-4 py-2.5">Produce</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Reassign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {slotBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-900">{b.farmer_name || 'Farmer'}</div>
                          <span className="text-[10px] text-slate-500">{b.village || ''}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-900 font-bold">{b.booking_reference}</td>
                        <td className="px-4 py-2.5 text-slate-800">
                          {b.crop_name} • {(b.quantity / 100).toFixed(0)} Qtl
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => {
                              setReassigningBooking(b);
                              setTargetSlotId('');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center space-x-1 ml-auto cursor-pointer shadow-2xs"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-slate-700" />
                            <span>Reassign</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Reassign Dialog Inline */}
            {reassigningBooking && (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900">
                    Reassign Farmer: {reassigningBooking.farmer_name} ({reassigningBooking.booking_reference})
                  </span>
                  <button
                    onClick={() => setReassigningBooking(null)}
                    className="text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={targetSlotId}
                    onChange={(e) => setTargetSlotId(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 font-bold cursor-pointer"
                  >
                    <option value="">Select Destination Slot...</option>
                    {slots
                      .filter((s) => s.id !== viewingSlot.id && s.status === 'OPEN' && s.booked_count < s.capacity)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {String(s.start_time).substring(0, 5)} - {String(s.end_time).substring(0, 5)} (
                          {s.capacity - s.booked_count} spots left)
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleConfirmReassignment}
                    disabled={!targetSlotId || isSubmittingReassign}
                    className="px-4 py-2 bg-zinc-950 hover:bg-black text-white font-bold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSubmittingReassign ? 'Reassigning...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setViewingSlot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-extrabold flex items-center text-slate-900 tracking-tight">
          <Settings className="w-5 h-5 mr-2 text-slate-900" />
          Mandi Centre Administration
        </h2>
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('management');
              setMessage(null);
            }}
            className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'management'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Slot Management
          </button>
          <button
            onClick={() => {
              setActiveTab('booking');
              setMessage(null);
            }}
            className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'booking'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Walk-in Booking
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 text-xs font-bold flex items-center justify-between shadow-2xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : message.type === 'info'
              ? 'bg-sky-50 text-sky-900 border border-sky-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-500 hover:text-slate-900 text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {activeTab === 'booking' ? renderBooking() : renderManagement()}
    </div>
  );
}

export default CentreManagement;
