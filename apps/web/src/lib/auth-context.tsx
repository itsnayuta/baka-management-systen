'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, UserProfile } from './api';

export type PortalType = 'employee-portal' | 'management-portal';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  portal: PortalType;
  login: (email: string, password: string, portal: PortalType) => Promise<void>;
  logout: () => void;
  switchPortal: (newPortal: PortalType) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [portal, setPortal] = useState<PortalType>('employee-portal');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ponytail: Rehydrate session from localStorage with zero external cookies/storage libraries
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedPortal = localStorage.getItem('portal') as PortalType;

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
    email: string,
    password: string,
    targetPortal: PortalType,
  ) => {
    const data = await api.login(email, password, targetPortal);
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

  const switchPortal = (newPortal: PortalType) => {
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
