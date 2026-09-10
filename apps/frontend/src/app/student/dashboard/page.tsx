'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  GraduationCap,
  Calendar,
  Video,
  Clock,
  Loader2,
  BookOpen,
  Star,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  PlayCircle,
  X,
  History,
  Sparkles,
  FileText,
} from 'lucide-react';
import RescheduleModal from '@/components/RescheduleModal';
import UpcomingClassBanner from '@/components/UpcomingClassBanner';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import ViewClassReportModal from '@/components/ViewClassReportModal';
import DailyScheduleView from '@/components/DailyScheduleView';
import { useUrlState } from '@/hooks/useUrlState';
import Navbar from '@/components/Navbar';
import {
  formatPKTTime,
  formatPKTDate,
} from '@/utils/islamabadTime';
// ─── Interfaces ──────────────────────────────────────────────────────────────

interface SessionItem {
  id: string;
  _id?: string;
  course: { title: string; type: string };
  teacher?: { id: string; name: string; email?: string; profilePicture?: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'FROZEN';
  recording?: { filePath: string | null; status: string } | null;
  teacherReport?: {
    attendanceStatus?: string;
    topicsCovered?: string;
    surahOrLesson?: string;
    fromAyahOrPage?: string;
    toAyahOrPage?: string;
    sabaqiRevision?: string;
    manzilRevision?: string;
    performanceRating?: number;
    understandingLevel?: string;
    tajweedLevel?: string;
    behavior?: string;
    homeworkAssignment?: string;
    teacherNotes?: string;
    submittedAt?: string;
  } | null;
}

interface Course {
  id: string;
  _id?: string;
  title: string;
  type: string;
  teacher?: { name: string };
}

interface StudentStats {
  total: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  totalHours: number;
  enrolledCourses: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return formatPKTDate(iso);
}

function formatTime(iso: string): string {
  return `${formatPKTTime(iso)} PKT`;
}

function getCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
}

function CourseTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    NAZIRA: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    TAJWEED: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    HIFZ_UL_QURAN: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
    ISLAMIC_STUDIES: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  };
  const cls =
    map[type] ??
    'from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/30';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r border ${cls}`}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function StudentDashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useUrlState<'learning' | 'schedule' | 'history' | 'attendance'>('tab', 'learning');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [selectedReportSession, setSelectedReportSession] = useState<SessionItem | null>(null);
  const [selectedRescheduleSession, setSelectedRescheduleSession] = useState<SessionItem | null>(null);

  const fetchSessionsAndStats = async () => {
    try {
      const [sRes, cRes, stRes] = await Promise.all([
        fetch(`${API_URL}/class-sessions/calendar`, { credentials: 'include' }),
        fetch(`${API_URL}/courses/enrolled`, { credentials: 'include' }),
        fetch(`${API_URL}/class-sessions/stats`, { credentials: 'include' }),
      ]);

      if (sRes.ok) {
        const sData = await sRes.json();
        const rawSessions: any[] = Array.isArray(sData) ? sData : sData.data ?? [];
        const seenIds = new Set<string>();
        const normalizedSessions: SessionItem[] = [];
        for (let i = 0; i < rawSessions.length; i++) {
          const s = rawSessions[i];
          const rawId = s.id || s._id || `session-${i}-${s.scheduledAt || Date.now()}`;
          const id = typeof rawId === 'string' ? rawId : String(rawId);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            normalizedSessions.push({ ...s, id });
          }
        }
        setSessions(normalizedSessions);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        const rawCourses: any[] = Array.isArray(cData) ? cData : cData.data ?? [];
        const seenIds = new Set<string>();
        const normalizedCourses: Course[] = [];
        for (let i = 0; i < rawCourses.length; i++) {
          const c = rawCourses[i];
          const rawId = c.id || c._id || `course-${i}-${c.title || Date.now()}`;
          const id = typeof rawId === 'string' ? rawId : String(rawId);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            normalizedCourses.push({ ...c, id });
          }
        }
        setCourses(normalizedCourses);
      }
      if (stRes.ok) {
        const stData = await stRes.json();
        setStats(stData);
      }
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshSessionsSilently = async () => {
    try {
      const sRes = await fetch(`${API_URL}/class-sessions/calendar`, { credentials: 'include' });
      if (sRes.ok) {
        const sData = await sRes.json();
        const rawSessions: any[] = Array.isArray(sData) ? sData : sData.data ?? [];
        const seenIds = new Set<string>();
        const normalizedSessions: SessionItem[] = [];
        for (let i = 0; i < rawSessions.length; i++) {
          const s = rawSessions[i];
          const rawId = s.id || s._id || `session-${i}-${s.scheduledAt || Date.now()}`;
          const id = typeof rawId === 'string' ? rawId : String(rawId);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            normalizedSessions.push({ ...s, id });
          }
        }
        setSessions(normalizedSessions);
      }
    } catch (_) { }
  };

  useEffect(() => {
    if (user) {
      fetchSessionsAndStats();
    }
  }, [user]);

  useEffect(() => {
    if (user && sessions.length > 0) {
      const hasActiveUploads = sessions.some(
        (s) => s.status === 'COMPLETED' && (!s.recording || s.recording.status === 'PROCESSING' || s.recording.status === 'UPLOADING')
      );

      if (hasActiveUploads) {
        const interval = setInterval(refreshSessionsSilently, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [sessions, user]);

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const upcomingSessions = sessions
    .filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ═══════════════ NAVBAR ═══════════════ */}
      {/* Reusable Dynamic Navbar */}
      <Navbar
        role="STUDENT"
        activeTab={activeTab === 'attendance' ? 'history' : activeTab}
        onTabChange={(tabKey) => setActiveTab(tabKey as any)}
        customTabs={[
          { key: 'learning', label: 'Learning Portal', icon: BookOpen },
          { key: 'schedule', label: 'Daily Schedule', icon: Calendar },
          { key: 'history', label: 'Classes History', icon: History },
        ]}
      />

      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* HERO */}
        {/* <section className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-6 md:p-8 backdrop-blur-xl mb-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 bg-brand/15 border border-brand/30 rounded-full px-3 py-1 mb-3">
                <Star className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-semibold text-brand">Quranic Journey</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
                Assalamu Alaikum, <span className="text-brand">{user.name}</span> 👋
              </h1>
              <p className="text-muted-foreground text-sm mb-5">
                May Allah guide you and grant you success in your learning.
              </p>
              <div className="rounded-xl border border-brand/20 bg-brand/10 p-4 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <p className="text-foreground/90 text-sm italic leading-relaxed">
                  &ldquo;Read in the name of your Lord who created.&rdquo;
                  <span className="text-brand font-semibold not-italic"> — Al-Alaq 96:1</span>
                </p>
              </div>
            </div>
            <div className="hidden md:flex shrink-0 w-28 h-28 rounded-full bg-brand/10 border border-brand/20 items-center justify-center">
              <GraduationCap className="w-14 h-14 text-brand" />
            </div>
          </div>
        </section> */}

        {/* Blinking Live / Upcoming Class Banner */}
        <UpcomingClassBanner userRole="STUDENT" className="mb-8" />

        {/* METRICS ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-brand/15 rounded-xl p-2.5">
                <CheckCircle className="w-5 h-5 text-brand" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1 leading-none">
              {dataLoading ? <Loader2 className="w-5 h-5 inline animate-spin text-brand" /> : completedSessions.length}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Classes Attended</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-emerald-500/15 rounded-xl p-2.5">
                <Calendar className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1 leading-none">
              {dataLoading ? <Loader2 className="w-5 h-5 inline animate-spin text-emerald-500" /> : upcomingSessions.length}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Upcoming Classes</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-brand/15 rounded-xl p-2.5">
                <Clock className="w-5 h-5 text-brand" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1 leading-none">
              {dataLoading ? <Loader2 className="w-5 h-5 inline animate-spin text-brand" /> : (stats?.totalHours ?? 0).toFixed(1)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Learning Hours</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-500/15 rounded-xl p-2.5">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1 leading-none">
              {dataLoading ? <Loader2 className="w-5 h-5 inline animate-spin text-blue-500" /> : (stats?.enrolledCourses ?? 0)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Enrolled Courses</p>
          </div>
        </section>

        {activeTab === 'learning' ? (
          <>
            {/* UPCOMING CLASSES */}
            <section className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Video className="w-5 h-5 text-brand" />
                  Upcoming Classes
                </h2>
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-7 h-7 text-brand animate-spin" />
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No upcoming classes scheduled</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingSessions.map((session, idx) => {
                    const sessionId = session.id || session._id || `upcoming-session-${idx}`;
                    return (
                      <div key={sessionId} className="rounded-xl border border-border bg-background/50 p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${session.status === 'LIVE'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                            : 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                            }`}>
                            {session.status === 'LIVE' ? <PlayCircle className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {session.course.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <CourseTypeBadge type={session.course.type} />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {session.status === 'LIVE' ? (
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <button
                                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                                onClick={() => router.push(`/classroom/${sessionId}`)}
                              >
                                <PlayCircle className="w-4 h-4" /> Join Now
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="inline-block bg-blue-500/15 border border-blue-500/30 rounded-full px-3 py-0.5 text-xs text-blue-500 font-semibold">
                                Upcoming
                              </span>
                              <p className="text-xs text-muted-foreground font-mono">
                                {getCountdown(session.scheduledAt)}
                              </p>
                              <button
                                onClick={() => setSelectedRescheduleSession(session)}
                                className="mt-1 text-[11px] font-semibold text-brand hover:underline flex items-center gap-1"
                              >
                                <Calendar size={12} />
                                <span>Request Advance Class</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ENROLLED COURSES */}
            <section className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand" />
                  <span className="text-brand">Enrolled Courses</span>
                </h2>
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-7 h-7 text-brand animate-spin" />
                </div>
              ) : courses.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <p>No enrolled courses found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course, idx) => {
                    const courseId = course.id || course._id || `enrolled-course-${idx}`;
                    return (
                      <div key={courseId} className="rounded-xl border border-border bg-background/50 p-5 flex flex-col justify-between hover:border-brand/40 transition-all shadow-sm">
                        <div className="mb-4">
                          <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center mb-3">
                            <BookOpen className="w-5 h-5 text-brand" />
                          </div>
                          <h3 className="font-bold text-foreground text-sm leading-snug mb-1">
                            {course.title}
                          </h3>
                          {course.teacher && <p className="text-xs text-muted-foreground">{course.teacher.name}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <CourseTypeBadge type={course.type} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : activeTab === 'schedule' ? (
          <DailyScheduleView
            role="STUDENT"
            studentId={user?.id}
            sessions={sessions}
            onJoinClass={(sessionId) => router.push(`/classroom/${sessionId}`)}
            onReschedule={(session) => setSelectedRescheduleSession(session)}
          />
        ) : (
          /* CLASSES HISTORY & LESSON REPORTS TAB */
          <section className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-brand" />
                  Classes History &amp; Lesson Progress
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review past attended classes, teacher evaluations, assigned homework, and recorded sessions.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted/40 px-3 py-1 rounded-xl border border-border/40 self-start sm:self-auto">
                {completedSessions.length} Completed Session{completedSessions.length === 1 ? '' : 's'}
              </span>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
              </div>
            ) : completedSessions.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
                <History className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">No completed class records yet.</p>
                <p className="text-xs">Your attended classes and teacher evaluation reports will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {completedSessions.map((session, idx) => {
                  const sessionId = session.id || session._id || `completed-session-${idx}`;
                  const hasReport = Boolean(session.teacherReport);
                  const isReadyRecording = session.recording?.status === 'READY';
                  const teacherName = session.teacher?.name || 'Assigned Teacher';

                  return (
                    <div
                      key={sessionId}
                      className="rounded-2xl border border-border bg-card/60 hover:border-brand/40 p-5 flex flex-col gap-4 transition-all shadow-sm"
                    >
                      {/* Top row: Course, Teacher, Date, Attendance status */}
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground text-sm">{session.course.title}</p>
                            <CourseTypeBadge type={session.course.type} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Teacher: <span className="font-medium text-foreground">{teacherName}</span> ·{' '}
                            {formatDate(session.scheduledAt)} at {formatTime(session.scheduledAt)} ({session.durationMinutes} mins)
                          </p>
                        </div>
                        <span className="bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Attended
                        </span>
                      </div>

                      {/* Lesson Progress & Teacher Report Card */}
                      {hasReport && (
                        <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                Today&apos;s Lesson:
                              </span>
                              <span className="font-semibold text-foreground">
                                {session.teacherReport?.topicsCovered || session.teacherReport?.surahOrLesson}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    (session.teacherReport?.performanceRating ?? 5) >= star
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-mono font-bold text-foreground ml-1">
                                {session.teacherReport?.performanceRating ?? 5}/5
                              </span>
                            </div>
                          </div>

                          {/* Homework Box */}
                          {session.teacherReport?.homeworkAssignment && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                                  Homework &amp; Practice Task:
                                </span>
                                <p className="text-foreground/90 leading-relaxed">
                                  {session.teacherReport.homeworkAssignment}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Teacher notes */}
                          {session.teacherReport?.teacherNotes && (
                            <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                              Teacher&apos;s Note: &ldquo;{session.teacherReport.teacherNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {/* Footer Actions: View Report & Watch Recording */}
                      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs flex-wrap gap-2">
                        <div>
                          {hasReport ? (
                            <button
                              onClick={() => setSelectedReportSession(session)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>View Full Teacher Report &rarr;</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">
                              Report pending submission by teacher
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Recording:{' '}
                            <span className={`font-semibold ${isReadyRecording ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                              {session.recording?.status || 'PROCESSING'}
                            </span>
                          </span>

                          {isReadyRecording ? (
                            <button
                              onClick={() => {
                                const previewUrl = `${API_URL}/recordings/${sessionId}/stream`;
                                setActiveVideoUrl(previewUrl);
                              }}
                              className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Watch Recording
                            </button>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">
                              Processing upload...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <ViewClassReportModal
          isOpen={Boolean(selectedReportSession)}
          report={selectedReportSession?.teacherReport}
          session={selectedReportSession}
          onClose={() => setSelectedReportSession(null)}
        />

        <VideoPlayerModal
          videoUrl={activeVideoUrl}
          onClose={() => setActiveVideoUrl(null)}
        />

        <RescheduleModal
          isOpen={!!selectedRescheduleSession}
          onClose={() => setSelectedRescheduleSession(null)}
          session={selectedRescheduleSession}
          onSuccess={fetchSessionsAndStats}
        />

        {/* FOOTER */}
        <footer className="text-center py-6 border-t border-border mt-12">
          <p className="italic text-muted-foreground text-sm mb-1">
            &ldquo;Seek knowledge from the cradle to the grave.&rdquo;
          </p>
          <p className="text-xs text-muted-foreground/70">— Prophet Muhammad (PBUH)</p>
        </footer>
      </main>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <StudentDashboardContent />
    </React.Suspense>
  );
}
