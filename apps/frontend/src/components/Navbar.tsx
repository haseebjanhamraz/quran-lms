'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  UserCheck,
  ShieldCheck,
  LogOut,
  Menu,
  X,
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
  FileText,
  HelpCircle,
  Video,
} from 'lucide-react';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ThemeToggle from '@/components/ThemeToggle';
import IslamabadClock from '@/components/IslamabadClock';
import { apiFetch } from '@/utils/apiFetch';

export interface NavItemConfig {
  key?: string;
  label: string;
  icon?: any;
  href?: string;
  permission?: string;
  badgeCount?: number;
  isFlaggedReviews?: boolean;
}

export interface NavbarProps {
  /**
   * Explicit role override. If omitted, defaults to authenticated user's role.
   */
  role?: 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT' | 'HR' | 'HR_MANAGER' | 'FINANCE' | 'SUPERVISOR' | 'REVIEWER' | string;

  /**
   * Custom portal subtitle/title displayed next to brand logo (e.g. "Teacher Portal").
   */
  portalTitle?: string;

  /**
   * Sub-header title rendered in a subtle ribbon directly below the main nav bar.
   */
  subHeader?: string;

  /**
   * In-page active tab key (for tabbed dashboards like Teacher, Student, Supervisor, Reviewer).
   */
  activeTab?: string;

  /**
   * Callback fired when an in-page tab is clicked.
   */
  onTabChange?: (tabKey: string) => void;

  /**
   * Custom tabs or nav items overriding default role navigation.
   */
  customTabs?: (string | NavItemConfig)[];

  /**
   * Extra actions rendered in the top-right toolbar before Theme/Notifications/Profile.
   */
  extraActions?: React.ReactNode;

  /**
   * Hide the live Islamabad clock if needed (default: false).
   */
  hideClock?: boolean;

  /**
   * Optional custom classes for the header container.
   */
  className?: string;
}

// ── Default Navigation Configurations per Role ──────────────────────────────────

const ADMIN_PRIMARY_NAV: NavItemConfig[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Students', icon: GraduationCap, href: '/admin/students', permission: 'students.read' },
  { label: 'Teachers', icon: BookUser, href: '/admin/teachers', permission: 'teachers.read' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses', permission: 'courses.read' },
  { label: 'Materials (PDF)', icon: FileText, href: '/admin/materials' },
  { label: 'Schedule', icon: Calendar, href: '/admin/schedule', permission: 'schedule.read' },
  { label: 'HR & Finance', icon: Briefcase, href: '/admin/hr', permission: 'hr.read' },
];

const ADMIN_MORE_NAV: NavItemConfig[] = [
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

const HR_PRIMARY_NAV: NavItemConfig[] = [
  { label: 'HR Dashboard', icon: LayoutDashboard, href: '/hr/dashboard' },
  { label: 'Finance & Expenses', icon: CreditCard, href: '/hr/finance', permission: 'fees.read' },
  { label: 'Teacher Payroll & Slips', icon: Briefcase, href: '/hr/salary', permission: 'salary-payments.read' },
  { label: 'Parent Support Tickets', icon: HelpCircle, href: '/hr/support', permission: 'support.read' },
  { label: 'Employee Directory', icon: Users, href: '/hr/employees', permission: 'teachers.read' },
];

const TEACHER_DEFAULT_TABS: NavItemConfig[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Schedule', label: 'Schedule', icon: Calendar },
  { key: 'My Courses', label: 'My Courses', icon: BookOpen },
  { key: 'My Students', label: 'My Students', icon: GraduationCap },
  { key: 'Class Recordings', label: 'Class Recordings', icon: Video },
];

const STUDENT_DEFAULT_TABS: NavItemConfig[] = [
  { key: 'learning', label: 'Learning Portal', icon: BookOpen },
  { key: 'schedule', label: 'Daily Schedule', icon: Calendar },
  { key: 'attendance', label: 'Attendance Logs', icon: Clock },
];

const SUPERVISOR_DEFAULT_TABS: NavItemConfig[] = [
  { key: 'pending', label: 'Pending Reviews', icon: Clock },
  { key: 'flagged', label: 'Flagged Issues', icon: Flag },
  { key: 'history', label: 'Review History', icon: Activity },
  { key: 'assignments', label: 'My Assignments', icon: UserCheck },
  { key: 'settings', label: 'Platform Settings', icon: Settings },
];

const REVIEWER_DEFAULT_TABS: NavItemConfig[] = [
  { key: 'pending', label: 'Pending Reviews', icon: Clock },
  { key: 'flagged', label: 'Flagged Issues', icon: Flag },
  { key: 'history', label: 'Review History', icon: Activity },
  { key: 'assignments', label: 'My Assignments', icon: UserCheck },
  { key: 'settings', label: 'Platform Settings', icon: Settings },
];

function getInitials(name?: string, fallback = 'AQ'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRolePortalTitle(role?: string): string {
  const norm = (role || '').toUpperCase();
  if (norm === 'ADMIN' || norm === 'SUPER_ADMIN') return 'Admin Portal';
  if (norm === 'TEACHER') return 'Teacher Portal';
  if (norm === 'STUDENT') return 'Student Portal';
  if (norm === 'HR' || norm === 'HR_MANAGER' || norm === 'FINANCE') return 'HR Operations Portal';
  if (norm === 'SUPERVISOR') return 'Supervisor Portal';
  if (norm === 'REVIEWER') return 'Reviewer Portal';
  return 'Ain Ul Quran Portal';
}

function getRoleBadgeBg(role?: string): string {
  const norm = (role || '').toUpperCase();
  if (norm === 'ADMIN' || norm === 'SUPER_ADMIN') return 'bg-brand text-brand-foreground';
  if (norm === 'TEACHER') return 'bg-emerald-600 text-white';
  if (norm === 'STUDENT') return 'bg-blue-600 text-white';
  if (norm === 'HR' || norm === 'HR_MANAGER' || norm === 'FINANCE') return 'bg-cyan-600 text-white';
  if (norm === 'SUPERVISOR') return 'bg-purple-600 text-white';
  if (norm === 'REVIEWER') return 'bg-amber-600 text-white';
  return 'bg-primary text-primary-foreground';
}

export default function Navbar({
  role: propRole,
  portalTitle,
  subHeader,
  activeTab,
  onTabChange,
  customTabs,
  extraActions,
  hideClock = false,
  className = '',
}: NavbarProps) {
  const { user, logout, hasPermission } = useAuth() as any;
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);

  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const activeRole = (propRole || user?.role || 'STUDENT').toUpperCase();
  const displayPortalTitle = portalTitle || getRolePortalTitle(activeRole);

  // Close dropdowns on outside click
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

  // Poll flagged count for Admin roles
  useEffect(() => {
    if (activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN') return;

    let mounted = true;
    async function getFlagged() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await apiFetch(`${API_URL}/class-reviews/flagged`);
        if (res.ok && mounted) {
          const data = await res.json();
          setFlaggedCount(Array.isArray(data) ? data.length : data.data?.length ?? 0);
        }
      } catch (_) { }
    }

    getFlagged();
    const interval = setInterval(getFlagged, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeRole]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Build normalized nav items based on customTabs or defaults
  const { primaryNavItems, moreNavItems, isTabMode } = useMemo(() => {
    if (customTabs && customTabs.length > 0) {
      const normalized: NavItemConfig[] = customTabs.map((item) => {
        if (typeof item === 'string') {
          return { key: item, label: item };
        }
        return item;
      });
      return { primaryNavItems: normalized, moreNavItems: [], isTabMode: Boolean(onTabChange) };
    }

    if (activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN') {
      const visiblePrimary = ADMIN_PRIMARY_NAV.filter(
        (item) => !item.permission || !hasPermission || hasPermission(item.permission)
      );
      const visibleMore = ADMIN_MORE_NAV.filter(
        (item) => !item.permission || !hasPermission || hasPermission(item.permission)
      );
      return { primaryNavItems: visiblePrimary, moreNavItems: visibleMore, isTabMode: false };
    }

    if (activeRole === 'HR' || activeRole === 'HR_MANAGER' || activeRole === 'FINANCE') {
      const visiblePrimary = HR_PRIMARY_NAV.filter(
        (item) => !item.permission || !hasPermission || hasPermission(item.permission)
      );
      return { primaryNavItems: visiblePrimary, moreNavItems: [], isTabMode: false };
    }

    if (activeRole === 'TEACHER') {
      return { primaryNavItems: TEACHER_DEFAULT_TABS, moreNavItems: [], isTabMode: Boolean(onTabChange) };
    }

    if (activeRole === 'SUPERVISOR') {
      return { primaryNavItems: SUPERVISOR_DEFAULT_TABS, moreNavItems: [], isTabMode: Boolean(onTabChange) };
    }

    if (activeRole === 'REVIEWER') {
      return { primaryNavItems: REVIEWER_DEFAULT_TABS, moreNavItems: [], isTabMode: Boolean(onTabChange) };
    }

    // Default to student tabs
    return { primaryNavItems: STUDENT_DEFAULT_TABS, moreNavItems: [], isTabMode: Boolean(onTabChange) };
  }, [activeRole, customTabs, onTabChange, hasPermission]);

  const allMobileNavItems = [...primaryNavItems, ...moreNavItems];

  return (
    <>
      <header
        className={`sticky top-0 left-0 right-0 z-50 h-16 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border px-4 md:px-6 flex items-center justify-between transition-colors ${className}`}
      >
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 h-full">
          <Link href={`/${activeRole.toLowerCase() === 'super_admin' ? 'admin' : activeRole.toLowerCase()}/dashboard`} className="flex items-center gap-2.5 shrink-0 group">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-1.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Image src="/logo.png" width={26} height={26} alt="Ain Ul Quran Logo" priority />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-sm font-bold tracking-tight text-foreground group-hover:text-brand transition-colors">
                Ain Ul Quran
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                {displayPortalTitle}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {primaryNavItems.map((item) => {
              const itemKey = item.key || item.label;
              const isActive = isTabMode
                ? activeTab === itemKey || activeTab === item.label
                : item.href
                ? pathname === item.href || (item.href !== `/${activeRole.toLowerCase()}/dashboard` && pathname?.startsWith(item.href))
                : false;
              const Icon = item.icon;

              if (isTabMode && onTabChange) {
                return (
                  <button
                    key={itemKey}
                    type="button"
                    onClick={() => onTabChange(itemKey)}
                    className={`relative flex h-full items-center gap-2 px-3 text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary font-bold shadow-[inset_0_-2px_0_0_hsl(var(--primary))]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {Icon && <Icon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground'} />}
                    <span>{item.label}</span>
                    {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                      <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary border border-primary/30">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={itemKey}
                  href={item.href || '#'}
                  className={`flex h-full items-center gap-2 px-3 text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand font-bold shadow-[inset_0_-2px_0_0_hsl(var(--brand))]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {Icon && <Icon size={16} className={isActive ? 'text-brand' : 'text-muted-foreground'} />}
                  <span>{item.label}</span>
                  {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary border border-primary/30">
                      {item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Admin 'More' Dropdown */}
            {moreNavItems.length > 0 && (
              <div className="relative h-full flex items-center" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`flex h-full items-center gap-1.5 px-3 text-xs sm:text-sm font-medium transition-colors ${
                    moreNavItems.some((item) => item.href && pathname === item.href)
                      ? 'text-brand shadow-[inset_0_-2px_0_0_hsl(var(--brand))] font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 rounded-2xl bg-card border border-border shadow-2xl py-2 flex flex-col z-50 animate-fadeIn">
                    {moreNavItems.map((item) => {
                      const isActive = item.href ? pathname === item.href : false;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href || '#'}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {Icon && <Icon size={16} />}
                          <span>{item.label}</span>
                          {item.isFlaggedReviews && flaggedCount > 0 && (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
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

        {/* Right: Clock, Extra Actions, Theme, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 h-full">

          {/* Optional Extra Action Buttons */}
          {extraActions && <div className="flex items-center gap-2">{extraActions}</div>}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* User Profile Pill & Dropdown */}
          <div className="relative h-full flex items-center" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-muted/50 p-1 rounded-full md:rounded-xl md:px-2 md:py-1.5 transition-colors border border-transparent hover:border-border/60"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${getRoleBadgeBg(
                  activeRole
                )}`}
              >
                {user ? getInitials(user.name, activeRole.slice(0, 2)) : 'AQ'}
              </div>
              <div className="hidden lg:block text-left max-w-[120px] truncate">
                <p className="text-xs font-bold text-foreground leading-tight truncate">
                  {user?.name || displayPortalTitle}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight uppercase font-mono truncate">
                  {user?.role || activeRole}
                </p>
              </div>
              <ChevronDown size={13} className="hidden lg:block text-muted-foreground" />
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-64 rounded-2xl bg-card border border-border shadow-2xl py-2 flex flex-col z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-border/80 mb-1">
                  <p className="text-xs font-bold text-foreground truncate">{user?.name || 'Logged User'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                    {user?.role || activeRole}
                  </span>
                </div>

                {/* Profile Links */}
                {activeRole === 'STUDENT' && (
                  <Link
                    href="/student/account"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <UserIcon size={15} />
                    <span>My Student Profile</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          {allMobileNavItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Optional Sub-Header Ribbon */}
      {subHeader && (
        <div className="bg-header/50 backdrop-blur border-b border-border px-4 sm:px-6 py-2">
          <p className="font-display font-semibold text-xs tracking-wide text-muted-foreground">
            {subHeader}
          </p>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 top-16 bg-background/95 backdrop-blur-md md:hidden flex flex-col border-t border-border overflow-y-auto animate-fadeIn">
          <div className="p-4 flex flex-col gap-1.5">
            {allMobileNavItems.map((item) => {
              const itemKey = item.key || item.label;
              const isActive = isTabMode
                ? activeTab === itemKey || activeTab === item.label
                : item.href
                ? pathname === item.href
                : false;
              const Icon = item.icon;

              if (isTabMode && onTabChange) {
                return (
                  <button
                    key={itemKey}
                    type="button"
                    onClick={() => {
                      onTabChange(itemKey);
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-foreground/80 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon size={18} />}
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-[10px] font-bold text-foreground">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={itemKey}
                  href={item.href || '#'}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand text-brand-foreground shadow-md'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon size={18} />}
                    <span>{item.label}</span>
                  </div>
                  {item.isFlaggedReviews && flaggedCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {flaggedCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="mt-4 pt-4 border-t border-border/80 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
