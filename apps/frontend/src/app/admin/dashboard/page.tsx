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
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  Sparkles,
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
  overallScore: number;
  isFlagged: boolean;
  session: {
    course: { title: string; teacher: { name: string } };
  };
  reviewer: { name: string };
}

interface AuditLogItem {
  id: string;
  action: string;
  createdAt: string;
  user: { name: string; email: string } | null;
}

interface EnrollmentStats {
  total: number;
  recent: number;
  byType: Record<string, number>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
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

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot?: string }> = {
    SCHEDULED: { cls: 'bg-blue-500/20 text-blue-500 border border-blue-500/30' },
    LIVE: {
      cls: 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30',
      dot: 'bg-emerald-500 animate-pulse',
    },
    COMPLETED: { cls: 'bg-muted text-muted-foreground border border-border' },
    CANCELLED: { cls: 'bg-destructive/20 text-destructive border border-destructive/30' },
  };
  const { cls, dot } = map[status] ?? { cls: 'bg-muted text-muted-foreground' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    HIGH: 'bg-destructive/20 text-destructive border border-destructive/30',
    MEDIUM: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    LOW: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  };
  const cls = map[severity] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}

function StatCard({ label, value, icon, iconBg, trend }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-all duration-300 hover:border-brand/40 hover:shadow-lg">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl" style={{ background: iconBg }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: iconBg + '25' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [flagged, setFlagged] = useState<FlaggedReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [enrollStats, setEnrollStats] = useState<EnrollmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, sRes, fRes, enrollRes, auditRes] = await Promise.all([
          fetch(`${API}/users`, { credentials: 'include' }),
          fetch(`${API}/class-sessions/calendar`, { credentials: 'include' }),
          fetch(`${API}/class-reviews/flagged`, { credentials: 'include' }),
          fetch(`${API}/enrollments/stats`, { credentials: 'include' }),
          fetch(`${API}/audit-logs?limit=10`, { credentials: 'include' }),
        ]);

        const [uData, sData, fData, eData, aData] = await Promise.all([
          uRes.ok ? uRes.json() : [],
          sRes.ok ? sRes.json() : [],
          fRes.ok ? fRes.json() : [],
          enrollRes.ok ? enrollRes.json() : null,
          auditRes.ok ? auditRes.json() : null,
        ]);

        setUsers(Array.isArray(uData) ? uData : uData.data ?? []);
        setSessions(Array.isArray(sData) ? sData : sData.data ?? []);
        setFlagged(Array.isArray(fData) ? fData : fData.data ?? []);
        setEnrollStats(eData);
        setAuditLogs(aData?.data || []);
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
  const totalCourses = sessions.reduce((acc, s) => {
    if (s.course && !acc.includes(s.course.title)) {
      acc.push(s.course.title);
    }
    return acc;
  }, [] as string[]).length || (users.length > 0 ? 6 : 0);

  const classesToday = sessions.filter((s) => isToday(s.scheduledAt)).length;
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 10);

  // Enrollment distribution computations
  const totalEnrollments = enrollStats?.total ?? 0;
  const types = ['NAZIRA', 'TAJWEED', 'HIFZ_UL_QURAN', 'ISLAMIC_STUDIES'];
  const maxEnrollTypeVal = Math.max(...types.map((t) => enrollStats?.byType?.[t] ?? 0), 1);

  // Session status computation
  const statusCounts = sessions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    { SCHEDULED: 0, LIVE: 0, COMPLETED: 0, CANCELLED: 0 } as Record<string, number>
  );
  const maxSessionStatusVal = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* ── Top Bar ── */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Assalamu Alaikum,{' '}
            <span className="text-brand">{user?.name ?? 'Admin'}</span> 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{todayLabel()}</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            Loading system metrics&hellip;
          </div>
        )}
      </div>

      {/* ── Stats Row (6 Cards) ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Teachers"
          value={totalTeachers}
          icon={<BookOpen size={20} className="text-emerald-500" />}
          iconBg="#10b981"
          trend="Active educators"
        />
        <StatCard
          label="Students"
          value={totalStudents}
          icon={<Users size={20} className="text-blue-500" />}
          iconBg="#3b82f6"
          trend="Enrolled learners"
        />
        <StatCard
          label="Classes Today"
          value={classesToday}
          icon={<Calendar size={20} className="text-brand" />}
          iconBg="#C9A84C"
        />
        <StatCard
          label="Enrollments"
          value={totalEnrollments}
          icon={<UserCheck size={20} className="text-emerald-500" />}
          iconBg="#10b981"
          trend="Total connections"
        />
        <StatCard
          label="Schedules"
          value={sessions.length}
          icon={<Clock size={20} className="text-purple-500" />}
          iconBg="#8b5cf6"
        />
        <StatCard
          label="Flagged Reviews"
          value={flagged.length}
          icon={<AlertTriangle size={20} className="text-destructive" />}
          iconBg="#ef4444"
        />
      </div>

      {/* ── Two-column Dashboard Area ── */}
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Columns - Roster, Schedule, System metrics */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Sessions Table */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Clock size={16} className="text-brand" />
                Recent scheduled classes
              </h2>
              <Link
                href="/admin/schedule"
                className="text-xs font-medium text-brand hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date &amp; Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          {loading ? 'Loading sessions\u2026' : 'No sessions scheduled yet.'}
                        </td>
                      </tr>
                    ) : (
                      recentSessions.map((s, i) => (
                        <tr
                          key={s.id}
                          onClick={() => {
                            if (s.status === 'COMPLETED') {
                              router.push(`/admin/transcripts/${s.id}`);
                            } else {
                              router.push(`/admin/schedule`);
                            }
                          }}
                          className={`cursor-pointer transition-colors hover:bg-muted/40 ${i !== recentSessions.length - 1 ? 'border-b border-border/60' : ''
                            }`}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{s.course?.title ?? '\u2014'}</p>
                            <p className="text-xs text-muted-foreground">{s.course?.type ?? 'CourseType'}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-foreground/80 font-mono text-xs">
                            {formatDate(s.scheduledAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-foreground/80">
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

          {/* System Overview Visualizations */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enrollment Distribution */}
            <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles size={16} className="text-brand" />
                Enrollment by Category
              </h3>
              <div className="space-y-3">
                {types.map((type) => {
                  const count = enrollStats?.byType?.[type] ?? 0;
                  const pct = Math.round((count / maxEnrollTypeVal) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground/80">{type.replace(/_/g, ' ')}</span>
                        <span className="text-brand font-mono">{count} student{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Status Overview */}
            <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-1.5">
                <LayoutDashboard size={16} className="text-brand" />
                Class Status Overview
              </h3>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const pct = Math.round((count / maxSessionStatusVal) * 100);
                  const colors: Record<string, string> = {
                    SCHEDULED: 'from-blue-500 to-indigo-500',
                    LIVE: 'from-emerald-400 to-teal-500',
                    COMPLETED: 'from-muted-foreground/60 to-muted-foreground',
                    CANCELLED: 'from-red-400 to-rose-500',
                  };
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground/80">{status}</span>
                        <span className="text-muted-foreground font-mono">{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/40">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[status] || 'from-muted-foreground to-muted-foreground'} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Audit Log Feed, Flagged Issues */}
        <div className="space-y-6">
          {/* Audit Logs Feed */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Activity size={16} className="text-brand" />
                Recent System Activity
              </h2>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-medium text-brand hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm space-y-3 max-h-[360px] overflow-y-auto shadow-sm">
              {auditLogs.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {loading ? 'Loading logs\u2026' : 'No system logs registered.'}
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1.5 leading-snug">
                      User: <span className="text-muted-foreground font-medium">{log.user?.name || 'System Action'}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Flagged Reviews Panel */}
          <section id="flagged">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Flag size={16} className="text-destructive" />
                Escalated Reviews
              </h2>
              <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-semibold text-destructive">
                {flagged.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {flagged.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card/80 px-4 py-10 text-center text-sm text-muted-foreground backdrop-blur-sm shadow-sm">
                  {loading ? 'Loading\u2026' : 'No flagged reviews \u2714'}
                </div>
              ) : (
                flagged.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-brand/40 shadow-sm"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground leading-snug truncate">
                        {f.session?.course?.title ?? 'Unknown Course'}
                      </p>
                      <SeverityBadge severity={f.flagSeverity} />
                    </div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Teacher:{' '}
                      <span className="text-foreground/80">
                        {f.session?.course?.teacher?.name ?? 'N/A'}
                      </span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Reviewer: <span className="text-foreground/80">{f.reviewer?.name ?? 'N/A'}</span></span>
                      <span>Score: <span className="text-amber-500 font-bold font-mono">{f.overallScore.toFixed(1)}/5.0</span></span>
                    </div>
                    {f.flagReason && (
                      <p className="mt-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs text-foreground/90 italic">
                        &ldquo;{f.flagReason}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <TrendingUp size={16} className="text-brand" />
          Admin Toolbelt Roster
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              href: '/admin/users',
              icon: <Users size={24} />,
              iconColor: '#3b82f6',
              title: 'Manage Users',
              desc: 'Edit teacher/student roles.',
            },
            {
              href: '/admin/courses',
              icon: <BookOpen size={24} />,
              iconColor: '#10b981',
              title: 'Manage Courses',
              desc: 'Configure Quran syllabus.',
            },
            {
              href: '/admin/schedule',
              icon: <Calendar size={24} />,
              iconColor: '#C9A84C',
              title: 'Class Scheduling',
              desc: 'Roster timing check.',
            },
            {
              href: '/admin/reviewer-assignments',
              icon: <ShieldCheck size={24} />,
              iconColor: '#8b5cf6',
              title: 'QA Reviewers',
              desc: 'Syllabus compliance assigning.',
            },
            {
              href: '/admin/audit-logs',
              icon: <Activity size={24} />,
              iconColor: '#10b981',
              title: 'Audit Logs',
              desc: 'Trace platform events.',
            },
          ].map(({ href, icon, iconColor, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg shadow-sm"
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                style={{ background: iconColor }}
              />
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: iconColor + '22', color: iconColor }}
              >
                {icon}
              </div>
              <h3 className="mb-0.5 font-semibold text-foreground text-sm truncate">{title}</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground truncate">{desc}</p>
              <span
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold transition-all duration-200"
                style={{ color: iconColor }}
              >
                Open <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
