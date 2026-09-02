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
  isAuthenticating: boolean;
  authStatusMessage: string | null;
  isLoggingOut: boolean;
  lastLogoutNotice: string | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsAdmin: (password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  clearLogoutNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // App starts with NO logged-in user so Login Page is shown first!
  const [user, setUser] = useState<StaffUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('caretrack_user');
      const savedToken = localStorage.getItem('caretrack_token');
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [lastLogoutNotice, setLastLogoutNotice] = useState<string | null>(null);

  const clearLogoutNotice = () => setLastLogoutNotice(null);

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    setIsAuthenticating(true);
    setAuthStatusMessage('Verifying credentials with CareTrack Hospital Server...');
    setLastLogoutNotice(null);

    try {
      const res = await api.login(email, password);
      if (res.success && res.user) {
        setAuthStatusMessage(`Authenticated: Welcome, ${res.user.name}. Loading clinical workspace...`);
        // Smooth clinical security feedback delay (700ms)
        await new Promise(resolve => setTimeout(resolve, 700));

        setUser(res.user);
        localStorage.setItem('caretrack_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('caretrack_token', res.token);
        }
        setIsAuthenticating(false);
        setAuthStatusMessage(null);
        return { success: true, message: res.message };
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      setIsAuthenticating(false);
      setAuthStatusMessage(null);
      return { success: false, message: res.message || 'Invalid credentials' };
    } catch (err: any) {
      console.error(err);
      setIsAuthenticating(false);
      setAuthStatusMessage(null);
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

  const logout = async () => {
    setIsLoggingOut(true);
    // Smooth clinical session clearing delay (650ms)
    await new Promise(resolve => setTimeout(resolve, 650));
    setUser(null);
    localStorage.removeItem('caretrack_user');
    localStorage.removeItem('caretrack_token');
    setIsLoggingOut(false);
    setLastLogoutNotice('You have been securely signed out. Clinical session credentials cleared.');
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
      isAuthenticating,
      authStatusMessage,
      isLoggingOut,
      lastLogoutNotice,
      login, 
      loginAsAdmin,
      register,
      logout,
      clearLogoutNotice,
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
