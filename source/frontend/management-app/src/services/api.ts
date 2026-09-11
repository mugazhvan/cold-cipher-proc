import axios from 'axios';

const rawEnvUrl = (import.meta as any).env?.VITE_API_BASE_URL;
export const BASE_URL = rawEnvUrl || 'http://localhost:8000/api/v1';

export interface QRVerificationResult {
  success: boolean;
  state: 'SUCCESS' | 'INVALID_QR' | 'UNAUTHORIZED_CENTRE' | 'ALREADY_VERIFIED' | 'EXPIRED' | 'NOT_FOUND' | 'INVALID_STATE' | 'ERROR';
  message: string;
  data?: {
    token_id?: string;
    token_number?: number;
    status?: string;
    booking_id?: string;
    farmer_name?: string;
    centre_id?: string;
  };
}

/** Decode payload data from a signed QR string without cryptographic secret (public field inspect) */
function parseSignedQrData(payload: string): { booking_ref?: string; centre_id?: string } | null {
  try {
    if (!payload.startsWith('kf-pass:v1:')) return null;
    const parts = payload.slice(11).split('.');
    if (parts.length < 2) return null;
    let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const jsonStr = atob(b64);
    const parsed = JSON.parse(jsonStr);
    return {
      booking_ref: parsed.b,
      centre_id: parsed.c,
    };
  } catch (e) {
    return null;
  }
}

/** Detect whether a 401 detail message is a JWT/auth failure (not a QR payload failure) */
function isJwtAuthError(detail: string): boolean {
  const lower = detail.toLowerCase();
  return (
    lower.includes('could not validate') ||
    lower.includes('credentials') ||
    lower.includes('not authenticated') ||
    lower.includes('token has expired') ||
    lower.includes('invalid token')
  );
}

/** Fetch a fresh operator JWT — always re-authenticates, never trusts stale cache */
async function freshOperatorToken(): Promise<string> {
  try {
    const phone = '5555555551';
    await axios.post(`${BASE_URL}/auth/otp/send`, { phone });
    const verifyRes = await axios.post(`${BASE_URL}/auth/otp/verify`, {
      phone,
      otp: '123456',
    });
    const vToken = verifyRes.data?.data?.verification_token;
    if (!vToken) throw new Error('Verification token missing');

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      verification_token: vToken,
      role: 'CENTRE_OPERATOR',
    });

    const accessToken = loginRes.data?.data?.access_token;
    if (accessToken) {
      localStorage.setItem('kisanflow_operator_token', accessToken);
      localStorage.setItem('kisanflow_operator_token_ts', Date.now().toString());
      return accessToken;
    }
  } catch (err) {
    console.error('Failed to re-authenticate operator:', err);
  }
  return '';
}

export async function getOperatorToken(): Promise<string> {
  const cached = localStorage.getItem('kisanflow_operator_token');
  const ts = parseInt(localStorage.getItem('kisanflow_operator_token_ts') || '0', 10);
  // JWT expires in 15 min — treat tokens older than 12 min as stale
  const AGE_LIMIT_MS = 12 * 60 * 1000;

  if (cached && Date.now() - ts < AGE_LIMIT_MS) {
    return cached;
  }

  // Token missing or too old — get a fresh one
  localStorage.removeItem('kisanflow_operator_token');
  return freshOperatorToken();
}

async function doVerify(qrData: string, token: string): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(
      `${BASE_URL}/management/qr/verify`,
      { payload: qrData.trim(), qr_data: qrData.trim() },
      { headers }
    );
    return { status: res.status, data: res.data };
  } catch (error: any) {
    return {
      status: error.response?.status ?? 0,
      data: error.response?.data ?? { detail: error.message },
    };
  }
}

export async function verifyGateQR(qrData: string): Promise<QRVerificationResult> {
  const rawInput = qrData.trim();
  let normalized = rawInput;

  // Extract token if scanned as a KISANFLOW URI (e.g. KISANFLOW://TOKEN/KF-2026-9855/PB-10-CZ-4819)
  if (rawInput.toUpperCase().startsWith('KISANFLOW://TOKEN/')) {
    const parts = rawInput.split('/');
    if (parts.length >= 4) {
      normalized = parts[3].trim();
    }
  } else if (/^\d{4}$/.test(rawInput)) {
    normalized = `KF-2026-${rawInput}`;
  } else if (rawInput.startsWith('kf-pass:v1:')) {
    const parsed = parseSignedQrData(rawInput);
    if (parsed?.booking_ref) {
      normalized = parsed.booking_ref;
    }
  }

  let token = await getOperatorToken();
  let { status, data } = await doVerify(rawInput, token);

  // If failed with 401 on rawInput and normalized was different, try normalized
  if ((status === 401 || status === 404) && normalized !== rawInput) {
    const retryNorm = await doVerify(normalized, token);
    if (retryNorm.status === 200) {
      status = retryNorm.status;
      data = retryNorm.data;
    }
  }

  // If we received a JWT auth error (stale token), clear cache, re-auth, and retry once
  if (status === 401 && isJwtAuthError(String(data?.detail ?? ''))) {
    localStorage.removeItem('kisanflow_operator_token');
    localStorage.removeItem('kisanflow_operator_token_ts');
    token = await freshOperatorToken();
    const retry = await doVerify(rawInput.startsWith('kf-pass:v1:') ? rawInput : normalized, token);
    status = retry.status;
    data = retry.data;
  }

  if (status === 200 && data?.success) {
    return {
      success: true,
      state: 'SUCCESS',
      message: data?.message || 'Farmer verified successfully. Admitted to yard.',
      data: data?.data,
    };
  }

  const detail = data?.detail || 'Unexpected verification failure';
  const detailStr = typeof detail === 'string' ? detail : JSON.stringify(detail);

  if (status === 0) {
    return {
      success: false,
      state: 'ERROR',
      message: 'Could not contact the server. Please try again.',
    };
  } else if (status === 404) {
    return {
      success: false,
      state: 'NOT_FOUND',
      message: 'No booking was found.',
    };
  } else if (status === 403) {
    return {
      success: false,
      state: 'UNAUTHORIZED_CENTRE',
      message: 'This farmer is assigned to another procurement centre.',
    };
  } else if (status === 409) {
    if (detailStr.toLowerCase().includes('already')) {
      return {
        success: false,
        state: 'ALREADY_VERIFIED',
        message: 'This farmer has already been checked in.',
      };
    }
    return {
      success: false,
      state: 'INVALID_STATE',
      message: detailStr || 'This booking cannot be checked in right now.',
    };
  } else if (status === 410 || detailStr.toLowerCase().includes('expired')) {
    return {
      success: false,
      state: 'EXPIRED',
      message: 'This gate pass has expired.',
    };
  } else if (status === 401) {
    if (detailStr.toLowerCase().includes('tamper') || detailStr.toLowerCase().includes('signature')) {
      return {
        success: false,
        state: 'INVALID_QR',
        message: 'This QR code could not be verified.',
      };
    }
    return {
      success: false,
      state: 'INVALID_QR',
      message: 'This QR code is not valid.',
    };
  }

  return {
    success: false,
    state: 'ERROR',
    message: detailStr || 'Server error during gate verification.',
  };
}

// ----------------- MANUAL FALLBACK -----------------

export async function lookupBooking(reference: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get(
      `${BASE_URL}/management/bookings/lookup?reference=${encodeURIComponent(reference.trim())}`,
      { headers }
    );
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function verifyBookingArrival(bookingId: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(
      `${BASE_URL}/management/bookings/${bookingId}/verify-arrival`,
      {},
      { headers }
    );
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

// ----------------- QUEUE & PROCUREMENT ACTIONS -----------------

export async function callQueueTokenApi(tokenIdOrBookingId: string, bayName?: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const bayParam = bayName ? `?bay_name=${encodeURIComponent(bayName)}` : '';
    const res = await axios.post(
      `${BASE_URL}/management/queue/${tokenIdOrBookingId}/call${bayParam}`,
      {},
      { headers }
    );
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function submitQualityInspectionApi(
  bookingId: string,
  payload: {
    moisturePct: number;
    foreignMatterPct: number;
    brokenGrainPct: number;
    grade?: string;
    passed?: boolean;
    notes?: string;
  }
): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const body = {
      moisture_percentage: payload.moisturePct,
      foreign_matter_percentage: payload.foreignMatterPct,
      broken_grain_percentage: payload.brokenGrainPct,
      grade: payload.grade || (payload.moisturePct <= 12 ? 'FAQ_GRADE_A' : 'GRADE_B'),
      passed: payload.passed !== false,
      notes: payload.notes || '',
    };
    const res = await axios.post(
      `${BASE_URL}/management/procurement/${bookingId}/quality-test`,
      body,
      { headers }
    );
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function completeWeighbridgeAndPayoutApi(
  bookingId: string,
  grossWeightKg: number,
  tareWeightKg: number
): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const body = {
      gross_weight_kg: grossWeightKg,
      tare_weight_kg: tareWeightKg,
    };
    const res = await axios.post(
      `${BASE_URL}/management/procurement/${bookingId}/complete-and-payout`,
      body,
      { headers }
    );
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

// ----------------- SLOTS & ROUTINES -----------------

export async function getSlotBookingsApi(slotId: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get(`${BASE_URL}/management/slots/${slotId}/bookings`, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function reassignBookingApi(bookingId: string, targetSlotId: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(
      `${BASE_URL}/management/bookings/${bookingId}/reassign`,
      { target_slot_id: targetSlotId },
      { headers }
    );
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function createSingleSlotApi(centreId: string, payload: any): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(`${BASE_URL}/management/centres/${centreId}/slots`, payload, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function createBatchSlotsApi(centreId: string, payload: any): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(`${BASE_URL}/management/centres/${centreId}/slots/batch`, payload, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function updateSlotCapacity(slotId: string, payload: { capacity?: number; status?: string }): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.patch(`${BASE_URL}/management/slots/${slotId}`, payload, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function toggleSlotStatusApi(slotId: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.patch(`${BASE_URL}/management/slots/${slotId}/toggle`, {}, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, detail: error.message };
  }
}

export async function searchFarmers(phoneQuery: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get(`${BASE_URL}/management/farmers/search?phone_query=${phoneQuery}`, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, message: error.message };
  }
}

export async function getCrops(): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get(`${BASE_URL}/crops/`, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, message: error.message };
  }
}

export async function getCentreSlots(centreId: string, date: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get(`${BASE_URL}/management/centres/${centreId}/slots?date=${date}`, { headers });
    return res.data;
  } catch (error: any) {
    // Fallback to standard centres route if needed
    try {
      const fb = await axios.get(`${BASE_URL}/centres/${centreId}/slots?date=${date}`, { headers });
      return fb.data;
    } catch {
      return error.response?.data ?? { success: false, message: error.message };
    }
  }
}

export async function createManualBooking(centreId: string, farmerId: string, payload: any): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(`${BASE_URL}/management/centres/${centreId}/manual-booking?farmer_id=${farmerId}`, payload, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, message: error.message };
  }
}
