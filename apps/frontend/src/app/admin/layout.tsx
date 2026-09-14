'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isViewer = pathname?.includes('/materials/view/');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isViewer && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [user, loading, router, isViewer]);

  if (isViewer) {
    if (loading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-400 font-mono">Authenticating secure session...</p>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      <Navbar
        role={user?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'}
        subHeader="Compliance & Academy Administration Portal"
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
