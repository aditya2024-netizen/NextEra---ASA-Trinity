import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient } from '../types';
import { 
  X, 
  Check, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Lock, 
  AlertCircle,
  Map,
  Navigation
} from 'lucide-react';
import { MapAddressPicker } from './MapAddressPicker';

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

export const EditPatientModal: React.FC = () => {
  const { editPatientModal, setEditPatientModal, addToast, refreshDashboard, viewPatientDetails } = useApp();
  const { isAdmin, user } = useAuth();

  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);

  useEffect(() => {
    if (editPatientModal) {
      setFormData({
        name: editPatientModal.name || '',
        age: editPatientModal.age || 45,
        gender: editPatientModal.gender || 'Female',
        phone: editPatientModal.phone || '+91 ',
        email: editPatientModal.email || '',
        address: editPatientModal.address || '',
        latitude: editPatientModal.latitude || 28.6139,
        longitude: editPatientModal.longitude || 77.2090,
        distanceKm: editPatientModal.distanceKm || 10,
        condition: editPatientModal.condition || '',
        treatmentType: editPatientModal.treatmentType || '',
        treatmentStartDate: editPatientModal.treatmentStartDate || '',
        treatmentDurationMonths: editPatientModal.treatmentDurationMonths || 6,
        appointmentFrequencyDays: editPatientModal.appointmentFrequencyDays || 30,
        totalAppointments: editPatientModal.totalAppointments || 5,
        attendedAppointments: editPatientModal.attendedAppointments || 3,
        missedAppointments: editPatientModal.missedAppointments || 2,
        nextFollowUpDate: editPatientModal.nextFollowUpDate || '',
        assignedDoctor: editPatientModal.assignedDoctor || 'Dr. Rajesh Kulkarni, MD, DM',
        preferredLanguage: editPatientModal.preferredLanguage || 'Hindi',
        transportAccess: editPatientModal.transportAccess || 'Personal',
      });
      setErrorMsg('');
      setShowMapPicker(false);
    }
  }, [editPatientModal]);

  if (!editPatientModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Administrative privileges are required to modify clinical patient records.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.updatePatient(editPatientModal.id, formData);
      if (res.success) {
        addToast('success', 'Patient Details Updated', `Administrator updated details for ${formData.name} (${editPatientModal.patientCode}).`);
        setEditPatientModal(null);
        await refreshDashboard();
        viewPatientDetails(editPatientModal.id);
      } else {
        setErrorMsg('Failed to update patient details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving patient changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapLocationSelect = (loc: {
    address: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }) => {
    setFormData(prev => ({
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
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Edit Patient Clinical & Follow-up Details</h3>
                  <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Admin Controlled
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Patient Code: <span className="font-mono font-bold text-white">{editPatientModal.patientCode}</span> • ID: {editPatientModal.id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditPatientModal(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!isAdmin && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Administrator Authorization Required</span>
                  <span>You are currently in view mode as {user?.role || 'Staff'}. Please switch or sign in as Admin to commit edits.</span>
                </div>
              </div>
            )}

            {/* Section 1: Demographics & Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Demographics & Contact Coordinates</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number (For WhatsApp / SMS) *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="+91 98100 00000"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="patient@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age || 45}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender || 'Female'}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Language</label>
                  <select
                    value={formData.preferredLanguage || 'Hindi'}
                    onChange={e => setFormData({ ...formData, preferredLanguage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  >
                    {INDIAN_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distance to Clinic (km)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={formData.distanceKm || 10}
                    onChange={e => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Address with Map Locator Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Residential Address / Locality</label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Locate / Pick on Map</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="Street, locality, landmark, city, state, pin code"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-slate-400" />
                    <span>GPS Coordinates: {formData.latitude}° N, {formData.longitude}° E</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Clinical Condition & Care Plan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>2. Clinical Condition & Care Management</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Diagnosis / Condition *</label>
                  <input
                    type="text"
                    required
                    value={formData.condition || ''}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="e.g., Post-Percutaneous Coronary Intervention (PCI)"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Treatment Regimen / Type</label>
                  <input
                    type="text"
                    value={formData.treatmentType || ''}
                    onChange={e => setFormData({ ...formData, treatmentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="e.g., Dual Antiplatelet Therapy (DAPT) Protocol"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Physician</label>
                  <input
                    type="text"
                    value={formData.assignedDoctor || ''}
                    onChange={e => setFormData({ ...formData, assignedDoctor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Treatment Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.treatmentDurationMonths || 6}
                    onChange={e => setFormData({ ...formData, treatmentDurationMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Appointment Cadence (Days)</label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={formData.appointmentFrequencyDays || 30}
                    onChange={e => setFormData({ ...formData, appointmentFrequencyDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Follow-up Scheduling & Attendance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>3. Follow-up Schedule & Historical Adherence</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-blue-900 mb-1">Next Follow-up Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.nextFollowUpDate || ''}
                    onChange={e => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-xs font-bold text-blue-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Scheduled</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.totalAppointments || 1}
                    onChange={e => {
                      const total = Number(e.target.value);
                      const missed = formData.missedAppointments || 0;
                      setFormData({ 
                        ...formData, 
                        totalAppointments: total,
                        attendedAppointments: Math.max(0, total - missed)
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-red-700 mb-1">Missed Appointments</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalAppointments || 100}
                    value={formData.missedAppointments || 0}
                    onChange={e => {
                      const missed = Number(e.target.value);
                      const total = formData.totalAppointments || 1;
                      setFormData({ 
                        ...formData, 
                        missedAppointments: missed,
                        attendedAppointments: Math.max(0, total - missed)
                      });
                    }}
                    className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-800 focus:outline-hidden focus:border-red-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transport Mode</label>
                  <select
                    value={formData.transportAccess || 'Personal'}
                    onChange={e => setFormData({ ...formData, transportAccess: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Personal">Personal Vehicle (Two-Wheeler/Car)</option>
                    <option value="Public Transit">Public Bus / Indian Railways / Metro</option>
                    <option value="Requires Assistance">Requires Auto / Hospital Shuttle</option>
                    <option value="None">No Reliable Transit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditPatientModal(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save & Recalculate Risk'}
                <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Map Address Picker Sub-Modal */}
      {showMapPicker && (
        <MapAddressPicker
          initialAddress={formData.address}
          initialLat={formData.latitude}
          initialLng={formData.longitude}
          initialDistance={formData.distanceKm}
          onSelectLocation={handleMapLocationSelect}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </>
  );
};
