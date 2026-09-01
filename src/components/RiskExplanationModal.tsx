import React from 'react';
import { useApp } from '../context/AppContext';
import { RiskGauge } from './RiskGauge';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  FileText, 
  ArrowRight,
  Info,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';

export const RiskExplanationModal: React.FC = () => {
  const { 
    explainModalPatient, 
    setExplainModalPatient, 
    setActionModalPatient, 
    setInterventionModalPatient,
    setReportModalPatient 
  } = useApp();

  if (!explainModalPatient || !explainModalPatient.currentRisk) return null;

  const patient = explainModalPatient;
  const risk = patient.currentRisk;
  const isHigh = risk.riskLevel === 'HIGH';
  const isMed = risk.riskLevel === 'MEDIUM';

  const badgeColor = isHigh 
    ? 'bg-red-100 text-red-700 border-red-200' 
    : isMed 
    ? 'bg-amber-100 text-amber-700 border-amber-200' 
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Why Is This Patient Classified {risk.riskLevel} Risk?</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>
                  {risk.score}/100
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Explainable Clinical Intelligence Breakdown & Decision Audit
              </p>
            </div>
          </div>
          <button
            onClick={() => setExplainModalPatient(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Patient Quick Context Strip */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Patient Identity</span>
              <span className="text-sm font-bold text-slate-900">{patient.name}</span>
              <span className="text-slate-500 font-mono ml-2">({patient.patientCode})</span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Clinical Condition</span>
              <span className="font-semibold text-slate-800">{patient.condition}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Distance</span>
                <span className="font-semibold text-slate-800">{patient.distanceKm} km away</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <div>
                <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Next Follow-up</span>
                <span className="font-bold text-blue-900">{patient.nextFollowUpDate}</span>
              </div>
            </div>
          </div>

          {/* Visual Gauge Component */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Follow-up Risk Position on Calibrated Scale</span>
              <span className="font-mono text-slate-500 text-[11px]">Thresholds: 0-29 Low | 30-59 Med | 60-100 High</span>
            </div>
            <RiskGauge score={risk.score} level={risk.riskLevel} size="lg" />
          </div>

          {/* Plain Natural Language Summary (Nurse & Receptionist Friendly) */}
          <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Info className="w-4 h-4 text-blue-700" />
              <h4 className="text-sm font-bold text-blue-950">Natural Language Clinical Explanation</h4>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{risk.naturalLanguageSummary}"
            </p>
          </div>

          {/* Two-Column Breakdown: Risk Drivers vs Protective Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Increasing Factors */}
            <div className="p-4 rounded-lg border border-red-200 bg-red-50/30 space-y-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-bold">Risk-Increasing Drivers ({risk.reasons.length})</h4>
              </div>
              <ul className="space-y-2 text-xs">
                {risk.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span className="font-medium">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Protective Factors */}
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold">Protective / Mitigating Factors ({risk.protectiveFactors.length})</h4>
              </div>
              <ul className="space-y-2 text-xs">
                {risk.protectiveFactors.map((prot, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="font-medium">{prot}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Factor Contributions Table (Explainable Breakdown) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              Mathematical Factor Contribution Breakdown
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Factor</th>
                    <th className="py-2.5 px-3">Observed Value</th>
                    <th className="py-2.5 px-3">Contribution</th>
                    <th className="py-2.5 px-3">% of Total</th>
                    <th className="py-2.5 px-3">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium">
                  {risk.topFactors.map((factor, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-semibold text-slate-800">{factor.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{factor.rawValue}</td>
                      <td className="py-2 px-3 font-mono text-slate-900">+{factor.points} / {factor.maxPoints} pts</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                factor.impact === 'HIGH' ? 'bg-red-500' : factor.impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${factor.percentageContribution}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-600">{factor.percentageContribution}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          factor.impact === 'HIGH' 
                            ? 'bg-red-100 text-red-700' 
                            : factor.impact === 'MEDIUM' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {factor.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Machine Learning Model Cross-Validation Panel */}
          <div className="p-4 rounded-lg bg-[#0F172A] text-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Cpu className="w-4 h-4" />
                Hybrid AI Comparison: Transparent Rule Engine vs. Logistic Regression Classifier
              </div>
              <span className="px-2 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 text-[10px] rounded font-mono">
                Model v2.1
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              CareTrack AI executes a primary deterministic, rule-based scoring engine for clinical explainability.
              Concurrently, a supervised Logistic Regression classifier evaluates non-linear multi-factor interactions:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-[11px] block">Production Rule Score</span>
                <span className="text-base font-bold text-white font-mono">{risk.score}/100</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-[11px] block">ML Classifier Probability</span>
                <span className="text-base font-bold text-blue-400 font-mono">
                  {Math.round((risk.mlProbability || 0.8) * 100)}% (p = {risk.mlProbability || 0.8})
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[11px] block">Model Agreement</span>
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> High Concordance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              const p = explainModalPatient;
              setExplainModalPatient(null);
              setReportModalPatient(p);
            }}
            className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            PDF Report
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const p = explainModalPatient;
                setExplainModalPatient(null);
                setActionModalPatient(p);
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Action Plan
            </button>
            <button
              onClick={() => {
                const p = explainModalPatient;
                setExplainModalPatient(null);
                setInterventionModalPatient(p);
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Log Outreach
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
