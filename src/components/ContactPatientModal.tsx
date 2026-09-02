import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  X, 
  Phone, 
  PhoneCall,
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  AlertTriangle,
  Sparkles,
  Share2,
  Copy,
  Check
} from 'lucide-react';

export const ContactPatientModal: React.FC = () => {
  const { contactPatientModal, setContactPatientModal, addToast, refreshDashboard, viewPatientDetails, triggerPatientRefresh } = useApp();
  const { isAdmin, user } = useAuth();

  const [channel, setChannel] = useState<'PHONE_CALL' | 'SMS' | 'WHATSAPP'>('PHONE_CALL');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [callOutcome, setCallOutcome] = useState<string>('Spoke with Patient - Confirmed Attendance');
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [confirmFollowUpDate, setConfirmFollowUpDate] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (contactPatientModal) {
      const patient = contactPatientModal.patient;
      const findings = contactPatientModal.findings;

      setPhoneNumber(patient.phone || '+91 98250 87654');
      setConfirmFollowUpDate(patient.nextFollowUpDate || '');
      setNotes('');
      setIsCalling(false);
      setCallDurationSeconds(0);

      // Construct draft messages
      const nextDate = patient.nextFollowUpDate || 'upcoming date';
      const cond = patient.condition || 'your health management';
      const doc = patient.assignedDoctor || 'Dr. Rajesh Kulkarni, MD, DM';

      if (findings?.smsDraft) {
        setMessageContent(findings.smsDraft);
      } else {
        setMessageContent(
          `[CareTrack AI Hospital] Dear ${patient.name}, your follow-up with ${doc} for ${cond} is scheduled for ${nextDate}. Please confirm your attendance or call +91 11 4050 2000 if you need transit support.`
        );
      }
    }
  }, [contactPatientModal]);

  // Timer for active phone call
  useEffect(() => {
    let interval: any;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDurationSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  if (!contactPatientModal) return null;

  const patient = contactPatientModal.patient;
  const findings = contactPatientModal.findings;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const res = await api.contactPatient({
        patientId: patient.id,
        channel,
        phoneNumber,
        messageContent,
        callOutcome,
        callDurationSeconds,
        notes,
        confirmFollowUpDate,
      });

      if (res.success) {
        const isDemo = res.data?.notification?.isDemo ?? true;
        addToast(
          'success',
          isDemo ? 'Twilio Demo Mode Outreach Logged' : 'Live Twilio Outreach Dispatched',
          res.message || `Outreach logged for ${patient.name}.`
        );
        setContactPatientModal(null);
        await refreshDashboard();
        triggerPatientRefresh();
        viewPatientDetails(patient.id);
      } else {
        addToast('error', 'Outreach Error', res.message || 'Failed to dispatch communication.');
      }
    } catch (err: any) {
      addToast('error', 'Outreach Error', err.message || 'Failed to record communication.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Contact Patient & Send Care Details</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Outreach Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Patient: <span className="font-bold text-white">{patient.name}</span> ({patient.patientCode}) • Target Phone: <span className="font-mono text-emerald-300 font-bold">{phoneNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setContactPatientModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Channel Selector */}
          <div>
            <label className="block font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
              Select Communication Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('PHONE_CALL')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  channel === 'PHONE_CALL'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Direct Phone Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChannel('SMS');
                  if (findings?.smsDraft) setMessageContent(findings.smsDraft);
                }}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  channel === 'SMS'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send SMS Text</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setChannel('WHATSAPP');
                  if (findings?.whatsappDraft) setMessageContent(findings.whatsappDraft);
                }}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Notice</span>
              </button>
            </div>
          </div>

          {/* Patient Phone Number Verification */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Destination Phone Number</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
                  placeholder="+1 (555) 000-0000"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Direct Click to Call */}
              <a
                href={`tel:${phoneNumber}`}
                onClick={() => setIsCalling(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Now</span>
              </a>
            </div>
          </div>

          {/* Direct Phone Call Active UI */}
          {channel === 'PHONE_CALL' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isCalling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="font-bold text-slate-900">
                    {isCalling ? 'Active Clinical Call in Progress' : 'Call Dispatch Control'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-1 bg-white border border-slate-200 rounded text-slate-700">
                    Duration: {formatTimer(callDurationSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCalling(!isCalling)}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      isCalling 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isCalling ? 'End Call Timer' : 'Start Call Timer'}
                  </button>
                </div>
              </div>

              {/* Call Script Helper */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recommended Clinical Conversation Script
                </span>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "Hello {patient.name}, this is Admin from Metro General Hospital follow-up team. We are calling regarding your care plan for {patient.condition} and your upcoming appointment on {patient.nextFollowUpDate || 'scheduled date'}. We noticed transit may be a challenge—can we assist with a clinic shuttle or offer a video consult with your physician?"
                </p>
              </div>

              {/* Call Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Call Outcome *</label>
                  <select
                    value={callOutcome}
                    onChange={e => setCallOutcome(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="Spoke with Patient - Confirmed Attendance">Spoke with Patient - Confirmed Attendance</option>
                    <option value="Left Voicemail / Callback Requested">Left Voicemail / Callback Requested</option>
                    <option value="Patient Requested Reschedule">Patient Requested Reschedule</option>
                    <option value="Arranged Transportation Voucher">Arranged Transportation Voucher</option>
                    <option value="Converted to Teleconsultation">Converted to Teleconsultation</option>
                    <option value="Unable to Reach / No Answer">Unable to Reach / No Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirmed Next Visit Date</label>
                  <input
                    type="date"
                    value={confirmFollowUpDate}
                    onChange={e => setConfirmFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SMS / WhatsApp Message Body */}
          {(channel === 'SMS' || channel === 'WHATSAPP') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  Message Content & Clinical Details to Send
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {channel === 'WHATSAPP' && (
                    <a
                      href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageContent)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Open WhatsApp Web</span>
                    </a>
                  )}
                </div>
              </div>

              <textarea
                rows={4}
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-600 focus:bg-white leading-relaxed"
                placeholder="Enter message details to send to patient..."
              />
            </div>
          )}

          {/* Clinical Outreach Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Administrative / Clinical Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
              placeholder="e.g., Patient stated bus schedule was changed; arranged clinic van pick-up at 9:30 AM."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2">
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
               <span className="text-xs font-bold text-amber-800 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" />
                 Demo Mode Active
               </span>
               <span className="text-[10px] text-amber-700">Live Twilio disabled. Actions will be simulated.</span>
            </div>
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setContactPatientModal(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
  
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Recording Dispatch...' : `Complete Outreach & Record`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
