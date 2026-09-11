import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Calendar, Package, Settings, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { searchFarmers, getCrops, getCentreSlots, createManualBooking, updateSlotCapacity } from '../../services/api';
interface CentreManagementProps {
  centreId: string;
}

export function CentreManagement({ centreId }: CentreManagementProps) {
  const [activeTab, setActiveTab] = useState<'booking' | 'management'>('booking');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);
  
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    if (date) {
      fetchSlots();
    }
  }, [date, centreId]);

  const fetchCrops = async () => {
    const res = await getCrops();
    if (res?.success) {
      setCrops(res.data);
    }
  };

  const fetchSlots = async () => {
    const res = await getCentreSlots(centreId, date);
    if (res?.success) {
      setSlots(res.data);
    }
  };

  const handleSearch = async () => {
    if (phoneQuery.length < 3) return;
    setLoading(true);
    const res = await searchFarmers(phoneQuery);
    if (res?.success) {
      setFarmers(res.data);
      if (res.data.length === 0) {
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
      quantity: parseFloat(quantity)
    };

    const res = await createManualBooking(centreId, selectedFarmer.id, payload);
    if (res?.success) {
      setMessage({ type: 'success', text: `Booking successful! Token # ${res.data.booking_reference || res.data.id?.substring(0,8) || ''}` });
      // Reset form
      setSelectedFarmer(null);
      setPhoneQuery('');
      setFarmers([]);
      setQuantity('');
      setSelectedSlot('');
      fetchSlots(); // Refresh slots
    } else {
      setMessage({ type: 'error', text: res?.message || 'Booking failed.' });
    }
    setLoading(false);
  };

  const handleUpdateSlot = async (slotId: string, newCapacity: number, isActive: boolean) => {
    setLoading(true);
    const payload = {
      max_capacity: newCapacity,
      is_active: isActive
    };
    const res = await updateSlotCapacity(slotId, payload);
    if (res?.success) {
      setMessage({ type: 'success', text: 'Slot updated successfully.' });
      fetchSlots();
    } else {
      setMessage({ type: 'error', text: res?.message || 'Failed to update slot.' });
    }
    setLoading(false);
  };

  const renderBooking = () => (
    <>
      {/* 1. Search Farmer */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-3 text-zinc-300">1. Select Farmer</h3>
        <div className="flex space-x-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by phone number..." 
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading || phoneQuery.length < 3}
            className="bg-sky-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-sky-500 transition shadow-xs disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {farmers.length > 0 && !selectedFarmer && (
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-medium">
                {farmers.map((farmer: any) => (
                  <tr key={farmer.id} className="hover:bg-zinc-800/60 transition">
                    <td className="px-4 py-3 text-white font-bold">{farmer.user?.full_name || 'N/A'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-300">{farmer.user?.phone_number || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedFarmer(farmer)}
                        className="text-sky-400 hover:text-sky-300 font-bold"
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
          <div className="bg-emerald-950/40 p-4 rounded-xl flex justify-between items-center border border-emerald-500/30">
            <div>
              <p className="font-bold text-white text-sm">{selectedFarmer.user?.full_name}</p>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">{selectedFarmer.user?.phone_number}</p>
            </div>
            <button 
              onClick={() => setSelectedFarmer(null)}
              className="text-zinc-400 hover:text-white text-xs font-medium"
            >
              Change Farmer
            </button>
          </div>
        )}
      </div>

      {/* 2. Crop Details */}
      {selectedFarmer && (
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-zinc-300 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            2. Crop & Quantity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Crop</label>
              <select 
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select Crop</option>
                {crops.map((crop: any) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Estimated Quantity (Quintals)</label>
              <input 
                type="number" 
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full p-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Slot Selection */}
      {selectedFarmer && selectedCrop && quantity && (
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-3 text-zinc-300 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            3. Select Slot
          </h3>
          <div className="mb-4">
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">Date</label>
            <input 
              type="date" 
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="p-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.filter(s => s.is_active && s.current_capacity < s.max_capacity).length === 0 ? (
              <p className="col-span-full text-zinc-500 text-xs">No available slots for this date.</p>
            ) : (
              slots.map((slot: any) => {
                const isAvailable = slot.is_active && slot.current_capacity < slot.max_capacity;
                if (!isAvailable) return null;
                
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      selectedSlot === slot.id 
                        ? 'border-sky-500 bg-sky-950/40 text-sky-400' 
                        : 'border-zinc-700/80 hover:border-zinc-500 text-zinc-300 bg-zinc-950/60'
                    }`}
                  >
                    <div className="font-bold text-sm font-mono">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</div>
                    <div className="text-[10px] mt-1 text-zinc-500">
                      {slot.max_capacity - slot.current_capacity} slots left
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      {selectedFarmer && selectedCrop && quantity && selectedSlot && (
        <div className="pt-4 border-t border-zinc-800">
          <button 
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-extrabold transition shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            {loading ? 'Processing...' : 'Confirm Manual Booking'}
          </button>
        </div>
      )}
    </>
  );

  const renderManagement = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-300 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Manage Slots
        </h3>
        <div>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-1.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs font-medium text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-950/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Crop</th>
              <th className="px-4 py-3">Booked / Max</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 font-medium">
            {slots.length === 0 ? (
               <tr><td colSpan={5} className="px-4 py-3 text-center text-zinc-500">No slots found for this date</td></tr>
            ) : slots.map((slot: any) => {
              const isFull = slot.current_capacity >= slot.max_capacity;
              return (
                <tr key={slot.id} className="hover:bg-zinc-800/60 transition">
                  <td className="px-4 py-3 font-mono text-white">
                    {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{slot.crop?.name || 'All'}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    <span className={isFull ? 'text-rose-400 font-bold' : ''}>{slot.current_capacity}</span> / {slot.max_capacity}
                  </td>
                  <td className="px-4 py-3">
                    {!slot.is_active ? (
                      <span className="text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px] border border-rose-800/50">Closed</span>
                    ) : isFull ? (
                      <span className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full text-[10px] border border-amber-800/50">Full</span>
                    ) : (
                      <span className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-800/50">Open</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => {
                          const val = prompt('Enter new capacity:', slot.max_capacity);
                          if (val !== null && !isNaN(parseInt(val))) {
                            handleUpdateSlot(slot.id, parseInt(val), slot.is_active);
                          }
                        }}
                        disabled={loading}
                        className="text-sky-400 hover:text-sky-300 bg-sky-950/50 p-1.5 rounded-md border border-sky-800/50 disabled:opacity-50 cursor-pointer"
                        title="Edit Capacity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to ${slot.is_active ? 'close' : 'open'} this slot?`)) {
                            handleUpdateSlot(slot.id, slot.max_capacity, !slot.is_active);
                          }
                        }}
                        disabled={loading}
                        className={`${slot.is_active ? 'text-rose-400 hover:text-rose-300 bg-rose-950/50 border-rose-800/50' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 border-emerald-800/50'} p-1.5 rounded-md border disabled:opacity-50 cursor-pointer`}
                        title={slot.is_active ? "Close Slot" : "Open Slot"}
                      >
                        {slot.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

    <div className="bg-zinc-900/95 rounded-2xl border border-zinc-800 shadow-2xl p-6 text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-extrabold flex items-center text-white">
          <Settings className="w-5 h-5 mr-2 text-sky-400" />
          Centre Operations
        </h2>
        <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'booking' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Walk-in Booking
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'management' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Slot Management
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50' : 'bg-rose-950/80 text-rose-300 border border-rose-600/50'}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'booking' ? renderBooking() : renderManagement()}
    </div>
  );
}

