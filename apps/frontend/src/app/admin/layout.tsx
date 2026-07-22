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
  Sparkles,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ThemeToggle from '@/components/ThemeToggle';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses' },
  { label: 'Schedule', icon: Calendar, href: '/admin/schedule' },
  { label: 'Enrollments', icon: UserCheck, href: '/admin/enrollments' },
  { label: 'Reviewer Assignments', icon: ShieldCheck, href: '/admin/reviewer-assignments' },
  { label: 'AI Quality Reports', icon: Sparkles, href: '/admin/reports' },
  { label: 'Flagged Reviews', icon: Flag, href: '/admin/dashboard', isFlaggedReviews: true },
  { label: 'Audit Logs', icon: Activity, href: '/admin/audit-logs' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${API_URL}/class-reviews/flagged`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFlaggedCount(Array.isArray(data) ? data.length : data.data?.length ?? 0);
        }
      } catch (_) { }
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
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Backdrop for mobile drawers */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Islamic Crescent Moon Icon */}
            <Image src="/logo.png" width={30} height={30} alt="Logo" />
            {!isCollapsed && (
              <div className="transition-all duration-200">
                <p className="text-sm font-bold leading-tight text-brand">
                  Quran Academy
                </p>
                <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                  Admin Portal
                </p>
              </div>
            )}
          </div>

          {/* Toggle Expand/Collapse Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-sidebar-foreground md:block"
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
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-brand/15 text-brand font-semibold'
                  : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground'
                  }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={
                    isActive ? 'text-brand' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  }
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.isFlaggedReviews && flaggedCount > 0 && (
                  <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground ${isCollapsed ? 'absolute right-2 top-2' : ''}`}>
                    {flaggedCount}
                  </span>
                )}
                {isActive && !isCollapsed && !item.isFlaggedReviews && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with Profile & Logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold bg-brand text-brand-foreground"
            >
              {user ? getInitials(user.name) : 'AD'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 transition-all duration-200">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Window wrapper */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
      >
        {/* Global Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-header/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>
            <span className="font-display font-bold text-sm tracking-wide text-foreground hidden md:inline">
              Compliance Administration Dashboard
            </span>
            <span className="font-display font-bold text-sm tracking-wide text-foreground md:hidden">
              Quran LMS Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationsDropdown />
            <div className="hidden text-right md:block">
              <p className="text-xs font-semibold text-foreground leading-none">{user?.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Administrator</p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative flex-grow p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
