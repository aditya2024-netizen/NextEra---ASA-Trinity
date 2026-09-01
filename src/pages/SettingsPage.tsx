import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ScoringConfiguration, StaffUser, UserRole } from '../types';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Users,
  UserPlus,
  Lock,
  Mail,
  Phone,
  Building2,
  Trash2,
  KeyRound,
  Shield,
  Stethoscope,
  BadgeCheck,
  Search,
  PlusCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { DEFAULT_SCORING_CONFIG } from '../services/scoringEngine';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { scoringConfig, updateScoringConfig, addToast } = useApp();
  const { isAdmin, user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'scoring' | 'staff'>('scoring');
  const [config, setConfig] = useState<ScoringConfiguration>(scoringConfig);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Staff Management State (Admin Only)
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [staffSearch, setStaffSearch] = useState<string>('');

  // New Staff Form State
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('password123');
  const [newRole, setNewRole] = useState<UserRole>('DOCTOR');
  const [newDepartment, setNewDepartment] = useState<string>('Cardiology & Outpatient Medicine');
  const [newEmployeeId, setNewEmployeeId] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('+91 98000 ');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);

  const totalMax = 
    config.maxMissedPoints + 
    config.maxDistancePoints + 
    config.maxAttendancePoints + 
    config.maxDurationPoints + 
    config.maxFrequencyPoints;

  useEffect(() => {
    if (activeTab === 'staff' && isAdmin) {
      loadStaff();
    }
  }, [activeTab, isAdmin]);

  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const res = await api.getUsers();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateScoringConfig(config);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_SCORING_CONFIG);
  };

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
    if (role === 'DOCTOR') setNewDepartment('Cardiology & Outpatient Medicine');
    else if (role === 'NURSE') setNewDepartment('Outpatient Triage & Vitals');
    else if (role === 'COORDINATOR') setNewDepartment('Follow-up & Coordination Desk');
    else if (role === 'CARE_MANAGER') setNewDepartment('Chronic Disease Adherence Program');
    else if (role === 'ADMIN') setNewDepartment('Hospital Clinical Administration');
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!newName.trim()) {
      setRegError('Please provide the full name of the staff member.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setRegError('Please provide a valid hospital email address.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      setRegError('Password must be at least 4 characters.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await api.register({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        role: newRole,
        department: newDepartment.trim(),
        employeeId: newEmployeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: newPhone.trim(),
      });

      if (res.success) {
        addToast({
          title: 'Staff Registered Successfully',
          message: `${newName} has been added as ${newRole}. Credentials are now active.`,
          type: 'success'
        });
        // Reset form
        setNewName('');
        setNewEmail('');
        setNewPassword('password123');
        setNewEmployeeId('');
        setNewPhone('+91 98000 ');
        setShowAddStaffModal(false);
        loadStaff();
      } else {
        setRegError(res.message || 'Failed to register staff.');
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration request failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteStaff = async (email: string, name: string) => {
    if (email === 'admin@caretrack.in') {
      addToast({
        title: 'Protected Account',
        message: 'Primary Administrator account cannot be removed.',
        type: 'warning'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to deactivate staff account for ${name} (${email})?`)) {
      return;
    }

    try {
      const res = await api.deleteUser(email);
      if (res.success) {
        addToast({
          title: 'Staff Member Removed',
          message: res.message,
          type: 'info'
        });
        loadStaff();
      }
    } catch (err) {
      addToast({
        title: 'Action Failed',
        message: 'Could not remove staff account.',
        type: 'error'
      });
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.role.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.department?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'DOCTOR':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Doctor</span>;
      case 'NURSE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Nurse</span>;
      case 'COORDINATOR':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Follow-up Staff</span>;
      case 'CARE_MANAGER':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Care Manager</span>;
      case 'ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">Administrator</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Hospital System & Operations Settings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage risk scoring weights, clinical thresholds, and hospital staff registration
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('scoring')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scoring' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Scoring Engine</span>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'staff' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff & User Registration</span>
              {isAdmin && (
                <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-mono">
                  Admin
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SCORING ENGINE CONFIGURATION */}
      {activeTab === 'scoring' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Maximum Point Allocations (Must Sum to 100) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Factor Maximum Point Weights</h3>
                <p className="text-xs text-slate-500">Define the upper ceiling contribution of each clinical variable in the risk score formula.</p>
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                totalMax === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Total Cap: {totalMax} / 100 pts
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              {/* Missed Appointments Cap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Missed Visits Cap</label>
                  <span className="font-mono text-slate-900 font-bold">{config.maxMissedPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  step="5"
                  value={config.maxMissedPoints}
                  onChange={e => setConfig({ ...config, maxMissedPoints: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Default: 40 pts</span>
              </div>

              {/* Distance Cap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Distance from Hospital Cap</label>
                  <span className="font-mono text-slate-900 font-bold">{config.maxDistancePoints} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="5"
                  value={config.maxDistancePoints}
                  onChange={e => setConfig({ ...config, maxDistancePoints: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Default: 20 pts</span>
              </div>

              {/* Attendance History Cap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Attendance History Cap</label>
                  <span className="font-mono text-slate-900 font-bold">{config.maxAttendancePoints} pts</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="5"
                  value={config.maxAttendancePoints}
                  onChange={e => setConfig({ ...config, maxAttendancePoints: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Default: 25 pts</span>
              </div>

              {/* Treatment Duration Cap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Treatment Duration Cap</label>
                  <span className="font-mono text-slate-900 font-bold">{config.maxDurationPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={config.maxDurationPoints}
                  onChange={e => setConfig({ ...config, maxDurationPoints: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Default: 10 pts</span>
              </div>

              {/* Frequency Gap Cap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between font-semibold">
                  <label className="text-slate-700">Appointment Cadence Cap</label>
                  <span className="font-mono text-slate-900 font-bold">{config.maxFrequencyPoints} pts</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={config.maxFrequencyPoints}
                  onChange={e => setConfig({ ...config, maxFrequencyPoints: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Default: 5 pts</span>
              </div>
            </div>
          </div>

          {/* Risk Thresholds */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Risk Classification Cut-off Thresholds</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                <label className="font-bold text-rose-900 block">High-Risk Minimum Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="50"
                    max="80"
                    value={config.highRiskThreshold}
                    onChange={e => setConfig({ ...config, highRiskThreshold: Number(e.target.value) })}
                    className="w-24 p-2 bg-white border border-rose-300 rounded-lg font-bold text-rose-950 font-mono text-sm"
                  />
                  <span className="text-slate-600">Points &gt;= {config.highRiskThreshold} triggers HIGH Risk triage</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <label className="font-bold text-amber-900 block">Medium-Risk Minimum Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="20"
                    max="50"
                    value={config.mediumRiskThreshold}
                    onChange={e => setConfig({ ...config, mediumRiskThreshold: Number(e.target.value) })}
                    className="w-24 p-2 bg-white border border-amber-300 rounded-lg font-bold text-amber-950 font-mono text-sm"
                  />
                  <span className="text-slate-600">Points &gt;= {config.mediumRiskThreshold} triggers MEDIUM Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Standard Defaults
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isSaving ? 'Recalculating Ranks...' : 'Save & Recalculate Cohort'}
              <Save className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: STAFF DIRECTORY & ADMIN-ONLY REGISTRATION */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {!isAdmin ? (
            /* Non-Admin Locked State */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Administrator Authorization Required
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Hospital staff registration and credential provisioning are restricted strictly to 
                  <strong> Hospital Administrators</strong>. Logged in as <span className="font-semibold text-slate-800">{currentUser?.name} ({currentUser?.role})</span>.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left">
                <span className="font-bold text-slate-800 block mb-1">How staff accounts are provisioned:</span>
                Contact your Hospital IT Administrator (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">admin@caretrack.in</code>) to create new Doctor, Nurse, or Coordinator accounts.
              </div>
            </div>
          ) : (
            /* Admin Staff Management Panel */
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <h2 className="text-base font-bold text-slate-900">
                        Hospital Staff Registry & Onboarding
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Only administrators can register and provision credentials for Doctors, Nurses, Coordinators & Care Managers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register New Staff Member</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search staff by name, email, department or role..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Staff Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Authorized Personnel ({filteredStaff.length})
                  </span>
                  <span className="text-xs text-slate-500">
                    Active Hospital Directory
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-bold">
                        <th className="py-3 px-6">Staff Member</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStaff.map((staff) => (
                        <tr key={staff.email} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{staff.name}</div>
                                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{staff.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {getRoleBadge(staff.role)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {staff.department || 'Outpatient Services'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {staff.employeeId || 'EMP-1001'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {staff.phone || '+91 98000 00000'}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {staff.email === 'admin@caretrack.in' ? (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Root Admin
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(staff.email, staff.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Deactivate staff account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN-ONLY REGISTRATION MODAL */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Admin Registration: Onboard Hospital Staff
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Create login credentials and assign clinical roles
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleRegisterStaff} className="p-6 space-y-4">
                  {regError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Staff Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Sunita Deshmukh"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hospital Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. sdeshmukh@caretrack.in"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Initial Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-8 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Clinical Role *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-bold"
                    >
                      <option value="DOCTOR">Doctor (Outpatient Review & Clinical Validation)</option>
                      <option value="NURSE">Nurse (Outpatient Triage & Screening)</option>
                      <option value="COORDINATOR">Follow-up Staff (Call Desk & Reminders)</option>
                      <option value="CARE_MANAGER">Care Manager (Chronic Disease Management)</option>
                      <option value="ADMIN">Hospital Administrator (Full Privileges)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Unit
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="e.g. Cardiology & Outpatient Medicine"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. EMP-3421"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98000 00000"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isRegistering ? 'Registering Staff...' : 'Create Staff Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
