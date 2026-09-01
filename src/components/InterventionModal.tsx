import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InterventionType, InterventionStatus } from '../types';
import { X, CheckCircle, PhoneCall, AlertCircle, Calendar, MessageSquare, Send, Check } from 'lucide-react';

export const InterventionModal: React.FC = () => {
  const { interventionModalPatient, setInterventionModalPatient, addToast, refreshDashboard } = useApp();
  const { user } = useAuth();

  const [type, setType] = useState<InterventionType>('Priority Phone Call');
  const [status, setStatus] = useState<InterventionStatus>('Contacted');
  const [patientConfirmed, setPatientConfirmed] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('Spoke with patient directly. Addressed transit concerns and confirmed next appointment attendance.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!interventionModalPatient) return null;
  const patient = interventionModalPatient;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createIntervention({
        patientId: patient.id,
        patientCode: patient.patientCode,
        patientName: patient.name,
        predictionId: patient.currentRisk?.id,
        type,
        status,
        reason: `${patient.missedAppointments} missed appointments, distance ${patient.distanceKm} km.`,
        notes,
        patientConfirmedNextVisit: patientConfirmed,
      });

      if (res.success) {
        addToast('success', 'Intervention Logged', `Recorded '${type}' for ${patient.name}. Status: ${status}`);
        await refreshDashboard();
        setInterventionModalPatient(null);
      }
    } catch (err: any) {
      addToast('error', 'Logging Failed', err.message || 'Could not record intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Record Clinical Follow-up Intervention</h3>
            <p className="text-xs text-slate-300">
              Patient: {patient.name} ({patient.patientCode}) — Due: {patient.nextFollowUpDate}
            </p>
          </div>
          <button
            onClick={() => setInterventionModalPatient(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Staff Info Banner */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-600">
            <span>Logging Staff: <strong>{user?.name || 'Nurse Michael Chen, RN'}</strong></span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{user?.role || 'NURSE'}</span>
          </div>

          {/* Intervention Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Intervention Outreach Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as InterventionType)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="Priority Phone Call">Priority Phone Call</option>
              <option value="SMS Reminder">SMS Reminder + 2-Way Link</option>
              <option value="WhatsApp Notification">WhatsApp Interactive Confirmation</option>
              <option value="Teleconsultation Offer">Teleconsultation / Virtual Care Setup</option>
              <option value="Transport Assistance">Transport Assistance / Voucher Coordination</option>
              <option value="Community Health Worker Visit">Community Health Worker Outreach</option>
              <option value="Clinic Schedule Adjustment">Clinic Schedule Rebooking</option>
            </select>
          </div>

          {/* Intervention Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Outreach Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Contacted', 'Confirmed', 'Rescheduled', 'Completed', 'Escalated', 'Unable to Reach'] as InterventionStatus[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2 text-center rounded-lg border font-semibold transition-colors ${
                    status === st 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Confirmed Follow-up Checkbox */}
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmed-check"
              checked={patientConfirmed}
              onChange={e => setPatientConfirmed(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="confirmed-check" className="font-semibold text-emerald-900 cursor-pointer">
              Patient explicitly verified next follow-up date attendance
            </label>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Intervention Notes & Call Summary</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Record details of conversation, barrier resolved, or rescheduled time..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setInterventionModalPatient(null)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[11px] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Intervention'}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
