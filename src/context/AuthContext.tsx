import React, { createContext, useContext, useState } from 'react';
import { StaffUser, UserRole, RegisterRequest } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: StaffUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isCoordinator: boolean;
  isCareManager: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsAdmin: (password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // App starts with NO logged-in user so Login Page is shown first!
  const [user, setUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('caretrack_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.login(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('caretrack_user', JSON.stringify(res.user));
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Invalid credentials' };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message || 'Login connection error' };
    }
  };

  const loginAsAdmin = async (password?: string) => {
    return login('admin@caretrack.in', password || 'password123');
  };

  const register = async (payload: RegisterRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.register(payload);
      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('caretrack_user');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isDoctor = user?.role === 'DOCTOR';
  const isNurse = user?.role === 'NURSE';
  const isCoordinator = user?.role === 'COORDINATOR';
  const isCareManager = user?.role === 'CARE_MANAGER';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isAdmin, 
      isDoctor,
      isNurse,
      isCoordinator,
      isCareManager,
      login, 
      loginAsAdmin,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
