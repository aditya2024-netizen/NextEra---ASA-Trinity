import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Zap, 
  PhoneCall, 
  MessageSquare, 
  Video, 
  Bus, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  Clock,
  UserCheck
} from 'lucide-react';

export const WhatShouldIDoModal: React.FC = () => {
  const { actionModalPatient, setActionModalPatient, setInterventionModalPatient } = useApp();

  if (!actionModalPatient || !actionModalPatient.currentRisk) return null;

  const patient = actionModalPatient;
  const risk = patient.currentRisk;

  const handleSelectAction = (type: any, reason: string) => {
    setActionModalPatient(null);
    setInterventionModalPatient(patient);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">What Should I Do? — Clinical Playbook</h3>
              <p className="text-xs text-slate-300">
                Tailored follow-up action plan for {patient.name} ({patient.patientCode})
              </p>
            </div>
          </div>
          <button
            onClick={() => setActionModalPatient(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Risk Context Banner */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Identified Primary Friction:</span>
              <span className="font-bold text-slate-900 text-sm">{risk.reasons[0] || 'Scheduled Outpatient Follow-up'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Follow-up Due:</span>
              <span className="font-bold text-blue-700 text-sm">{patient.nextFollowUpDate}</span>
            </div>
          </div>

          {/* Action 1: Immediate Priority Action */}
          <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50 hover:border-blue-400 transition-all space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                  Recommended Primary Action
                </span>
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Within 24-48 Hours
                </span>
              </div>
              <PhoneCall className="w-4 h-4 text-blue-600" />
            </div>

            <h4 className="text-sm font-bold text-blue-950">{risk.immediateAction}</h4>
            <p className="text-slate-700 leading-relaxed">
              Personal outreach addressing specific patient barriers (transportation, work schedule, or clinical concerns)
              to secure explicit verbal confirmation for the next clinic visit.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleSelectAction('Priority Phone Call', risk.immediateAction)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[11px] rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Execute Priority Call
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action 2: Secondary Action */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                Secondary Reinforcement
              </span>
              <MessageSquare className="w-4 h-4 text-slate-500" />
            </div>

            <h4 className="text-sm font-bold text-slate-900">{risk.secondaryAction}</h4>
            <p className="text-slate-600 leading-relaxed">
              Automated two-way interactive message allowing the patient to confirm attendance or request an immediate alternative date.
            </p>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => handleSelectAction('SMS Reminder', risk.secondaryAction)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[11px] rounded-lg flex items-center gap-1.5 transition-colors"
              >
                Schedule SMS / WhatsApp
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action 3: Alternative Barrier Elimination */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                Alternative Transit / Telehealth Option
              </span>
              <Video className="w-4 h-4 text-emerald-600" />
            </div>

            <h4 className="text-sm font-bold text-slate-900">{risk.alternativeAction}</h4>
            <p className="text-slate-600 leading-relaxed">
              If physical attendance remains difficult due to distance ({patient.distanceKm} km) or transit friction, switch the consultation to secure video visit.
            </p>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => handleSelectAction('Teleconsultation Offer', risk.alternativeAction)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase tracking-wider text-[11px] rounded-lg flex items-center gap-1.5 transition-colors"
              >
                Offer Virtual Care / Voucher
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setActionModalPatient(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
