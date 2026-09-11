import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppNotification,
  CropInfo,
  FarmerProfile,
  Language,
  NotificationPriority,
  NotificationType,
  PaymentDetails,
  ProcurementCentre,
  QualityReport,
  TokenRecord,
  TokenStatus,
  UserRole,
} from '../types';
import { CROPS_CATALOG, INITIAL_CENTRES, INITIAL_TOKENS, MOCK_FARMER } from '../mockData';
import { INITIAL_NOTIFICATIONS } from '../mockNotifications';

interface KisanFlowContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  farmer: FarmerProfile;
  crops: CropInfo[];
  centres: ProcurementCentre[];
  tokens: TokenRecord[];
  activeToken: TokenRecord | null;
  setActiveTokenId: (id: string) => void;
  bookSlot: (bookingData: {
    cropId: string;
    estimatedQuintals: number;
    centreId: string;
    slotDate: string;
    slotTime: string;
    vehicleType: 'Tractor Trolley' | 'Mini Truck' | 'Bullock Cart';
    vehicleNumber: string;
  }) => TokenRecord;
  updateTokenStatus: (tokenId: string, status: TokenStatus, assignedBay?: string) => void;
  callTokenToBay: (tokenId: string, bayName: string) => void;
  submitQualityInspection: (tokenId: string, report: Omit<QualityReport, 'inspectedAt'>) => void;
  completeWeighbridgeAndPayout: (
    tokenId: string,
    grossWeightKg: number,
    tareWeightKg: number
  ) => void;
  // Notification Management Service API
  notifications: AppNotification[];
  unreadNotificationCount: number;
  addNotification: (notification: {
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    targetRole?: 'farmer' | 'operator' | 'all';
    tokenId?: string;
    tokenNumber?: string;
    centreId?: string;
    actionUrl?: string;
  }) => AppNotification;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  resetDemoData: () => void;
  simulationStep: number;
  runNextSimulationStep: () => void;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

const KisanFlowContext = createContext<KisanFlowContextType | undefined>(undefined);

const STORAGE_KEY_TOKENS = 'kisanflow_tokens_v1';
const STORAGE_KEY_ROLE = 'kisanflow_role_v1';
const STORAGE_KEY_LANG = 'kisanflow_lang_v1';
const STORAGE_KEY_AUTH = 'kisanflow_auth_v1';
const STORAGE_KEY_NOTIFS = 'kisanflow_notifs_v1';

export const KisanFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    return saved === 'true';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE);
    return (saved as UserRole) || 'farmer';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return (saved as Language) || 'en';
  });

  const [farmer] = useState<FarmerProfile>(MOCK_FARMER);
  const [crops] = useState<CropInfo[]>(CROPS_CATALOG);
  const [centres] = useState<ProcurementCentre[]>(INITIAL_CENTRES);

  const [tokens, setTokens] = useState<TokenRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TOKENS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tokens from storage', e);
      }
    }
    return INITIAL_TOKENS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notifications from storage', e);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [activeTokenId, setActiveTokenId] = useState<string>('token-01');

  // Simulation state
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY_ROLE, newRole);
  };

  const login = (newRole: UserRole) => {
    setRole(newRole);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY_AUTH, 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEY_AUTH, 'false');
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem(STORAGE_KEY_LANG, newLang);
  };

  const activeToken = tokens.find((t) => t.id === activeTokenId) || tokens[0] || null;

  // Notification Service Functions
  const addNotification = (notifData: {
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    targetRole?: 'farmer' | 'operator' | 'all';
    tokenId?: string;
    tokenNumber?: string;
    centreId?: string;
    actionUrl?: string;
  }): AppNotification => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: notifData.title,
      message: notifData.message,
      type: notifData.type,
      priority: notifData.priority || 'MEDIUM',
      targetRole: notifData.targetRole || 'all',
      tokenId: notifData.tokenId,
      tokenNumber: notifData.tokenNumber,
      centreId: notifData.centreId,
      actionUrl: notifData.actionUrl,
      timestamp: timeNow,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter(
    (n) => !n.read && (n.targetRole === 'all' || n.targetRole === role)
  ).length;

  const bookSlot = (bookingData: {
    cropId: string;
    estimatedQuintals: number;
    centreId: string;
    slotDate: string;
    slotTime: string;
    vehicleType: 'Tractor Trolley' | 'Mini Truck' | 'Bullock Cart';
    vehicleNumber: string;
  }): TokenRecord => {
    const crop = crops.find((c) => c.id === bookingData.cropId) || crops[0];
    const centre = centres.find((c) => c.id === bookingData.centreId) || centres[0];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const tokenNumber = `KF-2026-${randomNum}`;
    const id = `token-${Date.now()}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newToken: TokenRecord = {
      id,
      tokenNumber,
      farmerId: farmer.id,
      farmerName: farmer.name,
      phone: farmer.phone,
      village: farmer.village,
      cropId: crop.id,
      cropName: crop.name,
      estimatedQuintals: Number(bookingData.estimatedQuintals),
      centreId: centre.id,
      centreName: centre.name,
      slotDate: bookingData.slotDate,
      slotTime: bookingData.slotTime,
      vehicleType: bookingData.vehicleType,
      vehicleNumber: bookingData.vehicleNumber.toUpperCase(),
      status: 'BOOKED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      qrCodeValue: `KISANFLOW://TOKEN/${tokenNumber}/${bookingData.vehicleNumber}`,
      smsAlerts: [
        {
          id: `sms-${Date.now()}`,
          timestamp: timeNow,
          text: `KisanFlow: e-Gate Pass ${tokenNumber} confirmed for ${centre.name}. Slot: ${bookingData.slotTime}. Show QR at entry gate.`,
          type: 'BOOKING',
        },
      ],
    };

    setTokens((prev) => [newToken, ...prev]);
    setActiveTokenId(newToken.id);

    // Fetch secure signed QR payload from backend for Milestone 1
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const rawEnv = (import.meta as any).env?.VITE_API_BASE_URL;
    const backendUrl = isVercel
      ? (!rawEnv || rawEnv.includes('localhost') ? 'https://kisanflow-backend.onrender.com/api/v1' : rawEnv)
      : (rawEnv || 'http://localhost:8000/api/v1');
    fetch(`${backendUrl}/bookings/demo/generate-qr?booking_reference=${tokenNumber}&centre_id=${centre.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.qr_payload) {
          setTokens(prevTokens => prevTokens.map(tok => 
            tok.id === id ? { ...tok, qrCodeValue: data.data.qr_payload } : tok
          ));
        }
      })
      .catch(err => console.error("Failed to fetch signed QR payload:", err));

    // Trigger Notification Service
    addNotification({
      title: `Slot Booked: ${tokenNumber}`,
      message: `Your procurement slot for ${newToken.estimatedQuintals} Qtl ${crop.name} is confirmed at ${centre.name} (${bookingData.slotTime}).`,
      type: 'QUEUE_UPDATE',
      priority: 'MEDIUM',
      targetRole: 'farmer',
      tokenId: newToken.id,
      tokenNumber: newToken.tokenNumber,
      centreId: centre.id,
    });

    addNotification({
      title: `New Yard Arrival Scheduled`,
      message: `Vehicle ${newToken.vehicleNumber} (${newToken.farmerName}) scheduled for ${bookingData.slotTime}. Estimated ${newToken.estimatedQuintals} Qtl ${crop.name}.`,
      type: 'QUEUE_UPDATE',
      priority: 'LOW',
      targetRole: 'operator',
      tokenId: newToken.id,
      tokenNumber: newToken.tokenNumber,
      centreId: centre.id,
    });

    return newToken;
  };

  const updateTokenStatus = (tokenId: string, status: TokenStatus, assignedBay?: string) => {
    setTokens((prev) =>
      prev.map((tok) => {
        if (tok.id !== tokenId) return tok;
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updatedAlerts = [...tok.smsAlerts];

        if (status === 'GATE_VERIFIED') {
          updatedAlerts.push({
            id: `sms-${Date.now()}`,
            timestamp: timeNow,
            text: `KisanFlow: Gate 1 check completed. Vehicle ${tok.vehicleNumber} admitted to Holding Yard.`,
            type: 'GATE_ENTRY',
          });

          addNotification({
            title: `Gate Verification Complete`,
            message: `Vehicle ${tok.vehicleNumber} (Token #${tok.tokenNumber}) admitted to Mandi Holding Yard. Position in queue: 3.`,
            type: 'QUEUE_UPDATE',
            priority: 'HIGH',
            targetRole: 'all',
            tokenId: tok.id,
            tokenNumber: tok.tokenNumber,
            centreId: tok.centreId,
          });
        }

        return {
          ...tok,
          status,
          assignedBay: assignedBay || tok.assignedBay,
          updatedAt: new Date().toISOString(),
          smsAlerts: updatedAlerts,
        };
      })
    );
  };

  const callTokenToBay = (tokenId: string, bayName: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTokens((prev) =>
      prev.map((tok) => {
        if (tok.id !== tokenId) return tok;

        // Alert via Notification Service
        addNotification({
          title: `🚨 Summon to ${bayName}`,
          message: `Vehicle ${tok.vehicleNumber} (Token #${tok.tokenNumber}) please proceed to ${bayName} immediately for weighing.`,
          type: 'BAY_CALL',
          priority: 'HIGH',
          targetRole: 'farmer',
          tokenId: tok.id,
          tokenNumber: tok.tokenNumber,
          centreId: tok.centreId,
        });

        return {
          ...tok,
          status: 'WEIGHBRIDGE_IN',
          assignedBay: bayName,
          updatedAt: new Date().toISOString(),
          smsAlerts: [
            ...tok.smsAlerts,
            {
              id: `sms-${Date.now()}`,
              timestamp: timeNow,
              text: `🚨 URGENT: Token ${tok.tokenNumber} called to ${bayName}. Please proceed immediately with tractor ${tok.vehicleNumber}.`,
              type: 'BAY_CALL',
            },
          ],
        };
      })
    );
  };

  const submitQualityInspection = (
    tokenId: string,
    reportData: Omit<QualityReport, 'inspectedAt'>
  ) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullReport: QualityReport = {
      ...reportData,
      inspectedAt: timeNow,
    };

    setTokens((prev) =>
      prev.map((tok) => {
        if (tok.id !== tokenId) return tok;

        // Notification dispatch
        if (reportData.passed) {
          addNotification({
            title: `Quality Cleared (${reportData.grade})`,
            message: `Crop moisture is ${reportData.moisturePct}% (Govt standard <= 12%). Token #${tok.tokenNumber} cleared for godown unloading.`,
            type: 'QUALITY_CLEARED',
            priority: 'HIGH',
            targetRole: 'all',
            tokenId: tok.id,
            tokenNumber: tok.tokenNumber,
            centreId: tok.centreId,
          });
        } else {
          addNotification({
            title: `Quality Inspection Issue`,
            message: `Moisture ${reportData.moisturePct}% exceeds permissible limit. Trolley redirected to Mandi Solar Drying Yard.`,
            type: 'QUALITY_REJECTED',
            priority: 'HIGH',
            targetRole: 'all',
            tokenId: tok.id,
            tokenNumber: tok.tokenNumber,
            centreId: tok.centreId,
          });
        }

        return {
          ...tok,
          status: reportData.passed ? 'UNLOADING' : 'REJECTED',
          qualityReport: fullReport,
          updatedAt: new Date().toISOString(),
          smsAlerts: [
            ...tok.smsAlerts,
            {
              id: `sms-${Date.now()}`,
              timestamp: timeNow,
              text: reportData.passed
                ? `KisanFlow Lab: Crop sample PASSED (${reportData.grade}) with ${reportData.moisturePct}% moisture. Proceeding to Godown Unloading.`
                : `KisanFlow Lab: Moisture ${reportData.moisturePct}% exceeds permissible limit (max 12%). Trolley redirected to Mandi Solar Drying Yard.`,
              type: 'BAY_CALL',
            },
          ],
        };
      })
    );
  };

  const completeWeighbridgeAndPayout = (
    tokenId: string,
    grossWeightKg: number,
    tareWeightKg: number
  ) => {
    const netWeightKg = Math.max(0, grossWeightKg - tareWeightKg);
    const netWeightQuintals = parseFloat((netWeightKg / 100).toFixed(2));
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTokens((prev) =>
      prev.map((tok) => {
        if (tok.id !== tokenId) return tok;
        const crop = crops.find((c) => c.id === tok.cropId) || crops[0];
        const mspRate = crop.mspPerQuintal;
        const grossAmount = Math.round(netWeightQuintals * mspRate);
        const deductions = tok.qualityReport?.deductionsAppliedRs || 0;
        const netPayable = Math.max(0, grossAmount - deductions);
        const utrSuffix = Math.floor(10000000 + Math.random() * 90000000);
        const jFormNumber = `JF-PB-SAM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const payment: PaymentDetails = {
          grossWeightKg,
          tareWeightKg,
          netWeightQuintals,
          mspRatePerQuintal: mspRate,
          grossAmountRs: grossAmount,
          qualityDeductionsRs: deductions,
          mandiFeesRs: 0, // Govt exempted for farmers
          netPayableRs: netPayable,
          utrNumber: `SIM-DBT-20260905-${utrSuffix}`,
          paymentStatus: 'PAID_TO_BANK',
          paidAt: timeNow,
          jFormNumber,
        };

        // Notify Payment Success
        addNotification({
          title: `💰 Payment Disbursed: ₹${netPayable.toLocaleString('en-IN')}`,
          message: `Direct MSP payment for ${netWeightQuintals} Qtl ${crop.name} credited to ${farmer.bankAccountMasked} (UTR: ${payment.utrNumber}). J-Form #${jFormNumber} available.`,
          type: 'PAYMENT_SETTLED',
          priority: 'HIGH',
          targetRole: 'farmer',
          tokenId: tok.id,
          tokenNumber: tok.tokenNumber,
          centreId: tok.centreId,
        });

        addNotification({
          title: `Procurement Complete: ${tok.tokenNumber}`,
          message: `Weight: ${netWeightQuintals} Qtl, Net Value: ₹${netPayable.toLocaleString('en-IN')}. DBT ledger updated.`,
          type: 'PAYMENT_SETTLED',
          priority: 'MEDIUM',
          targetRole: 'operator',
          tokenId: tok.id,
          tokenNumber: tok.tokenNumber,
          centreId: tok.centreId,
        });

        return {
          ...tok,
          status: 'COMPLETED',
          paymentDetails: payment,
          updatedAt: new Date().toISOString(),
          smsAlerts: [
            ...tok.smsAlerts,
            {
              id: `sms-${Date.now()}`,
              timestamp: timeNow,
              text: `✅ PAYMENT SUCCESS: Digital J-Form #${jFormNumber} issued. MSP Payout of ₹${netPayable.toLocaleString(
                'en-IN'
              )} directly credited to ${farmer.bankAccountMasked} (UTR: ${payment.utrNumber}).`,
              type: 'PAYMENT',
            },
          ],
        };
      })
    );
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_TOKENS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    setTokens(INITIAL_TOKENS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTokenId(INITIAL_TOKENS[0].id);
    setSimulationStep(0);
    setIsSimulating(false);
  };

  // Automated Simulation Tour
  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    setRole('farmer');
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulationStep(0);
  };

  const runNextSimulationStep = () => {
    const next = simulationStep + 1;
    setSimulationStep(next);

    if (next === 1) {
      setRole('farmer');
    } else if (next === 2) {
      // Create fresh token
      const newTok = bookSlot({
        cropId: 'crop-wheat',
        estimatedQuintals: 48,
        centreId: 'centre-samrala',
        slotDate: '2026-09-05',
        slotTime: '11:00 AM - 12:00 PM',
        vehicleType: 'Tractor Trolley',
        vehicleNumber: 'PB-10-DF-4819',
      });
      setActiveTokenId(newTok.id);
    } else if (next === 3) {
      // Farmer arrives at gate, Operator verifies
      setRole('operator');
      updateTokenStatus(activeTokenId, 'GATE_VERIFIED');
    } else if (next === 4) {
      // Operator calls token to Weighbridge 2
      callTokenToBay(activeTokenId, 'Weighbridge Bay 2 (North)');
    } else if (next === 5) {
      // Quality inspection
      submitQualityInspection(activeTokenId, {
        moisturePct: 11.2,
        foreignMatterPct: 0.3,
        brokenGrainPct: 0.8,
        grade: 'FAQ_GRADE_A',
        deductionsAppliedRs: 0,
        inspectorName: 'Er. R. K. Sharma (QCO-IV)',
        passed: true,
        notes: 'Premium Fair Average Quality Wheat. Cleared for immediate silo elevator unloading.',
      });
    } else if (next === 6) {
      // Weighbridge completes & DBT fires
      completeWeighbridgeAndPayout(activeTokenId, 7920, 3120);
    } else if (next === 7) {
      // Return to farmer role to inspect digital J-form
      setRole('farmer');
    } else if (next >= 8) {
      setIsSimulating(false);
      setSimulationStep(0);
    }
  };

  return (
    <KisanFlowContext.Provider
      value={{
        role,
        setRole,
        isAuthenticated,
        login,
        logout,
        language,
        setLanguage,
        farmer,
        crops,
        centres,
        tokens,
        activeToken,
        setActiveTokenId,
        bookSlot,
        updateTokenStatus,
        callTokenToBay,
        submitQualityInspection,
        completeWeighbridgeAndPayout,
        notifications,
        unreadNotificationCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        clearAllNotifications,
        resetDemoData,
        simulationStep,
        runNextSimulationStep,
        isSimulating,
        startSimulation,
        stopSimulation,
      }}
    >
      {children}
    </KisanFlowContext.Provider>
  );
};

export const useKisanFlow = () => {
  const context = useContext(KisanFlowContext);
  if (!context) {
    throw new Error('useKisanFlow must be used within a KisanFlowProvider');
  }
  return context;
};
