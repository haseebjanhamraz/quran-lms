'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/apiFetch';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'REVIEWER' | 'SUPERVISOR' | 'HR';
  permissions?: string[];
  preferredName?: string;
  gender?: string;
  dob?: string;
  dateOfBirth?: string;
  timezone?: string;
  enrollmentDate?: string;
  status?: string;
  studentStatus?: string;
  trialStatus?: string;
  isDiscontinued?: boolean;
  discontinued?: boolean;
  avatar?: string;
  profilePicture?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  studentId?: string;
  type?: 'CHILD' | 'ADULT';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const checkAuth = async () => {
    try {
      const res = await apiFetch(`${API_URL}/auth/me`);

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error during auth check:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshTokens = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error during token refresh:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      const redirectPath = `/${data.user.role.toLowerCase()}/dashboard`;
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const perms = user.permissions || [];
    return perms.includes(permission) || perms.includes(`${permission.split('.')[0]}.*`);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
