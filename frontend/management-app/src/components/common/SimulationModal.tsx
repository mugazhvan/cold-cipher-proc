import React from 'react';
import { useKisanFlow } from '../../context/KisanFlowContext';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export const SimulationModal: React.FC = () => {
  const {
    isSimulating,
    simulationStep,
    runNextSimulationStep,
    stopSimulation,
  } = useKisanFlow();

  if (!isSimulating) return null;

  const stepsInfo = [
    {
      step: 1,
      title: '1. AI Smart Mandi Recommendation',
      desc: 'System compares nearby procurement centres. Khanna has 85m queue while Samrala has only 18m wait. AI recommends Samrala to prevent yard congestion.',
      targetRole: 'Farmer View',
      actionPrompt: 'Click Next to book 48 Quintals of Wheat at Samrala Depot.',
    },
    {
      step: 2,
      title: '2. Slot Booking & e-Gate Pass Generation',
      desc: 'e-Gate Pass generated with unique QR Code, security seal, vehicle registration PB-10-DF-4819, and automated SMS confirmation.',
      targetRole: 'Farmer View',
      actionPrompt: 'Click Next to switch to Mandi Operator Console as vehicle arrives at Gate 1.',
    },
    {
      step: 3,
      title: '3. Gate Verification & Yard Admission',
      desc: 'Gate security officer verifies QR Code and admits the tractor-trolley into the regulated holding yard.',
      targetRole: 'Operator View',
      actionPrompt: 'Click Next to call the farmer token to Weighbridge Bay 2.',
    },
    {
      step: 4,
      title: '4. Token Called to Weighbridge Bay 2',
      desc: 'Yard Controller calls token #KF-2026-0942. System chimes and sends urgent SMS alert to the farmer with designated bay.',
      targetRole: 'Operator View',
      actionPrompt: 'Click Next to perform digital moisture & quality inspection.',
    },
    {
      step: 5,
      title: '5. Automated Quality & Moisture Inspection',
      desc: 'Lab Analyzer records 11.2% moisture (within 12% standard threshold) & 0.3% foreign matter. Certified as Fair Average Quality (FAQ) Grade A.',
      targetRole: 'Operator View',
      actionPrompt: 'Click Next to capture weighbridge readings and execute MSP payout.',
    },
    {
      step: 6,
      title: '6. Electronic Weighbridge & Direct Bank Transfer (DBT)',
      desc: 'Gross: 7920 kg | Tare: 3120 kg | Net: 48.0 Quintals. At ₹2,275/qtl MSP, ₹1,09,200 is settled with Digital J-Form and RBI-DBT transfer.',
      targetRole: 'Operator View',
      actionPrompt: 'Click Next to return to Farmer Portal and view the issued Digital J-Form & receipt.',
    },
    {
      step: 7,
      title: '7. Digital J-Form & Payout Receipt',
      desc: 'Farmer receives official Government J-Form on phone with digital signature, eliminating middlemen and payment delays.',
      targetRole: 'Farmer View',
      actionPrompt: 'Simulation Completed! Click Finish to explore freely.',
    },
  ];

  const current = stepsInfo[simulationStep - 1] || stepsInfo[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-500/40 p-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-amber-400 tracking-wide">
                SIH26032 Guided Evaluation Tour
              </h3>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                Step {simulationStep} of {stepsInfo.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">Context: {current.targetRole}</p>
          </div>
        </div>

        <button
          onClick={stopSimulation}
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
          title="Exit Tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 mb-4">
        <h4 className="text-sm font-semibold text-slate-100 mb-1">{current.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{current.desc}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-amber-200/80 font-medium">
          {current.actionPrompt}
        </span>

        <div className="flex items-center space-x-2">
          <button
            onClick={stopSimulation}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            id="simulation-next-step-btn"
            onClick={runNextSimulationStep}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md"
          >
            <span>{simulationStep >= stepsInfo.length ? 'Finish Tour' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
