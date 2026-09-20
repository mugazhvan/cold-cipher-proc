import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFarmer } from '../../src/context/FarmerContext';
import {
  calculateHaversineDistance,
} from '../../src/utils/geoUtils';
import {
  Calendar,
  Clock,
  Truck,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Search,
} from 'lucide-react-native';

const SLOTS_WINDOWS = [
  { id: 'slot-1', range: '09:30 AM - 10:30 AM', capacity: 500, booked: 120, isRec: true },
  { id: 'slot-2', range: '11:00 AM - 12:30 PM', capacity: 500, booked: 280, isRec: true },
  { id: 'slot-3', range: '02:00 PM - 03:30 PM', capacity: 500, booked: 210, isRec: false },
  { id: 'slot-4', range: '04:00 PM - 05:30 PM', capacity: 500, booked: 90, isRec: false },
];

const CROP_CATEGORIES = [
  { key: 'ALL', label: 'All Crops' },
  { key: 'Cereals', label: '🌾 Cereals' },
  { key: 'Millets', label: '🥣 Shree Anna' },
  { key: 'Pulses', label: '🫘 Pulses (Dal)' },
  { key: 'Oilseeds', label: '🌼 Oilseeds' },
  { key: 'Commercial', label: '☁️ Commercial' },
  { key: 'Spices', label: '🌶️ Spices' },
  { key: 'Vegetables', label: '🥔 Vegetables' },
] as const;

export default function BookSlotScreen() {
  const router = useRouter();
  const {
    crops,
    centres,
    userLocation,
    selectedCentreForBooking,
    setSelectedCentreForBooking,
    activeVehicleType,
    bookSlot,
  } = useFarmer();

  const [selectedCropId, setSelectedCropId] = useState(crops[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cropSearch, setCropSearch] = useState<string>('');
  const [estimatedQuintals, setEstimatedQuintals] = useState<number>(45);
  const [vehicleType, setVehicleType] = useState<string>(activeVehicleType);
  const [vehicleNumber, setVehicleNumber] = useState<string>('PB-10-DF-4819');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    selectedCentreForBooking ||
      centres.find((c) => c.isAiRecommended)?.id ||
      centres[0].id
  );

  // Filter crops by category and search keyword
  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      const matchesCat = selectedCategory === 'ALL' || crop.category === selectedCategory;
      const q = cropSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        crop.name.toLowerCase().includes(q) ||
        crop.hindiName.toLowerCase().includes(q) ||
        crop.punjabiName.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [crops, selectedCategory, cropSearch]);

  // Sync if pre-selected from Radar
  useEffect(() => {
    if (selectedCentreForBooking) {
      setSelectedCentreId(selectedCentreForBooking);
    }
  }, [selectedCentreForBooking]);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot-1');

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || crops[0];
  const selectedCentre = centres.find((c) => c.id === selectedCentreId) || centres[0];
  const selectedSlot = SLOTS_WINDOWS.find((s) => s.id === selectedSlotId) || SLOTS_WINDOWS[0];
  const estimatedPayout = Math.round(estimatedQuintals * selectedCrop.mspPerQuintal);
  const totalBags = estimatedQuintals * 2;

  const handleConfirmBooking = () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid transport vehicle number.');
      return;
    }

    const newTok = bookSlot({
      cropId: selectedCrop.id,
      estimatedQuintals,
      centreId: selectedCentre.id,
      slotDate: selectedDate,
      slotTime: selectedSlot.range,
      vehicleType,
      vehicleNumber,
    });

    // Clear radar pre-selection
    setSelectedCentreForBooking(null);

    Alert.alert(
      'e-Gate Pass Generated!',
      `Token ${newTok.tokenNumber} has been booked for ${selectedCentre.name}. Guaranteed weighbridge access window is reserved.`,
      [
        {
          text: 'View Gate Pass',
          onPress: () => router.push('/(tabs)/epass'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Procurement Slot</Text>
        <Text style={styles.headerSub}>
          Direct MSP Allocation • Zero Middleman Gate Pass
        </Text>
      </View>

      {/* STEP 1: CROP & QUANTITY */}
      <View style={styles.stepCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Crop & Produce Estimation</Text>
        </View>

        {/* Crop Search Bar */}
        <View style={styles.cropSearchRow}>
          <Search size={14} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.cropSearchInput}
            placeholder="Search 35+ crops (Wheat, Kanak, Sarson, Moong...)"
            placeholderTextColor="#64748B"
            value={cropSearch}
            onChangeText={setCropSearch}
          />
          {cropSearch.length > 0 && (
            <TouchableOpacity onPress={() => setCropSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.cropSearchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CROP_CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, isCatActive && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={[styles.catChipText, isCatActive && styles.catChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Horizontal Crop Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
          {filteredCrops.length === 0 ? (
            <View style={styles.noCropBox}>
              <Text style={styles.noCropText}>No matching crop found for "{cropSearch}".</Text>
            </View>
          ) : (
            filteredCrops.map((crop) => {
              const isSelected = crop.id === selectedCropId;
              return (
                <TouchableOpacity
                  key={crop.id}
                  style={[styles.cropCard, isSelected && styles.cropCardActive]}
                  onPress={() => setSelectedCropId(crop.id)}
                >
                  <Text style={styles.cropIcon}>{crop.icon}</Text>
                  <Text style={[styles.cropName, isSelected && styles.cropNameActive]} numberOfLines={2}>
                    {crop.name}
                  </Text>
                  <Text style={styles.cropVernacular} numberOfLines={1}>
                    {crop.hindiName}
                  </Text>
                  <Text style={styles.cropMsp}>₹{crop.mspPerQuintal}/qtl</Text>
                  <Text style={styles.cropMoisture}>Max {crop.maxMoisturePct}% H₂O</Text>
                  {isSelected && (
                    <View style={styles.cropCheckDot}>
                      <CheckCircle2 size={12} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Selected Crop Spotlight Banner */}
        <View style={styles.selectedCropBanner}>
          <Text style={styles.selectedCropBannerIcon}>{selectedCrop.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedCropBannerTitle}>
              {selectedCrop.name}
            </Text>
            <Text style={styles.selectedCropBannerSub}>
              {selectedCrop.hindiName} • {selectedCrop.punjabiName} | MSP ₹{selectedCrop.mspPerQuintal}/qtl | Max {selectedCrop.maxMoisturePct}% H₂O
            </Text>
          </View>
        </View>

        {/* Quantity Input & Stepper */}
        <View style={styles.quantityBox}>
          <View style={styles.quantityHeader}>
            <Text style={styles.quantityLabel}>Estimated Yield (Quintals):</Text>
            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              value={String(estimatedQuintals)}
              onChangeText={(val) => setEstimatedQuintals(Number(val) || 5)}
              maxLength={4}
            />
          </View>

          {/* Quick Adjustment Chips */}
          <View style={styles.quickQtlRow}>
            {[20, 45, 80, 120].map((qtl) => (
              <TouchableOpacity
                key={qtl}
                style={[
                  styles.qtlChip,
                  estimatedQuintals === qtl && styles.qtlChipActive,
                ]}
                onPress={() => setEstimatedQuintals(qtl)}
              >
                <Text
                  style={[
                    styles.qtlChipText,
                    estimatedQuintals === qtl && styles.qtlChipTextActive,
                  ]}
                >
                  {qtl} Qtl
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bagStatsRow}>
            <Text style={styles.bagStatText}>
              Standard 50kg Bags: <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{totalBags} Bags</Text>
            </Text>
            <Text style={styles.bagStatText}>
              Gross Weight: <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{(estimatedQuintals * 0.1).toFixed(1)} Tonnes</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* STEP 2: TRANSPORT REGISTRATION */}
      <View style={styles.stepCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepTitle}>Transport & Vehicle Details</Text>
        </View>

        {/* Vehicle Selection Chips */}
        <View style={styles.vehicleRow}>
          {(['Tractor Trolley', 'Mini Truck', 'Bullock Cart'] as const).map(
            (v) => {
              const isSelected = vehicleType === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[styles.vChip, isSelected && styles.vChipActive]}
                  onPress={() => setVehicleType(v)}
                >
                  <Truck size={13} color={isSelected ? '#064E3B' : '#64748B'} />
                  <Text style={[styles.vChipText, isSelected && styles.vChipTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* License Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>VEHICLE LICENSE / REGISTRATION NUMBER</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. PB-10-DF-4819"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />
        </View>
      </View>

      {/* STEP 3: PROCUREMENT CENTRE */}
      <View style={styles.stepCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepTitle}>Select Mandi Centre</Text>
        </View>

        {centres.map((centre) => {
          const isSelected = centre.id === selectedCentreId;
          const liveDistance = calculateHaversineDistance(
            userLocation.latitude,
            userLocation.longitude,
            centre.latitude,
            centre.longitude
          );

          return (
            <TouchableOpacity
              key={centre.id}
              style={[styles.centreCard, isSelected && styles.centreCardActive]}
              onPress={() => setSelectedCentreId(centre.id)}
            >
              <View style={styles.centreTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.centreTitleRow}>
                    <Text style={styles.centreName}>{centre.name}</Text>
                    {centre.isAiRecommended && (
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI Pick</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.centreDist}>
                    Distance: <Text style={{ color: '#34D399', fontWeight: '800' }}>{liveDistance} km</Text> • Wait: ~{centre.avgWaitMinutes}m
                  </Text>
                </View>

                {isSelected && (
                  <View style={styles.selectedCircle}>
                    <CheckCircle2 size={16} color="#10B981" />
                  </View>
                )}
              </View>

              {centre.recommendedReason && isSelected && (
                <Text style={styles.recReason}>⚡ {centre.recommendedReason}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* STEP 4: DATE & TIME WINDOW */}
      <View style={styles.stepCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <Text style={styles.stepTitle}>Arrival Date & Time Window</Text>
        </View>

        {/* Date Selector Chips */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateChip, selectedDate === todayStr && styles.dateChipActive]}
            onPress={() => setSelectedDate(todayStr)}
          >
            <Text style={[styles.dateChipText, selectedDate === todayStr && styles.dateChipTextActive]}>
              Today ({todayStr.slice(5)})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateChip, selectedDate === tomorrowStr && styles.dateChipActive]}
            onPress={() => setSelectedDate(tomorrowStr)}
          >
            <Text style={[styles.dateChipText, selectedDate === tomorrowStr && styles.dateChipTextActive]}>
              Tomorrow ({tomorrowStr.slice(5)})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Slot Window Cards */}
        <View style={styles.slotGrid}>
          {SLOTS_WINDOWS.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotCard, isSelected && styles.slotCardActive]}
                onPress={() => setSelectedSlotId(slot.id)}
              >
                <View style={styles.slotCardHeader}>
                  <Clock size={13} color={isSelected ? '#34D399' : '#94A3B8'} />
                  <Text style={[styles.slotTime, isSelected && styles.slotTimeActive]}>
                    {slot.range}
                  </Text>
                </View>
                <Text style={styles.slotCap}>
                  {slot.capacity - slot.booked} spots open
                </Text>
                {slot.isRec && (
                  <View style={styles.lowTrafficPill}>
                    <Text style={styles.lowTrafficText}>Low Congestion</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Guaranteed MSP Payout Banner & Submit Button */}
      <View style={styles.payoutCard}>
        <View style={styles.payoutHeader}>
          <Text style={styles.payoutLabel}>ESTIMATED GUARANTEED MSP PAYOUT</Text>
          <Text style={styles.payoutValue}>₹{estimatedPayout.toLocaleString('en-IN')}</Text>
          <Text style={styles.payoutSub}>
            Direct credit to Aadhaar-linked Bank Account upon weighbridge exit.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleConfirmBooking}
        >
          <ShieldCheck size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Generate Official e-Gate Pass</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  stepCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cropSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  cropSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 2,
  },
  cropSearchClear: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  catChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#34D399',
    fontWeight: '800',
  },
  cropScroll: {
    marginBottom: 10,
  },
  cropCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    width: 125,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    position: 'relative',
  },
  cropCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cropIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  cropName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  cropNameActive: {
    color: '#34D399',
  },
  cropMsp: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCD34D',
    marginTop: 3,
  },
  cropMoisture: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  cropVernacular: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  cropCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  noCropBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
  },
  noCropText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  selectedCropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 10,
  },
  selectedCropBannerIcon: {
    fontSize: 22,
  },
  selectedCropBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  selectedCropBannerSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  quantityBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  quantityInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
    fontFamily: 'monospace',
    width: 80,
    textAlign: 'center',
  },
  quickQtlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  qtlChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  qtlChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  qtlChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  qtlChipTextActive: {
    color: '#34D399',
    fontWeight: '800',
  },
  bagStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  bagStatText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  vChipActive: {
    backgroundColor: '#A7F3D0',
    borderColor: '#10B981',
  },
  vChipText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vChipTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },
  inputGroup: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  centreCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  centreCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  centreTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centreTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centreName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#78350F',
  },
  centreDist: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  selectedCircle: {
    marginLeft: 8,
  },
  recReason: {
    fontSize: 10,
    color: '#34D399',
    marginTop: 6,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '48.5%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  slotCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  slotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  slotTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  slotTimeActive: {
    color: '#34D399',
  },
  slotCap: {
    fontSize: 9,
    color: '#64748B',
  },
  lowTrafficPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  lowTrafficText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#34D399',
  },
  payoutCard: {
    backgroundColor: '#0F251E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 20,
  },
  payoutHeader: {
    marginBottom: 14,
  },
  payoutLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  payoutValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#34D399',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  payoutSub: {
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
