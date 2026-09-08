import { Language } from './types';

export const TRANSLATIONS: Record<
  Language,
  {
    appTitle: string;
    subTitle: string;
    govDept: string;
    farmerPortal: string;
    operatorConsole: string;
    analyticsPortal: string;
    bookSlot: string;
    liveTracker: string;
    jFormReceipt: string;
    mandiStatus: string;
    farmerName: string;
    mobileNumber: string;
    village: string;
    crop: string;
    estimatedQty: string;
    quintal: string;
    mspRate: string;
    selectCentre: string;
    bookingSuccess: string;
    vehicleNumber: string;
    vehicleType: string;
    generateGatePass: string;
    activeTokens: string;
    tokenCalledNotice: string;
    moistureResult: string;
    weighbridgeSlip: string;
    payoutConfirmed: string;
    liveWait: string;
    distance: string;
    aiRecommendedBadge: string;
    quickDemoTour: string;
    resetDemo: string;
  }
> = {
  en: {
    appTitle: 'KisanFlow',
    subTitle: 'Smart Procurement & Yard Queue Coordination',
    govDept: 'Department of Consumer Affairs • SIH26032',
    farmerPortal: '🌾 Farmer Portal',
    operatorConsole: '🏢 Mandi Operator Console',
    analyticsPortal: '📊 DCA Analytics & AI Balancer',
    bookSlot: 'Book Mandi Slot',
    liveTracker: 'Live Yard & Token Tracker',
    jFormReceipt: 'Digital J-Form & Payment',
    mandiStatus: 'Nearby Mandi Congestion',
    farmerName: 'Farmer Name',
    mobileNumber: 'Mobile Number',
    village: 'Village / Tehsil',
    crop: 'Crop Type',
    estimatedQty: 'Estimated Quantity',
    quintal: 'Quintals',
    mspRate: 'Govt. MSP Rate',
    selectCentre: 'Select Procurement Centre',
    bookingSuccess: 'Slot Booked & e-Gate Pass Issued!',
    vehicleNumber: 'Vehicle / Trolley No.',
    vehicleType: 'Transport Mode',
    generateGatePass: 'Confirm & Generate e-Gate Pass',
    activeTokens: 'Your Active Gate Passes',
    tokenCalledNotice: 'YOUR TOKEN HAS BEEN CALLED TO BAY!',
    moistureResult: 'Moisture & Quality Inspection',
    weighbridgeSlip: 'Electronic Weighbridge Slip',
    payoutConfirmed: 'Direct Bank Transfer (DBT) Credited',
    liveWait: 'Avg Wait',
    distance: 'Distance',
    aiRecommendedBadge: 'AI RECOMMENDED',
    quickDemoTour: '⚡ Guided Demo Tour',
    resetDemo: 'Reset Demo Data',
  },
  hi: {
    appTitle: 'किसानफ़्लो (KisanFlow)',
    subTitle: 'स्मार्ट खरीद केंद्र एवं टोकन समन्वय प्रणाली',
    govDept: 'उपभोक्ता मामले विभाग • SIH26032',
    farmerPortal: '🌾 किसान सेवा पोर्टल',
    operatorConsole: '🏢 मंडी ऑपरेटर कंसोल',
    analyticsPortal: '📊 डीसीए विश्लेषण एवं लोड संतुलन',
    bookSlot: 'मंडी स्लॉट बुक करें',
    liveTracker: 'लाइव टोकन व यार्ड ट्रैकर',
    jFormReceipt: 'डिजिटल जे-फॉर्म व भुगतान',
    mandiStatus: 'निकटवर्ती मंडियों की स्थिति',
    farmerName: 'किसान का नाम',
    mobileNumber: 'मोबाइल नंबर',
    village: 'गांव / तहसील',
    crop: 'फसल का प्रकार',
    estimatedQty: 'अनुमानित मात्रा',
    quintal: 'क्विंटल',
    mspRate: 'सरकारी एमएसपी दर',
    selectCentre: 'खरीद केंद्र चुनें',
    bookingSuccess: 'स्लॉट बुक हुआ और ई-गेट पास जारी!',
    vehicleNumber: 'वाहन / ट्रॉली नंबर',
    vehicleType: 'परिवहन साधन',
    generateGatePass: 'पुष्टि करें और ई-गेट पास बनाएं',
    activeTokens: 'आपके सक्रिय टोकन',
    tokenCalledNotice: 'आपका टोकन वे-ब्रिज पर बुलाया गया है!',
    moistureResult: 'नमी व गुणवत्ता जांच परिणाम',
    weighbridgeSlip: 'इलेक्ट्रॉनिक तौल पर्ची',
    payoutConfirmed: 'डीबीटी द्वारा बैंक खाते में भुगतान सफल',
    liveWait: 'औसत प्रतीक्षा',
    distance: 'दूरी',
    aiRecommendedBadge: 'एआई द्वारा अनुशंसित',
    quickDemoTour: '⚡ लाइव डेमो टूर',
    resetDemo: 'डेटा रीसेट करें',
  },
  pa: {
    appTitle: 'ਕਿਸਾਨਫ਼ਲੋ (KisanFlow)',
    subTitle: 'ਸਮਾਰਟ ਖਰੀਦ ਕੇਂਦਰ ਅਤੇ ਟੋਕਨ ਪ੍ਰਬੰਧਨ ਪ੍ਰਣਾਲੀ',
    govDept: 'ਖਪਤਕਾਰ ਮਾਮਲੇ ਵਿਭਾਗ • SIH26032',
    farmerPortal: '🌾 ਕਿਸਾਨ ਪੋਰਟਲ',
    operatorConsole: '🏢 ਮੰਡੀ ਅਪਰੇਟਰ ਕੰਸੋਲ',
    analyticsPortal: '📊 ਡੀਸੀਏ ਐਨਾਲਿਟਿਕਸ ਅਤੇ ਸੰਤੁਲਨ',
    bookSlot: 'ਮੰਡੀ ਸਲਾਟ ਬੁੱਕ ਕਰੋ',
    liveTracker: 'ਲਾਈਵ ਟੋਕਨ ਤੇ ਯਾਰਡ ਟਰੈਕਰ',
    jFormReceipt: 'ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ ਅਤੇ ਅਦਾਇਗੀ',
    mandiStatus: 'ਨੇੜਲੀਆਂ ਮੰਡੀਆਂ ਦੀ ਸਥਿਤੀ',
    farmerName: 'ਕਿਸਾਨ ਦਾ ਨਾਮ',
    mobileNumber: 'ਮੋਬਾਈਲ ਨੰਬਰ',
    village: 'ਪਿੰਡ / ਤਹਿਸੀਲ',
    crop: 'ਫ਼ਸਲ ਦੀ ਕਿਸਮ',
    estimatedQty: 'ਅਨੁਮਾਨਿਤ ਮਾਤਰਾ',
    quintal: 'ਕੁਇੰਟਲ',
    mspRate: 'ਸਰਕਾਰੀ ਐਮਐਸਪੀ ਰੇਟ',
    selectCentre: 'ਖਰੀਦ ਕੇਂਦਰ ਚੁਣੋ',
    bookingSuccess: 'ਸਲਾਟ ਬੁੱਕ ਹੋ ਗਿਆ ਅਤੇ ਈ-ਗੇਟ ਪਾਸ ਜਾਰੀ!',
    vehicleNumber: 'ਵਾਹਨ / ਟਰਾਲੀ ਨੰਬਰ',
    vehicleType: 'ਸਾਧਨ',
    generateGatePass: 'ਈ-ਗੇਟ ਪਾਸ ਜਾਰੀ ਕਰੋ',
    activeTokens: 'ਤੁਹਾਡੇ ਸਰਗਰਮ ਟੋਕਨ',
    tokenCalledNotice: 'ਤੁਹਾਡਾ ਟੋਕਨ ਕੰਡੇ (Bay) ਉੱਤੇ ਬੁਲਾਇਆ ਗਿਆ ਹੈ!',
    moistureResult: 'ਨਮੀ ਅਤੇ ਗੁਣਵੱਤਾ ਟੈਸਟ ਰਿਪੋਰਟ',
    weighbridgeSlip: 'ਇਲੈਕਟ੍ਰਾਨਿਕ ਕੰਡਾ ਪਰਚੀ',
    payoutConfirmed: 'ਡੀਬੀਟੀ ਰਾਹੀਂ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਭੁਗਤਾਨ ਸਫਲ',
    liveWait: 'ਉਡੀਕ ਸਮਾਂ',
    distance: 'ਦੂਰੀ',
    aiRecommendedBadge: 'ਏਆਈ ਸਿਫ਼ਾਰਸ਼ੀ',
    quickDemoTour: '⚡ ਲਾਈਵ ਡੈਮੋ ਟੂਰ',
    resetDemo: 'ਡੇਟਾ ਰੀਸੈਟ',
  },
};
