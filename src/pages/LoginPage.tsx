import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  HeartPulse, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticating, authStatusMessage, lastLogoutNotice, clearLogoutNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setIsLoading(true);
    try {
      const res = await login(quickEmail, quickPass);
      if (!res.success) {
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your hospital email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your security password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const res = await login(email.trim(), password);
    setIsLoading(false);
    if (!res.success) {
      setError(res.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 text-white mb-4">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          CareTrack AI
        </h1>
        <p className="mt-1.5 text-sm text-slate-300">
          Indian Outpatient Follow-up & Adherence Intelligence Portal
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ABDM & Clinical Privacy Compliant</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-8 border border-slate-100 space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Clinical Staff Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered hospital email and password to access the portal
            </p>
          </div>

          {lastLogoutNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{lastLogoutNotice}</span>
              </div>
              <button 
                type="button" 
                onClick={clearLogoutNotice}
                className="text-emerald-600 hover:text-emerald-900 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {isAuthenticating && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-900 animate-in fade-in">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="font-bold text-blue-800">{authStatusMessage || 'Authenticating clinical credentials...'}</p>
                <p className="text-[11px] text-blue-600">Verifying ABDM clinical permissions & initializing workspace...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@caretrack.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-slate-900 font-medium transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Security Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-slate-900 font-medium transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Clinical Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              Instant Demo Access (1-Click)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('doctor@caretrack.in', 'password123')}
                className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-left transition-all cursor-pointer disabled:opacity-50 hover:shadow-xs active:scale-[0.98]"
              >
                👨‍⚕️ Doctor 1-Click Login
                <span className="block text-[10px] font-normal text-blue-600">Dr. Rajesh Kulkarni</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('admin@caretrack.in', 'password123')}
                className="p-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-left transition-all cursor-pointer disabled:opacity-50 hover:shadow-xs active:scale-[0.98]"
              >
                🏥 Admin 1-Click Login
                <span className="block text-[10px] font-normal text-purple-600">Dr. Aruna Swaminathan</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('coordinator@caretrack.in', 'password123')}
                className="p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-left transition-all cursor-pointer disabled:opacity-50 hover:shadow-xs active:scale-[0.98]"
              >
                📞 Coordinator 1-Click
                <span className="block text-[10px] font-normal text-emerald-600">Amit Verma</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('nurse@caretrack.in', 'password123')}
                className="p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-left transition-all cursor-pointer disabled:opacity-50 hover:shadow-xs active:scale-[0.98]"
              >
                👩‍⚕️ Nurse 1-Click Login
                <span className="block text-[10px] font-normal text-amber-600">Sister Meena Pillai</span>
              </button>
            </div>
          </div>

          {/* Admin Notice */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Staff accounts and credentials are provisioned exclusively by Hospital Administrators.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-4">
          CareTrack Indian Healthcare Network • Authorized Personnel Access Only
        </p>
      </div>
    </div>
  );
};
