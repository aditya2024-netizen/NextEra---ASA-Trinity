import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Patient } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { RiskCard } from '../components/RiskCard';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  PhoneCall, 
  Activity, 
  MapPin,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Zap,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { 
    summary, 
    setCurrentPage, 
    viewPatientDetails, 
    setExplainModalPatient, 
    setActionModalPatient, 
    setInterventionModalPatient,
    refreshDashboard,
    setIsAiDrawerOpen,
  } = useApp();

  const [topHighRiskPatients, setTopHighRiskPatients] = useState<Patient[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [patientsRes, trendsRes] = await Promise.all([
          api.getPatients({ riskLevel: 'HIGH', limit: 5, sortBy: 'riskScore', sortOrder: 'desc' }),
          api.getDashboardTrends(),
        ]);
        if (patientsRes.success) setTopHighRiskPatients(patientsRes.data);
        if (trendsRes.success) setTrends(trendsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const highCount = summary?.highRiskPatients ?? (summary as any)?.highRiskCount ?? 186;
  const mediumCount = summary?.mediumRiskPatients ?? (summary as any)?.mediumRiskCount ?? 422;
  const lowCount = summary?.lowRiskPatients ?? (summary as any)?.lowRiskCount ?? 392;
  const totalCount = summary?.totalPatients ?? 1000;
  const dueWeekCount = summary?.followUpsDueThisWeek ?? (summary as any)?.dueThisWeekCount ?? 24;
  const completedInterventions = summary?.interventionsCompleted ?? (summary as any)?.completedInterventions ?? 78;
  const pendingInterventions = summary?.interventionsPending ?? (summary as any)?.pendingInterventions ?? 34;
  const successRate = summary?.outreachSuccessRate ?? 91;

  const riskPieData = [
    { name: 'High Risk (60-100)', value: highCount, color: '#e11d48' },
    { name: 'Medium Risk (30-59)', value: mediumCount, color: '#f59e0b' },
    { name: 'Low Risk (0-29)', value: lowCount, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner & Quick Context */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
              Outpatient Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Clinical Feed</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Patient Follow-up Risk Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Prioritizing patients at risk of missing vital follow-up visits using explainable clinical AI and closed-loop staff outreach.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshDashboard()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={() => setCurrentPage('risk-queue')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-900/20"
          >
            <AlertTriangle className="w-4 h-4" />
            Priority Queue ({highCount})
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: High Risk Patients */}
        <div 
          onClick={() => setCurrentPage('risk-queue')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              High-Risk Patients
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-600">
              {highCount}
            </span>
            <span className="text-xs text-red-700 font-bold">
              ({Math.round((highCount / totalCount) * 100)}% of total)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.round((highCount / totalCount) * 100)}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Requires urgent staff outreach
          </p>
        </div>

        {/* Card 2: Due This Week */}
        <div 
          onClick={() => setCurrentPage('risk-queue')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Follow-ups Due (7d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">
              {dueWeekCount}
            </span>
            <span className="text-xs text-amber-700 font-bold">Next 7 Days</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Critical intervention window
          </p>
        </div>

        {/* Card 3: Interventions Completed */}
        <div 
          onClick={() => setCurrentPage('interventions')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Interventions Logged
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-600">
              {completedInterventions}
            </span>
            <span className="text-xs text-blue-700 font-mono font-bold">
              {pendingInterventions} pending
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Calls, SMS, and vouchers
          </p>
        </div>

        {/* Card 4: Outreach Success Rate */}
        <div 
          onClick={() => setCurrentPage('analytics')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Outreach Success Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">
              {successRate}%
            </span>
            <span className="text-xs text-emerald-700 font-bold">Confirmed / Attended</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Across closed-loop interventions
          </p>
        </div>
      </div>

      {/* Main Grid: Priority High-Risk Attention Queue (Left 8 cols) + Risk Charts (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Top Urgent High Risk Follow-ups */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Top Priority High-Risk Follow-ups
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by clinical risk score needing immediate coordination.
                </p>
              </div>
              <button
                onClick={() => setCurrentPage('risk-queue')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                View All ({summary?.highRiskCount || 186})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Patients List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-3">Risk Score</th>
                    <th className="py-3 px-3">Primary Risk Driver</th>
                    <th className="py-3 px-3">Next Due</th>
                    <th className="py-3 px-3">Recommended Action</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {topHighRiskPatients.map((p, idx) => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-slate-50/80 bg-red-50/15 transition-colors group cursor-pointer"
                      onClick={() => viewPatientDetails(p.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 group-hover:text-blue-600">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.patientCode} • {p.condition}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-red-600 font-mono">
                            {p.currentRisk?.score || 85}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            HIGH
                          </span>
                        </div>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div 
                            className="h-full bg-red-600 rounded-full" 
                            style={{ width: `${p.currentRisk?.score || 85}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium block">
                          {p.missedAppointments} missed • {p.distanceKm} km
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {p.attendanceRate}% adherence
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {p.nextFollowUpDate}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-blue-900 font-semibold text-[11px] block bg-blue-50 p-1.5 rounded border border-blue-100">
                          {p.currentRisk?.immediateAction || 'Priority Phone Call'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setExplainModalPatient(p)}
                            title="Why is this patient high risk?"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => setInterventionModalPatient(p)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1"
                          >
                            Contact
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Banner: Hackathon Feature Showcase */}
          <div className="p-5 rounded-xl bg-[#1E293B] text-white flex items-center justify-between gap-4 shadow-md border border-slate-700">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Interactive What-If Simulation Sandbox</h4>
                <p className="text-xs text-slate-300">
                  Simulate travel vouchers or telehealth switches to evaluate prospective risk reduction before committing clinic resources.
                </p>
              </div>
            </div>
            <button
              onClick={() => viewPatientDetails('PAT-1042')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shadow-sm shrink-0"
            >
              Test Simulation
            </button>
          </div>
        </div>

        {/* Right Column: Risk Analytics & Distribution (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Population Risk Distribution Donut */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Risk Level Distribution</h3>
              <span className="text-[11px] font-mono text-slate-500">1,000 Cohort</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} Patients`, 'Count']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High Risk (60-100)
                </span>
                <span className="font-bold text-slate-900 font-mono">{highCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium Risk (30-59)
                </span>
                <span className="font-bold text-slate-900 font-mono">{mediumCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low Risk (0-29)
                </span>
                <span className="font-bold text-slate-900 font-mono">{lowCount}</span>
              </div>
            </div>
          </div>

          {/* Top Risk Drivers Frequency */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Hospital-Wide Risk Drivers
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Previous Missed Visits</span>
                  <span className="font-mono font-bold text-red-600">54% of High Risk</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '54%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Distance Barrier (&gt;30 km)</span>
                  <span className="font-mono font-bold text-amber-600">32% of High Risk</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '32%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Sparse Frequency (&gt;60d gap)</span>
                  <span className="font-mono font-bold text-blue-600">22% of High Risk</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
