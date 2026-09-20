/**
 * KisanFlow Geospatial Engine & Haversine Distance Calculator
 * Enables GPS detection, distance calculations, and road navigation for farmers.
 */

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

/**
 * Common agricultural hubs & village clusters in the procurement zone (Punjab / Ludhiana belt)
 */
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
    hindiName: 'ਸਾਹਨੇਵਾਲ ਫਾਰਮ ਕਲੱਸਟਰ',
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
 * Generates direct one-click navigation URL to Google Maps directions.
 */
export function getGoogleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  destName?: string
): string {
  const query = destName
    ? `${encodeURIComponent(destName)}&destination=${destLat},${destLng}`
    : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

/**
 * Calculates AI Load Balancing score.
 * Combines physical transit distance and mandi queue waiting time.
 * Lower score represents optimal mandi choice.
 */
export function calculateSmartScore(
  distanceKm: number,
  waitMinutes: number,
  yardCapacityPercent: number
): { score: number; badge: string; reason: string } {
  // Score weights: 1 km ~ 2.5 mins travel, plus queue wait time, plus congestion penalty
  const congestionPenalty = yardCapacityPercent > 80 ? 40 : yardCapacityPercent > 60 ? 15 : 0;
  const score = Math.round(distanceKm * 2.5 + waitMinutes + congestionPenalty);

  if (yardCapacityPercent < 45 && waitMinutes <= 25) {
    return {
      score,
      badge: 'TOP RECOMMENDATION',
      reason: 'Fastest total turnaround: short queue & quick weighbridge clearance',
    };
  } else if (yardCapacityPercent >= 80) {
    return {
      score,
      badge: 'HEAVY CONGESTION',
      reason: 'Severe traffic bottleneck: consider diverting to avoid queue choke',
    };
  } else {
    return {
      score,
      badge: 'MODERATE QUEUE',
      reason: 'Standard operating load: steady queue clearance rate',
    };
  }
}

/**
 * Request real GPS coordinates from browser Geolocation API with graceful fallback.
 */
export async function getUserGeolocation(): Promise<GeoLocationCoords> {
  const defaultLocation: GeoLocationCoords = {
    latitude: PUNJAB_FARM_HUBS[0].latitude,
    longitude: PUNJAB_FARM_HUBS[0].longitude,
    source: 'REGISTERED_VILLAGE',
    locationName: 'Samrala Agri Farm (Default)',
  };

  if (typeof window === 'undefined' || !navigator.geolocation) {
    return defaultLocation;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          source: 'GPS_LIVE',
          locationName: 'Live Device GPS',
        });
      },
      (error) => {
        console.warn('Geolocation lookup warning or denied, using farm village fallback:', error.message);
        resolve(defaultLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}
