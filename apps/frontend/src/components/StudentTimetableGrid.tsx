'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, BookOpen, User,
  Video, Globe, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import {
  formatPKTTime,
  formatPKTDate,
} from '@/utils/islamabadTime';

interface StudentTimetableGridProps {
  studentId: string;
  studentName: string;
  classDays?: Array<{
    day: string;
    time?: string;
    studentTime?: string;
    teacherTime?: string;
  }>;
  classDuration?: number;
  assignedTeacher?: any;
  timezone?: string;
  tier?: string;
  totalClasses?: number;
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

const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return -1;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const raw = clean.replace(/[AP]M/, '').trim();
  const [hStr, mStr] = raw.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
};

const minutesToFormattedTime = (minutes: number): string => {
  const norm = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

const calculateEndTimeStr = (startTimeStr: string, duration: number = 30): string => {
  const mins = parseTimeToMinutes(startTimeStr);
  if (mins < 0) return '';
  return minutesToFormattedTime(mins + duration);
};

export default function StudentTimetableGrid({
  studentId,
  studentName,
  classDays = [],
  classDuration = 30,
  assignedTeacher,
  timezone = 'UTC',
  tier = 'Beginner',
  totalClasses,
}: StudentTimetableGridProps) {
  const [, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [gridSlots, setGridSlots] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const teacherName =
    assignedTeacher?.name ||
    (typeof assignedTeacher === 'string' ? assignedTeacher : 'Assigned Teacher');

  // Normalized Class Days map with student & teacher times
  const activeClassDaysMap = useMemo(() => {
    const map: Record<string, { day: string; studentTime: string; teacherTime: string; time: string }> = {};
    if (Array.isArray(classDays)) {
      classDays.forEach((slot: any) => {
        if (!slot || !slot.day) return;
        const full = SHORT_TO_FULL[slot.day] || slot.day;
        const studentTime = slot.studentTime || slot.time || slot.teacherTime || '';
        const teacherTime = slot.teacherTime || slot.time || slot.studentTime || '';
        const timeVal = slot.time || studentTime || teacherTime || '';
        map[full] = {
          day: full,
          studentTime,
          teacherTime,
          time: timeVal,
        };
      });
    }
    return map;
  }, [classDays]);

  // Fetch schedule grid and class sessions for this student
  const fetchStudentSchedule = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const targetId = studentId.toString();

      // 1. Fetch grid slots
      const gridRes = await apiFetch(`${API_URL}/schedule/grid`);
      if (gridRes.ok) {
        const data = await gridRes.json();
        const studentGrid = Array.isArray(data)
          ? data.filter((s: any) => {
              const sId = typeof s.studentId === 'object' ? s.studentId?._id || s.studentId?.id : s.studentId;
              const sObjId = s.student?._id || s.student?.id;
              const sIdStr = sId?.toString();
              const sObjIdStr = sObjId?.toString();

              if (sIdStr === targetId || sObjIdStr === targetId) return true;

              if (Array.isArray(s.enrolledStudents)) {
                return s.enrolledStudents.some((st: any) => {
                  const eId = (st?._id || st?.id)?.toString();
                  return eId === targetId;
                });
              }
              return false;
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
              const stIdStr = stId?.toString();
              const stObjIdStr = stObjId?.toString();
              if (stIdStr === targetId || stObjIdStr === targetId) return true;
              if (Array.isArray(cs.students)) {
                return cs.students.some((st: any) => (st?._id || st?.id)?.toString() === targetId);
              }
              return false;
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

  const totalDays = Object.keys(activeClassDaysMap).length;
  const totalClassesCount =
    totalClasses !== undefined
      ? totalClasses
      : sessions.length > 0
      ? sessions.length
      : totalDays > 0
      ? totalDays * 4
      : 0;

  // Build matrix rows for assigned class timings (removes empty schedule rows)
  const matrixRows = useMemo(() => {
    const rows: Array<{
      timeLabel: string;
      dayDataMap: Record<
        string,
        {
          occupied: boolean;
          studentTime: string;
          teacherTime: string;
          teacherName: string;
          courseTitle: string;
        }
      >;
    }> = [];

    // 1. From activeClassDaysMap
    Object.values(activeClassDaysMap).forEach((dayInfo) => {
      const sTime = dayInfo.studentTime || dayInfo.time;
      const tTime = dayInfo.teacherTime || dayInfo.time;
      const label = `${sTime} - ${calculateEndTimeStr(sTime, classDuration)}`;

      let existingRow = rows.find((r) => r.timeLabel === label);
      if (!existingRow) {
        existingRow = {
          timeLabel: label,
          dayDataMap: {},
        };
        rows.push(existingRow);
      }

      existingRow.dayDataMap[dayInfo.day] = {
        occupied: true,
        studentTime: sTime,
        teacherTime: tTime,
        teacherName,
        courseTitle: `${tier} Level`,
      };
    });

    // 2. Merge from gridSlots if available
    gridSlots.forEach((gs) => {
      const sTime = gs.studentStartTime || gs.startTime;
      const tTime = gs.teacherStartTime || gs.startTime;
      const label = `${sTime} - ${gs.endTime || calculateEndTimeStr(sTime, gs.durationMinutes || classDuration)}`;

      let existingRow = rows.find((r) => r.timeLabel === label);
      if (!existingRow) {
        existingRow = {
          timeLabel: label,
          dayDataMap: {},
        };
        rows.push(existingRow);
      }

      existingRow.dayDataMap[gs.dayOfWeek] = {
        occupied: true,
        studentTime: sTime,
        teacherTime: tTime,
        teacherName: gs.teacher?.name || teacherName,
        courseTitle: gs.course?.title || `${tier} Level`,
      };
    });

    return rows;
  }, [activeClassDaysMap, gridSlots, teacherName, tier, classDuration]);

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
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="text-xl font-bold font-mono text-purple-500">{totalClassesCount}</p>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Classes</p>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Day-by-Day Schedule Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand" />
          <span>Weekly Class Days &amp; Assigned Timings</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {FULL_DAYS.map((day) => {
            const dayInfo = activeClassDaysMap[day];
            const hasClass = Boolean(dayInfo);
            const studentStartTime = dayInfo?.studentTime || dayInfo?.time || '';
            const teacherStartTime = dayInfo?.teacherTime || dayInfo?.time || '';
            const endTime = hasClass ? calculateEndTimeStr(studentStartTime, classDuration) : '';

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
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">Student:</p>
                          <p className="font-mono text-xs font-bold text-brand">{studentStartTime}</p>
                        </div>
                        {teacherStartTime && (
                          <div>
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase">Teacher:</p>
                            <p className="font-mono text-xs font-semibold text-foreground">{teacherStartTime}</p>
                          </div>
                        )}
                        <p className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                          {classDuration} mins (to {endTime})
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
                    <span> • {tier}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Recurring Timetable Grid Matrix */}
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

        {matrixRows.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border border-border/60 shadow-md space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <h5 className="font-bold text-sm text-foreground">No Recurring Classes Scheduled</h5>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              This student does not currently have any active class days assigned. Edit the schedule in the student profile or admission wizard to set class timings.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="p-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider w-40 border-r border-border">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand" />
                        <span>Class Time Slot</span>
                      </div>
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
                  {matrixRows.map(({ timeLabel, dayDataMap }, rowIdx) => (
                    <tr key={timeLabel} className="hover:bg-card/40 transition-colors">
                      <td className="p-3 font-mono text-xs text-foreground/80 border-r border-border whitespace-nowrap bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-bold">#{rowIdx + 1}</span>
                          <span>{timeLabel}</span>
                        </div>
                      </td>
                      {FULL_DAYS.map((day) => {
                        const cellData = dayDataMap[day];
                        const isOccupied = Boolean(cellData?.occupied);
                        const isWeekend = day === 'Saturday' || day === 'Sunday';

                        return (
                          <td
                            key={`${day}-${timeLabel}`}
                            className={`p-2.5 text-center border-r border-border last:border-0 transition-colors ${
                              isOccupied
                                ? 'bg-brand/10'
                                : isWeekend
                                ? 'bg-card/10'
                                : ''
                            }`}
                          >
                            {isOccupied && cellData ? (
                              <div className="inline-flex flex-col items-center justify-center p-2.5 rounded-xl text-[11px] font-bold bg-brand/20 text-brand border border-brand/40 shadow-sm w-full animate-fadeIn gap-1">
                                <span className="truncate max-w-[120px] font-bold text-foreground">
                                  {cellData.courseTitle}
                                </span>
                                <div className="w-full py-1 border-t border-b border-current/15 flex flex-col items-center gap-0.5 font-mono text-[10px]">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-sans opacity-70 font-semibold">Student:</span>
                                    <span className="font-bold">{cellData.studentTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-sans opacity-70 font-semibold">Teacher:</span>
                                    <span className="font-bold">{cellData.teacherTime}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[120px]">
                                  {cellData.teacherName}
                                </span>
                              </div>
                            ) : isWeekend ? (
                              <span className="text-[9px] font-bold text-muted-foreground/30 uppercase">OFF</span>
                            ) : (
                              <span className="text-muted-foreground/20 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                          {formatPKTDate(session.scheduledAt)} at{' '}
                          <span className="font-mono text-foreground font-semibold">
                            {formatPKTTime(session.scheduledAt)} PKT
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
                          className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-md transition-all cursor-pointer"
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
