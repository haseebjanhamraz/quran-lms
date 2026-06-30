'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  UserCheck,
  ShieldCheck,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Activity,
  Flag,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses' },
  { label: 'Schedule', icon: Calendar, href: '/admin/schedule' },
  { label: 'Enrollments', icon: UserCheck, href: '/admin/enrollments' },
  { label: 'Reviewer Assignments', icon: ShieldCheck, href: '/admin/reviewer-assignments' },
  { label: 'Flagged Reviews', icon: Flag, href: '/admin/dashboard', isFlaggedReviews: true },
  { label: 'Audit Logs', icon: Activity, href: '/admin/audit-logs' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth() as {
    user: { name: string; email: string } | null;
    logout: () => void;
  };
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => {
    async function getFlagged() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        const res = await fetch(`${API_URL}/class-reviews/flagged`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFlaggedCount(Array.isArray(data) ? data.length : data.data?.length ?? 0);
        }
      } catch (_) {}
    }
    getFlagged();
    const interval = setInterval(getFlagged, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Backdrop for mobile drawers */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: '#0a2e2b' }}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Islamic Crescent Moon Icon */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 34 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="flex-shrink-0"
            >
              <circle cx="17" cy="17" r="16" fill="#C9A84C" fillOpacity="0.15" />
              <path
                d="M22 10.5A9 9 0 0 1 13 26a9 9 0 1 0 9-15.5z"
                fill="#C9A84C"
              />
              <circle cx="23" cy="12" r="1.5" fill="#C9A84C" opacity="0.7" />
              <circle cx="25" cy="16" r="1" fill="#C9A84C" opacity="0.5" />
            </svg>
            {!isCollapsed && (
              <div className="transition-all duration-200">
                <p className="text-sm font-bold leading-tight" style={{ color: '#C9A84C' }}>
                  Quran Academy
                </p>
                <p className="text-[9px] font-medium uppercase tracking-widest text-teal-300/60">
                  Admin Portal
                </p>
              </div>
            )}
          </div>

          {/* Toggle Expand/Collapse Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-100 md:block"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={
                    isActive ? 'text-[#C9A84C]' : 'text-slate-400 group-hover:text-slate-200'
                  }
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.isFlaggedReviews && flaggedCount > 0 && (
                  <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ${isCollapsed ? 'absolute right-2 top-2' : ''}`}>
                    {flaggedCount}
                  </span>
                )}
                {isActive && !isCollapsed && !item.isFlaggedReviews && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with Profile & Logout */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-900"
              style={{ background: '#C9A84C' }}
            >
              {user ? getInitials(user.name) : 'AD'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 transition-all duration-200">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Window wrapper */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Mobile Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800/40 bg-slate-900/60 px-4 md:hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-sm tracking-wide text-slate-200">
            Quran LMS Admin
          </span>
          <div className="w-10" />
        </header>

        {/* Main Content Area */}
        <main className="relative flex-grow p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
