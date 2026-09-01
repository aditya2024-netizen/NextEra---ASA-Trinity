import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  RefreshCw,
  X,
  Check,
  Edit,
  BrainCircuit,
  Phone,
  Lock,
  ShieldCheck,
  PhoneCall,
  Activity,
  ArrowRight,
  Map,
  Languages,
  Navigation
} from 'lucide-react';
import { MapAddressPicker } from '../components/MapAddressPicker';

const INDIAN_LANGUAGES = [
  'Hindi',
  'English',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Urdu',
  'Kannada',
  'Malayalam',
  'Odia',
  'Punjabi'
];

export const PatientsPage: React.FC = () => {
  const { 
    viewPatientDetails, 
    addToast, 
    setEditPatientModal, 
    setContactPatientModal, 
    runAnalyzerForPatient,
    isAnalyzing 
  } = useApp();
  const { isAdmin, user } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // New Patient Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 48,
    gender: 'Female',
    phone: '+91 98101 ',
    email: '',
    address: 'Sector 14, Gurugram, Haryana - 122001',
    latitude: 28.4595,
    longitude: 77.0266,
    preferredLanguage: 'Hindi',
    condition: 'Post-Percutaneous Coronary Intervention (PCI)',
    treatmentType: 'Dual Antiplatelet Therapy (DAPT) Protocol',
    assignedDoctor: 'Dr. Rajesh Kulkarni, MD, DM',
    distanceKm: 28,
    treatmentDurationMonths: 12,
    appointmentFrequencyDays: 30,
    totalAppointments: 6,
    attendedAppointments: 4,
    missedAppointments: 2,
    transportAccess: 'Personal',
    nextFollowUpDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.getPatients({
        search,
        riskLevel: riskLevel === 'ALL' ? undefined : riskLevel,
        page,
        limit: 15,
      });
      if (res.success) {
        setPatients(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, riskLevel, page]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      addToast('error', 'Admin Access Required', 'Only hospital administrators can enroll new outpatient records.');
      return;
    }

    try {
      const res = await api.createPatient(newPatient as any);
      if (res.success) {
        addToast('success', 'Patient Enrolled', `Registered ${res.data.name} (${res.data.patientCode}) with baseline risk score ${res.data.currentRisk?.score}/100.`);
        setIsAddModalOpen(false);
        // Reset form
        setNewPatient({
          name: '',
          age: 48,
          gender: 'Female',
          phone: '+91 98101 ',
          email: '',
          address: 'Sector 14, Gurugram, Haryana - 122001',
          latitude: 28.4595,
          longitude: 77.0266,
          preferredLanguage: 'Hindi',
          condition: 'Post-Percutaneous Coronary Intervention (PCI)',
          treatmentType: 'Dual Antiplatelet Therapy (DAPT) Protocol',
          assignedDoctor: 'Dr. Rajesh Kulkarni, MD, DM',
          distanceKm: 28,
          treatmentDurationMonths: 12,
          appointmentFrequencyDays: 30,
          totalAppointments: 6,
          attendedAppointments: 4,
          missedAppointments: 2,
          transportAccess: 'Personal',
          nextFollowUpDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        });
        fetchPatients();
      }
    } catch (err) {
      addToast('error', 'Enrollment Failed', 'Could not create patient record.');
    }
  };

  const handleMapLocationSelect = (loc: {
    address: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }) => {
    setNewPatient(prev => ({
      ...prev,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      distanceKm: loc.distanceKm,
    }));
    setShowMapPicker(false);
    addToast('info', 'Address Calibrated from Map', `${loc.address} (${loc.distanceKm} km to clinic).`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Admin Privilege Banner */}
      {isAdmin ? (
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Administrator Authority Active ({user?.name}):</span>
              <span className="ml-1 text-emerald-800">
                You have exclusive permissions to view, edit all patient records, submit details to the Clinical Analyzer, and dispatch outreach directly to patient phone numbers.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-md shrink-0">
            Full Admin Access
          </span>
        </div>
      ) : (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Staff View Mode ({user?.role}):</span>
              <span className="ml-1 text-amber-800">
                Hospital Administrator credentials are required to enroll new patients or modify clinical registries.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-bold text-[10px] uppercase tracking-wider rounded-md shrink-0">
            Read-Only Registry
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Patient Clinical Directory & Records
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
              {total} Patients
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect all patient details, edit demographics & appointments, run AI analysis, and initiate patient phone outreach.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Enroll New Patient</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search cohort by patient name, patient code, phone, or condition..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={riskLevel}
            onChange={e => { setRiskLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-600 w-full sm:w-auto"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <button
            onClick={() => fetchPatients()}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh Cohort"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-[#0F172A] font-bold text-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Patient Code & Name</th>
                <th className="py-3.5 px-4">Phone (Outreach)</th>
                <th className="py-3.5 px-4">Clinical Condition</th>
                <th className="py-3.5 px-4">Distance & Language</th>
                <th className="py-3.5 px-4">Adherence</th>
                <th className="py-3.5 px-4">Next Visit</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4 text-right">Admin Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {patients.map(p => {
                const r = p.currentRisk;
                const isHigh = r?.riskLevel === 'HIGH';
                const isMed = r?.riskLevel === 'MEDIUM';

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Patient Name */}
                    <td 
                      className="py-3.5 px-4 cursor-pointer"
                      onClick={() => viewPatientDetails(p.id)}
                    >
                      <div className="font-bold text-slate-900 hover:text-blue-600 text-sm">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.patientCode} • {p.age}y {p.gender}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3.5 px-4">
                      <a 
                        href={`tel:${p.phone}`}
                        className="font-mono font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.phone}</span>
                      </a>
                      <span className="text-[10px] text-slate-400 block">{p.preferredLanguage || 'Hindi'}</span>
                    </td>

                    {/* Condition */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {p.condition}
                      <span className="text-[10px] text-slate-400 block">{p.treatmentType || 'Standard Care'}</span>
                    </td>

                    {/* Distance & Language */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className={`font-semibold ${p.distanceKm > 30 ? 'text-amber-700 font-bold' : ''}`}>
                        {p.distanceKm} km
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[120px]" title={p.address || ''}>
                        {p.address ? p.address.split(',')[0] : p.transportAccess}
                      </span>
                    </td>

                    {/* Attendance */}
                    <td className="py-3.5 px-4">
                      <span className={`font-bold font-mono ${p.attendanceRate < 70 ? 'text-red-700' : 'text-slate-900'}`}>
                        {p.attendanceRate}%
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        ({p.missedAppointments} missed / {p.totalAppointments} total)
                      </span>
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{p.nextFollowUpDate}</span>
                      <span className="text-[10px] text-slate-400 block">{p.assignedDoctor || 'Assigned MD'}</span>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-sm ${
                          isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {r?.score || 50}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh ? 'bg-red-50 text-red-800 border border-red-200' : isMed ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {r?.riskLevel}
                        </span>
                      </div>
                    </td>

                    {/* Action Buttons: Edit, Analyze, Contact */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {/* 1. Admin Edit Details */}
                        {isAdmin ? (
                          <button
                            onClick={() => setEditPatientModal(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Admin: Edit all patient details"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => addToast('info', 'Admin Access Required', 'Sign in as Admin to edit patient details.')}
                            className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs flex items-center gap-1"
                            title="Admin required to edit"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}

                        {/* 2. Admin Give to Analyzer */}
                        <button
                          onClick={() => runAnalyzerForPatient(p)}
                          disabled={isAnalyzing}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-blue-200"
                          title="Submit details to Clinical Risk Analyzer"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                          <span>Analyze</span>
                        </button>

                        {/* 3. Contact Patient (Phone) */}
                        <button
                          onClick={() => setContactPatientModal({ patient: p })}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                          title="Contact patient via Phone or SMS"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Contact</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-slate-500">
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total patients)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Enroll Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Enroll New Outpatient Record</h3>
                <p className="text-xs text-slate-300">Enter demographics, address locator, preferred language & clinical parameters</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.name}
                    onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="e.g. Rameshwar Sharma"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="+91 98100 00000"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={newPatient.age}
                    onChange={e => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Language *</label>
                  <select
                    value={newPatient.preferredLanguage}
                    onChange={e => setNewPatient({ ...newPatient, preferredLanguage: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    {INDIAN_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address with Map Locator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Residential Address / Locality</label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Locate on Map</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newPatient.address}
                    onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
                    placeholder="Locality, City, State, PIN code"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                {newPatient.latitude && newPatient.longitude && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>Calibrated GPS: {newPatient.latitude}° N, {newPatient.longitude}° E • {newPatient.distanceKm} km from Clinic</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Condition *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.condition}
                    onChange={e => setNewPatient({ ...newPatient, condition: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Physician</label>
                  <input
                    type="text"
                    value={newPatient.assignedDoctor}
                    onChange={e => setNewPatient({ ...newPatient, assignedDoctor: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    value={newPatient.distanceKm}
                    onChange={e => setNewPatient({ ...newPatient, distanceKm: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Scheduled</label>
                  <input
                    type="number"
                    value={newPatient.totalAppointments}
                    onChange={e => setNewPatient({ ...newPatient, totalAppointments: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-red-700 mb-1">Missed Visits</label>
                  <input
                    type="number"
                    value={newPatient.missedAppointments}
                    onChange={e => setNewPatient({ ...newPatient, missedAppointments: Number(e.target.value) })}
                    className="w-full p-2 bg-red-50 border border-red-200 rounded-lg text-red-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-blue-900 mb-1">Next Follow-up</label>
                  <input
                    type="date"
                    value={newPatient.nextFollowUpDate}
                    onChange={e => setNewPatient({ ...newPatient, nextFollowUpDate: e.target.value })}
                    className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save & Calculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Map Sub-Modal for Add Patient */}
      {showMapPicker && (
        <MapAddressPicker
          initialAddress={newPatient.address}
          initialLat={newPatient.latitude}
          initialLng={newPatient.longitude}
          initialDistance={newPatient.distanceKm}
          onSelectLocation={handleMapLocationSelect}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};
