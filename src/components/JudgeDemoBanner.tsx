import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Play, 
  RotateCcw, 
  Code, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight,
  Database,
  Award,
  Layers
} from 'lucide-react';

export const JudgeDemoBanner: React.FC = () => {
  const { 
    demoTourStep, 
    startDemoTour, 
    nextDemoTourStep, 
    endDemoTour, 
    resetDemoData,
    setIsJavaModalOpen,
    setCurrentPage,
    setSelectedPatientId,
    setExplainModalPatient,
    setInterventionModalPatient
  } = useApp();

  const tourSteps = [
    { step: 1, title: '1. Executive Dashboard', desc: '186 High-Risk Patients Identified across clinics' },
    { step: 2, title: '2. Ranked Risk Queue', desc: 'Patient P-1042 ranked #1 with Score 88 / 100' },
    { step: 3, title: '3. Explainable AI Analysis', desc: 'Inspect top drivers, protective factors & simulation' },
    { step: 4, title: '4. Staff Intervention', desc: 'Log outreach & confirm upcoming visit' },
    { step: 5, title: '5. Closed-Loop Impact', desc: '91% outreach success & prevented no-shows' },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-900/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Hackathon Badge & Fast Controls */}
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            Hackathon Judge Presentation Mode
          </span>

          <span className="hidden sm:inline text-slate-300">
            CareTrack AI — Closed-Loop Explainable Follow-up Intelligence
          </span>
        </div>

        {/* Center / Right: Tour & Controls */}
        <div className="flex items-center flex-wrap gap-2 ml-auto">
          {/* Spring Boot Code Viewer */}
          <button
            onClick={() => setIsJavaModalOpen(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-md font-semibold flex items-center gap-1.5 transition-colors"
            title="Inspect Spring Boot 3, Java 21 entities, scoring engine, JUnit tests, and Docker setup"
          >
            <Layers className="w-3.5 h-3.5" />
            Java 21 / Spring Boot Arch
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetDemoData}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md font-semibold flex items-center gap-1 transition-colors"
            title="Reseed database with 1,000 synthetic patients and canonical demo cases"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            Reset Demo Data
          </button>

          {/* Tour Step Controller */}
          {demoTourStep === null ? (
            <button
              onClick={startDemoTour}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              Start 5-Min Judge Demo Story
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-blue-900/80 px-2 py-0.5 rounded-lg border border-blue-500/50">
              <span className="font-bold text-amber-300 text-[11px]">
                {tourSteps[demoTourStep - 1]?.title}
              </span>
              <button
                onClick={nextDemoTourStep}
                className="px-2 py-0.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors"
              >
                {demoTourStep === 5 ? 'Finish Demo' : 'Next Step'}
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={endDemoTour}
                className="text-slate-400 hover:text-white px-1 text-[11px]"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
