import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface QRVerificationResult {
  success: boolean;
  state: 'SUCCESS' | 'INVALID_QR' | 'UNAUTHORIZED_CENTRE' | 'ALREADY_VERIFIED' | 'EXPIRED' | 'ERROR';
  message: string;
  data?: {
    token_number?: number;
    status?: string;
    booking_id?: string;
    farmer_name?: string;
    centre_id?: string;
  };
}

/** Detect whether a 401 detail message is a JWT/auth failure (not a QR payload failure) */
function isJwtAuthError(detail: string): boolean {
  const lower = detail.toLowerCase();
  return (
    lower.includes('could not validate') ||
    lower.includes('credentials') ||
    lower.includes('not authenticated') ||
    lower.includes('token has expired') ||
    lower.includes('invalid token') ||
    lower.includes('signature')
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
  let token = await getOperatorToken();
  let { status, data } = await doVerify(qrData, token);

  // If we received a JWT auth error (stale token), clear cache, re-auth, and retry once
  if (status === 401 && isJwtAuthError(String(data?.detail ?? ''))) {
    localStorage.removeItem('kisanflow_operator_token');
    localStorage.removeItem('kisanflow_operator_token_ts');
    token = await freshOperatorToken();
    const retry = await doVerify(qrData, token);
    status = retry.status;
    data = retry.data;
  }

  if (status === 200 && data?.success) {
    return {
      success: true,
      state: 'SUCCESS',
      message: data?.message || 'Gate entry verified successfully.',
      data: data?.data,
    };
  }

  const detail = data?.detail || 'Unknown verification error';

  if (status === 401) {
    // At this point it's a real QR-payload error, not an auth error
    return {
      success: false,
      state: 'INVALID_QR',
      message: typeof detail === 'string' ? detail : 'Invalid or tampered e-Pass QR code.',
    };
  } else if (status === 403) {
    return {
      success: false,
      state: 'UNAUTHORIZED_CENTRE',
      message: typeof detail === 'string' ? detail : 'Not authorized to access this centre.',
    };
  } else if (status === 409) {
    return {
      success: false,
      state: 'ALREADY_VERIFIED',
      message: typeof detail === 'string' ? detail : 'Booking has already been gate-verified.',
    };
  } else if (status === 410 || (typeof detail === 'string' && detail.toLowerCase().includes('expired'))) {
    return {
      success: false,
      state: 'EXPIRED',
      message: typeof detail === 'string' ? detail : 'e-Pass slot has expired.',
    };
  }

  return {
    success: false,
    state: 'ERROR',
    message: typeof detail === 'string' ? detail : 'Server error during gate verification.',
  };
}

export async function searchFarmers(phoneQuery: string): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.get(`${BASE_URL}/farmers/search?phone_query=${phoneQuery}`, { headers });
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
    const res = await axios.get(`${BASE_URL}/centres/${centreId}/slots?date=${date}`, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, message: error.message };
  }
}

export async function createManualBooking(centreId: string, farmerId: string, payload: any): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.post(`${BASE_URL}/centres/${centreId}/manual-booking?farmer_id=${farmerId}`, payload, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, message: error.message };
  }
}

export async function updateSlotCapacity(slotId: string, payload: any): Promise<any> {
  const token = await getOperatorToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await axios.patch(`${BASE_URL}/slots/${slotId}`, payload, { headers });
    return res.data;
  } catch (error: any) {
    return error.response?.data ?? { success: false, message: error.message };
  }
}
