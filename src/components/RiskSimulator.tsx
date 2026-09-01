import React, { useState } from 'react';
import { Patient, RiskPrediction } from '../types';
import { calculatePatientRisk } from '../services/scoringEngine';
import { useApp } from '../context/AppContext';
import { RiskGauge } from './RiskGauge';
import { Sliders, RefreshCw, ArrowRight, Video, CheckCircle2, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';

interface RiskSimulatorProps {
  patient: Patient;
}

export const RiskSimulator: React.FC<RiskSimulatorProps> = ({ patient }) => {
  const { scoringConfig } = useApp();

  const originalRisk = patient.currentRisk || calculatePatientRisk(patient, scoringConfig);

  // Simulation State
  const [simAge, setSimAge] = useState<number>(patient.age);
  const [simMissed, setSimMissed] = useState<number>(patient.missedAppointments);
  const [simDistance, setSimDistance] = useState<number>(patient.distanceKm);
  const [simFrequency, setSimFrequency] = useState<number>(patient.appointmentFrequencyDays);
  const [simDuration, setSimDuration] = useState<number>(patient.treatmentDurationMonths);
  const [isTelehealthActive, setIsTelehealthActive] = useState<boolean>(false);

  // Compute simulated risk
  const effectiveDistance = isTelehealthActive ? 0 : simDistance;
  const effectiveTotal = Math.max(simMissed + 1, patient.totalAppointments);
  const effectiveAttended = Math.max(0, effectiveTotal - simMissed);

  const simulatedRisk: RiskPrediction = calculatePatientRisk({
    id: 'SIMULATED',
    age: simAge,
    distanceKm: effectiveDistance,
    treatmentDurationMonths: simDuration,
    appointmentFrequencyDays: simFrequency,
    totalAppointments: effectiveTotal,
    attendedAppointments: effectiveAttended,
    missedAppointments: simMissed,
  }, scoringConfig);

  const scoreDiff = simulatedRisk.score - originalRisk.score;

  const handleReset = () => {
    setSimAge(patient.age);
    setSimMissed(patient.missedAppointments);
    setSimDistance(patient.distanceKm);
    setSimFrequency(patient.appointmentFrequencyDays);
    setSimDuration(patient.treatmentDurationMonths);
    setIsTelehealthActive(false);
  };

  const handleApplyTelehealth = () => {
    setIsTelehealthActive(prev => !prev);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              "What If?" Decision Support Simulator
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                Hypothetical
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Simulate clinical or logistical interventions to evaluate prospective risk reduction.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* Quick 1-Click Action Playbooks */}
      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-950 font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Quick Scenario: Switch to Virtual Teleconsultation</span>
        </div>
        <button
          onClick={handleApplyTelehealth}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
            isTelehealthActive
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          {isTelehealthActive ? 'Telehealth Active (0 km travel)' : 'Simulate Telehealth'}
        </button>
      </div>

      {/* Controls & Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sliders Column (7 cols) */}
        <div className="md:col-span-7 space-y-4 text-xs">
          {/* Missed Visits Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Missed Appointments History</span>
              <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{simMissed} visits</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={simMissed}
              onChange={e => setSimMissed(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-700">
              <span>0 (Perfect Attendance)</span>
              <span>3 visits</span>
              <span>6+ visits</span>
            </div>
          </div>

          {/* Distance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Effective Distance to Clinic</span>
              <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {isTelehealthActive ? '0 km (Telehealth)' : `${simDistance} km`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="80"
              step="1"
              disabled={isTelehealthActive}
              value={simDistance}
              onChange={e => setSimDistance(Number(e.target.value))}
              className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                isTelehealthActive ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
            <div className="flex justify-between text-[10px] text-slate-700">
              <span>&lt; 5 km</span>
              <span>30 km</span>
              <span>80 km</span>
            </div>
          </div>

          {/* Follow-up Frequency Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Follow-up Interval Cadence</span>
              <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Every {simFrequency} days</span>
            </div>
            <input
              type="range"
              min="14"
              max="120"
              step="7"
              value={simFrequency}
              onChange={e => setSimFrequency(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-700">
              <span>Every 14d (Frequent)</span>
              <span>45d</span>
              <span>120d (Sparse)</span>
            </div>
          </div>

          {/* Treatment Duration Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Treatment Journey Duration</span>
              <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{simDuration} months</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={simDuration}
              onChange={e => setSimDuration(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Slider 5: Patient Age */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Patient Age (Mobility & Vulnerability)</span>
              <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{simAge} years</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={simAge}
              onChange={e => setSimAge(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Dynamic Result Column (5 cols) */}
        <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Simulated Risk Outcome
            </span>

            {/* Score Comparison */}
            <div className="flex items-baseline gap-3 my-2">
              <div>
                <span className="text-xs text-slate-700 block">Baseline</span>
                <span className="text-xl font-extrabold text-slate-600">{originalRisk.score}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-700" />
              <div>
                <span className="text-xs text-slate-700 block">Simulated</span>
                <span className={`text-3xl font-extrabold ${
                  simulatedRisk.riskLevel === 'CRITICAL' ? 'text-rose-700' :
                  simulatedRisk.riskLevel === 'HIGH' ? 'text-red-600' : 
                  simulatedRisk.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {simulatedRisk.score}
                </span>
              </div>

              {/* Delta Badge */}
              <div className="ml-auto">
                <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                  scoreDiff < 0 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : scoreDiff > 0 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {scoreDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : scoreDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                  {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts
                </span>
              </div>
            </div>

            {/* Risk Tier Badge */}
            <div className="mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                simulatedRisk.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                simulatedRisk.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                simulatedRisk.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {simulatedRisk.riskLevel} RISK TIER
              </span>
            </div>

            <div className="mb-3">
              <RiskGauge score={simulatedRisk.score} level={simulatedRisk.riskLevel} size="sm" showLabels={false} />
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Hypothetical Rationale:</span>
              <p className="text-slate-600 italic">"{simulatedRisk.naturalLanguageSummary}"</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs">
            <span className="font-bold text-blue-900 block">Target Intervention Strategy:</span>
            <span className="text-blue-800 font-medium">{simulatedRisk.immediateAction}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
