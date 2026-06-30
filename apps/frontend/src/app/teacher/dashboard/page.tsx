'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  BookOpen,
  Calendar,
  Video,
  Clock,
  Loader2,
  PlayCircle,
  LogIn,
  MonitorPlay,
  Plus,
  ChevronRight,
  Users,
  Award,
  TrendingUp,
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
}

interface Course {
  id: string;
  title: string;
  type: string;
  _count?: { enrollments: number; classSessions: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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

const TYPE_COLORS: Record<string, string> = {
  QURAN: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  ARABIC: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  TAJWEED: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  ISLAMIC_STUDIES: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

const CIRCLE_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

function circleColor(index: number): string {
  return CIRCLE_COLORS[index % CIRCLE_COLORS.length];
}

function typeLabel(type: string): string {
  return type.replace(/_/g, ' ');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      )}
    </button>
  );
}

function StatCard({
  icon,
  value,
  label,
  gradient,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-700/50 p-5 ${gradient} backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">{icon}</div>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
      <p className="text-3xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
      <div className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />
    </div>
  );
}

function SessionCard({
  session,
  index,
  onStartClass,
  router,
}: {
  session: SessionItem;
  index: number;
  onStartClass: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const initial = session.course.title.charAt(0).toUpperCase();
  const typeClass =
    TYPE_COLORS[session.course.type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/30';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-600/60 hover:shadow-lg hover:shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
      {/* Left info */}
      <div className="flex items-start gap-4 sm:items-center">
        {/* Circle avatar */}
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${circleColor(index)} text-base font-bold text-white shadow-lg`}
        >
          {initial}
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-100">{session.course.title}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${typeClass}`}
            >
              {typeLabel(session.course.type)}
            </span>
            {session.status === 'LIVE' && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDateTime(session.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {session.durationMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
        {session.status === 'SCHEDULED' && (
          <>
            <button
              onClick={() => router.push(`/teacher/schedule`)}
              className="rounded-xl border border-slate-600/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
            >
              Edit
            </button>
            <button
              onClick={() => onStartClass(session.id)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-400 hover:shadow-emerald-400/30"
            >
              <PlayCircle size={14} />
              Start Class
            </button>
          </>
        )}

        {session.status === 'LIVE' && (
          <button
            onClick={() => router.push(`/classroom/${session.id}`)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:bg-emerald-400"
          >
            <MonitorPlay size={14} />
            Enter Classroom
          </button>
        )}

        {session.status === 'COMPLETED' && (
          <button
            onClick={() => router.push(`/teacher/feedback/${session.id}`)}
            className="flex items-center gap-1.5 rounded-xl border border-teal-500/50 px-4 py-1.5 text-xs font-semibold text-teal-400 transition-all duration-200 hover:bg-teal-500/10"
          >
            <Award size={14} />
            View Feedback
          </button>
        )}

        {session.status === 'CANCELLED' && (
          <span className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-700">
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const typeClass =
    TYPE_COLORS[course.type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  return (
    <div className="group rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-600/60 hover:shadow-xl hover:shadow-black/30">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5">
          <BookOpen size={18} className="text-emerald-400" />
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${typeClass}`}>
          {typeLabel(course.type)}
        </span>
      </div>
      <h3 className="mb-3 font-semibold text-slate-100 leading-snug">{course.title}</h3>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {course._count?.enrollments ?? 0} students
        </span>
        <span className="flex items-center gap-1">
          <Video size={12} />
          {course._count?.classSessions ?? 0} sessions
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'Schedule' | 'My Courses'>('Schedule');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/class-sessions/calendar`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch {
      // silently handle
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch(`${API_URL}/courses`, { credentials: 'include' });
      if (res.ok) {
        const data: Course[] = await res.json();
        setCourses(data);
      }
    } catch {
      // silently handle
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'My Courses' && courses.length === 0) fetchCourses();
  }, [activeTab]);

  // Start a class → set status to LIVE
  const handleStartClass = async (id: string) => {
    setStartingId(id);
    try {
      const res = await fetch(`${API_URL}/class-sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'LIVE' }),
      });
      if (res.ok) await fetchSessions();
    } catch {
      // silently handle
    } finally {
      setStartingId(null);
    }
  };

  // ── Derived stats ──
  const classesToday = sessions.filter(
    (s) => isToday(s.scheduledAt) && s.status !== 'CANCELLED',
  ).length;

  const totalHours = Math.round(
    sessions
      .filter((s) => s.status === 'COMPLETED')
      .reduce((acc, s) => acc + s.durationMinutes, 0) / 60,
  );

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const liveCount = sessions.filter((s) => s.status === 'LIVE').length;

  // ── Auth guard ──
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Google Font import via style */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgb(2 6 23); }
        ::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 3px; }
      `}</style>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5">
              <BookOpen size={18} className="text-emerald-400" />
            </div>
            <span className="font-display text-base font-bold text-slate-100">
              Teacher Portal
            </span>
          </div>

          {/* Center tabs */}
          <nav className="hidden items-center gap-1 sm:flex">
            {(['Schedule', 'My Courses'] as const).map((tab) => (
              <NavTab
                key={tab}
                label={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </nav>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-200 leading-none">{user.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all duration-200 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex border-t border-slate-800/60 sm:hidden">
          {(['Schedule', 'My Courses'] as const).map((tab) => (
            <NavTab
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* ── Hero ── */}
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 backdrop-blur-sm">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className="font-display text-3xl font-bold leading-tight sm:text-4xl"
                style={{ color: '#C9A84C' }}
              >
                Assalamu Alaikum, {user.name}
              </h1>
              <p className="mt-2 text-slate-400">
                May Allah bless your teaching and your students.
              </p>
            </div>
            <button
              onClick={() => router.push('/teacher/schedule')}
              className="group flex w-fit items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-emerald-400 hover:shadow-emerald-400/35"
            >
              <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
              Create New Class
            </button>
          </div>
        </section>

        {/* ── Stats Row ── */}
        <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Calendar size={18} className="text-emerald-400" />}
            value={classesToday}
            label="Classes Today"
            gradient="bg-emerald-500/10 border-emerald-500/20"
          />
          <StatCard
            icon={<Clock size={18} className="text-sky-400" />}
            value={totalHours}
            label="Total Hours Taught"
            gradient="bg-sky-500/10 border-sky-500/20"
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-violet-400" />}
            value={completedCount}
            label="Completed Sessions"
            gradient="bg-violet-500/10 border-violet-500/20"
          />
          <StatCard
            icon={
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <Video size={18} className="text-emerald-400" />
              </span>
            }
            value={liveCount}
            label="Live Now"
            gradient="bg-emerald-400/10 border-emerald-400/20"
          />
        </section>

        {/* ── Schedule Tab ── */}
        {activeTab === 'Schedule' && (
          <section>
            {/* Section header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  className="font-display text-xl font-bold"
                  style={{ color: '#C9A84C' }}
                >
                  Your Class Schedule
                </h2>
                <span className="rounded-full border border-slate-700/50 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                  {sessions.filter((s) => s.status !== 'CANCELLED').length} sessions
                </span>
              </div>
              <button
                onClick={fetchSessions}
                className="text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                Refresh
              </button>
            </div>

            {/* Session list */}
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 py-16 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/80">
                  <CalendarEmptyIcon />
                </div>
                <p className="font-semibold text-slate-300">No sessions yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first class to get started on this noble journey.
                </p>
                <button
                  onClick={() => router.push('/teacher/schedule')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
                >
                  <Plus size={15} />
                  Create New Class
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session, i) => (
                  <div key={session.id} className="relative">
                    {startingId === session.id && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm">
                        <Loader2 size={22} className="animate-spin text-emerald-400" />
                      </div>
                    )}
                    <SessionCard
                      session={session}
                      index={i}
                      onStartClass={handleStartClass}
                      router={router}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── My Courses Tab ── */}
        {activeTab === 'My Courses' && (
          <section>
            <div className="mb-5 flex items-center gap-3">
              <h2
                className="font-display text-xl font-bold"
                style={{ color: '#C9A84C' }}
              >
                My Courses
              </h2>
              <span className="rounded-full border border-slate-700/50 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                {courses.length} courses
              </span>
            </div>

            {coursesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 py-16 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/80">
                  <BookOpen size={24} className="text-slate-500" />
                </div>
                <p className="font-semibold text-slate-300">No courses found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Your courses will appear here once they are assigned to you.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// ── Tiny inline SVG for empty state ──────────────────────────────────────────
function CalendarEmptyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      className="text-slate-500"
    >
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
