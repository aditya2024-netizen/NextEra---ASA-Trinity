import React from 'react';
import { Patient, RiskPrediction } from '../types';
import { RiskGauge } from './RiskGauge';
import { AlertTriangle, CheckCircle, HelpCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RiskCardProps {
  patient: Patient;
  risk?: RiskPrediction;
  compact?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({ patient, risk = patient.currentRisk, compact = false }) => {
  const { setExplainModalPatient, setActionModalPatient, setInterventionModalPatient } = useApp();

  if (!risk) {
    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <p className="text-sm text-slate-500">No active risk prediction recorded for this patient.</p>
      </div>
    );
  }

  const isHigh = risk.riskLevel === 'HIGH';
  const isMed = risk.riskLevel === 'MEDIUM';

  const badgeStyle = isHigh
    ? 'bg-red-100 text-red-700 border-red-200'
    : isMed
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const dotColor = isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div 
      id={`risk-card-${patient.patientCode}`}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
              Risk Assessment
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeStyle} flex items-center gap-1.5`}>
            {isHigh ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {risk.riskLevel} RISK
          </span>
        </div>

        {/* Big Score Display */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`text-4xl font-extrabold tracking-tight ${
            isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {risk.score}
          </span>
          <span className="text-sm font-semibold text-slate-400">/ 100</span>
          <span className="text-xs text-slate-500 ml-auto font-mono">
            Certainty: {Math.round(risk.confidenceOrPriority * 100)}%
          </span>
        </div>

        {/* Visual Gauge */}
        <div className="mb-4">
          <RiskGauge score={risk.score} level={risk.riskLevel} size="md" />
        </div>

        {/* Natural Language Reason Summary */}
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 mb-4 text-xs leading-relaxed text-slate-700">
          <p className="font-bold text-slate-800 mb-0.5">Clinical Risk Rationale:</p>
          <p className="italic text-slate-600">"{risk.naturalLanguageSummary}"</p>
        </div>

        {/* Top 3 Contributing Drivers */}
        {!compact && (
          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Primary Contributing Drivers
            </p>
            {risk.topFactors.slice(0, 3).map((factor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{factor.name}</span>
                  <span className="font-mono text-slate-900 font-bold">
                    +{factor.points} pts ({factor.percentageContribution}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      factor.impact === 'HIGH' ? 'bg-red-500' : factor.impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, (factor.points / factor.maxPoints) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Action Summary */}
        <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-lg mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Recommended Immediate Intervention
          </div>
          <p className="text-xs font-semibold text-blue-800">
            {risk.immediateAction}
          </p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setExplainModalPatient(patient)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            title="Inspect comprehensive explainable reasons and ML comparison"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Why?
          </button>
          
          <button
            onClick={() => setActionModalPatient(patient)}
            className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
            title="View actionable clinical intervention playbooks"
          >
            <Zap className="w-3.5 h-3.5" />
            Action
          </button>
        </div>

        <button
          onClick={() => setInterventionModalPatient(patient)}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs uppercase tracking-wider text-[11px]"
        >
          Take Action
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
