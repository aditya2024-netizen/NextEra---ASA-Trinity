import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Patient, RiskLevel } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  HelpCircle, 
  Zap, 
  PhoneCall, 
  Calendar, 
  MapPin, 
  RefreshCw, 
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const RiskQueuePage: React.FC = () => {
  const { 
    viewPatientDetails, 
    setExplainModalPatient, 
    setActionModalPatient, 
    setInterventionModalPatient 
  } = useApp();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('HIGH'); // Default to HIGH for triage
  const [interventionStatus, setInterventionStatus] = useState<string>('ALL');
  const [dueFilter, setDueFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getPatients({
        search,
        riskLevel: riskLevel === 'ALL' ? undefined : riskLevel,
        interventionStatus: interventionStatus === 'ALL' ? undefined : interventionStatus,
        dueFilter: dueFilter === 'ALL' ? undefined : dueFilter,
        sortBy,
        sortOrder,
        page,
        limit: 12,
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
    fetchQueue();
  }, [search, riskLevel, interventionStatus, dueFilter, sortBy, sortOrder, page]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              Priority Risk Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold font-mono">
              {total} Patients Matching Triage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ranked risk queue for clinical staff to triage, investigate reasons, and execute proactive interventions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchQueue()}
            disabled={loading}
            className="px-3.5 py-2 text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50/80 rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs transition-all flex items-center gap-2 text-xs font-bold cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          {/* Search Box (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, ID (e.g. PAT-1042), or condition..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Risk Level Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={riskLevel}
              onChange={e => {
                setRiskLevel(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Risk Tiers (All)</option>
              <option value="CRITICAL">🟣 Critical Risk Only (&gt;= 80)</option>
              <option value="HIGH">🔴 High Risk Only (60 - 79)</option>
              <option value="MEDIUM">🟡 Medium Risk Only (30 - 59)</option>
              <option value="LOW">🟢 Low Risk Only (0 - 29)</option>
            </select>
          </div>

          {/* Due Window Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={dueFilter}
              onChange={e => {
                setDueFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Follow-up Dates</option>
              <option value="TODAY">📍 Due Today</option>
              <option value="NEXT_7_DAYS">🚨 Due in Next 7 Days</option>
              <option value="NEXT_30_DAYS">📅 Due in Next 30 Days</option>
              <option value="OVERDUE">⚠️ Overdue Appointments</option>
            </select>
          </div>

          {/* Sort Control (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as any);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="riskScore-desc">Highest Risk Score</option>
              <option value="nextFollowUpDate-asc">Earliest Due Date</option>
              <option value="missedAppointments-desc">Most Missed Visits</option>
              <option value="distanceKm-desc">Farthest Distance</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Triage:</span>
          <button
            onClick={() => { setRiskLevel('HIGH'); setDueFilter('NEXT_7_DAYS'); setPage(1); }}
            className="px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200 transition-colors"
          >
            🔥 High Risk Due in 7 Days
          </button>
          <button
            onClick={() => { setRiskLevel('HIGH'); setInterventionStatus('Pending'); setPage(1); }}
            className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition-colors"
          >
            ⏳ Uncontacted High Risk
          </button>
          <button
            onClick={() => { setRiskLevel('ALL'); setDueFilter('ALL'); setSearch(''); setInterventionStatus('ALL'); setPage(1); }}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading Skeleton or Empty State */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Evaluating Patient Follow-up Risk Cohort...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Patients Found in this Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, risk level filters, or scheduled follow-up time window.
          </p>
          <button
            onClick={() => { setRiskLevel('ALL'); setDueFilter('ALL'); setSearch(''); setPage(1); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Patient Code & Name</th>
                  <th className="py-3.5 px-4">Risk Assessment</th>
                  <th className="py-3.5 px-4">Primary Contributing Factors</th>
                  <th className="py-3.5 px-4">Follow-up Due</th>
                  <th className="py-3.5 px-4">Recommended Action</th>
                  <th className="py-3.5 px-4">Intervention Status</th>
                  <th className="py-3.5 px-4 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {patients.map(p => {
                  const r = p.currentRisk;
                  const isCritical = r?.riskLevel === 'CRITICAL';
                  const isHigh = r?.riskLevel === 'HIGH';
                  const isMed = r?.riskLevel === 'MEDIUM';

                  return (
                    <tr 
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                        isCritical ? 'bg-rose-50/30' : isHigh ? 'bg-red-50/15' : ''
                      }`}
                      onClick={() => viewPatientDetails(p.id)}
                    >
                      {/* Patient Name & Demographics */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 block text-sm">
                            {p.name}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">
                            {p.patientCode} • {p.age}y {p.gender} • {p.condition}
                          </span>
                        </div>
                      </td>

                      {/* Risk Score & Gauge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-extrabold font-mono ${
                            isCritical ? 'text-rose-700' : isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {r?.score || 50}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isHigh 
                              ? 'bg-red-100 text-red-700' 
                              : isMed 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {r?.riskLevel}
                          </span>
                        </div>
                        <div className="w-24 mt-1">
                          <RiskGauge score={r?.score || 50} level={r?.riskLevel} size="sm" showLabels={false} />
                        </div>
                      </td>

                      {/* Reasons */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-slate-800 font-semibold block truncate">
                          {r?.reasons[0] || 'Scheduled routine visit'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {p.missedAppointments} missed • {p.distanceKm} km away • {p.attendanceRate}% adherence
                        </span>
                      </td>

                      {/* Follow-up Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-bold text-slate-900">{p.nextFollowUpDate}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          Every {p.appointmentFrequencyDays}d
                        </span>
                      </td>

                      {/* Recommended Action */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-blue-900 font-semibold text-[11px] block bg-blue-50/80 p-1.5 rounded border border-blue-100 truncate">
                          {r?.immediateAction}
                        </span>
                      </td>

                      {/* Intervention Status */}
                      <td className="py-3.5 px-4">
                        {p.latestIntervention ? (
                          <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            {p.latestIntervention.status}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            Pending Outreach
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setExplainModalPatient(p)}
                            title="Why is this patient high risk?"
                            className="px-2.5 py-1.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 flex items-center gap-1 font-semibold"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                            Why?
                          </button>
                          
                          <button
                            onClick={() => setActionModalPatient(p)}
                            title="What should I do?"
                            className="px-2.5 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 flex items-center gap-1 font-semibold"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Action
                          </button>

                          <button
                            onClick={() => setInterventionModalPatient(p)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-wider text-[11px] transition-colors shadow-xs flex items-center gap-1"
                          >
                            <PhoneCall className="w-3 h-3" />
                            Contact
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
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-slate-500 font-medium">
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total patients)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="px-3 py-1.5 bg-slate-100 rounded-lg font-mono font-bold text-slate-800">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
