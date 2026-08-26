'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, BookOpen, User, CheckCircle2,
  Video, Globe, Loader2, Sparkles, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useTimeSlots, DEFAULT_TIME_SLOTS } from '@/hooks/useTimeSlots';

interface StudentTimetableGridProps {
  studentId: string;
  studentName: string;
  classDays?: Array<{ day: string; time: string }>;
  classDuration?: number;
  assignedTeacher?: any;
  timezone?: string;
  tier?: string;
}

const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_TO_FULL: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export default function StudentTimetableGrid({
  studentId,
  studentName,
  classDays = [],
  classDuration = 60,
  assignedTeacher,
  timezone = 'UTC',
  tier = 'Beginner',
}: StudentTimetableGridProps) {
  const { timeSlots: hookTimeSlots } = useTimeSlots();
  const timeSlots = hookTimeSlots || DEFAULT_TIME_SLOTS;

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [gridSlots, setGridSlots] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const teacherName = assignedTeacher?.name || (typeof assignedTeacher === 'string' ? assignedTeacher : 'Assigned Teacher');

  // Normalized Class Days map
  const activeClassDaysMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(classDays)) {
      classDays.forEach((slot) => {
        const full = SHORT_TO_FULL[slot.day] || slot.day;
        map[full] = slot.time;
      });
    }
    return map;
  }, [classDays]);

  // Fetch schedule grid and sessions for this student
  const fetchStudentSchedule = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // 1. Fetch grid slots
      const gridRes = await apiFetch(`${API_URL}/schedule/grid`);
      if (gridRes.ok) {
        const data = await gridRes.json();
        const studentGrid = Array.isArray(data)
          ? data.filter((s: any) => {
              const sId = typeof s.studentId === 'object' ? s.studentId?._id || s.studentId?.id : s.studentId;
              const sObjId = s.student?._id || s.student?.id;
              return sId === studentId || sObjId === studentId;
            })
          : [];
        setGridSlots(studentGrid);
      }

      // 2. Fetch class sessions for this student
      const sessRes = await apiFetch(`${API_URL}/class-sessions`);
      if (sessRes.ok) {
        const sData = await sessRes.json();
        const studentSessions = Array.isArray(sData)
          ? sData.filter((cs: any) => {
              const stId = typeof cs.studentId === 'object' ? cs.studentId?._id || cs.studentId?.id : cs.studentId;
              const stObjId = cs.student?._id || cs.student?.id;
              return stId === studentId || stObjId === studentId;
            })
          : [];
        setSessions(studentSessions);
      }
    } catch (err) {
      console.error('Error fetching student schedule details:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, studentId]);

  useEffect(() => {
    fetchStudentSchedule();
  }, [fetchStudentSchedule]);

  // Calculate end time
  const getEndTime = (startTime: string, duration: number) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalM = h * 60 + m + duration;
    const endH = Math.floor(totalM / 60) % 24;
    const endM = totalM % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const totalDays = Object.keys(activeClassDaysMap).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Schedule Metrics & Teacher Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5">
          <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">{totalDays} Days / Wk</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Weekly Frequency</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-blue-500">{classDuration} Minutes</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Session Duration</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <User className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="text-sm font-bold text-foreground truncate">{teacherName}</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Assigned Teacher</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-border/60 bg-card/60 flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Globe className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold font-mono text-foreground truncate">{timezone}</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Timezone Region</p>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Day-by-Day Schedule Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" />
          <span>Weekly Class Days & Assigned Timings</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {FULL_DAYS.map((day) => {
            const hasClass = Boolean(activeClassDaysMap[day]);
            const startTime = activeClassDaysMap[day] || '';
            const endTime = hasClass ? getEndTime(startTime, classDuration) : '';

            return (
              <div
                key={day}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  hasClass
                    ? 'bg-gradient-to-b from-brand/10 via-card to-card border-brand/40 shadow-sm shadow-brand/5'
                    : 'bg-card/40 border-border/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-xs font-bold text-foreground">{day.slice(0, 3)}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        hasClass
                          ? 'bg-brand/20 text-brand border border-brand/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {hasClass ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>

                  <div className="py-3">
                    {hasClass ? (
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-bold text-brand">
                          {startTime}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          to {endTime}
                        </p>
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <span className="text-xs text-muted-foreground/50 font-medium">No Class</span>
                      </div>
                    )}
                  </div>
                </div>

                {hasClass && (
                  <div className="pt-2 border-t border-border/30 text-[10px] text-muted-foreground truncate">
                    <span className="font-medium text-foreground">{teacherName.split(' ')[0]}</span>
                    <span> • {classDuration}m</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Full Timetable Matrix (Hour Slots x Days) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand" />
            <span>Recurring Timetable Grid Matrix</span>
          </h4>
          <span className="text-xs text-muted-foreground">
            {studentName}&apos;s Weekly Schedule
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
                  {FULL_DAYS.map((day) => (
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
                {timeSlots.map((slot, timeIdx) => {
                  const slotStartHour = slot.split(' - ')[0]?.trim() || slot;
                  const slotHourNum = parseInt(slotStartHour.split(':')[0], 10);

                  return (
                    <tr key={slot} className="hover:bg-card/40 transition-colors">
                      <td className="p-2.5 font-mono text-[11px] text-foreground/80 border-r border-border whitespace-nowrap bg-muted/20">
                        {slot}
                      </td>
                      {FULL_DAYS.map((day) => {
                        const dayStartTime = activeClassDaysMap[day];
                        const isScheduledThisDay = Boolean(dayStartTime);

                        let matchesSlot = false;
                        if (isScheduledThisDay && dayStartTime) {
                          const classHourNum = parseInt(dayStartTime.split(':')[0], 10);
                          matchesSlot = classHourNum === slotHourNum || timeIdx === (classHourNum - 8);
                        }

                        // Also check matching grid slot if populated
                        const matchingGridSlot = gridSlots.find(
                          (gs) => gs.dayOfWeek === day && (gs.timeSlotIndex === timeIdx || gs.startTime === dayStartTime)
                        );

                        const isOccupied = matchesSlot || Boolean(matchingGridSlot);

                        return (
                          <td
                            key={`${day}-${timeIdx}`}
                            className={`p-2 text-center border-r border-border last:border-0 transition-colors ${
                              isOccupied
                                ? 'bg-brand/10'
                                : day === 'Saturday' || day === 'Sunday'
                                ? 'bg-card/10'
                                : ''
                            }`}
                          >
                            {isOccupied ? (
                              <div className="inline-flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold bg-brand/20 text-brand border border-brand/40 shadow-sm w-full animate-fadeIn">
                                <span className="truncate max-w-[110px] font-bold text-foreground">
                                  {matchingGridSlot?.course?.title || `${tier} Level`}
                                </span>
                                <span className="text-[10px] font-mono text-brand font-semibold">
                                  {dayStartTime || matchingGridSlot?.startTime || slotStartHour} ({classDuration}m)
                                </span>
                                <span className="text-[9px] text-muted-foreground font-normal truncate max-w-[110px]">
                                  {teacherName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/20 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
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
                          ({session.durationMinutes || classDuration} mins)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isLive && (
                        <a
                          href={`/classroom/${studentId}`}
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
