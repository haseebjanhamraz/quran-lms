'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Loader2,
  Users,
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Languages,
  ChevronRight,
  CalendarDays,
  Play,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export interface StudentRecord {
  id: string;
  _id?: string;
  name: string;
  preferredName?: string;
  profilePicture?: string;
  studentId?: string | number;
  languages?: string[];
  courseTitle: string;
  classDays?: Array<{ day: string; time?: string; studentTime?: string; teacherTime?: string }>;
  classDuration?: number;
  classesPerWeek?: number;
  tier?: string;
  todaySession?: {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    status: 'SCHEDULED' | 'ACTIVATED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'FROZEN';
    livekitRoomId?: string;
    courseTitle?: string;
  } | null;
  nextSession?: {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    status: 'SCHEDULED' | 'ACTIVATED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'FROZEN';
    livekitRoomId?: string;
    courseTitle?: string;
  } | null;
  totalCompletedSessions?: number;
  totalSessionsCount?: number;
}

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'ACTIVATED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'FROZEN';
  livekitRoomId?: string;
  student?: any;
}

interface StudentsTabProps {
  students: StudentRecord[];
  studentsLoading: boolean;
  sessions?: SessionItem[];
  handleStartClass?: (id: string) => void;
  handleActivateClass?: (id: string) => void;
  startingId?: string | null;
  onNavigateSchedule?: () => void;
  onRefreshStudents?: () => void;
}

type FilterType = 'all' | 'live' | 'today' | 'upcoming';

export default function StudentsTab({
  students,
  studentsLoading,
  sessions = [],
  handleStartClass,
  handleActivateClass,
  startingId,
  onNavigateSchedule,
  onRefreshStudents,
}: StudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Compute realtime session mapping for each student by combining backend data with live sessions array
  const enrichedStudents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return students.map((st) => {
      const sId = st.id || st._id;

      // Find any live session or today's session from the realtime sessions prop
      const matchingLiveSession = sessions.find((sess) => {
        const sessStudentId = sess.student?.id || sess.student?._id;
        return (sessStudentId === sId || sessStudentId === st._id) && sess.status === 'LIVE';
      });

      const matchingTodaySession = sessions.find((sess) => {
        const sessStudentId = sess.student?.id || sess.student?._id;
        if (sessStudentId !== sId && sessStudentId !== st._id) return false;
        const d = new Date(sess.scheduledAt);
        return d >= startOfToday && d <= endOfToday;
      });

      const matchingNextSession = sessions
        .filter((sess) => {
          const sessStudentId = sess.student?.id || sess.student?._id;
          if (sessStudentId !== sId && sessStudentId !== st._id) return false;
          const d = new Date(sess.scheduledAt);
          return d >= now && sess.status !== 'COMPLETED' && sess.status !== 'CANCELLED';
        })
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

      // Merge realtime session state
      let activeToday = st.todaySession;
      if (matchingLiveSession) {
        activeToday = {
          id: matchingLiveSession.id,
          scheduledAt: matchingLiveSession.scheduledAt,
          durationMinutes: matchingLiveSession.durationMinutes,
          status: 'LIVE',
          livekitRoomId: matchingLiveSession.livekitRoomId,
          courseTitle: matchingLiveSession.course?.title || st.courseTitle,
        };
      } else if (matchingTodaySession) {
        activeToday = {
          id: matchingTodaySession.id,
          scheduledAt: matchingTodaySession.scheduledAt,
          durationMinutes: matchingTodaySession.durationMinutes,
          status: matchingTodaySession.status as any,
          livekitRoomId: matchingTodaySession.livekitRoomId,
          courseTitle: matchingTodaySession.course?.title || st.courseTitle,
        };
      }

      let activeNext = st.nextSession;
      if (matchingNextSession) {
        activeNext = {
          id: matchingNextSession.id,
          scheduledAt: matchingNextSession.scheduledAt,
          durationMinutes: matchingNextSession.durationMinutes,
          status: matchingNextSession.status as any,
          livekitRoomId: matchingNextSession.livekitRoomId,
          courseTitle: matchingNextSession.course?.title || st.courseTitle,
        };
      }

      const isLive = activeToday?.status === 'LIVE';
      const hasClassToday = Boolean(
        activeToday &&
        (activeToday.status === 'SCHEDULED' ||
          activeToday.status === 'ACTIVATED' ||
          activeToday.status === 'LIVE' ||
          activeToday.status === 'COMPLETED')
      );

      return {
        ...st,
        isLive,
        hasClassToday,
        effectiveTodaySession: activeToday,
        effectiveNextSession: activeNext,
      };
    });
  }, [students, sessions]);

  // Metric counts
  const totalCount = enrichedStudents.length;
  const liveCount = enrichedStudents.filter((s) => s.isLive).length;
  const todayCount = enrichedStudents.filter((s) => s.hasClassToday).length;
  const totalCompletedCount = enrichedStudents.reduce(
    (acc, s) => acc + (s.totalCompletedSessions || 0),
    0
  );

  // Filtered roster
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter((st) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        st.name?.toLowerCase().includes(q) ||
        st.preferredName?.toLowerCase().includes(q) ||
        st.courseTitle?.toLowerCase().includes(q) ||
        st.languages?.some((l) => l.toLowerCase().includes(q)) ||
        String(st.studentId || '').includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'live') return st.isLive;
      if (activeFilter === 'today') return st.hasClassToday;
      if (activeFilter === 'upcoming') {
        return Boolean(st.effectiveNextSession || (st.classDays && st.classDays.length > 0));
      }

      return true;
    });
  }, [enrichedStudents, searchQuery, activeFilter]);

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  const formatDateShort = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <section className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              My Students & Realtime Classes
            </h2>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {liveCount} Live Now
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track your assigned students roster, live classroom status, and upcoming session schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshStudents && (
            <button
              onClick={onRefreshStudents}
              disabled={studentsLoading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl border border-border transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Refresh Students Roster"
            >
              <RefreshCw size={14} className={studentsLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          {onNavigateSchedule && (
            <button
              onClick={onNavigateSchedule}
              className="px-3 py-2 text-xs font-medium bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Calendar size={14} />
              <span>Full Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Assigned Students</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {studentsLoading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active assigned learners</p>
        </div>

        {/* Classes Today */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Classes Today</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <CalendarDays size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {studentsLoading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : todayCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled for today</p>
        </div>

        {/* Live Right Now */}
        <div
          className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden group transition-all ${
            liveCount > 0
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/5'
              : 'bg-card border-border/80 hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Live Right Now</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                liveCount > 0
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Video size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground flex items-center gap-2">
            {studentsLoading ? (
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            ) : (
              <>
                <span>{liveCount}</span>
                {liveCount > 0 && (
                  <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                    In Progress
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active virtual classrooms</p>
        </div>

        {/* Completed Lessons */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed Lessons</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {studentsLoading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : totalCompletedCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total sessions delivered</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/60 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-card text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Students ({totalCount})
          </button>
          <button
            onClick={() => setActiveFilter('live')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'live'
                ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Live Now ({liveCount})
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeFilter === 'today'
                ? 'bg-card text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Classes Today ({todayCount})
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeFilter === 'upcoming'
                ? 'bg-card text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            With Schedule
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-sm w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student, course, language, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-card border border-border/80 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Student List Content */}
      {studentsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/60 rounded-2xl">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading assigned students and realtime classes...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-base font-semibold text-foreground">No students found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1 mb-4">
            {searchQuery
              ? `No student matching "${searchQuery}" was found. Try a different search keyword or reset filters.`
              : activeFilter !== 'all'
              ? `No students matching the "${activeFilter}" filter.`
              : 'You do not have any students assigned yet or no active classes are scheduled.'}
          </p>
          {(searchQuery || activeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl shadow-sm hover:opacity-95 transition-opacity"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredStudents.map((st) => {
            const isLive = st.isLive;
            const todaySess = st.effectiveTodaySession;
            const nextSess = st.effectiveNextSession;
            const isStarting = startingId === (todaySess?.id || nextSess?.id);
            const isExpanded = expandedStudentId === st.id;

            return (
              <div
                key={st.id || st._id}
                className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isLive
                    ? 'bg-gradient-to-r from-emerald-500/10 via-card to-card border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : todaySess && todaySess.status === 'SCHEDULED'
                    ? 'bg-card border-primary/40 hover:border-primary shadow-sm hover:shadow-md'
                    : 'bg-card border-border/80 hover:border-border shadow-sm hover:shadow-md'
                }`}
              >
                {/* Live glow ribbon at top if LIVE */}
                {isLive && (
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse"></div>
                )}

                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Student Identity */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Avatar with Status Ring */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                            isLive
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                              : todaySess
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                              : 'bg-muted text-foreground border border-border'
                          }`}
                        >
                          {st.profilePicture ? (
                            <img
                              src={st.profilePicture}
                              alt={st.name}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            getInitials(st.name)
                          )}
                        </div>
                        {isLive && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-card"></span>
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-foreground truncate">
                            {st.name}
                          </h3>
                          {st.preferredName && st.preferredName !== st.name && (
                            <span className="text-xs text-muted-foreground">
                              ({st.preferredName})
                            </span>
                          )}
                          {st.studentId && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/80">
                              #{st.studentId}
                            </span>
                          )}
                          {st.tier && st.tier !== 'General' && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              {st.tier}
                            </span>
                          )}
                        </div>

                        {/* Subline: Course & Timezone */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground/90">
                            <BookOpen size={13} className="text-primary" />
                            {st.courseTitle || 'Quran Studies'}
                          </span>
                          {st.languages && st.languages.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Languages size={13} className="text-primary/70" />
                              <span>{st.languages.join(', ')}</span>
                            </span>
                          )}
                          {st.totalCompletedSessions !== undefined && st.totalCompletedSessions > 0 && (
                            <span className="text-muted-foreground">
                              • {st.totalCompletedSessions} lessons completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Realtime Class Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Class Status
                        </span>
                        {isLive ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <Video size={14} className="text-emerald-500" />
                            <span>LIVE NOW • Room Active</span>
                          </div>
                        ) : todaySess && todaySess.status === 'SCHEDULED' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-xs">
                            <Clock size={14} />
                            <span>Today at {formatTime(todaySess.scheduledAt)} ({todaySess.durationMinutes || 30}m)</span>
                          </div>
                        ) : todaySess && todaySess.status === 'ACTIVATED' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                            <Clock size={14} />
                            <span>Activated • Starting Soon</span>
                          </div>
                        ) : todaySess && todaySess.status === 'COMPLETED' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            <CheckCircle2 size={14} />
                            <span>Completed Today</span>
                          </div>
                        ) : nextSess ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border/80 text-muted-foreground font-medium text-xs">
                            <Calendar size={14} />
                            <span>
                              Next: {formatDateShort(nextSess.scheduledAt)} • {formatTime(nextSess.scheduledAt)}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/40 text-muted-foreground/80 font-medium text-xs">
                            <Calendar size={14} />
                            <span>No scheduled sessions</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {isLive && todaySess ? (
                          <Link
                            href={`/classroom/${todaySess.id}`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            <Video size={15} />
                            <span>Join Classroom Now</span>
                          </Link>
                        ) : todaySess && (todaySess.status === 'SCHEDULED' || todaySess.status === 'ACTIVATED') ? (
                          <button
                            onClick={() => handleStartClass && handleStartClass(todaySess.id)}
                            disabled={isStarting}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-60"
                          >
                            {isStarting ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Play size={14} className="fill-current" />
                            )}
                            <span>Start Class</span>
                          </button>
                        ) : null}

                        {/* Toggle More Details / Schedule */}
                        <button
                          onClick={() => setExpandedStudentId(isExpanded ? null : st.id)}
                          className="px-3 py-2.5 rounded-xl border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Days Bar (Always visible if student has regular class days) */}
                  {st.classDays && st.classDays.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
                        <CalendarDays size={12} />
                        Weekly Schedule:
                      </span>
                      {st.classDays.map((cd, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-muted text-foreground/90 font-medium text-[11px] border border-border/60"
                        >
                          <span className="font-semibold text-primary">{cd.day}</span>
                          {(cd.teacherTime || cd.time || cd.studentTime) && (
                            <span className="text-muted-foreground ml-1">
                              {cd.teacherTime || cd.time || cd.studentTime}
                            </span>
                          )}
                        </span>
                      ))}
                      {st.classDuration && (
                        <span className="text-muted-foreground text-[11px] ml-auto">
                          {st.classDuration} mins / session
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Academic & Schedule Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-muted/30 -mx-4 -mb-4 p-4 rounded-b-2xl">
                      {/* Academic & Course Details */}
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                          <BookOpen size={13} className="text-primary" />
                          Course & Level
                        </h4>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Enrolled Course:</span> {st.courseTitle || 'Quran Studies'}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Student Level:</span> {st.tier || 'Beginner'}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <span className="font-medium text-foreground">Language:</span>{' '}
                          {st.languages && st.languages.length > 0 ? st.languages.join(', ') : 'English'}
                        </p>
                      </div>

                      {/* Schedule Specifications */}
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-primary" />
                          Schedule Details
                        </h4>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Weekly Frequency:</span>{' '}
                          {st.classesPerWeek ? `${st.classesPerWeek} classes / week` : `${st.classDays?.length || 0} days / week`}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Class Duration:</span>{' '}
                          {st.classDuration || 30} minutes / class
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Status:</span>{' '}
                          {st.isLive ? 'Currently in Class' : st.hasClassToday ? 'Scheduled Today' : 'Upcoming'}
                        </p>
                      </div>

                      {/* Academic & Class History */}
                      <div className="space-y-1.5">
                        <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                          <Clock size={13} className="text-primary" />
                          Class Record
                        </h4>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Total Sessions:</span>{' '}
                          {st.totalSessionsCount || 0}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Completed Lessons:</span>{' '}
                          {st.totalCompletedSessions || 0}
                        </p>
                        {onNavigateSchedule && (
                          <button
                            onClick={onNavigateSchedule}
                            className="text-primary hover:underline font-semibold flex items-center gap-1 mt-2"
                          >
                            <span>Open Timetable</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
