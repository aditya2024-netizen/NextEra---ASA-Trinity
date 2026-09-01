import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';

// Modals & Overlays
import { RiskExplanationModal } from './components/RiskExplanationModal';
import { WhatShouldIDoModal } from './components/WhatShouldIDoModal';
import { InterventionModal } from './components/InterventionModal';
import { PdfReportModal } from './components/PdfReportModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { EditPatientModal } from './components/EditPatientModal';
import { AnalyzerFindingsModal } from './components/AnalyzerFindingsModal';
import { ContactPatientModal } from './components/ContactPatientModal';
import { AdminLoginModal } from './components/AdminLoginModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RiskQueuePage } from './pages/RiskQueuePage';
import { PatientDetailsPage } from './pages/PatientDetailsPage';
import { PatientsPage } from './pages/PatientsPage';
import { PredictionPage } from './pages/PredictionPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainLayout: React.FC = () => {
  const { currentPage, isAdminLoginModalOpen, setIsAdminLoginModalOpen } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'risk-queue':
        return <RiskQueuePage />;
      case 'patient-details':
        return <PatientDetailsPage />;
      case 'patients':
        return <PatientsPage />;
      case 'predict':
        return <PredictionPage />;
      case 'interventions':
        return <InterventionsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Primary Hospital Navigation */}
      <Navbar onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)} />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar 
          isOpenMobile={mobileSidebarOpen} 
          onCloseMobile={() => setMobileSidebarOpen(false)} 
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Modals & Workflow Overlays */}
      <EditPatientModal />
      <AnalyzerFindingsModal />
      <ContactPatientModal />
      <RiskExplanationModal />
      <WhatShouldIDoModal />
      <InterventionModal />
      <PdfReportModal />
      <AiAssistantDrawer />
      <AdminLoginModal 
        isOpen={isAdminLoginModalOpen} 
        onClose={() => setIsAdminLoginModalOpen(false)} 
      />
      <ToastContainer />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthGate />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
