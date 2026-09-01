import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Share2, 
  AlertTriangle, 
  ShieldCheck, 
  BrainCircuit, 
  Calendar, 
  Stethoscope, 
  ArrowRight,
  Send,
  UserCheck,
  Zap,
  Info,
  Clock
} from 'lucide-react';

export const AnalyzerFindingsModal: React.FC = () => {
  const { 
    analyzerFindingsModal, 
    setAnalyzerFindingsModal, 
    setContactPatientModal, 
    viewPatientDetails 
  } = useApp();

  if (!analyzerFindingsModal) return null;

  const findings = analyzerFindingsModal;
  const isHighRisk = findings.riskLevel === 'HIGH';
  const isMediumRisk = findings.riskLevel === 'MEDIUM';

  const riskBadgeColor = isHighRisk 
    ? 'bg-red-50 text-red-700 border-red-200' 
    : isMediumRisk 
      ? 'bg-amber-50 text-amber-700 border-amber-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const handleOpenContact = () => {
    // Construct dummy patient object wrapper for contact modal
    const patientObj: any = {
      id: findings.patientId,
      patientCode: findings.patientCode,
      name: findings.patientName,
      phone: findings.phone,
      condition: findings.condition,
      nextFollowUpDate: findings.nextFollowUpDate,
      currentRisk: {
        score: findings.riskScore,
        riskLevel: findings.riskLevel,
      }
    };

    setAnalyzerFindingsModal(null);
    setContactPatientModal({
      patient: patientObj,
      findings: findings,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Clinical Risk & Adherence Analyzer Findings</h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Verified Analysis
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Generated for <span className="font-bold text-white">{findings.patientName}</span> ({findings.patientCode}) • Phone: <span className="font-mono text-blue-300">{findings.phone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setAnalyzerFindingsModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Top Score Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border font-bold ${
                isHighRisk ? 'bg-red-600 text-white border-red-700' : isMediumRisk ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-600 text-white border-emerald-700'
              }`}>
                <span className="text-2xl leading-none">{findings.riskScore}</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskBadgeColor}`}>
                    {findings.riskLevel} FOLLOW-UP RISK
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Certainty: {findings.confidence}%
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Care Plan: <strong className="text-slate-900">{findings.condition}</strong> • Next Appointment: <strong className="text-blue-700">{findings.nextFollowUpDate}</strong>
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Recommended Action</span>
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded-lg text-xs inline-block">
                {findings.suggestedIntervention}
              </span>
            </div>
          </div>

          {/* Section 1: Identified Primary Risk Drivers */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Identified Primary Risk Drivers
            </h4>
            <div className="space-y-1.5">
              {findings.primaryDrivers && findings.primaryDrivers.map((driver, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{driver}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Clinical Hazards if Follow-up is Missed */}
          <div className="space-y-2">
            <h4 className="font-bold text-red-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Clinical Hazards if Follow-up is Missed
            </h4>
            <div className="space-y-1.5">
              {findings.clinicalHazards && findings.clinicalHazards.map((hazard, idx) => (
                <div key={idx} className="p-2.5 bg-red-50/70 border border-red-200 rounded-lg flex items-start gap-2 text-red-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span className="font-medium">{hazard}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Recommended Clinical Actions */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Recommended Clinical Action Strategy
            </h4>
            <div className="space-y-1.5">
              {findings.recommendedActions && findings.recommendedActions.map((action, idx) => (
                <div key={idx} className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-900">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Patient-Ready Communication Draft */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                Prepared Patient Outreach Script / Message
              </h4>
              <span className="text-[10px] font-mono font-bold text-blue-700">Target Phone: {findings.phone}</span>
            </div>
            <p className="text-slate-800 text-xs italic bg-white p-3 rounded-lg border border-blue-100 leading-relaxed font-sans">
              "{findings.patientSummaryMessage}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAnalyzerFindingsModal(null)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors"
          >
            Close Findings
          </button>

          <button
            type="button"
            onClick={handleOpenContact}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors shadow-md"
          >
            <Phone className="w-4 h-4" />
            <span>Contact Patient ({findings.phone})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
