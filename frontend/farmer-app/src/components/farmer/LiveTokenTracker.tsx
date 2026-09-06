import React, { useState } from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { TRANSLATIONS } from '../../translations';
import { TokenRecord, TokenStatus } from '../../types';
import { DigitalTokenPassModal } from './DigitalTokenPassModal';
import {
  CheckCircle2,
  Clock,
  Wheat,
  ShieldCheck,
  Bell,
  Volume2,
  FileText,
  Printer,
  ArrowRight,
  Download,
} from 'lucide-react';

interface LiveTokenTrackerProps {
  onViewJForm: () => void;
  onBookNewSlot: () => void;
}

export const LiveTokenTracker: React.FC<LiveTokenTrackerProps> = ({
  onViewJForm,
  onBookNewSlot,
}) => {
  const {
    tokens,
    activeToken,
    setActiveTokenId,
    farmer,
    language,
  } = useKisanFlow();
  const t = TRANSLATIONS[language];

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  const farmerTokens = tokens.filter((tok) => tok.farmerId === farmer.id);
  const currentToken: TokenRecord | null = activeToken || farmerTokens[0] || null;

  const steps: { status: TokenStatus; label: string; desc: string }[] = [
    {
      status: 'BOOKED',
      label: 'Slot Booked',
      desc: 'e-Gate Pass confirmed with QR code',
    },
    {
      status: 'GATE_VERIFIED',
      label: 'Gate 1 Clearance',
      desc: 'Security scan & vehicle admission',
    },
    {
      status: 'YARD_QUEUED',
      label: 'Holding Yard Queue',
      desc: 'Awaiting bay calling chime',
    },
    {
      status: 'WEIGHBRIDGE_IN',
      label: 'Weighbridge In',
      desc: 'Gross weight measurement',
    },
    {
      status: 'QUALITY_INSPECTION',
      label: 'Quality & Moisture Lab',
      desc: 'Moisture % & Fair Average Quality',
    },
    {
      status: 'UNLOADING',
      label: 'Unloading & Bagging',
      desc: 'Produce unloaded at Silo/Godown',
    },
    {
      status: 'WEIGHBRIDGE_OUT',
      label: 'Weighbridge Out',
      desc: 'Tare weight calculation',
    },
    {
      status: 'COMPLETED',
      label: 'J-Form & DBT Payment',
      desc: 'Digital receipt & bank credit',
    },
  ];

  const getStepIndex = (status: TokenStatus) => {
    switch (status) {
      case 'BOOKED':
        return 0;
      case 'GATE_VERIFIED':
        return 1;
      case 'YARD_QUEUED':
        return 2;
      case 'WEIGHBRIDGE_IN':
        return 3;
      case 'QUALITY_INSPECTION':
        return 4;
      case 'UNLOADING':
        return 5;
      case 'WEIGHBRIDGE_OUT':
        return 6;
      case 'COMPLETED':
        return 7;
      case 'REJECTED':
        return 4;
      default:
        return 0;
    }
  };

  if (!currentToken) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
        <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">No Active Passes Found</h3>
        <p className="text-xs text-slate-500 mb-4">
          Book a procurement slot to generate your first electronic gate pass.
        </p>
        <button
          onClick={onBookNewSlot}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
        >
          Book Mandi Slot Now
        </button>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(currentToken.status);
  const isBayCalled =
    currentToken.status === 'WEIGHBRIDGE_IN' ||
    currentToken.status === 'QUALITY_INSPECTION' ||
    currentToken.status === 'UNLOADING';

  return (
    <div className="space-y-6">
      {/* Active Token Switcher Pills */}
      {farmerTokens.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
            {t.activeTokens}:
          </span>
          {farmerTokens.map((tok) => (
            <button
              key={tok.id}
              onClick={() => setActiveTokenId(tok.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                tok.id === currentToken.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tok.tokenNumber} ({tok.cropName.split(' ')[0]}) - {tok.status}
            </button>
          ))}
        </div>
      )}

      {/* Live Chime Alert Banner if Bay is called */}
      {isBayCalled && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-950 text-amber-400 rounded-xl">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-slate-900">
                Yard Audio Chime & Display Announcement
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                Token {currentToken.tokenNumber} called to{' '}
                {currentToken.assignedBay || 'Weighbridge Bay 2'}!
              </h3>
              <p className="text-xs font-medium text-slate-900 mt-0.5">
                Proceed immediately with vehicle <strong>{currentToken.vehicleNumber}</strong>. Gate
                inspectors are waiting.
              </p>
            </div>
          </div>
          <span className="bg-slate-950 text-amber-300 text-xs font-mono font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xs">
            GATE CHIME #2
          </span>
        </div>
      )}

      {/* Main Grid: Pass & Real-time Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Visual e-Gate Pass Card */}
        <div className="space-y-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            {/* Top decorative badge */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                  e-Gate Pass (QR Verified)
                </span>
              </div>
              <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                {currentToken.tokenNumber}
              </span>
            </div>

            {/* QR Code Block */}
            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center my-4 shadow-inner">
              {/* Stylized high-contrast QR Matrix */}
              <div className="w-40 h-40 bg-slate-950 p-2 rounded-lg flex items-center justify-center relative">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-white">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        i % 2 === 0 || i % 5 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-slate-950'
                          : 'bg-emerald-700'
                      } rounded-xs`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                    KF-PASS
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-2 font-medium tracking-wider">
                SCAN AT MANDI GATE 1
              </span>
            </div>

            {/* Pass Metadata */}
            <div className="space-y-2 text-xs border-t border-slate-800/80 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Farmer:</span>
                <span className="font-bold text-slate-100">{currentToken.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crop:</span>
                <span className="font-bold text-emerald-400">{currentToken.cropName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle:</span>
                <span className="font-mono font-bold text-amber-300">
                  {currentToken.vehicleNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mandi / Depot:</span>
                <span className="font-bold text-slate-200 text-right max-w-[160px] truncate">
                  {currentToken.centreName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot Window:</span>
                <span className="font-bold text-slate-100">{currentToken.slotTime}</span>
              </div>
              {currentToken.assignedBay && (
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-amber-400 font-bold">Assigned Bay:</span>
                  <span className="font-bold text-amber-300">{currentToken.assignedBay}</span>
                </div>
              )}
            </div>

            {/* Action footer with Download and Print buttons */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <button
                id="download-token-pass-btn"
                onClick={() => setIsPassModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Pass</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 font-semibold py-1.5 px-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Col 2 & 3: Multi-Stage Stepper & Live Station Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stepper Timeline Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Live Queue Progress & Mandi Journey
                </h3>
                <p className="text-xs text-slate-500">
                  Token #{currentToken.tokenNumber} • Current Station:{' '}
                  <strong className="text-emerald-700">{currentToken.status}</strong>
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  currentToken.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentToken.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-900 animate-pulse'
                }`}
              >
                {currentToken.status === 'COMPLETED'
                  ? 'Procurement Completed'
                  : currentToken.status === 'REJECTED'
                  ? 'Moisture Re-test Required'
                  : 'In Yard Operations'}
              </span>
            </div>

            {/* Steps Visual Vertical / Timeline */}
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const isDone = idx < currentStepIdx || currentToken.status === 'COMPLETED';
                const isCurrent = idx === currentStepIdx && currentToken.status !== 'COMPLETED';

                return (
                  <div key={step.status} className="flex items-start space-x-3.5">
                    {/* Circle Indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : isCurrent
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100 animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-slate-950" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-6 my-1 ${
                            idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs sm:text-sm font-bold ${
                            isCurrent
                              ? 'text-amber-900 font-extrabold'
                              : isDone
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            CURRENT STAGE
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-medium text-emerald-700">Cleared</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality & Moisture Lab Inspection Summary if available */}
          {currentToken.qualityReport && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Wheat className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Official Quality & Moisture Lab Certificate
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {currentToken.qualityReport.grade}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Moisture %
                  </span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {currentToken.qualityReport.moisturePct}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Std: &lt; 12.0%</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Foreign Matter
                  </span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {currentToken.qualityReport.foreignMatterPct}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Std: &lt; 0.75%</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Broken Grain
                  </span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {currentToken.qualityReport.brokenGrainPct}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Std: &lt; 2.0%</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Deductions
                  </span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    ₹{currentToken.qualityReport.deductionsAppliedRs}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">Nil</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                &ldquo;{currentToken.qualityReport.notes}&rdquo; —{' '}
                <strong className="text-slate-800">
                  {currentToken.qualityReport.inspectorName}
                </strong>{' '}
                at {currentToken.qualityReport.inspectedAt}
              </p>
            </div>
          )}

          {/* Direct Bank Transfer & J-Form Card if Completed */}
          {currentToken.status === 'COMPLETED' && currentToken.paymentDetails && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  <h3 className="font-extrabold text-base">Direct Bank Transfer (DBT) Credited</h3>
                </div>
                <p className="text-xs text-emerald-100">
                  Net Amount:{' '}
                  <strong className="text-xl text-white font-mono">
                    ₹{currentToken.paymentDetails.netPayableRs.toLocaleString('en-IN')}
                  </strong>{' '}
                  credited to {farmer.bankAccountMasked}
                </p>
                <span className="text-[11px] font-mono text-emerald-200 mt-1 block">
                  RBI-UTR: {currentToken.paymentDetails.utrNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="view-jform-btn"
                  onClick={onViewJForm}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-emerald-900 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>View J-Form & Print Receipt</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Real-time SMS Notification Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Mobile SMS & WhatsApp Broadcast Feed
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                SIM: {currentToken.phone}
              </span>
            </div>

            <div className="space-y-2.5">
              {currentToken.smsAlerts.map((sms) => (
                <div
                  key={sms.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start space-x-2.5 text-xs"
                >
                  <span className="p-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold mt-0.5">
                    {sms.timestamp}
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium flex-1">{sms.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Token Pass Download Modal */}
      {isPassModalOpen && (
        <DigitalTokenPassModal
          token={currentToken}
          farmer={farmer}
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
        />
      )}
    </div>
  );
};
