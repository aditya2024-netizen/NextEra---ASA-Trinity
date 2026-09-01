import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  UserCheck, 
  AlertCircle, 
  Stethoscope, 
  Building2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { login, loginAsAdmin, user, isAdmin } = useAuth();
  const { addToast } = useApp();

  const [email, setEmail] = useState<string>('admin@caretrack.in');
  const [password, setPassword] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      if (res.success) {
        addToast('success', 'Admin Session Verified', `Signed in as ${email}. Full edit and dispatch rights unlocked.`);
        onClose();
      } else {
        setErrorMsg(res.message || 'Invalid administrative credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdmin = async () => {
    await loginAsAdmin();
    addToast('success', 'Admin Access Granted', 'Signed in as Dr. Aruna Swaminathan (Hospital Administrator).');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Admin Authentication Portal</h3>
              <p className="text-xs text-slate-300">CareTrack Clinical Follow-up System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isAdmin ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">You are logged in as Administrator</h4>
              <p className="text-xs text-slate-600">
                Active User: <strong className="text-slate-900">{user?.name}</strong> ({user?.email})
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                >
                  Continue to System
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick 1-Click Login */}
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="w-full p-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-900 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    AS
                  </div>
                  <div>
                    <span className="font-bold block text-xs">1-Click Sign In: Dr. Aruna Swaminathan</span>
                    <span className="text-[11px] text-blue-700">Hospital Administrator • admin@caretrack.in</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or Enter Credentials</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="admin@hospital.org"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Security Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Admin'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
