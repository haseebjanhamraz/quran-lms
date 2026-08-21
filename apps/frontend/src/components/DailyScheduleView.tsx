'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock, Calendar, Search, Trash2, Move,
  CheckCircle2, PlayCircle, Video, User, BookOpen, AlertCircle, RefreshCw,
  Sparkles, LayoutGrid, List
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useWebSocket } from '@/hooks/useWebSocket';

export interface TeacherItem {
  id: string;
  name: string;
  email?: string;
  assignedDaysCount?: number;
  color?: string;
}

export interface SlotAssignment {
  id?: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacher?: { id: string; name: string; email?: string; profilePicture?: string };
  course?: { id?: string; title: string; type?: string };
  student?: { id?: string; name: string; email?: string };
  enrolledStudents?: { id: string; name: string; email?: string }[];
}

export interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'FROZEN';
  teacherId?: string;
  studentId?: string;
  teacher?: { id: string; name: string; email?: string; profilePicture?: string };
  student?: { id: string; name: string };
  recording?: { filePath: string | null; status: string } | null;
}

export const TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TEACHER_COLORS = [
  'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30',
  'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
];

const COURSE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  NAZIRA: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  TAJWEED: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  HIFZ_UL_QURAN: { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30' },
  ISLAMIC_STUDIES: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  ARABIC: { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
};

export function getTeacherColor(index: number): string {
  return TEACHER_COLORS[index % TEACHER_COLORS.length];
}

export function getCurrentDayOfWeek(): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = new Date().getDay();
  return dayNames[dayIndex];
}

interface DailyScheduleViewProps {
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPERVISOR';
  teacherId?: string;
  studentId?: string;
  teachers?: TeacherItem[];
  gridAssignments?: Record<string, SlotAssignment>;
  sessions?: SessionItem[];
  allowDragDrop?: boolean;
  onDropSlot?: (targetDay: string, targetTimeIdx: number, payload: any) => void;
  onRemoveSlot?: (dayOfWeek: string, timeSlotIndex: number) => void;
  onStartClass?: (sessionId: string) => void;
  onJoinClass?: (sessionId: string) => void;
  onReschedule?: (session: any) => void;
}

export default function DailyScheduleView({
  role = 'ADMIN',
  teacherId,
  studentId,
  teachers = [],
  gridAssignments: initialGridAssignments,
  sessions: initialSessions,
  allowDragDrop = false,
  onDropSlot,
  onRemoveSlot,
  onStartClass,
  onJoinClass,
  onReschedule,
}: DailyScheduleViewProps) {
  const currentTodayName = useMemo(() => getCurrentDayOfWeek(), []);
  const [selectedDay, setSelectedDay] = useState<string>(currentTodayName);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(teacherId || '');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [displayLayout, setDisplayLayout] = useState<'table' | 'cards'>('cards');

  // Internal state if props not passed
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>(initialGridAssignments || {});
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions || []);
  const [loadingData, setLoadingData] = useState<boolean>(!initialGridAssignments);

  // Map teacher ID -> { courseTitle, enrolledStudents }
  const [teacherCourseMap, setTeacherCourseMap] = useState<Record<string, { courseTitle: string; enrolledStudents: { id: string; name: string; email?: string }[] }>>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Sync props when updated externally
  useEffect(() => {
    if (initialGridAssignments) setGridAssignments(initialGridAssignments);
  }, [initialGridAssignments]);

  useEffect(() => {
    if (initialSessions) setSessions(initialSessions);
  }, [initialSessions]);

  // Fetch real course & student enrollment mapping for teachers & admins
  const fetchTeacherCourseEnrollments = useCallback(async () => {
    if (role === 'STUDENT') return;
    try {
      const res = await apiFetch(`${API_URL}/courses`);
      if (res.ok) {
        const coursesData = await res.json();
        const map: Record<string, { courseTitle: string; enrolledStudents: { id: string; name: string; email?: string }[] }> = {};

        await Promise.all(
          coursesData.map(async (c: any) => {
            const teacherIds = [c.teacherId, ...(c.teacherIds || [])].filter(Boolean);
            const courseIdStr = c._id || c.id;

            let enrolledStudents: { id: string; name: string; email?: string }[] = [];
            try {
              const detailRes = await apiFetch(`${API_URL}/courses/${courseIdStr}`);
              if (detailRes.ok) {
                const detail = await detailRes.json();
                if (Array.isArray(detail.enrollments)) {
                  enrolledStudents = detail.enrollments
                    .map((e: any) => e.student)
                    .filter(Boolean)
                    .map((s: any) => ({
                      id: s._id || s.id,
                      name: s.name,
                      email: s.email,
                    }));
                }
              }
            } catch (_) {}

            teacherIds.forEach((tId: any) => {
              const tIdStr = tId.toString();
              map[tIdStr] = {
                courseTitle: c.title,
                enrolledStudents,
              };
            });
          })
        );

        setTeacherCourseMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch teacher course enrollments:', err);
    }
  }, [API_URL, role]);

  const fetchDailyData = useCallback(async () => {
    try {
      setLoadingData(true);
      await fetchTeacherCourseEnrollments();

      // Scoped endpoint call by role
      const gridUrl = role === 'TEACHER' 
        ? `${API_URL}/schedule/grid/my` 
        : role === 'STUDENT'
        ? `${API_URL}/schedule/grid/student`
        : `${API_URL}/schedule/grid`;

      const res = await apiFetch(gridUrl);
      if (res.ok) {
        const gridData: SlotAssignment[] = await res.json();
        const map: Record<string, SlotAssignment> = {};
        gridData.forEach((slot) => {
          map[`${slot.dayOfWeek}-${slot.timeSlotIndex}`] = slot;
        });
        setGridAssignments(map);
      }
    } catch (err) {
      console.error('Failed to fetch schedule grid in DailyScheduleView:', err);
    } finally {
      setLoadingData(false);
    }
  }, [API_URL, role, fetchTeacherCourseEnrollments]);

  // Real-time updates via WebSocket
  useWebSocket({
    eventFilter: 'schedule_update',
    onMessage: () => {
      fetchDailyData();
    },
  });

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  // Map day to actual day sessions for correlation
  const daySessionsMap = useMemo(() => {
    const map: Record<string, SessionItem[]> = {};
    DAYS.forEach((d) => { map[d] = []; });

    sessions.forEach((s) => {
      try {
        const d = new Date(s.scheduledAt);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[d.getDay()];
        if (map[dayName]) {
          map[dayName].push(s);
        }
      } catch (_) {}
    });

    return map;
  }, [sessions]);

  // Extract daily slots for the selected day
  const dailySlots = useMemo(() => {
    return TIME_SLOTS.map((timeSlot, timeIdx) => {
      const slotKey = `${selectedDay}-${timeIdx}`;
      const assignment = gridAssignments[slotKey];

      // Correlate with real session if available
      const relatedSession = (daySessionsMap[selectedDay] || []).find((s) => {
        try {
          const sDate = new Date(s.scheduledAt);
          const [startStr] = timeSlot.split(' - ');
          const [startH, startM] = startStr.split(':').map(Number);
          return sDate.getHours() === startH && Math.abs(sDate.getMinutes() - startM) < 15;
        } catch (_) {
          return false;
        }
      });

      return {
        timeSlotIndex: timeIdx,
        timeSlot,
        assignment,
        session: relatedSession,
      };
    });
  }, [selectedDay, gridAssignments, daySessionsMap]);

  // Filter slots based on user role, selected teacher filter, and search query
  const filteredSlots = useMemo(() => {
    return dailySlots.filter(({ assignment, session, timeSlotIndex }) => {
      // In student view, if no assignment and no session, hide empty slot rows
      if (!assignment && !session) {
        if (role === 'STUDENT') return false;
        return true;
      }

      const assTeacherId = assignment
        ? (typeof assignment.teacherId === 'object'
            ? (assignment.teacherId as any)?._id || (assignment.teacherId as any)?.id
            : assignment.teacherId) || assignment.teacher?.id
        : session?.teacherId;

      // Teacher dashboard filter
      if (teacherId) {
        if (assTeacherId !== teacherId && assignment?.teacher?.id !== teacherId) {
          return false;
        }
      }

      // Student dashboard filter
      if (studentId && role === 'STUDENT') {
        const assStudentId = assignment
          ? (typeof (assignment as any).studentId === 'object'
              ? (assignment as any).studentId?._id || (assignment as any).studentId?.id
              : (assignment as any).studentId) || assignment?.student?.id
          : session?.studentId || session?.student?.id;

        if (assStudentId && assStudentId !== studentId) {
          return false;
        }

        if (session?.studentId && session.studentId !== studentId) {
          return false;
        }
      }

      // Selected Teacher Dropdown filter (Admin view)
      if (selectedTeacherFilter) {
        if (assTeacherId !== selectedTeacherFilter && assignment?.teacher?.id !== selectedTeacherFilter && assignment?.teacher?.name !== selectedTeacherFilter) {
          return false;
        }
      }

      // Search Query filter (matches teacher, student, or course name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const teacherName = (assignment?.teacher?.name || session?.teacher?.name || '').toLowerCase();
        const mappedInfo = assTeacherId ? teacherCourseMap[assTeacherId] : null;
        const enrolledStudents = assignment?.enrolledStudents || mappedInfo?.enrolledStudents || [];
        const studentNames = [
          assignment?.student?.name,
          session?.student?.name,
          ...enrolledStudents.map((s) => s.name),
        ].filter(Boolean).join(' ').toLowerCase();

        const courseTitle = (assignment?.course?.title || session?.course?.title || mappedInfo?.courseTitle || '').toLowerCase();

        if (!teacherName.includes(q) && !studentNames.includes(q) && !courseTitle.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [dailySlots, teacherId, studentId, role, displayLayout, selectedTeacherFilter, searchQuery, teacherCourseMap]);

  // Count assigned slots for each day accurately
  const daySlotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DAYS.forEach((day) => {
      let count = 0;
      TIME_SLOTS.forEach((timeSlot, idx) => {
        const slotKey = `${day}-${idx}`;
        const hasGridSlot = Boolean(gridAssignments[slotKey]);
        const hasSession = (daySessionsMap[day] || []).some((s) => {
          try {
            const sDate = new Date(s.scheduledAt);
            const [startStr] = timeSlot.split(' - ');
            const [startH, startM] = startStr.split(':').map(Number);
            return sDate.getHours() === startH && Math.abs(sDate.getMinutes() - startM) < 15;
          } catch (_) {
            return false;
          }
        });

        if (hasGridSlot || hasSession) {
          count++;
        }
      });

      counts[day] = count;
    });
    return counts;
  }, [gridAssignments, daySessionsMap]);

  // Total classes scheduled for student across the entire week
  const totalWeeklyClasses = useMemo(() => {
    return Object.values(daySlotCounts).reduce((acc, c) => acc + c, 0);
  }, [daySlotCounts]);

  // Format student local time display
  const formatStudentTime = (teacherTime: string) => {
    try {
      const [startStr, endStr] = teacherTime.split(' - ');
      const formatPart = (timeStr: string) => {
        const [hStr, mStr] = timeStr.split(':');
        let hours = parseInt(hStr, 10);
        const mins = parseInt(mStr, 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const formattedMins = mins < 10 ? `0${mins}` : mins;
        return `${displayHours}:${formattedMins} ${period}`;
      };
      return `${formatPart(startStr)} – ${formatPart(endStr)}`;
    } catch (_) {
      return teacherTime;
    }
  };

  // Drag handlers (for Admin)
  const handleDragOver = (e: React.DragEvent, timeIdx: number) => {
    if (!allowDragDrop) return;
    e.preventDefault();
    setDragOverIndex(timeIdx);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, timeIdx: number) => {
    if (!allowDragDrop) return;
    e.preventDefault();
    setDragOverIndex(null);
    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;
    try {
      const payload = JSON.parse(rawData);
      if (onDropSlot) {
        onDropSlot(selectedDay, timeIdx, payload);
      }
    } catch (_) {}
  };

  const handleDragStartFromSlot = (e: React.DragEvent, slot: SlotAssignment, timeIdx: number) => {
    if (!allowDragDrop) return;
    const sourceSlotKey = `${selectedDay}-${timeIdx}`;
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        type: 'MOVE_SLOT',
        teacherId: slot.teacherId,
        teacherName: slot.teacher?.name || 'Teacher',
        sourceSlotKey,
      })
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ─── Top Control Panel & Day Selector ─── */}
      <div className="glass-panel p-5 rounded-2xl border border-border/60 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-display font-bold text-foreground">
                {role === 'STUDENT' ? 'Daily Class Timetable' : 'Daily Timetable Schedule'}
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand/15 text-brand border border-brand/30 flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                {selectedDay === currentTodayName ? "Today's Schedule" : `${selectedDay} Timetable`}
              </span>
              {role === 'STUDENT' && totalWeeklyClasses > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {totalWeeklyClasses} classes / week
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {role === 'STUDENT'
                ? `Your scheduled Quran & Islamic Studies learning slots for ${selectedDay}.`
                : `Active sessions & assigned slots for ${selectedDay}. (${daySlotCounts[selectedDay] || 0} slots assigned today)`}
            </p>
          </div>

          {/* Quick Filters & Layout Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={role === 'STUDENT' ? 'Search subject, teacher...' : 'Search teacher, student...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>

            {/* Layout Toggle for Student */}
            {role === 'STUDENT' && (
              <div className="flex items-center p-1 bg-card border border-border rounded-xl shadow-sm">
                <button
                  onClick={() => setDisplayLayout('cards')}
                  title="Card View"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    displayLayout === 'cards'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setDisplayLayout('table')}
                  title="Table View"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    displayLayout === 'table'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            )}

            {/* Teacher filter dropdown (Admin mode) */}
            {role === 'ADMIN' && teachers.length > 0 && (
              <div className="relative min-w-[180px]">
                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all cursor-pointer"
                >
                  <option value="">All Teachers ({teachers.length})</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ─── Days of Week Navigation Bar ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-border/50 scrollbar-thin">
          {DAYS.map((day) => {
            const isToday = day === currentTodayName;
            const isSelected = day === selectedDay;
            const daySlotCount = daySlotCounts[day] || 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.03]'
                    : 'bg-card/60 text-muted-foreground border-border hover:bg-card hover:text-foreground'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    Today
                  </span>
                )}
                {daySlotCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-primary-foreground/25 text-primary-foreground' : 'bg-brand/15 text-brand'
                  }`}>
                    {daySlotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Schedule Content Area ─── */}
      {loadingData ? (
        <div className="glass-panel rounded-2xl py-20 flex flex-col items-center justify-center gap-3 border border-border/60 shadow-md">
          <RefreshCw className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading your timetable schedule...</p>
        </div>
      ) : role === 'STUDENT' && displayLayout === 'cards' ? (
        /* ═══════════════ STUDENT CARD VIEW ═══════════════ */
        <div className="space-y-4">
          {filteredSlots.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-border/60 shadow-md">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <h4 className="text-base font-bold text-foreground mb-1">
                No classes scheduled for {selectedDay}
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                You have no live sessions or weekly slots scheduled for {selectedDay}. Take this time for Quran revision or self-study!
              </p>
              {selectedDay !== currentTodayName && (
                <button
                  onClick={() => setSelectedDay(currentTodayName)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-bold shadow-md hover:bg-brand/90 transition-all"
                >
                  <Clock className="w-3.5 h-3.5" /> View Today&apos;s Schedule
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSlots.map(({ timeSlotIndex, timeSlot, assignment, session }) => {
                const isLive = session?.status === 'LIVE';
                const isCompleted = session?.status === 'COMPLETED';
                const courseType = assignment?.course?.type || session?.course?.type || 'NAZIRA';
                const badgeStyle = COURSE_BADGES[courseType] || COURSE_BADGES.NAZIRA;
                const courseTitle = assignment?.course?.title || session?.course?.title || 'Quran & Tajweed Learning';
                const teacherName = assignment?.teacher?.name || session?.teacher?.name || 'Assigned Quran Teacher';
                const teacherEmail = assignment?.teacher?.email || session?.teacher?.email;
                const targetSessionId = session?.id || assignment?.id || `session-${timeSlotIndex}`;

                return (
                  <div
                    key={timeSlotIndex}
                    className={`rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between gap-4 shadow-sm backdrop-blur-sm ${
                      isLive
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/10 shadow-lg ring-1 ring-emerald-500'
                        : 'border-border/70 bg-card/80 hover:border-brand/40 hover:shadow-md'
                    }`}
                  >
                    {/* Card Top: Time & Status Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-background/80 border border-border px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-foreground shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-brand" />
                          <span>{formatStudentTime(timeSlot)}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                          {courseType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div>
                        {isLive ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            Live Now
                          </span>
                        ) : isCompleted ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase">
                            <Sparkles className="w-3 h-3" /> Scheduled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Middle: Subject & Teacher */}
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-foreground flex items-center gap-2 leading-snug">
                        <BookOpen className="w-4 h-4 text-brand shrink-0" />
                        <span>{courseTitle}</span>
                      </h4>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand/20 to-teal-500/20 border border-brand/30 flex items-center justify-center text-brand font-bold text-xs shadow-xs">
                          {teacherName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{teacherName}</p>
                          {teacherEmail && <p className="text-[11px] text-muted-foreground truncate">{teacherEmail}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                      <div>
                        {onReschedule && !isCompleted && (
                          <button
                            onClick={() => onReschedule(session || assignment)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-brand transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Advance / Reschedule</span>
                          </button>
                        )}
                      </div>

                      <div>
                        {isLive ? (
                          <button
                            onClick={() => onJoinClass && onJoinClass(targetSessionId)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all scale-105"
                          >
                            <PlayCircle className="w-4 h-4" /> Join Classroom
                          </button>
                        ) : onJoinClass ? (
                          <button
                            onClick={() => onJoinClass(targetSessionId)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs shadow-sm transition-all"
                          >
                            <Video className="w-3.5 h-3.5" /> Enter Class
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════ TABLE VIEW (ADMIN, TEACHER, & STUDENT TABLE) ═══════════════ */
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider w-12 text-center border-r border-border">
                    #
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Time Slot
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Course / Subject
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Assigned Teacher
                  </th>
                  {role !== 'STUDENT' && (
                    <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                      Assigned Student(s)
                    </th>
                  )}
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Status
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSlots.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'STUDENT' ? 6 : 7} className="p-12 text-center text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="font-semibold text-sm">No schedule slots match your filter criteria for {selectedDay}.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map(({ timeSlotIndex, timeSlot, assignment, session }) => {
                    const isDragOver = dragOverIndex === timeSlotIndex;
                    const teacherIndex = teachers.findIndex((t) => t.id === assignment?.teacherId);
                    const colorClass = getTeacherColor(teacherIndex >= 0 ? teacherIndex : timeSlotIndex);

                    const assTeacherId = assignment
                      ? (typeof assignment.teacherId === 'object'
                          ? (assignment.teacherId as any)?._id || (assignment.teacherId as any)?.id
                          : assignment.teacherId) || assignment.teacher?.id
                      : session?.teacherId;

                    const mappedInfo = assTeacherId ? teacherCourseMap[assTeacherId] : null;

                    // Resolve real course title
                    const displayCourseTitle = assignment?.course?.title || session?.course?.title || mappedInfo?.courseTitle || (assignment ? 'Quran Session' : null);
                    const courseType = assignment?.course?.type || session?.course?.type;

                    // Resolve real enrolled students
                    const assignedStudentObj = assignment?.student || session?.student;
                    const enrolledList = (assignment as any)?.enrolledStudents || mappedInfo?.enrolledStudents || [];

                    const displayStudentName = assignedStudentObj?.name
                      || (enrolledList.length > 0 ? enrolledList[timeSlotIndex % enrolledList.length]?.name : null);

                    const isLive = session?.status === 'LIVE';
                    const targetSessionId = session?.id || assignment?.id || `slot-${timeSlotIndex}`;

                    return (
                      <tr
                        key={timeSlotIndex}
                        onDragOver={(e) => handleDragOver(e, timeSlotIndex)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, timeSlotIndex)}
                        className={`hover:bg-card/40 transition-colors ${
                          isLive ? 'bg-emerald-500/10' : ''
                        } ${isDragOver ? 'bg-primary/20 ring-2 ring-primary ring-inset' : ''}`}
                      >
                        {/* Index */}
                        <td className="p-3.5 text-center font-mono font-medium text-muted-foreground border-r border-border">
                          {timeSlotIndex + 1}
                        </td>

                        {/* Time Slot */}
                        <td className="p-3.5 font-mono text-xs font-semibold text-foreground border-r border-border whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand" />
                            <span>{formatStudentTime(timeSlot)}</span>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="p-3.5 border-r border-border">
                          {displayCourseTitle ? (
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span className="font-semibold text-foreground">{displayCourseTitle}</span>
                              {courseType && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                                  {courseType.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>

                        {/* Teacher */}
                        <td className="p-3.5 border-r border-border">
                          {assignment || session ? (
                            <div
                              draggable={allowDragDrop}
                              onDragStart={(e) => assignment && handleDragStartFromSlot(e, assignment, timeSlotIndex)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                                allowDragDrop ? 'cursor-grab active:cursor-grabbing hover:scale-105 transition-all' : ''
                              } ${colorClass}`}
                            >
                              {allowDragDrop && <Move className="w-3 h-3 opacity-60" />}
                              <User className="w-3.5 h-3.5" />
                              <span>{assignment?.teacher?.name || session?.teacher?.name || 'Assigned Teacher'}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 italic text-xs">
                              {allowDragDrop ? 'Drag teacher here to assign' : 'Unassigned'}
                            </span>
                          )}
                        </td>

                        {/* Student (Hidden on Student role) */}
                        {role !== 'STUDENT' && (
                          <td className="p-3.5 border-r border-border">
                            {displayStudentName ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                  <span>{displayStudentName}</span>
                                </span>
                                {enrolledList.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground font-medium pl-3.5">
                                    +{enrolledList.length - 1} other student{enrolledList.length - 1 > 1 ? 's' : ''} enrolled
                                  </span>
                                )}
                              </div>
                            ) : assignment ? (
                              <span className="text-xs text-muted-foreground/60 italic font-normal">No Student Enrolled</span>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            )}
                          </td>
                        )}

                        {/* Status */}
                        <td className="p-3.5 border-r border-border">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Live Now
                            </span>
                          ) : assignment || session ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Scheduled Slot
                            </span>
                          ) : (
                            <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              Available
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {(assignment || session) && (role === 'TEACHER' || role === 'ADMIN') && onStartClass && (
                              <button
                                onClick={() => onStartClass(targetSessionId)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                              >
                                <PlayCircle className="w-3.5 h-3.5" /> Start
                              </button>
                            )}

                            {(assignment || session) && role === 'STUDENT' && onJoinClass && (
                              <button
                                onClick={() => onJoinClass(targetSessionId)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                  isLive
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                    : 'bg-brand hover:bg-brand/90 text-brand-foreground'
                                }`}
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>{isLive ? 'Join Live Class' : 'Enter Class'}</span>
                              </button>
                            )}

                            {(assignment || session) && role === 'STUDENT' && onReschedule && (
                              <button
                                onClick={() => onReschedule(session || assignment)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-all"
                                title="Request Advance / Reschedule"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            )}

                            {assignment && allowDragDrop && onRemoveSlot && (
                              <button
                                onClick={() => onRemoveSlot(selectedDay, timeSlotIndex)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                title="Remove Slot Assignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

