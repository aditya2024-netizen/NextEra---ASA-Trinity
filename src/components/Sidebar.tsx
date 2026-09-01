import React from 'react';
import { useApp, PageView } from '../context/AppContext';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  Calculator, 
  PhoneForwarded, 
  BarChart3, 
  Sliders, 
  Code2, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { currentPage, setCurrentPage, summary } = useApp();
  const { user } = useAuth();

  const navigationItems: { id: PageView; label: string; icon: any; badge?: number | string; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { 
      id: 'risk-queue', 
      label: 'Priority Risk Queue', 
      icon: AlertTriangle, 
      badge: summary?.highRiskPatients || 186,
      badgeColor: 'bg-red-500 text-white'
    },
    { id: 'patients', label: 'Patient Records & Directory', icon: Users, badge: summary?.totalPatients || 1000, badgeColor: 'bg-slate-700 text-slate-300' },
    { id: 'predict', label: 'Clinical Risk Analyzer', icon: Calculator },
    { 
      id: 'interventions', 
      label: 'Patient Outreach & Dispatch', 
      icon: PhoneForwarded, 
      badge: summary?.interventionsPending || 34,
      badgeColor: 'bg-amber-500 text-slate-900'
    },
    { id: 'analytics', label: 'Follow-up Impact & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Scoring Model Config', icon: Sliders },
  ];

  const handleNavClick = (page: PageView) => {
    setCurrentPage(page);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed md:sticky top-16 z-40 md:z-10
        w-64 h-[calc(100vh-4rem)] bg-[#0F172A] text-slate-200 border-r border-slate-800
        flex flex-col justify-between p-4 overflow-y-auto
        transition-transform duration-200 ease-in-out shadow-xl
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-5">
          {/* Main Navigation Header */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Clinical Operations
            </div>
            <nav className="space-y-1">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-700 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Filter Playbooks */}
          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Urgent Focus Filters
            </span>
            <button
              onClick={() => {
                setCurrentPage('risk-queue');
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors flex items-center justify-between"
            >
              <span>🚨 Due in 7 Days</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button
              onClick={() => {
                setCurrentPage('risk-queue');
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-colors flex items-center justify-between"
            >
              <span>📍 Distance (&gt;30 km)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* User Role Footer */}
        <div className="pt-4 border-t border-slate-800 mt-4">
          <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              {user?.name ? user.name.charAt(0) : 'D'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Dr. Sarah Jenkins'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.role} • {user?.department || 'Outpatient'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
