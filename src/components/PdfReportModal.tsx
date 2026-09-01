import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Printer, Download, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const PdfReportModal: React.FC = () => {
  const { reportModalPatient, setReportModalPatient } = useApp();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  if (!reportModalPatient || !reportModalPatient.currentRisk) return null;

  const patient = reportModalPatient;
  const risk = patient.currentRisk;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Toolbar (hidden on print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold">Printable Clinical Follow-up Risk Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={() => setReportModalPatient(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans text-xs print:p-0">
          {/* Header & Hospital Branding */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                  CT
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-blue-950">CareTrack AI</h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Explainable Patient Follow-up Risk Intelligence Platform</p>
              <p className="text-[10px] text-slate-400">Department of Outpatient Clinical Coordination</p>
            </div>
            <div className="text-right text-[11px] space-y-0.5">
              <span className="font-bold text-slate-900 block">PATIENT FOLLOW-UP RISK AUDIT</span>
              <span className="text-slate-500 block">Report Generated: {new Date().toLocaleDateString()}</span>
              <span className="text-slate-500 font-mono">Ref: {risk.id}</span>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
              <span className="text-sm font-bold text-slate-900">{patient.name}</span>
              <span className="text-slate-500 block font-mono">ID: {patient.patientCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Demographics & Distance</span>
              <span className="font-medium text-slate-800">{patient.age} yrs • {patient.gender}</span>
              <span className="text-slate-600 block">{patient.distanceKm} km from hospital</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Follow-up Schedule</span>
              <span className="text-sm font-bold text-blue-900">{patient.nextFollowUpDate}</span>
              <span className="text-slate-500 block">Every {patient.appointmentFrequencyDays} days</span>
            </div>
          </div>

          {/* Risk Score Summary Banner */}
          <div className="p-4 rounded-xl border-2 border-slate-300 bg-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Calculated Follow-up Non-Attendance Risk
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900">{risk.score} / 100</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  risk.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' : risk.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {risk.riskLevel} RISK
                </span>
              </div>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-slate-500 block">Assigned Doctor:</span>
              <span className="font-bold text-slate-900">{patient.assignedDoctor}</span>
            </div>
          </div>

          {/* Rationale & Reasons */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              1. Clinical Risk Rationale
            </h3>
            <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 italic">
              "{risk.naturalLanguageSummary}"
            </p>
          </div>

          {/* Factors Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              2. Contributing Risk Factor Breakdown
            </h3>
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-3">Factor</th>
                  <th className="py-2 px-3">Observed Value</th>
                  <th className="py-2 px-3">Risk Points</th>
                  <th className="py-2 px-3">Clinical Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {risk.topFactors.map((f, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-3 font-semibold">{f.name}</td>
                    <td className="py-1.5 px-3 font-mono text-slate-600">{f.rawValue}</td>
                    <td className="py-1.5 px-3 font-mono font-bold">+{f.points} pts</td>
                    <td className="py-1.5 px-3">{f.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommended Intervention Strategy */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              3. Recommended Clinical Action Plan
            </h3>
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-950 text-xs">Primary Intervention:</span>
                <span className="font-extrabold text-blue-900 text-sm">{risk.immediateAction}</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {risk.recommendedActions.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Signatures & Ethical Disclaimer */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8">
            <div>
              <span className="text-[10px] text-slate-400 block mb-6">Reviewing Clinical Coordinator Signature:</span>
              <div className="border-b border-slate-400 pb-1 font-semibold text-slate-700">
                {user?.name || 'Dr. Sarah Jenkins, MD'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-6">Date of Clinical Review:</span>
              <div className="border-b border-slate-400 pb-1 font-semibold text-slate-700">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Mandated Safety Disclaimer */}
          <div className="p-2.5 bg-slate-100 rounded text-[10px] text-slate-500 leading-normal text-center">
            <strong>Ethical AI Notice:</strong> This system is an operational decision-support tool to prioritize follow-up appointment outreach and does not replace medical diagnosis, treatment plans, or clinician judgement.
          </div>
        </div>
      </div>
    </div>
  );
};
