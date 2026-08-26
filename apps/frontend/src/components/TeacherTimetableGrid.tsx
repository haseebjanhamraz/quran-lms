'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Clock, Loader2, BookOpen, User, Video,
  Globe, CheckCircle2, ArrowUpRight, Sparkles, Users
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTimeSlots, DEFAULT_TIME_SLOTS } from '@/hooks/useTimeSlots';

interface SlotAssignment {
  id?: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacher?: { id: string; name: string; email?: string };
  course?: { id: string; title: string; type: string };
  student?: { id: string; name: string };
}

interface TeacherTimetableGridProps {
  teacherId: string;
  teacherName?: string;
  readOnly?: boolean;
  selfView?: boolean;
  timeSlots?: string[];
  timezone?: string;
  specialization?: string;
  coursesCount?: number;
  studentsCount?: number;
}

export { DEFAULT_TIME_SLOTS };
export const TIME_SLOTS = DEFAULT_TIME_SLOTS;

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherTimetableGrid({
  teacherId,
  teacherName,
  readOnly = true,
  selfView = false,
  timeSlots: customTimeSlots,
  timezone = 'UTC',
  specialization = 'Tajweed & Quranic Studies',
  coursesCount = 0,
  studentsCount = 0,
}: TeacherTimetableGridProps) {
  const { timeSlots: hookTimeSlots } = useTimeSlots();
  const timeSlots = customTimeSlots || hookTimeSlots || DEFAULT_TIME_SLOTS;
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchSchedule = useCallback(async () => {
    if (!teacherId && !selfView) return;
    setLoading(true);
    try {
      // 1. Fetch grid slots
      const endpoint = selfView ? `${API_URL}/schedule/grid/my` : `${API_URL}/schedule/grid`;
      const [res, sessRes] = await Promise.all([
        apiFetch(endpoint).catch(() => null),
        apiFetch(`${API_URL}/class-sessions`).catch(() => null),
      ]);

      if (res && res.ok) {
        const data: SlotAssignment[] = await res.json();
        const teacherSlots = selfView
          ? data
          : data.filter((s) => {
              const tId = typeof s.teacherId === 'object' ? (s.teacherId as any)?._id || (s.teacherId as any)?.id : s.teacherId;
              return tId === teacherId || s.teacher?.id === teacherId || (s.teacher as any)?._id === teacherId;
            });

        const map: Record<string, SlotAssignment> = {};
        teacherSlots.forEach((slot) => {
          map[`${slot.dayOfWeek}-${slot.timeSlotIndex}`] = slot;
        });
        setGridAssignments(map);
      }

      // 2. Fetch live & upcoming sessions for this teacher
      if (sessRes && sessRes.ok) {
        const sData = await sessRes.json();
        const teacherSessions = Array.isArray(sData)
          ? sData.filter((cs: any) => {
              const tId = typeof cs.teacherId === 'object' ? cs.teacherId?._id || cs.teacherId?.id : cs.teacherId;
              const tObjId = cs.teacher?._id || cs.teacher?.id;
              return tId === teacherId || tObjId === teacherId;
            })
          : [];
        setSessions(teacherSessions);
      }
    } catch (err) {
      console.error('Failed to load teacher schedule grid:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, teacherId, selfView]);

  useWebSocket({
    eventFilter: 'schedule_update',
    onMessage: () => {
      fetchSchedule();
    },
  });

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const dailyClassesCount = useMemo(() => {
    const map: Record<string, number> = {};
    DAYS.forEach((day) => {
      let count = 0;
      timeSlots.forEach((_, index) => {
        if (gridAssignments[`${day}-${index}`]) {
          count++;
        }
      });
      map[day] = count;
    });
    return map;
  }, [gridAssignments, timeSlots]);

  const totalWeeklySlots = Object.keys(gridAssignments).length;

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-brand" />
        <p className="text-xs text-muted-foreground">Loading teacher weekly timetable &amp; schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Schedule Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">{totalWeeklySlots} Active Slots</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Weekly Schedule</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-blue-500">{studentsCount || Object.keys(gridAssignments).length} Students</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Enrolled Roster</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="text-sm font-bold text-foreground truncate">{specialization}</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Teaching Focus</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Globe className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold font-mono text-foreground truncate">{timezone}</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Timezone Region</p>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Day-by-Day Schedule Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" />
          <span>Weekly Day-by-Day Load &amp; Timetable</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {DAYS.map((day) => {
            const count = dailyClassesCount[day] || 0;
            const hasClasses = count > 0;
            const isWeekend = day === 'Saturday' || day === 'Sunday';

            return (
              <div
                key={day}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  hasClasses
                    ? 'bg-gradient-to-b from-brand/10 via-card to-card border-brand/40 shadow-sm shadow-brand/5'
                    : 'bg-card/40 border-border/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-xs font-bold text-foreground">{day.slice(0, 3)}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        hasClasses
                          ? 'bg-brand/20 text-brand border border-brand/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {hasClasses ? `${count} SLOT${count !== 1 ? 'S' : ''}` : isWeekend ? 'OFF' : 'FREE'}
                    </span>
                  </div>

                  <div className="py-3">
                    {hasClasses ? (
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-bold text-brand">
                          {count} Class{count !== 1 ? 'es' : ''}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Scheduled Today
                        </p>
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <span className="text-xs text-muted-foreground/50 font-medium">
                          {isWeekend ? 'Weekend Off' : 'No Classes'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">{day}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Timetable Matrix Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand" />
            <span>Recurring Timetable Grid Matrix {teacherName ? `(${teacherName})` : ''}</span>
          </h4>
          <span className="text-xs text-muted-foreground">
            {totalWeeklySlots} Active Weekly Recurring Slots
          </span>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="p-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider w-32 border-r border-border">
                    Time Slot
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="p-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timeSlots.map((slot, timeIdx) => (
                  <tr key={slot} className="hover:bg-card/40 transition-colors">
                    <td className="p-2.5 font-mono text-[11px] text-foreground/80 border-r border-border whitespace-nowrap bg-muted/20">
                      {slot}
                    </td>
                    {DAYS.map((day) => {
                      const slotKey = `${day}-${timeIdx}`;
                      const slotData = gridAssignments[slotKey];
                      const isWeekend = day === 'Saturday' || day === 'Sunday';

                      return (
                        <td
                          key={slotKey}
                          className={`p-2 text-center border-r border-border last:border-0 ${
                            slotData
                              ? 'bg-brand/10'
                              : isWeekend
                              ? 'bg-card/10'
                              : ''
                          }`}
                        >
                          {slotData ? (
                            <div className="inline-flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold bg-brand/20 text-brand border border-brand/40 shadow-sm w-full animate-fadeIn">
                              <span className="truncate max-w-[110px] font-bold text-foreground">
                                {slotData.course?.title || 'Quranic Session'}
                              </span>
                              <span className="text-[10px] font-mono text-brand font-semibold">
                                {slotData.startTime} - {slotData.endTime}
                              </span>
                              {slotData.student && (
                                <span className="text-[9px] text-muted-foreground font-normal truncate max-w-[110px]">
                                  Student: {slotData.student.name}
                                </span>
                              )}
                            </div>
                          ) : isWeekend ? (
                            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase">WEEKEND OFF</span>
                          ) : (
                            <span className="text-muted-foreground/20 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-muted/40 border-t-2 border-border font-semibold">
                  <td className="p-3 text-[11px] text-muted-foreground uppercase tracking-wider border-r border-border">
                    Daily Classes
                  </td>
                  {DAYS.map((day) => (
                    <td
                      key={`classes-${day}`}
                      className="p-3 text-center text-foreground font-mono text-xs border-r border-border last:border-0"
                    >
                      {dailyClassesCount[day] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Upcoming & Live Class Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-500" />
              <span>Upcoming &amp; Live Class Sessions ({sessions.length})</span>
            </h4>
          </div>

          <div className="glass-panel rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {sessions.slice(0, 5).map((session, sIdx) => {
                const isLive = session.status === 'LIVE';
                const isCompleted = session.status === 'COMPLETED';
                const scheduledDate = new Date(session.scheduledAt);

                return (
                  <div
                    key={session._id || session.id || sIdx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isLive
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 animate-pulse'
                            : isCompleted
                            ? 'bg-muted text-muted-foreground border-border'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}
                      >
                        <Video className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground">
                            {session.course?.title || 'Quran & Tajweed Session'}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isLive
                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                : isCompleted
                                ? 'bg-muted text-muted-foreground border-border'
                                : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {scheduledDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                          <span className="font-mono text-foreground font-semibold">
                            {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>{' '}
                          ({session.durationMinutes || 60} mins)
                          {session.student?.name && ` • Student: ${session.student.name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isLive && (
                        <a
                          href={`/classroom/${teacherId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-md transition-all"
                        >
                          <span>Join Classroom</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
