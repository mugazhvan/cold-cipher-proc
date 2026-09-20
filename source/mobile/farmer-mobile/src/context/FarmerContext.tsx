import React, { createContext, useContext, useState } from 'react';
import { GeoLocationCoords, PUNJAB_FARM_HUBS } from '../utils/geoUtils';

export interface MobileFarmerProfile {
  id: string;
  name: string;
  punjabiName: string;
  hindiName: string;
  phone: string;
  farmerId: string;
  village: string;
  district: string;
  state: string;
  landAcres: number;
  bankName: string;
  bankAccountMasked: string;
  ifscCode: string;
}

export interface MobileCrop {
  id: string;
  name: string;
  hindiName: string;
  punjabiName: string;
  mspPerQuintal: number;
  maxMoisturePct: number;
  icon: string;
}

export interface MobileCentre {
  id: string;
  name: string;
  punjabiName: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  activeBays: number;
  currentQueueCount: number;
  yardCapacityPercent: number;
  avgWaitMinutes: number;
  isAiRecommended?: boolean;
  recommendedReason?: string;
}

export interface MobileToken {
  id: string;
  tokenNumber: string;
  farmerId: string;
  centreId: string;
  centreName: string;
  cropId: string;
  cropName: string;
  estimatedQuintals: number;
  totalBags: number;
  vehicleType: string;
  vehicleNumber: string;
  slotDate: string;
  slotTime: string;
  status: 'BOOKED' | 'ARRIVED' | 'WEIGHBRIDGE_IN' | 'QUALITY_CHECK' | 'COMPLETED';
  queuePosition: number;
  estimatedWaitMins: number;
  securityHash: string;
  grossWeightKg?: number;
  tareWeightKg?: number;
  netWeightKg?: number;
  moisturePercent?: number;
  dockagePercent?: number;
  payoutAmount?: number;
  jFormNumber?: string;
  createdAt: string;
}

interface BookSlotInput {
  cropId: string;
  estimatedQuintals: number;
  centreId: string;
  slotDate: string;
  slotTime: string;
  vehicleType: string;
  vehicleNumber: string;
}

interface FarmerContextType {
  farmer: MobileFarmerProfile;
  crops: MobileCrop[];
  centres: MobileCentre[];
  tokens: MobileToken[];
  activeToken: MobileToken | null;
  userLocation: GeoLocationCoords;
  setUserLocation: (loc: GeoLocationCoords) => void;
  selectedCentreForBooking: string | null;
  setSelectedCentreForBooking: (id: string | null) => void;
  activeVehicleType: string;
  setActiveVehicleType: (v: string) => void;
  bookSlot: (input: BookSlotInput) => MobileToken;
  advanceTokenStage: (tokenId: string) => void;
}

const INITIAL_FARMER: MobileFarmerProfile = {
  id: 'farmer-msd-07',
  name: 'Mahendra Singh Dhoni',
  punjabiName: 'ਮਹਿੰਦਰ ਸਿੰਘ ਧੋਨੀ',
  hindiName: 'महेंद्र सिंह धोनी',
  phone: '+91 98765 43210',
  farmerId: 'PB-SAM-2026-9042',
  village: 'Samrala Agri Farm Belt (Registered)',
  district: 'Ludhiana',
  state: 'Punjab',
  landAcres: 12.5,
  bankName: 'State Bank of India',
  bankAccountMasked: '•••• •••• 4821',
  ifscCode: 'SBIN0001234',
};

const INITIAL_CROPS: MobileCrop[] = [
  {
    id: 'crop-wheat',
    name: 'Wheat (Sharbati / PBW-725)',
    hindiName: 'गेहूं (शरबती)',
    punjabiName: 'ਕਣਕ (ਸ਼ਰਬਤੀ)',
    mspPerQuintal: 2275,
    maxMoisturePct: 12.0,
    icon: '🌾',
  },
  {
    id: 'crop-paddy',
    name: 'Paddy / Basmati (PB-1121)',
    hindiName: 'धान (बासमती)',
    punjabiName: 'ਝੋਨਾ (ਬਾਸਮਤੀ)',
    mspPerQuintal: 2203,
    maxMoisturePct: 17.0,
    icon: '🍚',
  },
  {
    id: 'crop-mustard',
    name: 'Mustard (Giriraj / Pusa-31)',
    hindiName: 'सरसों',
    punjabiName: 'ਸਰ੍ਹੋਂ',
    mspPerQuintal: 5650,
    maxMoisturePct: 8.0,
    icon: '🌻',
  },
  {
    id: 'crop-maize',
    name: 'Yellow Maize (K-65)',
    hindiName: 'मक्का',
    punjabiName: 'ਮੱਕੀ',
    mspPerQuintal: 2090,
    maxMoisturePct: 14.0,
    icon: '🌽',
  },
  {
    id: 'crop-moong',
    name: 'Moong Dal (Green Gram)',
    hindiName: 'मूंग दाल',
    punjabiName: 'ਮੂੰਗ ਦਾਲ',
    mspPerQuintal: 8558,
    maxMoisturePct: 12.0,
    icon: '🌱',
  },
];

const INITIAL_CENTRES: MobileCentre[] = [
  {
    id: 'centre-doraha',
    name: 'Doraha Sub-Yard',
    punjabiName: 'ਦੋਰਾਹਾ ਸਬ-ਯਾਰਡ',
    address: 'Grand Trunk Rd, Doraha, Punjab 141421',
    latitude: 30.8052,
    longitude: 76.0354,
    distanceKm: 3.8,
    activeBays: 4,
    currentQueueCount: 6,
    yardCapacityPercent: 34,
    avgWaitMinutes: 12,
    isAiRecommended: true,
    recommendedReason: 'Fastest turnaround: 4 weighbridges active with low traffic buildup',
  },
  {
    id: 'centre-samrala',
    name: 'Samrala Market Yard',
    punjabiName: 'ਸਮਰਾਲਾ ਮਾਰਕੀਟ ਯਾਰਡ',
    address: 'Near Old Bus Stand, Samrala, Punjab 141114',
    latitude: 30.8359,
    longitude: 76.1914,
    distanceKm: 5.2,
    activeBays: 6,
    currentQueueCount: 18,
    yardCapacityPercent: 72,
    avgWaitMinutes: 25,
    isAiRecommended: false,
    recommendedReason: 'Direct rail-siding clearance with high intake speed',
  },
  {
    id: 'centre-sahnewal',
    name: 'Sahnewal Agro Hub',
    punjabiName: 'ਸਾਹਨੇਵਾਲ ਐਗਰੋ ਹੱਬ',
    address: 'Airport Road, Sahnewal, Punjab 141120',
    latitude: 30.8444,
    longitude: 75.9806,
    distanceKm: 9.6,
    activeBays: 4,
    currentQueueCount: 14,
    yardCapacityPercent: 62,
    avgWaitMinutes: 40,
    isAiRecommended: false,
    recommendedReason: 'Extended evening unloading hours till 8 PM',
  },
  {
    id: 'centre-khanna',
    name: 'Khanna Grain Market (Asia’s Largest)',
    punjabiName: 'ਖੰਨਾ ਅਨਾਜ ਮੰਡੀ',
    address: 'GT Road Mandi Complex, Khanna, Punjab 141401',
    latitude: 30.7068,
    longitude: 76.2205,
    distanceKm: 14.8,
    activeBays: 8,
    currentQueueCount: 42,
    yardCapacityPercent: 88,
    avgWaitMinutes: 65,
    isAiRecommended: false,
    recommendedReason: 'High volume terminal yard with 8 computerized weighbridges',
  },
  {
    id: 'centre-ludhiana',
    name: 'Ludhiana Central Nodal Mandi',
    punjabiName: 'ਲੁਧਿਆਣਾ ਕੇਂਦਰੀ ਨੋਡਲ ਮੰਡੀ',
    address: 'Ferozepur Rd, Ludhiana, Punjab 141001',
    latitude: 30.901,
    longitude: 75.8573,
    distanceKm: 28.5,
    activeBays: 10,
    currentQueueCount: 38,
    yardCapacityPercent: 79,
    avgWaitMinutes: 55,
    isAiRecommended: false,
    recommendedReason: 'Mega FCI warehouse node for bulk train loading',
  },
];

const INITIAL_TOKENS: MobileToken[] = [
  {
    id: 'tok-live-01',
    tokenNumber: 'KF-PB-8492',
    farmerId: 'farmer-msd-07',
    centreId: 'centre-doraha',
    centreName: 'Doraha Sub-Yard',
    cropId: 'crop-wheat',
    cropName: 'Wheat (Sharbati / PBW-725)',
    estimatedQuintals: 45,
    totalBags: 90,
    vehicleType: 'Tractor Trolley',
    vehicleNumber: 'PB-10-DF-4819',
    slotDate: new Date().toISOString().split('T')[0],
    slotTime: '09:30 AM - 10:30 AM',
    status: 'ARRIVED',
    queuePosition: 3,
    estimatedWaitMins: 12,
    securityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    grossWeightKg: 8520,
    tareWeightKg: 4020,
    netWeightKg: 4500,
    moisturePercent: 11.4,
    dockagePercent: 0.0,
    payoutAmount: 102375,
    jFormNumber: 'J-FORM-2026-PB-8492',
    createdAt: new Date().toISOString(),
  },
];

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export const FarmerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [farmer] = useState<MobileFarmerProfile>(INITIAL_FARMER);
  const [crops] = useState<MobileCrop[]>(INITIAL_CROPS);
  const [centres] = useState<MobileCentre[]>(INITIAL_CENTRES);
  const [tokens, setTokens] = useState<MobileToken[]>(INITIAL_TOKENS);
  const [userLocation, setUserLocation] = useState<GeoLocationCoords>({
    latitude: PUNJAB_FARM_HUBS[0].latitude,
    longitude: PUNJAB_FARM_HUBS[0].longitude,
    source: 'REGISTERED_VILLAGE',
    locationName: PUNJAB_FARM_HUBS[0].name,
  });
  const [selectedCentreForBooking, setSelectedCentreForBooking] = useState<string | null>(null);
  const [activeVehicleType, setActiveVehicleType] = useState<string>('Tractor Trolley');

  const activeToken =
    tokens.find((t) => t.status !== 'COMPLETED') || tokens[0] || null;

  const bookSlot = (input: BookSlotInput): MobileToken => {
    const centre = centres.find((c) => c.id === input.centreId) || centres[0];
    const crop = crops.find((c) => c.id === input.cropId) || crops[0];
    const tokenNum = `KF-PB-${Math.floor(1000 + Math.random() * 9000)}`;
    const payout = Math.round(input.estimatedQuintals * crop.mspPerQuintal);

    const newToken: MobileToken = {
      id: `tok-${Date.now()}`,
      tokenNumber: tokenNum,
      farmerId: farmer.id,
      centreId: centre.id,
      centreName: centre.name,
      cropId: crop.id,
      cropName: crop.name,
      estimatedQuintals: input.estimatedQuintals,
      totalBags: input.estimatedQuintals * 2,
      vehicleType: input.vehicleType,
      vehicleNumber: input.vehicleNumber.toUpperCase(),
      slotDate: input.slotDate,
      slotTime: input.slotTime,
      status: 'BOOKED',
      queuePosition: centre.currentQueueCount + 1,
      estimatedWaitMins: centre.avgWaitMinutes,
      securityHash: Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      payoutAmount: payout,
      createdAt: new Date().toISOString(),
    };

    setTokens((prev) => [newToken, ...prev]);
    return newToken;
  };

  const advanceTokenStage = (tokenId: string) => {
    setTokens((prev) =>
      prev.map((tok) => {
        if (tok.id !== tokenId) return tok;
        const stages: MobileToken['status'][] = [
          'BOOKED',
          'ARRIVED',
          'WEIGHBRIDGE_IN',
          'QUALITY_CHECK',
          'COMPLETED',
        ];
        const nextIdx = Math.min(stages.indexOf(tok.status) + 1, stages.length - 1);
        const nextStatus = stages[nextIdx];
        return {
          ...tok,
          status: nextStatus,
          jFormNumber:
            nextStatus === 'COMPLETED'
              ? `J-FORM-2026-${tok.tokenNumber}`
              : tok.jFormNumber,
        };
      })
    );
  };

  return (
    <FarmerContext.Provider
      value={{
        farmer,
        crops,
        centres,
        tokens,
        activeToken,
        userLocation,
        setUserLocation,
        selectedCentreForBooking,
        setSelectedCentreForBooking,
        activeVehicleType,
        setActiveVehicleType,
        bookSlot,
        advanceTokenStage,
      }}
    >
      {children}
    </FarmerContext.Provider>
  );
};

export const useFarmer = () => {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
};
