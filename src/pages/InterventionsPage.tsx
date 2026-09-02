import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Intervention, InterventionStatus } from '../types';
import { 
  PhoneForwarded, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Filter, 
  RefreshCw, 
  Check, 
  Search,
  MessageSquare,
  Video,
  User
} from 'lucide-react';

export const InterventionsPage: React.FC = () => {
  const { viewPatientDetails, addToast, refreshDashboard } = useApp();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const res = await api.getInterventions(statusFilter);
      if (res.success) {
        setInterventions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchInterventions(),
        refreshDashboard()
      ]);
      addToast('success', 'Interventions Refreshed', 'Latest outreach tracking records synchronized.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: InterventionStatus) => {
    try {
      const isConfirmed = newStatus === 'Confirmed';
      const res = await api.updateInterventionStatus(id, newStatus, undefined, isConfirmed);
      if (res.success) {
        addToast('success', 'Status Updated', `Intervention updated to ${newStatus}.`);
        fetchInterventions();
        refreshDashboard();
      }
    } catch (err) {
      addToast('error', 'Update Failed', 'Could not update intervention status.');
    }
  };

  const filtered = interventions.filter(i => 
    i.patientName.toLowerCase().includes(search.toLowerCase()) ||
    i.patientCode.toLowerCase().includes(search.toLowerCase()) ||
    i.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Closed-Loop Intervention Tracking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              {interventions.length} Outreach Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit staff outreach, monitor patient contact confirmations, and prevent lost-to-follow-up scenarios.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing || loading}
          className="px-3.5 py-2 text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50/80 rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs transition-all flex items-center gap-2 text-xs font-bold self-start cursor-pointer active:scale-95 disabled:opacity-50"
          title="Refresh Outreach Records"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'Pending', 'Contacted', 'Confirmed', 'Rescheduled', 'Completed', 'Escalated'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Outreach' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search outreach records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="py-3.5 px-4">Patient Code & Name</th>
                <th className="py-3.5 px-4">Intervention Type</th>
                <th className="py-3.5 px-4">Clinical Trigger & Notes</th>
                <th className="py-3.5 px-4">Staff Lead</th>
                <th className="py-3.5 px-4">Date Logged</th>
                <th className="py-3.5 px-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(interv => (
                <tr key={interv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => viewPatientDetails(interv.patientId)}
                      className="font-bold text-slate-900 hover:text-blue-700 text-sm text-left block"
                    >
                      {interv.patientName}
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {interv.patientCode}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {interv.type.includes('Phone') ? <PhoneForwarded className="w-3.5 h-3.5 text-blue-600" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                      {interv.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="text-slate-800 font-medium line-clamp-2">
                      "{interv.notes}"
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Trigger: {interv.reason}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="font-semibold block">{interv.staffName}</span>
                    <span className="text-[10px] text-slate-400">{interv.staffRole}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {new Date(interv.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={interv.status}
                      onChange={e => handleUpdateStatus(interv.id, e.target.value as InterventionStatus)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                        interv.status === 'Confirmed' || interv.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : interv.status === 'Rescheduled'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : interv.status === 'Escalated'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}
                    >
                      <option value="Contacted">Contacted</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Unable to Reach">Unable to Reach</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
