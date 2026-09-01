import React from 'react';
import { Appointment, Patient } from '../types';
import { CheckCircle2, XCircle, Clock, Calendar, ArrowRight, ShieldAlert, Check } from 'lucide-react';

interface AppointmentTimelineProps {
  patient: Patient;
  appointments: Appointment[];
}

export const AppointmentTimeline: React.FC<AppointmentTimelineProps> = ({ patient, appointments }) => {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Explainable Attendance & Risk Timeline
          </h3>
          <p className="text-xs text-slate-500">
            Chronological audit of historical attendance, current predicted risk, and closed-loop staff outreach.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> {patient.attendedAppointments} Attended
          </span>
          <span className="flex items-center gap-1 text-rose-700">
            <XCircle className="w-3.5 h-3.5" /> {patient.missedAppointments} Missed
          </span>
          <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {patient.attendanceRate}% Adherence
          </span>
        </div>
      </div>

      {/* Interactive Horizontal / Vertical Timeline Flow */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {/* Phase 1: Historical Appointment Events */}
        {sorted.map((appt, idx) => {
          const isMissed = appt.status === 'MISSED';
          const isRescheduled = appt.status === 'RESCHEDULED';

          return (
            <div key={appt.id || idx} className="relative group">
              {/* Dot Icon */}
              <div className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                isMissed ? 'bg-rose-500 text-white' : isRescheduled ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {isMissed ? <XCircle className="w-3.5 h-3.5" /> : isRescheduled ? <Clock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </div>

              {/* Event Content */}
              <div className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200/80 text-xs transition-colors flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{appt.appointmentDate}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isMissed ? 'bg-rose-100 text-rose-800' : isRescheduled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {appt.status}
                    </span>
                    <span className="text-slate-500 font-medium">{appt.department || 'Outpatient Clinic'}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{appt.notes || 'Scheduled visit'}</p>
                </div>
                <div className="text-slate-700 text-[11px] font-mono">
                  {appt.doctorName}
                </div>
              </div>
            </div>
          );
        })}

        {/* Phase 2: Current Follow-up Prediction Milestone */}
        <div className="relative">
          <div className="absolute -left-[27px] top-0.5 w-6 h-6 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="bg-blue-50/90 border-2 border-blue-200 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider">
                Current Risk Assessment
              </span>
              <span className="font-mono text-xs font-bold text-blue-900">
                Score: {patient.currentRisk?.score || 88}/100 ({patient.currentRisk?.riskLevel || 'HIGH'})
              </span>
            </div>
            <p className="font-semibold text-blue-950">
              Next Scheduled Appointment: {patient.nextFollowUpDate}
            </p>
            <p className="text-slate-700">
              Triggered recommended proactive intervention: <strong className="text-blue-900">{patient.currentRisk?.immediateAction}</strong>
            </p>
          </div>
        </div>

        {/* Phase 3: Intervention & Closed-Loop Resolution */}
        {patient.latestIntervention && (
          <div className="relative">
            <div className="absolute -left-[27px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px] uppercase">
                  Staff Intervention Recorded
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(patient.latestIntervention.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="font-bold text-emerald-950">
                {patient.latestIntervention.type} — Status: {patient.latestIntervention.status}
              </p>
              <p className="text-slate-700">
                "{patient.latestIntervention.notes}"
              </p>
              {patient.latestIntervention.patientConfirmedNextVisit && (
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Outcome: Patient confirmed next follow-up attendance (Outreach Successful).
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
