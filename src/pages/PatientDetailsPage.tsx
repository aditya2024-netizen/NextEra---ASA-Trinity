import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Appointment, Intervention, RiskPrediction } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { RiskSimulator } from '../components/RiskSimulator';
import { AppointmentTimeline } from '../components/AppointmentTimeline';
import { 
  ArrowLeft, 
  HelpCircle, 
  Zap, 
  FileText, 
  PhoneCall, 
  Calendar, 
  MapPin, 
  User, 
  Activity, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Stethoscope,
  Edit,
  BrainCircuit,
  Phone,
  Lock
} from 'lucide-react';

export const PatientDetailsPage: React.FC = () => {
  const { 
    selectedPatientId, 
    setCurrentPage, 
    setExplainModalPatient, 
    setActionModalPatient, 
    setReportModalPatient,
    setEditPatientModal,
    setContactPatientModal,
    runAnalyzerForPatient,
    isAnalyzing,
    setIsAdminLoginModalOpen,
    patientRefreshKey,
    addToast
  } = useApp();
  const { isAdmin } = useAuth();

  const [patientData, setPatientData] = useState<{
    patient: Patient;
    appointments: Appointment[];
    interventions: Intervention[];
    riskAnalysis: RiskPrediction;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPatient = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getPatientById(id);
      if (res.success) {
        setPatientData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatient(selectedPatientId);
    }
  }, [selectedPatientId, patientRefreshKey]);

  if (loading) {
    return (
      <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading Patient Clinical Dossier...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Patient Record Not Found</h3>
        <button
          onClick={() => setCurrentPage('patients')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Patient Directory
        </button>
      </div>
    );
  }

  const { patient, appointments, interventions, riskAnalysis } = patientData;
  const isHigh = riskAnalysis.riskLevel === 'HIGH';
  const isMed = riskAnalysis.riskLevel === 'MEDIUM';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation & Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setCurrentPage('patients')}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Patient Directory
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Edit Details */}
          {isAdmin ? (
            <button
              onClick={() => setEditPatientModal(patient)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-4 h-4 text-blue-600" />
              Edit Details (Admin)
            </button>
          ) : (
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Admin login required to edit"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              Log In as Admin to Edit
            </button>
          )}

          {/* Submit to Analyzer */}
          <button
            onClick={() => runAnalyzerForPatient(patient)}
            disabled={isAnalyzing}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <BrainCircuit className="w-4 h-4 text-blue-600" />
            Submit to Analyzer
          </button>

          {/* Contact Patient via Phone / SMS */}
          <button
            onClick={() => setContactPatientModal({ patient })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            Contact Patient ({patient.phone})
          </button>

          <button
            onClick={() => selectedPatientId && loadPatient(selectedPatientId)}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Refresh Dossier Data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setReportModalPatient(patient)}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            title="Download PDF Dossier"
          >
            <FileText className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Patient Dossier Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Patient Identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                  {patient.patientCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  isHigh ? 'bg-red-50 text-red-700 border-red-200' : isMed ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {riskAnalysis.riskLevel} RISK ({riskAnalysis.score}/100)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{patient.age} years old • {patient.gender}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {patient.distanceKm} km from clinic ({patient.transportAccess || 'Standard'})
                </span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  {patient.condition}
                </span>
                <a 
                  href={`tel:${patient.phone}`} 
                  className="font-mono font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {patient.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Right: Key Follow-up Milestones */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Next Follow-up Due</span>
              <span className="text-sm font-bold text-blue-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {patient.nextFollowUpDate}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Attendance Record</span>
              <span className="font-bold text-slate-800">
                {patient.attendedAppointments}/{patient.totalAppointments} attended ({patient.attendanceRate}%)
              </span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Treatment Phase</span>
              <span className="font-bold text-slate-800">
                {patient.treatmentDurationMonths} mos active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Risk Card + Simulator + Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Risk Score & Gauge Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Explainable Risk Calculation</h3>
                <p className="text-xs text-slate-500">Mathematical point contribution per clinical factor.</p>
              </div>
              <span className="text-xs font-mono text-slate-600 font-semibold">
                Certainty: {Math.round((riskAnalysis.confidence ?? 0.94) * 100)}%
              </span>
            </div>

            <RiskGauge score={riskAnalysis.score} level={riskAnalysis.riskLevel} size="lg" />

            {/* Rationale Banner */}
            <div className="p-3.5 bg-blue-50/70 rounded-lg border border-blue-100 text-xs text-slate-800 space-y-1">
              <span className="font-bold text-blue-950 block">AI Clinical Rationale:</span>
              <p className="italic text-slate-700">"{riskAnalysis.naturalLanguageSummary}"</p>
            </div>

            {/* Contributing Factors Bars */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Factor Contribution Breakdown
              </span>
              {riskAnalysis.topFactors.map((f, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{f.name} ({f.rawValue})</span>
                    <span className="font-mono text-slate-900 font-bold">+{f.points} / {f.maxPoints} pts</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        f.impact === 'HIGH' ? 'bg-red-500' : f.impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive What-If Simulator */}
          <RiskSimulator patient={patient} />

          {/* Attendance Timeline */}
          <AppointmentTimeline patient={patient} appointments={appointments} />
        </div>

        {/* Right Column (5 cols): Clinical Action Plan + Interventions Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Playbook */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Recommended Action Plan</h3>
                <p className="text-xs text-slate-500">Actionable clinical follow-up protocol</p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-100 text-xs space-y-1.5">
              <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wider">Primary Immediate Action</span>
              <h4 className="font-extrabold text-blue-950 text-sm">{riskAnalysis.immediateAction}</h4>
              <p className="text-slate-700 leading-relaxed">
                Execute telephone check-in to confirm transport, answer clinical medication queries, and verify appointment time.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Supporting Protocol Actions:</span>
              <ul className="space-y-1.5 text-slate-600">
                {riskAnalysis.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Closed-Loop Intervention Outreach History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Intervention History</h3>
                <p className="text-xs text-slate-500">Staff outreach log for this patient.</p>
              </div>
              <button
                onClick={() => setContactPatientModal({ patient })}
                className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Record
              </button>
            </div>

            {interventions.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                No outreach interventions recorded yet. Click "Log Outreach" to create the first record.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {interventions.map(interv => (
                  <div key={interv.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{interv.type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {interv.status}
                      </span>
                    </div>
                    <p className="text-slate-600 italic">"{interv.notes}"</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                      <span>Staff: {interv.staffName} ({interv.staffRole})</span>
                      <span>{new Date(interv.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
