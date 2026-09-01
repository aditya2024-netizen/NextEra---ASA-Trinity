import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, AnalyzerFindings } from '../types';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Phone,
  PhoneCall,
  User,
  ShieldCheck,
  Calendar,
  MapPin,
  Send,
  Lock,
  MessageSquare
} from 'lucide-react';

export const PredictionPage: React.FC = () => {
  const { 
    setContactPatientModal, 
    setEditPatientModal, 
    addToast 
  } = useApp();
  const { isAdmin, user } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  // Input fields for Analyzer
  const [name, setName] = useState<string>('Rameshwar Sharma');
  const [phone, setPhone] = useState<string>('+91 98101 22334');
  const [condition, setCondition] = useState<string>('Post-Percutaneous Coronary Intervention (PCI)');
  const [assignedDoctor, setAssignedDoctor] = useState<string>('Dr. Rajesh Kulkarni, MD, DM');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [age, setAge] = useState<number>(58);
  const [distanceKm, setDistanceKm] = useState<number>(38);
  const [treatmentDurationMonths, setTreatmentDurationMonths] = useState<number>(12);
  const [missedAppointments, setMissedAppointments] = useState<number>(3);
  const [totalAppointments, setTotalAppointments] = useState<number>(8);
  const [appointmentFrequencyDays, setAppointmentFrequencyDays] = useState<number>(30);
  const [transportAccess, setTransportAccess] = useState<string>('Public Bus');

  const [findings, setFindings] = useState<AnalyzerFindings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch cohort patients to populate patient selector
  useEffect(() => {
    api.getPatients({ limit: 20 }).then(res => {
      if (res.success && res.data.length > 0) {
        setPatients(res.data);
        // Select first patient
        const p = res.data[0];
        setSelectedPatientId(p.id);
        loadPatientIntoForm(p);
      }
    });
  }, []);

  const loadPatientIntoForm = (p: Patient) => {
    setName(p.name);
    setPhone(p.phone || '+91 98101 22334');
    setCondition(p.condition);
    setAssignedDoctor(p.assignedDoctor || 'Dr. Rajesh Kulkarni, MD, DM');
    setNextFollowUpDate(p.nextFollowUpDate);
    setAge(p.age);
    setDistanceKm(p.distanceKm);
    setTreatmentDurationMonths(p.treatmentDurationMonths || 12);
    setMissedAppointments(p.missedAppointments);
    setTotalAppointments(p.totalAppointments);
    setAppointmentFrequencyDays(p.appointmentFrequencyDays || 30);
    setTransportAccess(p.transportAccess || 'Personal');
  };

  const handlePatientSelectChange = (pId: string) => {
    setSelectedPatientId(pId);
    const found = patients.find(p => p.id === pId);
    if (found) {
      loadPatientIntoForm(found);
    }
  };

  const handleRunAnalyzer = async () => {
    setLoading(true);
    try {
      const patientPayload: any = {
        id: selectedPatientId || 'PAT-CUSTOM',
        patientCode: selectedPatientId ? (patients.find(p => p.id === selectedPatientId)?.patientCode || 'P-1042') : 'P-CUSTOM',
        name,
        phone,
        condition,
        assignedDoctor,
        nextFollowUpDate,
        age,
        distanceKm,
        treatmentDurationMonths,
        missedAppointments,
        totalAppointments,
        attendedAppointments: Math.max(0, totalAppointments - missedAppointments),
        appointmentFrequencyDays,
        transportAccess,
      };

      const res = await api.runAnalyzer(patientPayload);
      if (res.success && res.data) {
        setFindings(res.data);
        addToast('success', 'Analyzer Findings Generated', `Analysis completed for ${name}. Risk Score: ${res.data.riskScore}/100.`);
      }
    } catch (err: any) {
      addToast('error', 'Analyzer Failed', err.message || 'Could not run analyzer.');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount once
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRunAnalyzer();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleContactPatient = () => {
    if (!findings) return;
    const dummyPatient: any = {
      id: selectedPatientId || 'PAT-1042',
      patientCode: findings.patientCode,
      name: findings.patientName,
      phone: findings.phone,
      condition: findings.condition,
      nextFollowUpDate: findings.nextFollowUpDate,
      assignedDoctor,
      currentRisk: {
        score: findings.riskScore,
        riskLevel: findings.riskLevel,
      }
    };

    setContactPatientModal({
      patient: dummyPatient,
      findings,
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Admin Status Banner */}
      {isAdmin ? (
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Clinical Risk Analyzer Pipeline:</span>
              <span className="ml-1 text-emerald-800">
                Admin gives patient parameters to the Analyzer → Analyzer returns actionable findings → Admin contacts patient and sends details.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-md shrink-0">
            Admin Workflow
          </span>
        </div>
      ) : (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Staff View Mode ({user?.role}):</span>
              <span className="ml-1 text-amber-800">
                Log in with Hospital Administrator credentials to alter clinical baseline variables or dispatch direct SMS/WhatsApp notifications.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-bold text-[10px] uppercase tracking-wider rounded-md shrink-0">
            Read-Only Analyzer
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Clinical Risk & Adherence Analyzer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit outpatient clinical metrics to generate risk predictions, identify hazards, and formulate patient outreach communications.
            </p>
          </div>
        </div>

        {/* Patient Fast Selector */}
        {patients.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Patient:</label>
            <select
              value={selectedPatientId}
              onChange={e => handlePatientSelectChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white w-full sm:w-64"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientCode}) - {p.condition}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Input Details (Step 1) & Analyzer Findings (Step 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Admin takes details and gives to Analyzer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Admin Patient Details Input</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Step 1
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Patient Name & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  placeholder="+91 98100 00000"
                />
              </div>
            </div>

            {/* Condition & Doctor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Physician</label>
                <input
                  type="text"
                  value={assignedDoctor}
                  onChange={e => setAssignedDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block font-bold text-blue-900 mb-1">Next Scheduled Follow-up Due</label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg font-bold text-blue-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Sliders for Clinical & Attendance Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Missed Appointments */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Missed Visits:</span>
                  <span className="font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {missedAppointments} missed / {totalAppointments} total
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={missedAppointments}
                  onChange={e => setMissedAppointments(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Distance */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Distance to Clinic:</span>
                  <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {distanceKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={distanceKm}
                  onChange={e => setDistanceKm(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Treatment Duration */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Treatment Duration:</span>
                  <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {treatmentDurationMonths} months
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="36"
                  step="1"
                  value={treatmentDurationMonths}
                  onChange={e => setTreatmentDurationMonths(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Cadence */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-700">Appointment Cadence:</span>
                  <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    Every {appointmentFrequencyDays} days
                  </span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="180"
                  step="7"
                  value={appointmentFrequencyDays}
                  onChange={e => setAppointmentFrequencyDays(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Trigger Button: Submit to Analyzer */}
            <button
              type="button"
              onClick={handleRunAnalyzer}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzer Processing Data...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Submit Details to Analyzer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2 & 3: Analyzer Returns Findings & Contact Patient (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {findings ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
              {/* Findings Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Analyzer Findings Delivered to Admin</h3>
                    <p className="text-[11px] text-slate-500">
                      Calculated for {findings.patientName} • Follow-up due: {findings.nextFollowUpDate}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Analysis Complete
                </span>
              </div>

              {/* Score & Risk Tier Display */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-xs ${
                    findings.riskLevel === 'HIGH' ? 'bg-red-600' : findings.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}>
                    <span className="text-2xl leading-none">{findings.riskScore}</span>
                    <span className="text-[9px] uppercase tracking-wider">/ 100</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        findings.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : findings.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {findings.riskLevel} FOLLOW-UP RISK
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Certainty: {findings.confidence}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Primary Barrier: {distanceKm > 30 ? `Transit Distance (${distanceKm} km)` : 'Historical Missed Visits'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Recommended Outreach</span>
                  <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded-lg text-xs inline-block">
                    {findings.suggestedIntervention}
                  </span>
                </div>
              </div>

              {/* Primary Risk Drivers */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Primary Risk Drivers Identified by Analyzer
                </h4>
                <div className="space-y-1.5 text-xs">
                  {findings.primaryDrivers && findings.primaryDrivers.map((driver, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-slate-800">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Hazards Warning */}
              <div className="space-y-2">
                <h4 className="font-bold text-red-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Potential Hazards if Follow-up is Missed
                </h4>
                <div className="space-y-1.5 text-xs">
                  {findings.clinicalHazards && findings.clinicalHazards.map((hazard, idx) => (
                    <div key={idx} className="p-2.5 bg-red-50/70 border border-red-200 rounded-lg flex items-start gap-2 text-red-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{hazard}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Admin Action Banner -> Contact Patient */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                      Step 3: Admin Outreach to Patient
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Phone: {findings.phone}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The Analyzer has formulated customized care details and messages for <strong>{findings.patientName}</strong>. Admin can now place a direct voice call or dispatch SMS/WhatsApp instructions.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleContactPatient}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Contact Patient via Phone ({findings.phone})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href={`tel:${findings.phone}`}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Click to Dial</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
              <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Analyzer Ready for Data</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a registered outpatient from the list or modify the clinical parameters on the left, then click "Submit Details to Analyzer".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
