'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, CreditCard, Briefcase, HelpCircle, Users,
  LogOut, Menu, ChevronDown, UserCheck
} from 'lucide-react';
import Image from 'next/image';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

interface NavItem {
  label: string;
  icon: any;
  href: string;
  permission?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'HR Dashboard', icon: LayoutDashboard, href: '/hr/dashboard' },
  { label: 'Finance & Expenses', icon: CreditCard, href: '/hr/finance', permission: 'fees.read' },
  { label: 'Teacher Payroll & Slips', icon: Briefcase, href: '/hr/salary', permission: 'salary-payments.read' },
  { label: 'Parent Support Tickets', icon: HelpCircle, href: '/hr/support', permission: 'support.read' },
  { label: 'Employee Directory', icon: Users, href: '/hr/employees', permission: 'teachers.read' },
];

function getInitials(name: string): string {
  if (!name) return 'HR';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const visibleNav = PRIMARY_NAV.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      {/* Fixed Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-6 h-full">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" width={32} height={32} alt="Logo" />
            <div className="hidden lg:block">
              <p className="text-sm font-bold leading-tight text-brand">Ain Ul Quran</p>
              <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">HR Management Portal</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 h-full">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/hr/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-full items-center gap-2 px-3 text-xs font-semibold transition-colors ${isActive
                      ? 'text-brand shadow-[inset_0_-2px_0_0_hsl(var(--brand))]'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5'
                    }`}
                >
                  <Icon size={16} className={isActive ? 'text-brand' : 'text-sidebar-foreground/70'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4 h-full">
          <ThemeToggle />
          <NotificationsDropdown />

          <div className="relative h-full flex items-center" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-sidebar-foreground/5 p-1 rounded-full md:rounded-lg md:pr-3 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white shadow-sm">
                {user ? getInitials(user.name) : 'HR'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-sidebar-foreground leading-tight">{user?.name || 'HR Specialist'}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{user?.role || 'HR Department'}</p>
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

      {/* Sub Header */}
      <div className="mt-16 bg-header/50 backdrop-blur border-b border-border px-6 py-2">
        <h1 className="font-display font-semibold text-xs tracking-wide text-muted-foreground">
          Human Resource &amp; Finance Operations Management
        </h1>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
