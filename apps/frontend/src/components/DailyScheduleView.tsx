'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock, Calendar, UserCheck, Search, Filter, Trash2, Move,
  CheckCircle2, PlayCircle, Video, User, BookOpen, AlertCircle, RefreshCw, Users
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

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
  teacher?: { id: string; name: string; email?: string };
  course?: { id?: string; title: string; type?: string };
  student?: { id?: string; name: string; email?: string };
  enrolledStudents?: { id: string; name: string; email?: string }[];
}

export interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  teacherId?: string;
  studentId?: string;
  teacher?: { id: string; name: string };
  student?: { id: string; name: string };
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
}: DailyScheduleViewProps) {
  const currentTodayName = useMemo(() => getCurrentDayOfWeek(), []);
  const [selectedDay, setSelectedDay] = useState<string>(currentTodayName);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(teacherId || '');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Fetch real course & student enrollment mapping for teachers
  const fetchTeacherCourseEnrollments = useCallback(async () => {
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
  }, [API_URL]);

  const fetchDailyData = useCallback(async () => {
    try {
      setLoadingData(true);
      await fetchTeacherCourseEnrollments();
      const res = await apiFetch(`${API_URL}/schedule/grid`);
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
  }, [API_URL, fetchTeacherCourseEnrollments]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  // Extract daily slots for the selected day
  const dailySlots = useMemo(() => {
    return TIME_SLOTS.map((timeSlot, timeIdx) => {
      const slotKey = `${selectedDay}-${timeIdx}`;
      const assignment = gridAssignments[slotKey];
      return {
        timeSlotIndex: timeIdx,
        timeSlot,
        assignment,
      };
    });
  }, [selectedDay, gridAssignments]);

  // Filter slots based on user role, selected teacher filter, and search query
  const filteredSlots = useMemo(() => {
    return dailySlots.filter(({ assignment, timeSlotIndex }) => {
      if (!assignment) return true; // Show available slot rows

      const assTeacherId = typeof assignment.teacherId === 'object'
        ? (assignment.teacherId as any)?._id || (assignment.teacherId as any)?.id
        : assignment.teacherId || assignment.teacher?.id;

      // Teacher dashboard filter
      if (teacherId) {
        if (assTeacherId !== teacherId && assignment.teacher?.id !== teacherId) {
          return false;
        }
      }

      // Student dashboard filter
      if (studentId) {
        const assStudentId = typeof (assignment as any).studentId === 'object'
          ? (assignment as any).studentId?._id || (assignment as any).studentId?.id
          : (assignment as any).studentId;
        
        const mappedInfo = assTeacherId ? teacherCourseMap[assTeacherId] : null;
        const enrolledStudents = assignment.enrolledStudents || mappedInfo?.enrolledStudents || [];
        const isEnrolled = enrolledStudents.some((s) => s.id === studentId);

        if (assStudentId !== studentId && assignment.student?.id !== studentId && !isEnrolled) {
          return false;
        }
      }

      // Selected Teacher Dropdown filter (Admin view)
      if (selectedTeacherFilter) {
        if (assTeacherId !== selectedTeacherFilter && assignment.teacher?.id !== selectedTeacherFilter && assignment.teacher?.name !== selectedTeacherFilter) {
          return false;
        }
      }

      // Search Query filter (matches teacher, student, or course name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const teacherName = assignment.teacher?.name?.toLowerCase() || '';
        const mappedInfo = assTeacherId ? teacherCourseMap[assTeacherId] : null;
        const enrolledStudents = assignment.enrolledStudents || mappedInfo?.enrolledStudents || [];
        const studentNames = [
          assignment.student?.name,
          ...enrolledStudents.map((s) => s.name),
        ].filter(Boolean).join(' ').toLowerCase();

        const courseTitle = (assignment.course?.title || mappedInfo?.courseTitle || '').toLowerCase();

        if (!teacherName.includes(q) && !studentNames.includes(q) && !courseTitle.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [dailySlots, teacherId, studentId, selectedTeacherFilter, searchQuery, teacherCourseMap]);

  // Count assigned slots for selected day
  const assignedCountForDay = useMemo(() => {
    return dailySlots.filter((s) => s.assignment).length;
  }, [dailySlots]);

  // Format student local time display
  const formatStudentTime = (teacherTime: string) => {
    try {
      const [startStr] = teacherTime.split(' - ');
      const [hStr, mStr] = startStr.split(':');
      let hours = parseInt(hStr, 10);
      const mins = parseInt(mStr, 10);
      const period = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      const formattedMins = mins < 10 ? `0${mins}` : mins;
      return `${displayHours}:${formattedMins} ${period}`;
    } catch (_) {
      return teacherTime;
    }
  };

  // Drag handlers
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
      {/* Top Header & Day Selector Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-border/60 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-display font-bold text-foreground">
                Daily Timetable Schedule
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand/15 text-brand border border-brand/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {selectedDay === currentTodayName ? "Today's Schedule" : `${selectedDay} Schedule`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active sessions & assigned slots for {selectedDay}. ({assignedCountForDay} slots assigned today)
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teacher, student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>

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

        {/* Days of Week Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-border/50">
          {DAYS.map((day) => {
            const isToday = day === currentTodayName;
            const isSelected = day === selectedDay;
            const daySlotCount = TIME_SLOTS.filter((_, idx) => gridAssignments[`${day}-${idx}`]).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                    : 'bg-card/60 text-muted-foreground border-border hover:bg-card hover:text-foreground'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}>
                    Today
                  </span>
                )}
                {daySlotCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-brand/15 text-brand'
                  }`}>
                    {daySlotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Daily Timetable Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/60">
        {loadingData ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-brand animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading daily timetable sessions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider w-12 text-center border-r border-border">
                    #
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Teacher Time
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Student Time
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Assigned Teacher
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Assigned Student(s)
                  </th>
                  <th className="p-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Course / Subject
                  </th>
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
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="font-semibold text-sm">No schedule slots match your filter criteria for {selectedDay}.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSlots.map(({ timeSlotIndex, timeSlot, assignment }) => {
                    const isDragOver = dragOverIndex === timeSlotIndex;
                    const teacherIndex = teachers.findIndex((t) => t.id === assignment?.teacherId);
                    const colorClass = getTeacherColor(teacherIndex >= 0 ? teacherIndex : timeSlotIndex);

                    const assTeacherId = assignment
                      ? (typeof assignment.teacherId === 'object'
                          ? (assignment.teacherId as any)?._id || (assignment.teacherId as any)?.id
                          : assignment.teacherId) || assignment.teacher?.id
                      : null;

                    const mappedInfo = assTeacherId ? teacherCourseMap[assTeacherId] : null;

                    // Resolve real course title
                    const displayCourseTitle = assignment?.course?.title || mappedInfo?.courseTitle || (assignment ? 'Quran Session' : null);

                    // Resolve real enrolled students
                    const assignedStudentObj = assignment?.student;
                    const enrolledList = (assignment as any)?.enrolledStudents || mappedInfo?.enrolledStudents || [];

                    const displayStudentName = assignedStudentObj?.name
                      || (enrolledList.length > 0 ? enrolledList[timeSlotIndex % enrolledList.length]?.name : null);

                    return (
                      <tr
                        key={timeSlotIndex}
                        onDragOver={(e) => handleDragOver(e, timeSlotIndex)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, timeSlotIndex)}
                        className={`hover:bg-card/40 transition-colors ${
                          isDragOver ? 'bg-primary/20 ring-2 ring-primary ring-inset' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="p-3.5 text-center font-mono font-medium text-muted-foreground border-r border-border">
                          {timeSlotIndex + 1}
                        </td>

                        {/* Teacher Time */}
                        <td className="p-3.5 font-mono text-xs font-semibold text-foreground border-r border-border whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{timeSlot}</span>
                          </div>
                        </td>

                        {/* Student Time */}
                        <td className="p-3.5 font-mono text-xs font-bold text-brand border-r border-border whitespace-nowrap">
                          {formatStudentTime(timeSlot)}
                        </td>

                        {/* Teacher */}
                        <td className="p-3.5 border-r border-border">
                          {assignment ? (
                            <div
                              draggable={allowDragDrop}
                              onDragStart={(e) => handleDragStartFromSlot(e, assignment, timeSlotIndex)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                                allowDragDrop ? 'cursor-grab active:cursor-grabbing hover:scale-105 transition-all' : ''
                              } ${colorClass}`}
                            >
                              {allowDragDrop && <Move className="w-3 h-3 opacity-60" />}
                              <User className="w-3.5 h-3.5" />
                              <span>{assignment.teacher?.name || 'Assigned Teacher'}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 italic text-xs">
                              {allowDragDrop ? 'Drag teacher here to assign' : 'Unassigned'}
                            </span>
                          )}
                        </td>

                        {/* Student */}
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

                        {/* Course */}
                        <td className="p-3.5 border-r border-border">
                          {assignment && displayCourseTitle ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <BookOpen className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span>{displayCourseTitle}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 border-r border-border">
                          {assignment ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Regular Slot
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
                            {assignment && (role === 'TEACHER' || role === 'ADMIN') && onStartClass && (
                              <button
                                onClick={() => onStartClass(assignment.id || `slot-${timeSlotIndex}`)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                              >
                                <PlayCircle className="w-3.5 h-3.5" /> Start
                              </button>
                            )}

                            {assignment && role === 'STUDENT' && onJoinClass && (
                              <button
                                onClick={() => onJoinClass(assignment.id || `slot-${timeSlotIndex}`)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm"
                              >
                                <Video className="w-3.5 h-3.5" /> Join Class
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
        )}
      </div>
    </div>
  );
}
