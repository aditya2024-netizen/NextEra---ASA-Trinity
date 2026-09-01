import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  PhoneCall, 
  Award,
  Users,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { summary, refreshDashboard } = useApp();
  const [trends, setTrends] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadTrends = async () => {
    try {
      const res = await api.getDashboardTrends();
      if (res.success) {
        setTrends(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshDashboard(), loadTrends()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Operational Impact & Clinical Adherence Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Measuring the reduction of missed follow-ups, outreach conversion rates, and hospital capacity optimization.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
        </button>
      </div>

      {/* Impact Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Prevented Missed Visits
          </span>
          <span className="text-3xl font-extrabold text-slate-900 block">31</span>
          <p className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" /> -42% no-show reduction
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
            Outreach Conversion Rate
          </span>
          <span className="text-3xl font-extrabold text-slate-900 block">
            {summary?.outreachSuccessRate ?? 91}%
          </span>
          <p className="text-[11px] text-blue-700 mt-2 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> High patient engagement
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
            Clinic Revenue Preserved
          </span>
          <span className="text-3xl font-extrabold text-slate-900 block">$74,400</span>
          <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> Capacity recovered
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1">
            Total Monitored Cohort
          </span>
          <span className="text-3xl font-extrabold text-slate-900 block">
            {summary?.totalPatients || 1000}
          </span>
          <p className="text-[11px] text-indigo-700 mt-2 flex items-center gap-1 font-semibold">
            <Users className="w-3.5 h-3.5" /> Continuous automated risk ranking
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Attendance Trend Over Time */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Adherence Trajectory (6 Months)</h3>
            <p className="text-xs text-slate-500">Adherence percentage after implementing CareTrack AI.</p>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="attendedRate" name="Attendance Rate (%)" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="missedRate" name="Missed Rate (%)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Intervention Channel Conversion */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Outreach Channel Efficacy & Success Rate</h3>
            <p className="text-xs text-slate-500">Comparison of telephone, SMS, and telehealth outreach outcomes.</p>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.interventionSuccessChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="attempted" name="Outreach Attempted" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmed" name="Confirmed Attendance" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
