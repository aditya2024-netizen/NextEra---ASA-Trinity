import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, DashboardSummary, ScoringConfiguration, Intervention, AnalyzerFindings } from '../types';
import { api } from '../services/api';
import { DEFAULT_SCORING_CONFIG } from '../services/scoringEngine';

export type PageView = 
  | 'dashboard'
  | 'risk-queue'
  | 'patient-details'
  | 'patients'
  | 'predict'
  | 'interventions'
  | 'analytics'
  | 'settings';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  viewPatientDetails: (patientId: string) => void;

  // Modals
  explainModalPatient: Patient | null;
  setExplainModalPatient: (patient: Patient | null) => void;
  actionModalPatient: Patient | null;
  setActionModalPatient: (patient: Patient | null) => void;
  interventionModalPatient: Patient | null;
  setInterventionModalPatient: (patient: Patient | null) => void;
  reportModalPatient: Patient | null;
  setReportModalPatient: (patient: Patient | null) => void;
  
  // Admin Core Flow Modals
  editPatientModal: Patient | null;
  setEditPatientModal: (patient: Patient | null) => void;
  contactPatientModal: { patient: Patient; findings?: AnalyzerFindings } | null;
  setContactPatientModal: (data: { patient: Patient; findings?: AnalyzerFindings } | null) => void;
  analyzerFindingsModal: AnalyzerFindings | null;
  setAnalyzerFindingsModal: (findings: AnalyzerFindings | null) => void;

  // Analyzer Helper
  runAnalyzerForPatient: (patient: Patient) => Promise<AnalyzerFindings | null>;
  isAnalyzing: boolean;

  // Drawers & Overlays
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  isAdminLoginModalOpen: boolean;
  setIsAdminLoginModalOpen: (open: boolean) => void;

  // Global Data & Stats
  summary: DashboardSummary | null;
  scoringConfig: ScoringConfiguration;
  updateScoringConfig: (config: ScoringConfiguration) => Promise<boolean>;
  refreshDashboard: () => Promise<void>;
  isLoadingSummary: boolean;

  resetDemoData: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (typeOrObj: ToastMessage['type'] | { type?: ToastMessage['type']; title: string; message: string }, title?: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('PAT-1041');

  const [explainModalPatient, setExplainModalPatient] = useState<Patient | null>(null);
  const [actionModalPatient, setActionModalPatient] = useState<Patient | null>(null);
  const [interventionModalPatient, setInterventionModalPatient] = useState<Patient | null>(null);
  const [reportModalPatient, setReportModalPatient] = useState<Patient | null>(null);

  // Admin Core Flow Modals
  const [editPatientModal, setEditPatientModal] = useState<Patient | null>(null);
  const [contactPatientModal, setContactPatientModal] = useState<{ patient: Patient; findings?: AnalyzerFindings } | null>(null);
  const [analyzerFindingsModal, setAnalyzerFindingsModal] = useState<AnalyzerFindings | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfiguration>(DEFAULT_SCORING_CONFIG);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([
    {
      id: 'init-1',
      type: 'info',
      title: 'CareTrack Indian Healthcare Portal Active',
      message: 'Secure outpatient clinical follow-up intelligence system ready.',
    }
  ]);

  const addToast = (
    typeOrObj: ToastMessage['type'] | { type?: ToastMessage['type']; title: string; message: string },
    title?: string,
    message?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    let finalType: ToastMessage['type'] = 'info';
    let finalTitle = '';
    let finalMessage = '';

    if (typeof typeOrObj === 'string') {
      finalType = typeOrObj;
      finalTitle = title || '';
      finalMessage = message || '';
    } else if (typeOrObj && typeof typeOrObj === 'object') {
      finalType = typeOrObj.type || 'info';
      finalTitle = typeOrObj.title || '';
      finalMessage = typeOrObj.message || '';
    }

    setToasts(prev => [{ id, type: finalType, title: finalTitle, message: finalMessage }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshDashboard = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const res = await api.getDashboardSummary();
      if (res.success) {
        setSummary(res.data);
      }
      const configRes = await api.getScoringConfig();
      if (configRes.success) {
        setScoringConfig(configRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const updateScoringConfig = async (newConfig: ScoringConfiguration): Promise<boolean> => {
    try {
      const res = await api.updateScoringConfig(newConfig);
      if (res.success) {
        setScoringConfig(res.data);
        addToast('success', 'Scoring Model Updated', 'Scoring weights saved and all risk ranks recalculated.');
        await refreshDashboard();
        return true;
      }
    } catch (err) {
      addToast('error', 'Update Failed', 'Failed to update scoring configuration.');
    }
    return false;
  };

  const viewPatientDetails = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patient-details');
  };

  const runAnalyzerForPatient = async (patient: Patient): Promise<AnalyzerFindings | null> => {
    setIsAnalyzing(true);
    try {
      const res = await api.runAnalyzer(patient);
      if (res.success && res.data) {
        setAnalyzerFindingsModal(res.data);
        addToast('success', 'Analyzer Findings Ready', `Generated deep clinical findings for ${patient.name} (Risk: ${res.data.riskScore}/100).`);
        return res.data;
      }
    } catch (err) {
      addToast('error', 'Analyzer Error', 'Could not process patient details in analyzer.');
    } finally {
      setIsAnalyzing(false);
    }
    return null;
  };

  const resetDemoData = async () => {
    try {
      await api.resetDemo();
      await refreshDashboard();
      addToast('success', 'Demo Reset', 'Reseeded 1,000 synthetic patient records and canonical demo cases.');
    } catch (e) {
      addToast('error', 'Reset Failed', 'Could not reset demo database.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        selectedPatientId,
        setSelectedPatientId,
        viewPatientDetails,
        explainModalPatient,
        setExplainModalPatient,
        actionModalPatient,
        setActionModalPatient,
        interventionModalPatient,
        setInterventionModalPatient,
        reportModalPatient,
        setReportModalPatient,
        editPatientModal,
        setEditPatientModal,
        contactPatientModal,
        setContactPatientModal,
        analyzerFindingsModal,
        setAnalyzerFindingsModal,
        runAnalyzerForPatient,
        isAnalyzing,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        summary,
        scoringConfig,
        updateScoringConfig,
        refreshDashboard,
        isLoadingSummary,
        resetDemoData,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

