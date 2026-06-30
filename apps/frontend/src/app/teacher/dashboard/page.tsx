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
  MonitorPlay,
  Plus,
  ChevronRight,
  Users,
  Award,
  TrendingUp,
  Star,
  ExternalLink,
  Search,
} from 'lucide-react';
import Link from 'next/link';
// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
  recording?: { driveUrl: string | null; status: string } | null;
}

interface Course {
  id: string;
  title: string;
  type: string;
  _count?: { enrollments: number; classSessions: number };
}

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  courseTitle: string;
}

interface TeacherStats {
  total: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  today: number;
  totalHours: number;
  totalStudents: number;
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

const TYPE_COLORS: Record<string, string> = {
  NAZIRA: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
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

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      )}
    </button>
  );
}

function StatCard({ icon, value, label, gradient }: any) {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'Schedule' | 'My Courses' | 'My Students' | 'Class Recordings'>('Schedule');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

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

  const refreshSessionsSilently = async () => {
    try {
      const res = await fetch(`${API_URL}/class-sessions/calendar`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (_) {}
  };

  const handleRetryUpload = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/recordings/${sessionId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await refreshSessionsSilently();
      } else {
        alert('Failed to trigger upload retry.');
      }
    } catch (_) {
      alert('Network error while retrying upload.');
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    if (!user?.id) return;
    setCoursesLoading(true);
    try {
      const res = await fetch(`${API_URL}/courses/teacher/${user.id}`, { credentials: 'include' });
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

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/class-sessions/stats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (_) { }
  };

  // Fetch students
  const fetchStudents = async () => {
    if (!user?.id) return;
    setStudentsLoading(true);
    try {
      const courseRes = await fetch(`${API_URL}/courses/teacher/${user.id}`, { credentials: 'include' });
      if (courseRes.ok) {
        const coursesData: Course[] = await courseRes.json();
        const roster: StudentRecord[] = [];

        await Promise.all(
          coursesData.map(async (course) => {
            const detailRes = await fetch(`${API_URL}/courses/${course.id}`, { credentials: 'include' });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (Array.isArray(detailData.enrollments)) {
                detailData.enrollments.forEach((e: any) => {
                  if (e.student) {
                    roster.push({
                      id: e.student.id,
                      name: e.student.name,
                      email: e.student.email,
                      courseTitle: course.title,
                    });
                  }
                });
              }
            }
          })
        );

        setStudents(roster);
      }
    } catch (_) {
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    if (!user?.id) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_URL}/class-reviews/teacher/${user.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentReviews(data.slice(0, 5));
      }
    } catch (_) {
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchStats();
      fetchReviews();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const hasActiveUploads = sessions.some(
        (s) =>
          s.status === 'COMPLETED' &&
          (!s.recording || s.recording.status === 'PROCESSING' || s.recording.status === 'UPLOADING')
      );

      if (hasActiveUploads) {
        const interval = setInterval(refreshSessionsSilently, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [sessions, user]);

  useEffect(() => {
    if (activeTab === 'My Courses') fetchCourses();
    if (activeTab === 'My Students') fetchStudents();
  }, [activeTab]);

  const handleStartClass = async (id: string) => {
    setStartingId(id);
    try {
      const res = await fetch(`${API_URL}/class-sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'LIVE' }),
      });
      if (res.ok) {
        await fetchSessions();
        await fetchStats();
      }
    } catch {
      // silently handle
    } finally {
      setStartingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) return null;

  const completedRecordings = sessions.filter((s) => s.status === 'COMPLETED');
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', sans-serif" }}>
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
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5">
              <BookOpen size={18} className="text-emerald-400" />
            </div>
            <span className="font-display text-base font-bold text-slate-100">Teacher Portal</span>
          </div>

          {/* Nav items */}
          <nav className="hidden items-center gap-1 sm:flex">
            {(['Schedule', 'My Courses', 'My Students', 'Class Recordings'] as const).map((tab) => (
              <NavTab
                key={tab}
                label={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </nav>

          {/* Right logout info */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-200 leading-none">{user.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-880/60 px-3 py-1.5 text-xs font-medium text-slate-450 transition-all duration-205 hover:border-rose-505/40 hover:bg-rose-505/10 hover:text-rose-400"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex border-t border-slate-800/60 sm:hidden overflow-x-auto">
          {(['Schedule', 'My Courses', 'My Students', 'Class Recordings'] as const).map((tab) => (
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
        {/* Hero */}
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 backdrop-blur-sm">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl" style={{ color: '#C9A84C' }}>
                Assalamu Alaikum, {user.name}
              </h1>
              <p className="mt-2 text-slate-400">May Allah bless your teaching efforts and your students.</p>
            </div>
            <button
              onClick={() => router.push('/teacher/schedule')}
              className="group flex w-fit items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-emerald-400"
            >
              <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
              Create New Class
            </button>
          </div>
        </section>

        {/* Stats Row */}
        <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            icon={<Calendar size={18} className="text-emerald-400" />}
            value={stats?.today ?? 0}
            label="Classes Today"
            gradient="bg-emerald-500/10 border-emerald-500/20"
          />
          <StatCard
            icon={<Clock size={18} className="text-sky-400" />}
            value={stats?.totalHours ?? 0}
            label="Total Hours Taught"
            gradient="bg-sky-500/10 border-sky-500/20"
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-violet-400" />}
            value={stats?.completed ?? 0}
            label="Completed Sessions"
            gradient="bg-violet-500/10 border-violet-500/20"
          />
          <StatCard
            icon={<Users size={18} className="text-amber-400" />}
            value={stats?.totalStudents ?? 0}
            label="Enrolled Students"
            gradient="bg-amber-500/10 border-amber-500/20"
          />
          <StatCard
            icon={
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <Video size={18} className="text-emerald-400" />
              </span>
            }
            value={stats?.live ?? 0}
            label="Live Classes Now"
            gradient="bg-emerald-400/10 border-emerald-400/20"
          />
        </section>

        {/* Schedule Tab */}
        {activeTab === 'Schedule' && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Class schedule */}
            <div className="xl:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold" style={{ color: '#C9A84C' }}>
                  Your Class Schedule
                </h2>
                <span className="rounded-full border border-slate-700/50 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                  {sessions.filter((s) => s.status !== 'CANCELLED').length} active sessions
                </span>
              </div>

              {sessionsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-emerald-400" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-16 text-center backdrop-blur-sm">
                  <p className="font-semibold text-slate-350">No sessions scheduled yet.</p>
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
                      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-600/60 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4 sm:items-center">
                          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${circleColor(i)} text-base font-bold text-white shadow-lg`}>
                            {session.course.title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-100">{session.course.title}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[session.course.type] || 'text-slate-400 bg-slate-400/10'}`}>
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

                        <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
                          {session.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => router.push(`/teacher/schedule`)}
                                className="rounded-xl border border-slate-600/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleStartClass(session.id)}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-400"
                              >
                                <PlayCircle size={14} />
                                Start Class
                              </button>
                            </>
                          )}
                          {session.status === 'LIVE' && (
                            <button
                              onClick={() => router.push(`/classroom/${session.id}`)}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-400"
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QA Feedback summary */}
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: '#C9A84C' }}>
                  <Award size={20} className="text-[#C9A84C]" />
                  QA Feedback summary
                </h2>
                <Link href="/teacher/feedback" className="text-xs text-[#C9A84C] hover:underline font-semibold">
                  See all &rarr;
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
                {reviewsLoading ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
                  </div>
                ) : recentReviews.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No evaluation scorecards yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((rev) => (
                      <div
                        key={rev.id}
                        onClick={() => router.push(`/teacher/feedback/${rev.session.id}`)}
                        className="cursor-pointer border-b border-slate-800/80 pb-3 last:border-0 last:pb-0 hover:bg-white/[0.01] p-1.5 rounded transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-xs text-slate-200 truncate">{rev.session.course.title}</p>
                          <span className="text-xs font-mono font-bold text-amber-400">{rev.overallScore.toFixed(1)}/5.0</span>
                        </div>
                        <p className="text-[11px] text-slate-450 mt-1 line-clamp-2 italic">
                          &ldquo;{rev.strengths || rev.improvements || 'Evaluation complete.'}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Courses Tab */}
        {activeTab === 'My Courses' && (
          <section>
            <div className="mb-5 flex items-center gap-3">
              <h2 className="font-display text-xl font-bold" style={{ color: '#C9A84C' }}>
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
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-16 text-center">
                <p className="text-slate-400">No courses assigned to you.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="group rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-2.5">
                        <BookOpen size={18} className="text-emerald-400" />
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[course.type] || 'text-slate-450 bg-slate-900'}`}>
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
                ))}
              </div>
            )}
          </section>
        )}

        {/* My Students Tab */}
        {activeTab === 'My Students' && (
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold" style={{ color: '#C9A84C' }}>
                Assigned Students Roster
              </h2>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 max-w-sm w-full">
                <Search size={16} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Search students or course..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-600 text-slate-200"
                />
              </div>
            </div>

            {studentsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">No students found.</div>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-850">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      <th className="py-3.5 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Student Name</th>
                      <th className="py-3.5 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Email Address</th>
                      <th className="py-3.5 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Enrolled Course</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {filteredStudents.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-200">{st.name}</td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-xs">{st.email}</td>
                        <td className="py-4 px-6 text-slate-350">{st.courseTitle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Recordings Tab */}
        {activeTab === 'Class Recordings' && (
          <section className="space-y-5">
            <h2 className="font-display text-xl font-bold" style={{ color: '#C9A84C' }}>
              Past Class Recordings Archive
            </h2>

            {sessionsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
              </div>
            ) : completedRecordings.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">No past class recordings cataloged.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedRecordings.map((session) => {
                  const status = session.recording?.status || 'PROCESSING';
                  const isProcessing = status === 'PROCESSING' || status === 'UPLOADING';
                  const isFailed = status === 'FAILED';
                  const isReady = status === 'READY';

                  return (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-100">{session.course.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{formatDateTime(session.scheduledAt)}</span>
                          <span>•</span>
                          <span>{session.durationMinutes} mins</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Status:</span>
                          <span className={`inline-flex items-center gap-1.5 font-semibold text-xs rounded-full px-2 py-0.5 ${
                            isReady
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isFailed
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {isProcessing && <Loader2 size={10} className="animate-spin" />}
                            {status}
                          </span>
                        </div>
                        {isReady && session.recording?.driveUrl ? (
                          <a
                            href={session.recording.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-1.5 px-4 rounded-xl transition-all"
                          >
                            <ExternalLink size={12} />
                            <span>Watch recording</span>
                          </a>
                        ) : isFailed ? (
                          <button
                            onClick={() => handleRetryUpload(session.id)}
                            className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/35 hover:bg-red-500/30 text-red-300 text-xs font-semibold py-1.5 px-4 rounded-xl transition-all"
                          >
                            <span>Retry Upload</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Processing upload...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
