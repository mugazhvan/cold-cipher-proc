export type Language = 'en' | 'hi' | 'pa';

export type UserRole = 'farmer' | 'operator' | 'analytics';

export type TokenStatus =
  | 'BOOKED'
  | 'GATE_VERIFIED'
  | 'YARD_QUEUED'
  | 'WEIGHBRIDGE_IN'
  | 'QUALITY_INSPECTION'
  | 'UNLOADING'
  | 'WEIGHBRIDGE_OUT'
  | 'COMPLETED'
  | 'REJECTED';

export type NotificationType =
  | 'QUEUE_UPDATE'
  | 'BAY_CALL'
  | 'QUALITY_CLEARED'
  | 'QUALITY_REJECTED'
  | 'PAYMENT_SETTLED'
  | 'WEATHER_ALERT'
  | 'SYSTEM_BROADCAST';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetRole: 'farmer' | 'operator' | 'all';
  tokenId?: string;
  tokenNumber?: string;
  centreId?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface FarmerProfile {
  id: string;
  name: string;
  hindiName?: string;
  punjabiName?: string;
  phone: string;
  aadhaarMasked: string;
  farmerId: string;
  state: string;
  district: string;
  village: string;
  landAcres: number;
  bankAccountMasked: string;
  bankName: string;
  ifsc: string;
}

export interface CropInfo {
  id: string;
  name: string;
  hindiName: string;
  punjabiName: string;
  category: 'Rabi' | 'Kharif' | 'Zaid' | 'Commercial' | 'Spices' | 'Horticulture';
  mspPerQuintal: number;
  maxMoisturePct: number;
  standardBagWeightKg: number;
  icon: string;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm: number;
  transitMinutes?: number;
  googleMapsUrl?: string;
  currentQueueCount: number;
  avgWaitMinutes: number;
  yardCapacityPercent: number;
  activeBays: number;
  status: 'OPEN' | 'CONGESTED' | 'MAINTENANCE';
  weatherCondition: string;
  rainRiskPercent: number;
  recommendedReason?: string;
  isAiRecommended?: boolean;
}

export interface QualityReport {
  moisturePct: number;
  foreignMatterPct: number;
  brokenGrainPct: number;
  grade: 'FAQ_GRADE_A' | 'GRADE_B' | 'SUB_STANDARD';
  deductionsAppliedRs: number;
  inspectorName: string;
  inspectedAt: string;
  passed: boolean;
  notes: string;
}

export interface PaymentDetails {
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightQuintals: number;
  mspRatePerQuintal: number;
  grossAmountRs: number;
  qualityDeductionsRs: number;
  mandiFeesRs: number;
  netPayableRs: number;
  utrNumber: string;
  paymentStatus: 'PAID_TO_BANK' | 'PROCESSING' | 'PENDING';
  paidAt?: string;
  jFormNumber: string;
}

export interface SmsAlert {
  id: string;
  timestamp: string;
  text: string;
  type: 'BOOKING' | 'GATE_ENTRY' | 'BAY_CALL' | 'PAYMENT' | 'WEATHER';
}

export interface TokenRecord {
  id: string;
  tokenNumber: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  cropId: string;
  cropName: string;
  estimatedQuintals: number;
  centreId: string;
  centreName: string;
  slotDate: string;
  slotTime: string;
  vehicleType: 'Tractor Trolley' | 'Mini Truck' | 'Bullock Cart';
  vehicleNumber: string;
  status: TokenStatus;
  assignedBay?: string;
  qualityReport?: QualityReport;
  paymentDetails?: PaymentDetails;
  smsAlerts: SmsAlert[];
  createdAt: string;
  updatedAt: string;
  qrCodeValue: string;
}
