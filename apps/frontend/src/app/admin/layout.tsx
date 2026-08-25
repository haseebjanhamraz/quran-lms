'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Activity,
  Flag,
  Sparkles,
  Settings,
  ChevronDown,
  User as UserIcon,
  Shield,
  Clock,
  GraduationCap,
  BookUser,
  CreditCard,
  Briefcase,
  PlaneTakeoff,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import { apiFetch } from '@/utils/apiFetch';

interface NavItem {
  label: string;
  icon: any;
  href: string;
  permission?: string;
  isFlaggedReviews?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Students', icon: GraduationCap, href: '/admin/students', permission: 'students.read' },
  { label: 'Teachers', icon: BookUser, href: '/admin/teachers', permission: 'teachers.read' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses', permission: 'courses.read' },
  { label: 'Materials (PDF)', icon: FileText, href: '/admin/materials' },
  { label: 'Schedule', icon: Calendar, href: '/admin/schedule', permission: 'schedule.read' },
  { label: 'HR & Finance', icon: Briefcase, href: '/admin/hr', permission: 'hr.read' },
];

const MORE_NAV: NavItem[] = [
  { label: 'Leave Requests', icon: PlaneTakeoff, href: '/admin/leave-requests', permission: 'leave.read' },
  { label: 'Fees Collection', icon: CreditCard, href: '/admin/hr?tab=fees', permission: 'fees.read' },
  { label: 'Users & Accounts', icon: Users, href: '/admin/users', permission: 'users.read' },
  { label: 'Enrollments', icon: UserCheck, href: '/admin/enrollments', permission: 'enrollments.read' },
  { label: 'Supervisor Assignments', icon: ShieldCheck, href: '/admin/supervisor-assignments', permission: 'supervisors.read' },
  { label: 'AI Quality Reports', icon: Sparkles, href: '/admin/reports', permission: 'reports.read' },
  { label: 'Flagged Reviews', icon: Flag, href: '/admin/dashboard', isFlaggedReviews: true },
  { label: 'Audit Logs', icon: Activity, href: '/admin/audit-logs', permission: 'audit-logs.read' },
  { label: 'Feedback & Complaints', icon: Clock, href: '/admin/feedback', permission: 'feedback.read' },
  { label: 'Roles & Permissions', icon: Shield, href: '/admin/roles-permissions' },
  { label: 'Settings', icon: Settings, href: '/admin/settings', permission: 'settings.read' },
];

function getInitials(name: string): string {
  if (!name) return 'AD';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasPermission } = useAuth() as any;
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const visiblePrimaryNav = PRIMARY_NAV.filter(item => !item.permission || !hasPermission || hasPermission(item.permission));
  const visibleMoreNav = MORE_NAV.filter(item => !item.permission || !hasPermission || hasPermission(item.permission));
  const allNavItems = [...visiblePrimaryNav, ...visibleMoreNav];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function getFlagged() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await apiFetch(`${API_URL}/class-reviews/flagged`);
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
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      {/* Fixed Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border px-4 md:px-6 flex items-center justify-between">

        {/* Left: Logo and Primary Nav */}
        <div className="flex items-center gap-6 h-full">
          <div className="flex items-center gap-2 ">
            <Image src="/logo.png" width={32} height={32} alt="Logo" className="bg-white p-1/5 rounded-sm" />
            <div className="hidden lg:block">
              <p className="text-sm font-bold leading-tight text-brand">Ain Ul Quran</p>
              <p className="text-[9px] font-medium uppercase tracking-widest text-white">Admin Portal</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 h-full">
            {visiblePrimaryNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-full items-center gap-2 px-3 text-sm font-medium transition-colors ${isActive
                    ? 'text-brand shadow-[inset_0_-2px_0_0_hsl(var(--brand))]'
                    : 'text-white hover:text-sidebar-foreground hover:bg-sidebar-foreground/5'
                    }`}
                >
                  <Icon size={16} className={isActive ? 'text-brand' : 'text-sidebar-foreground/70'} />
                  {item.label}
                </Link>
              );
            })}

            {/* More Dropdown */}
            {visibleMoreNav.length > 0 && (
              <div className="relative h-full flex items-center" ref={moreRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`flex h-full items-center gap-1 px-3 text-sm font-medium transition-colors ${visibleMoreNav.some(item => pathname === item.href)
                    ? 'text-brand shadow-[inset_0_-2px_0_0_hsl(var(--brand))]'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5'
                    }`}
                >
                  More <ChevronDown size={14} className={`transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-60 rounded-xl bg-card border border-border shadow-xl py-2 flex flex-col z-50">
                    {visibleMoreNav.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                          <Icon size={16} />
                          {item.label}
                          {item.isFlaggedReviews && flaggedCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                              {flaggedCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right: Actions and Profile */}
        <div className="flex items-center gap-3 md:gap-4 h-full">
          <ThemeToggle />
          <NotificationsDropdown />

          <div className="relative h-full flex items-center" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-sidebar-foreground/5 p-1 rounded-full md:rounded-lg md:pr-3 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground shadow-sm">
                {user ? getInitials(user.name) : 'AD'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-sidebar-foreground leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{user?.role || 'Administrator'}</p>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-1 w-64 rounded-xl bg-card border border-border shadow-lg py-2 flex flex-col z-50">
                <div className="px-4 py-3 border-b border-border mb-2">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 top-16 bg-background/95 backdrop-blur-sm md:hidden flex flex-col border-t border-border overflow-y-auto">
          <div className="p-4 flex flex-col gap-1">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand/15 text-brand' : 'text-foreground/80 hover:bg-muted'
                    }`}
                >
                  <Icon size={18} className={isActive ? 'text-brand' : 'text-muted-foreground'} />
                  {item.label}
                  {item.isFlaggedReviews && flaggedCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {flaggedCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub Header */}
      <div className="mt-16 bg-header/50 backdrop-blur border-b border-border px-6 py-2">
        <h1 className="font-display font-semibold text-sm tracking-wide text-muted-foreground">
          Compliance & Academy Administration Portal
        </h1>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}
