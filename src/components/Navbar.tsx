import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  HeartPulse, 
  Bot, 
  Menu,
  LogOut,
  User,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { 
    summary, 
    setCurrentPage, 
    setIsAiDrawerOpen, 
  } = useApp();
  const { user, isAdmin, logout } = useAuth();

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'DOCTOR': return 'Doctor';
      case 'NURSE': return 'Nurse';
      case 'COORDINATOR': return 'Follow-up Staff';
      case 'CARE_MANAGER': return 'Care Manager';
      case 'ADMIN': return 'Administrator';
      default: return 'Staff';
    }
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'DOCTOR': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NURSE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COORDINATOR': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CARE_MANAGER': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ADMIN': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile Menu + CareTrack AI Logo Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-base tracking-tight text-slate-900">
                CareTrack <span className="text-blue-600">AI</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono font-bold border border-blue-200/60">
                India Clinical Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Indian Outpatient Follow-up & Adherence System
            </p>
          </div>
        </div>
      </div>

      {/* Center: System Real-Time Status & High Risk Alert Badge */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => setCurrentPage('risk-queue')}
          className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-2 text-xs font-bold"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>{summary?.highRiskPatients || 4} High-Risk Patients</span>
          <span className="text-[11px] font-normal text-red-600 hidden lg:inline">
            ({summary?.followUpsDueThisWeek || 6} due this week)
          </span>
        </button>
      </div>

      {/* Right: AI Assistant, Fixed User Profile (No Role Changer) & Log Out */}
      <div className="flex items-center gap-2.5">
        {/* AI Assistant Drawer Trigger */}
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Bot className="w-4 h-4 text-cyan-300" />
          <span className="hidden sm:inline">Clinical AI</span>
        </button>

        {/* Fixed User Account Info (Role cannot be changed here) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
              {user?.name || 'Staff User'}
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getRoleBadgeColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={logout}
          className="px-3 py-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors flex items-center gap-1 text-xs font-bold"
          title="Sign Out of Portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
