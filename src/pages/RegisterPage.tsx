import React, { useState } from 'react';
import { 
  HeartPulse, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Phone, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  BadgeCheck, 
  ArrowRight,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('DOCTOR');
  const [department, setDepartment] = useState('Cardiology & Outpatient Medicine');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ name: string; email: string; role: string } | null>(null);

  const rolesConfig: {
    role: UserRole;
    label: string;
    description: string;
    icon: string;
    defaultDept: string;
  }[] = [
    {
      role: 'DOCTOR',
      label: 'Doctor',
      description: 'Review high-risk patients, validate clinical hazards & confirm treatment plans',
      icon: '🩺',
      defaultDept: 'Cardiology & Outpatient Medicine',
    },
    {
      role: 'NURSE',
      label: 'Nurse',
      description: 'Outpatient triage, vital checkups, appointment tracking & pre-visit screening',
      icon: '👩‍⚕️',
      defaultDept: 'Outpatient Triage & Vitals Unit',
    },
    {
      role: 'COORDINATOR',
      label: 'Hospital Follow-up / Co-ordination Staff',
      description: 'Priority call desk, WhatsApp & SMS reminders, patient transit assistance',
      icon: '📞',
      defaultDept: 'Follow-up & Coordination Desk',
    },
    {
      role: 'CARE_MANAGER',
      label: 'Care Manager',
      description: 'Chronic disease adherence, rehabilitation protocols & long-term care',
      icon: '📊',
      defaultDept: 'Chronic Disease Adherence Program',
    },
    {
      role: 'ADMIN',
      label: 'Hospital Administrator',
      description: 'Full system audit, patient master record management & scoring engine controls',
      icon: '🏛️',
      defaultDept: 'Hospital Clinical Administration',
    },
  ];

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const matched = rolesConfig.find(r => r.role === newRole);
    if (matched && (!department || rolesConfig.some(r => r.defaultDept === department))) {
      setDepartment(matched.defaultDept);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid hospital email address');
      return;
    }
    if (password && password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password || 'password123',
      role,
      department: department.trim(),
      employeeId: employeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: phone.trim(),
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessData({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: rolesConfig.find(r => r.role === role)?.label || role,
      });
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center z-10 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 shadow-md text-white mb-2.5">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Clinical Staff Registration
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Create an authorized account for Doctors, Nurses, Coordinators, Care Managers & Administrators
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          
          {successData ? (
            /* Success State */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Registration Successful!</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Your hospital staff account has been registered and initialized in the database.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Name:</span>
                  <span className="font-semibold text-slate-900">{successData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Email:</span>
                  <span className="font-semibold text-slate-900">{successData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{successData.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-700">Active & Authorized</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Clinical Staff Details</h2>
                  <p className="text-xs text-slate-500">Select your hospital role and enter authorization details</p>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Selector Segment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Your Clinical / Operational Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {rolesConfig.map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleChange(item.role)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        role === item.role
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-bold text-xs text-slate-900">{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name & Title *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Kulkarni"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. doctor.kulkarni@caretrack.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Specialty Unit
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Cardiology & Outpatient Medicine"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee / Medical Reg. No.
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. DOC-MH-4421"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                    <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Mobile Number (India)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+91 98100 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Secured under Indian Healthcare Informatics standard
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoading ? 'Creating Staff Account...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
