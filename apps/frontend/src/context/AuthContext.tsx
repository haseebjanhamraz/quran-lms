'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/apiFetch';
import TerminatedScreen from '@/components/TerminatedScreen';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'REVIEWER' | 'SUPERVISOR' | 'HR';
  permissions?: string[];
  preferredName?: string;
  gender?: string;
  country?: string;
  cameraRestricted?: boolean;
  dob?: string;
  dateOfBirth?: string;
  timezone?: string;
  enrollmentDate?: string;
  status?: string;
  studentStatus?: string;
  trialStatus?: string;
  isDiscontinued?: boolean;
  discontinued?: boolean;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
  accountStatusReason?: string;
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
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

  const updateUserState = (newUser: User | null) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      try {
        if (newUser) {
          localStorage.setItem('quran_lms_auth_user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('quran_lms_auth_user');
          localStorage.removeItem('quran_lms_access_token');
        }
      } catch (_) {}
    }
  };

  const checkAuth = async () => {
    try {
      const res = await apiFetch(`${API_URL}/auth/me`);

      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          updateUserState(data.user);
        }
      } else if (res.status === 401) {
        updateUserState(null);
      }
    } catch (err) {
      console.error('Error during auth check:', err);
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
        if (data?.user) {
          updateUserState(data.user);
        }
        if (data?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('quran_lms_access_token', data.accessToken);
        }
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('quran_lms_auth_user');
        if (cached) {
          setUser(JSON.parse(cached));
        }
      } catch (_) {}
    }

    checkAuth();

    const handleUserRefreshed = (e: any) => {
      if (e.detail) {
        updateUserState(e.detail);
      }
    };
    window.addEventListener('auth:user-refreshed', handleUserRefreshed);
    return () => window.removeEventListener('auth:user-refreshed', handleUserRefreshed);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      updateUserState(data.user);
      if (data.accessToken && typeof window !== 'undefined') {
        localStorage.setItem('quran_lms_access_token', data.accessToken);
      }

      const redirectPath =
        data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN'
          ? '/admin/dashboard'
          : `/${data.user.role.toLowerCase()}/dashboard`;
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
      updateUserState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('quran_lms_access_token');
        localStorage.removeItem('quran_lms_auth_user');
      }
      router.push('/login');
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const perms = user.permissions || [];
    if (perms.length === 0 && user.role === 'ADMIN') return true;
    return perms.includes(permission) || perms.includes(`${permission.split('.')[0]}.*`);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, error }}>
      {user && user.accountStatus === 'TERMINATED' && <TerminatedScreen user={user} />}
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
