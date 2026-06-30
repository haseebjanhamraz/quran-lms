'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  UserCheck,
  ShieldCheck,
  Flag,
  LogOut,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: string;
}

interface FlaggedReview {
  id: string;
  flagSeverity: string;
  flagReason: string;
  isFlagged: boolean;
  session: {
    course: { title: string; teacher: { name: string } };
  };
  reviewer: { name: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses' },
  { label: 'Schedule', icon: Calendar, href: '/admin/schedule' },
  { label: 'Enrollments', icon: UserCheck, href: '/admin/enrollments' },
  { label: 'Reviewer Assignments', icon: ShieldCheck, href: '/admin/reviewer-assignments' },
  { label: 'Flagged Reviews', icon: Flag, href: '/admin/dashboard' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot?: string }> = {
    SCHEDULED: { cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
    LIVE: {
      cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
    },
    COMPLETED: { cls: 'bg-slate-600/40 text-slate-300 border border-slate-600/40' },
    CANCELLED: { cls: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  };
  const { cls, dot } = map[status] ?? { cls: 'bg-slate-700 text-slate-300' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {status}
    </span>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    HIGH: 'bg-red-500/20 text-red-300 border border-red-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    LOW: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  };
  const cls = map[severity] ?? 'bg-slate-700 text-slate-300';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}

function StatCard({ label, value, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/60 hover:shadow-lg hover:shadow-black/30">
      {/* subtle radial glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl" style={{ background: iconBg }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-100">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: iconBg + '33' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, logout } = useAuth() as {
    user: { name: string; email: string } | null;
    logout: () => void;
  };
  const router = useRouter();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [flagged, setFlagged] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, sRes, fRes] = await Promise.all([
          fetch(`${API}/users`, { credentials: 'include' }),
          fetch(`${API}/class-sessions/calendar`, { credentials: 'include' }),
          fetch(`${API}/class-reviews/flagged`, { credentials: 'include' }),
        ]);

        const [uData, sData, fData] = await Promise.all([
          uRes.ok ? uRes.json() : [],
          sRes.ok ? sRes.json() : [],
          fRes.ok ? fRes.json() : [],
        ]);

        setUsers(Array.isArray(uData) ? uData : uData.data ?? []);
        setSessions(Array.isArray(sData) ? sData : sData.data ?? []);
        setFlagged(Array.isArray(fData) ? fData : fData.data ?? []);
      } catch (_) {
        // silently handle network errors — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalTeachers = users.filter((u) => u.role === 'TEACHER').length;
  const totalStudents = users.filter((u) => u.role === 'STUDENT').length;
  const classesToday = sessions.filter((s) => isToday(s.scheduledAt)).length;
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 10);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="relative mx-auto max-w-7xl">
          {/* ── Top Bar ── */}
          <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Assalamu Alaikum,{' '}
                <span style={{ color: '#C9A84C' }}>{user?.name ?? 'Admin'}</span> 👋
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">{todayLabel()}</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#C9A84C]" />
                Loading data&hellip;
              </div>
            )}
          </div>

          {/* ── Stats Row ── */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Teachers"
              value={totalTeachers}
              icon={<BookOpen size={22} color="#6ee7b7" />}
              iconBg="#6ee7b7"
              trend="Active educators"
            />
            <StatCard
              label="Total Students"
              value={totalStudents}
              icon={<Users size={22} color="#60a5fa" />}
              iconBg="#60a5fa"
              trend="Enrolled learners"
            />
            <StatCard
              label="Classes Today"
              value={classesToday}
              icon={<Calendar size={22} color="#C9A84C" />}
              iconBg="#C9A84C"
            />
            <StatCard
              label="Flagged Issues"
              value={flagged.length}
              icon={<AlertTriangle size={22} color="#f87171" />}
              iconBg="#f87171"
            />
          </div>

          {/* ── Two-column: Sessions Table + Flagged Reviews ── */}
          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Recent Sessions Table */}
            <section className="xl:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
                  <Clock size={16} className="text-[#C9A84C]" />
                  Recent Sessions
                </h2>
                <Link
                  href="/admin/schedule"
                  className="text-xs font-medium text-[#C9A84C] hover:underline"
                >
                  View all &rarr;
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/60">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Course
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Date &amp; Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            {loading ? 'Loading sessions\u2026' : 'No sessions found.'}
                          </td>
                        </tr>
                      ) : (
                        recentSessions.map((s, i) => (
                          <tr
                            key={s.id}
                            className={`transition-colors hover:bg-white/[0.03] ${
                              i !== recentSessions.length - 1
                                ? 'border-b border-slate-700/40'
                                : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-100">
                                {s.course?.title ?? '\u2014'}
                              </p>
                              <p className="text-xs text-slate-500">
                                {s.course?.type ?? ''}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                              {formatDate(s.scheduledAt)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                              {s.durationMinutes} min
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={s.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Flagged Reviews Panel */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
                  <Flag size={16} className="text-red-400" />
                  Flagged Reviews
                </h2>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                  {flagged.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {flagged.length === 0 ? (
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 py-10 text-center text-sm text-slate-500 backdrop-blur-sm">
                    {loading ? 'Loading\u2026' : 'No flagged reviews \u2714'}
                  </div>
                ) : (
                  flagged.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 backdrop-blur-sm transition-all hover:border-slate-600/60"
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-100 leading-snug">
                          {f.session?.course?.title ?? 'Unknown Course'}
                        </p>
                        <SeverityBadge severity={f.flagSeverity} />
                      </div>
                      <p className="mb-1 text-xs text-slate-400">
                        Teacher:{' '}
                        <span className="text-slate-300">
                          {f.session?.course?.teacher?.name ?? 'N/A'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Reviewer:{' '}
                        <span className="text-slate-300">
                          {f.reviewer?.name ?? 'N/A'}
                        </span>
                      </p>
                      {f.flagReason && (
                        <p className="mt-2 rounded-lg border border-slate-700/40 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 italic">
                          &ldquo;{f.flagReason}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ── Quick Actions ── */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-100">
              <TrendingUp size={16} className="text-[#C9A84C]" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  href: '/admin/users',
                  icon: <Users size={28} />,
                  iconColor: '#60a5fa',
                  title: 'Manage Users',
                  desc: 'Add, edit, or remove teachers and students from the platform.',
                },
                {
                  href: '/admin/courses',
                  icon: <BookOpen size={28} />,
                  iconColor: '#6ee7b7',
                  title: 'Manage Courses',
                  desc: 'Create and organise Quran courses, topics, and materials.',
                },
                {
                  href: '/admin/schedule',
                  icon: <Calendar size={28} />,
                  iconColor: '#C9A84C',
                  title: 'View Schedule',
                  desc: 'Browse upcoming and past class sessions across all courses.',
                },
                {
                  href: '/admin/reviewer-assignments',
                  icon: <ShieldCheck size={28} />,
                  iconColor: '#c084fc',
                  title: 'Reviewer Assignments',
                  desc: 'Assign reviewers to courses and manage quality assurance.',
                },
              ].map(({ href, icon, iconColor, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600/60 hover:shadow-xl hover:shadow-black/40"
                >
                  <div
                    className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                    style={{ background: iconColor }}
                  />
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: iconColor + '22', color: iconColor }}
                  >
                    {icon}
                  </div>
                  <h3 className="mb-1 font-semibold text-slate-100">{title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
                  <span
                    className="mt-3 inline-block text-xs font-semibold transition-all duration-200 group-hover:gap-2"
                    style={{ color: iconColor }}
                  >
                    Open &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </section>
    </div>
  );
}
