'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, UserProfile } from './api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  portal: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL';
  login: (employeeCode: string, password: string, portal: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL') => Promise<void>;
  logout: () => void;
  switchPortal: (newPortal: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [portal, setPortal] = useState<'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL'>('EMPLOYEE_PORTAL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ponytail: Rehydrate session from localStorage with zero external cookies/storage libraries
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedPortal = localStorage.getItem('portal') as 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL';

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedPortal) setPortal(savedPortal);
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    employeeCode: string,
    password: string,
    targetPortal: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL',
  ) => {
    const data = await api.login(employeeCode, password, targetPortal);
    setToken(data.accessToken);
    setUser(data.user);
    setPortal(targetPortal);

    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('portal', targetPortal);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  const switchPortal = (newPortal: 'EMPLOYEE_PORTAL' | 'MANAGEMENT_PORTAL') => {
    setPortal(newPortal);
    localStorage.setItem('portal', newPortal);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        portal,
        login,
        logout,
        switchPortal,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
