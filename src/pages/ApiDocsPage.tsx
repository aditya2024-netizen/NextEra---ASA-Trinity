import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Code2, Server, Database, Shield, Layers, Copy, Check, ExternalLink, Terminal } from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  const { setIsJavaModalOpen } = useApp();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/patients',
      desc: 'List and filter patients with paginated search, risk tier filters, and sorting.',
      sampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "PAT-1042",\n      "patientCode": "P-1042",\n      "name": "Eleanor Vance",\n      "age": 64,\n      "distanceKm": 47.0,\n      "condition": "Hypertension & CKD",\n      "currentRisk": {\n        "score": 88,\n        "riskLevel": "HIGH",\n        "reasons": [\n          "4 previous follow-up appointments were missed",\n          "Patient lives 47 km from hospital"\n        ]\n      }\n    }\n  ],\n  "pagination": { "total": 1000, "page": 1, "totalPages": 67 }\n}`
    },
    {
      method: 'POST',
      path: '/api/predictions/predict',
      desc: 'Execute real-time explainable risk prediction for arbitrary patient parameters.',
      sampleRequest: `{\n  "age": 64,\n  "distanceKm": 47.0,\n  "treatmentDurationMonths": 14,\n  "missedAppointments": 4,\n  "totalAppointments": 12,\n  "appointmentFrequencyDays": 60\n}`,
      sampleResponse: `{\n  "success": true,\n  "data": {\n    "score": 88,\n    "riskLevel": "HIGH",\n    "confidenceOrPriority": 0.88,\n    "immediateAction": "Offer Remote Teleconsultation / Virtual Visit",\n    "topFactors": [\n      { "name": "Missed Appointments", "points": 40, "maxPoints": 40, "impact": "HIGH" },\n      { "name": "Hospital Distance", "points": 15, "maxPoints": 20, "impact": "HIGH" }\n    ]\n  }\n}`
    },
    {
      method: 'POST',
      path: '/api/interventions',
      desc: 'Record a clinical staff outreach action (Priority call, SMS, telehealth) with audit trail.',
      sampleRequest: `{\n  "patientId": "PAT-1042",\n  "type": "Priority Phone Call",\n  "status": "Confirmed",\n  "notes": "Patient agreed to 10:00 AM follow-up visit.",\n  "patientConfirmedNextVisit": true\n}`,
      sampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "INT-901",\n    "status": "Confirmed",\n    "createdAt": "2026-09-01T10:30:00Z"\n  }\n}`
    },
    {
      method: 'GET',
      path: '/api/dashboard/summary',
      desc: 'Retrieve executive summary KPI metrics, total high-risk count, and outreach rates.',
      sampleResponse: `{\n  "success": true,\n  "data": {\n    "totalPatients": 1000,\n    "highRiskCount": 186,\n    "mediumRiskCount": 422,\n    "lowRiskCount": 392,\n    "dueThisWeekCount": 24,\n    "completedInterventions": 78,\n    "interventionSuccessRate": 91\n  }\n}`
    }
  ];

  const handleCopy = (path: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(path);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold">
            API
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Spring Boot 3 & REST API Documentation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Production-grade backend architecture, REST endpoints, and explainability payloads.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsJavaModalOpen(true)}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Layers className="w-4 h-4" />
          Inspect Java 21 Classes & JUnit Tests
        </button>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Server className="w-4 h-4 text-blue-600" />
            Clean Layered Architecture
          </div>
          <p className="text-slate-600">
            Strict separation: Controller &rarr; Service &rarr; AI RiskPredictionEngine &rarr; Repository &rarr; JPA Entity.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Database className="w-4 h-4 text-emerald-600" />
            Relational Persistence & Indexing
          </div>
          <p className="text-slate-600">
            Optimized indexes on `patient_code`, `next_follow_up_date`, and `status` for rapid sub-50ms triage queries.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Shield className="w-4 h-4 text-rose-600" />
            Explainable AI Transparency
          </div>
          <p className="text-slate-600">
            Returns normalized 0-100 score, explicit reasons, protective factors, and recommended clinical actions.
          </p>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Core REST API Endpoints</h3>

        <div className="space-y-4">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Endpoint Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-bold text-slate-900">{ep.path}</span>
                </div>
                <span className="text-slate-600">{ep.desc}</span>
              </div>

              {/* Payload Viewer */}
              <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-3">
                {ep.sampleRequest && (
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                      Request Body JSON:
                    </span>
                    <pre className="text-slate-300">{ep.sampleRequest}</pre>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Response JSON (200 OK):
                    </span>
                    <button
                      onClick={() => handleCopy(ep.path, ep.sampleResponse)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedEndpoint === ep.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedEndpoint === ep.path ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-emerald-400">{ep.sampleResponse}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
