import { Platform, Linking } from 'react-native';

export interface GeoLocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'GPS_LIVE' | 'REGISTERED_VILLAGE' | 'MANUAL_SELECTION';
  locationName?: string;
}

export interface FarmHubLocation {
  id: string;
  name: string;
  punjabiName?: string;
  hindiName?: string;
  latitude: number;
  longitude: number;
  tehsil: string;
}

export const PUNJAB_FARM_HUBS: FarmHubLocation[] = [
  {
    id: 'hub-samrala',
    name: 'Samrala Agri Farm Belt (Registered)',
    punjabiName: 'ਸਮਰਾਲਾ ਖੇਤੀ ਫਾਰਮ',
    hindiName: 'समराला कृषि फार्म',
    latitude: 30.8359,
    longitude: 76.1914,
    tehsil: 'Samrala',
  },
  {
    id: 'hub-khanna',
    name: 'Khanna Rural Hub',
    punjabiName: 'ਖੰਨਾ ਪੇਂਡੂ ਖੇਤਰ',
    hindiName: 'खन्ना ग्रामीण क्षेत्र',
    latitude: 30.7068,
    longitude: 76.2205,
    tehsil: 'Khanna',
  },
  {
    id: 'hub-doraha',
    name: 'Doraha Canal Zone',
    punjabiName: 'ਦੋਰਾਹਾ ਨਹਿਰੀ ਖੇਤਰ',
    hindiName: 'दोराहा नहर क्षेत्र',
    latitude: 30.8052,
    longitude: 76.0354,
    tehsil: 'Payal',
  },
  {
    id: 'hub-sahnewal',
    name: 'Sahnewal Farm Cluster',
    punjabiName: 'ਸਾਹਨੇਵਾਲ ਫਾਰਮ ਕਲੱਸਟਰ',
    hindiName: 'साहनेवाल फार्म क्लस्टर',
    latitude: 30.8444,
    longitude: 75.9806,
    tehsil: 'Ludhiana East',
  },
  {
    id: 'hub-jagraon',
    name: 'Jagraon Grain Belt',
    punjabiName: 'ਜਗਰਾਉਂ ਅਨਾਜ ਪੱਟੀ',
    hindiName: 'जगराओं अनाज बेल्ट',
    latitude: 30.7844,
    longitude: 75.4806,
    tehsil: 'Jagraon',
  },
  {
    id: 'hub-raikot',
    name: 'Raikot Agricultural Area',
    punjabiName: 'ਰਾਏਕੋਟ ਖੇਤੀਬਾੜੀ ਖੇਤਰ',
    hindiName: 'रायकोट कृषि क्षेत्र',
    latitude: 30.6514,
    longitude: 75.6022,
    tehsil: 'Raikot',
  },
];

/**
 * Calculates Great-Circle distance between two points using the Haversine formula.
 * @returns Distance in kilometers rounded to 1 decimal place.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Estimates driving transit time based on rural road vehicle speed.
 */
export function estimateTransitTimeMinutes(
  distanceKm: number,
  vehicleType: string = 'Tractor Trolley'
): number {
  let speedKmh = 25; // Standard tractor trolley with loaded produce
  const lower = vehicleType.toLowerCase();
  if (lower.includes('truck') || lower.includes('pickup')) {
    speedKmh = 40;
  } else if (lower.includes('bullock') || lower.includes('cart')) {
    speedKmh = 8;
  }
  const minutes = Math.round((distanceKm / speedKmh) * 60);
  return Math.max(5, minutes);
}

/**
 * Opens native turn-by-turn navigation in Google Maps / Apple Maps.
 */
export async function openNativeMapsNavigation(
  destLat: number,
  destLng: number,
  destName?: string
) {
  const label = encodeURIComponent(destName || 'Mandi Procurement Centre');
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${destLat},${destLng}&q=${label}`,
    android: `google.navigation:q=${destLat},${destLng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`,
  });

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`
      );
    }
  } catch (err) {
    console.warn('Could not open maps', err);
  }
}

/**
 * Calculates AI Load Balancing score.
 */
export function calculateSmartScore(
  distanceKm: number,
  waitMinutes: number,
  yardCapacityPercent: number
): { score: number; badge: string; reason: string; color: string } {
  const congestionPenalty =
    yardCapacityPercent > 80 ? 40 : yardCapacityPercent > 60 ? 15 : 0;
  const score = Math.round(distanceKm * 2.5 + waitMinutes + congestionPenalty);

  if (yardCapacityPercent < 45 && waitMinutes <= 25) {
    return {
      score,
      badge: 'TOP CHOICE',
      reason: 'Shortest wait & rapid weighbridge turnaround',
      color: '#10B981',
    };
  } else if (yardCapacityPercent >= 80) {
    return {
      score,
      badge: 'CONGESTED',
      reason: 'High yard congestion: consider diverting to avoid queue choke',
      color: '#EF4444',
    };
  } else {
    return {
      score,
      badge: 'MODERATE',
      reason: 'Steady clearance rate with normal queue progression',
      color: '#F59E0B',
    };
  }
}
