import { TokenStatus } from '../types';

/**
 * Format currency into Indian Rupee format (e.g. ₹ 1,23,456)
 */
export const formatCurrencyINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format weight in quintals / kg
 */
export const formatWeightQuintals = (quintals: number): string => {
  return `${quintals.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Qtl`;
};

/**
 * Get human-readable status badge class and label
 */
export const getStatusBadgeInfo = (status: TokenStatus) => {
  switch (status) {
    case 'BOOKED':
      return { label: 'Slot Reserved', bgClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'GATE_VERIFIED':
      return { label: 'Gate Verified', bgClass: 'bg-sky-100 text-sky-800 border-sky-200' };
    case 'YARD_QUEUED':
      return { label: 'In Holding Yard', bgClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    case 'WEIGHBRIDGE_IN':
      return { label: 'Gross Weighment', bgClass: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' };
    case 'QUALITY_INSPECTION':
      return { label: 'Quality Lab FAQ', bgClass: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'UNLOADING':
      return { label: 'Unloading Bay', bgClass: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'WEIGHBRIDGE_OUT':
      return { label: 'Tare Weighment', bgClass: 'bg-teal-100 text-teal-800 border-teal-200' };
    case 'COMPLETED':
      return { label: 'Settled & Paid', bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'REJECTED':
      return { label: 'Rejected', bgClass: 'bg-red-100 text-red-800 border-red-200' };
    default:
      return { label: status, bgClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
};
