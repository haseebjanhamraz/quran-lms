'use client';

import React, { useMemo } from 'react';
import { Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import { DAYS, TeacherItem, SlotAssignment, getTeacherColor, matchTeacherFilter } from './types';

interface WeeklyScheduleGridProps {
  timeSlots: string[];
  gridAssignments: Record<string, SlotAssignment>;
  teachers: TeacherItem[];
  activeFilter: string | null;
  loading?: boolean;
}

export default function WeeklyScheduleGrid({
  timeSlots,
  gridAssignments,
  teachers,
  activeFilter,
  loading = false,
}: WeeklyScheduleGridProps) {
  // Only include time slots that have at least one assigned class (removes empty schedule rows)
  const assignedSlotsList = useMemo(() => {
    const allIndices = new Set<number>();
    timeSlots.forEach((_, idx) => allIndices.add(idx));
    Object.values(gridAssignments).forEach((slot) => {
      if (typeof slot.timeSlotIndex === 'number') {
        allIndices.add(slot.timeSlotIndex);
      }
    });

    return Array.from(allIndices)
      .sort((a, b) => a - b)
      .filter((timeIdx) => {
        return DAYS.some((day) => {
          const slotData = gridAssignments[`${day}-${timeIdx}`];
          return matchTeacherFilter(slotData, activeFilter, teachers);
        });
      })
      .map((timeIdx) => ({ timeIdx }));
  }, [timeSlots, gridAssignments, activeFilter, teachers]);

  const calculateDailyClasses = (day: string) => {
    let count = 0;
    assignedSlotsList.forEach(({ timeIdx }) => {
      const slot = gridAssignments[`${day}-${timeIdx}`];
      if (slot && matchTeacherFilter(slot, activeFilter, teachers)) {
        count++;
      }
    });
    return count;
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-16 text-center border border-border/60 shadow-md space-y-4 animate-fadeIn">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <h4 className="font-semibold text-base text-foreground">Loading Master Schedule &amp; Timetable...</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Retrieving assigned weekly classes, teacher slots, and student timetable timings.
          </p>
        </div>
      </div>
    );
  }

  if (assignedSlotsList.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-border/60 shadow-md space-y-3 animate-fadeIn">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <h4 className="font-semibold text-base text-foreground">No Assigned Classes Found</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {activeFilter
            ? 'No schedule time slots match the selected teacher filter.'
            : 'There are currently no assigned class sessions scheduled across the weekly timetable.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[220px] w-56 border-r border-border">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>Assigned Time Slot</span>
                  </div>
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignedSlotsList.map(({ timeIdx }, rowIdx) => {
                const rowClasses = DAYS.map((day) => ({
                  day,
                  slotData: gridAssignments[`${day}-${timeIdx}`],
                })).filter(({ slotData }) => slotData && matchTeacherFilter(slotData, activeFilter, teachers));

                const rowTimings: Array<{
                  studentName: string;
                  studentTime: string;
                  teacherTime: string;
                  teacherName: string;
                }> = [];

                rowClasses.forEach(({ slotData }) => {
                  if (!slotData) return;
                  const teacherTime = slotData?.teacherStartTime || slotData?.startTime || '—';
                  const studentTime = slotData?.studentStartTime || slotData?.startTime || '—';
                  const teacherName = slotData?.teacher?.name || 'Unknown Teacher';

                  const names: string[] = [];
                  if (slotData.student?.name) names.push(slotData.student.name);
                  if (Array.isArray((slotData as any).students)) {
                    (slotData as any).students.forEach((st: any) => {
                      if (st?.name && !names.includes(st.name)) names.push(st.name);
                    });
                  }
                  if (Array.isArray(slotData.enrolledStudents)) {
                    slotData.enrolledStudents.forEach((st: any) => {
                      if (st?.name && !names.includes(st.name)) names.push(st.name);
                    });
                  }
                  if (names.length === 0) names.push('Student');

                  names.forEach((studentName) => {
                    const exists = rowTimings.some(
                      (item) =>
                        item.studentName === studentName &&
                        item.studentTime === studentTime &&
                        item.teacherTime === teacherTime
                    );
                    if (!exists) {
                      rowTimings.push({ studentName, studentTime, teacherTime, teacherName });
                    }
                  });
                });

                return (
                  <tr key={`row-${timeIdx}`} className="hover:bg-card/30 transition-colors">
                    {/* Time slot label - Displays student and teacher times for all classes on this row */}
                    <td className="p-3 text-xs text-foreground/80 border-r border-border bg-card/10 align-middle">
                      <div className="flex flex-col gap-1.5 min-w-[190px]">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">
                            #{rowIdx + 1}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 font-mono">
                          {rowTimings.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 bg-background/60 px-2 py-1 rounded-md border border-border/60 text-[11px] leading-tight"
                            >
                              <span className="font-semibold text-foreground truncate max-w-[105px]" title={t.studentName}>
                                {t.studentName}: <span className="font-bold text-brand">{t.studentTime}</span>
                              </span>
                              <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                                {t.teacherName}: <span className="font-bold text-foreground">{t.teacherTime}</span>
                              </span>
                            </div>
                          ))}
                          {rowTimings.length === 0 && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 7 Days columns */}
                    {DAYS.map((day) => {
                      const slotKey = `${day}-${timeIdx}`;
                      const slotData = gridAssignments[slotKey];
                      const isWeekend = day === 'Saturday' || day === 'Sunday';

                      const teacherIndex = teachers.findIndex(
                        (t) =>
                          t.id === slotData?.teacherId ||
                          (t as any)._id === slotData?.teacherId ||
                          t.name?.toLowerCase() === slotData?.teacher?.name?.toLowerCase(),
                      );
                      const isVisible = matchTeacherFilter(slotData, activeFilter, teachers);

                      // Collect all student names for this slot
                      const studentList: Array<{ name: string; email?: string }> = [];
                      if (slotData?.student?.name) {
                        studentList.push({ name: slotData.student.name, email: slotData.student.email });
                      }
                      if (Array.isArray((slotData as any)?.students)) {
                        (slotData as any).students.forEach((st: any) => {
                          if (st?.name && !studentList.some((e) => e.name === st.name)) {
                            studentList.push({ name: st.name, email: st.email });
                          }
                        });
                      }
                      if (Array.isArray(slotData?.enrolledStudents)) {
                        slotData.enrolledStudents.forEach((st: any) => {
                          if (st?.name && !studentList.some((e) => e.name === st.name)) {
                            studentList.push({ name: st.name, email: st.email });
                          }
                        });
                      }

                      const teacherDisplayTime = slotData?.teacherStartTime || slotData?.startTime || '—';
                      const studentDisplayTime = slotData?.studentStartTime || slotData?.startTime || '—';

                      return (
                        <td
                          key={slotKey}
                          className={`p-3 text-center border-r border-border last:border-0 transition-all ${
                            isWeekend && !slotData ? 'bg-card/20' : ''
                          }`}
                        >
                          {slotData && isVisible ? (
                            <div
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold border shadow-xs transition-all gap-1.5 ${getTeacherColor(
                                teacherIndex >= 0 ? teacherIndex : 0
                              )}`}
                            >
                              {/* Teacher name */}
                              <div className="flex items-center gap-1 leading-tight">
                                <User className="h-3 w-3 opacity-70 shrink-0" />
                                <span className="font-bold truncate max-w-[130px]">
                                  {slotData.teacher?.name || 'Instructor'}
                                </span>
                              </div>

                              {/* Teacher and Student Independent Times */}
                              <div className="w-full py-1 border-t border-b border-current/15 flex flex-col items-center gap-1 font-mono text-[10px]">
                                {studentList.length > 0 ? (
                                  studentList.map((st, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-center justify-center flex-wrap gap-x-1.5 gap-y-0.5 leading-tight text-center"
                                    >
                                      <span className="font-semibold opacity-95 text-foreground/90 truncate max-w-[120px]" title={st.name}>
                                        {st.name}: <span className="font-bold">{studentDisplayTime}</span>
                                      </span>
                                      <span className="font-semibold opacity-85">
                                        {slotData.teacher?.name || 'Instructor'}:{' '}
                                        <span className="font-bold">{teacherDisplayTime}</span>
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-center flex-wrap gap-x-1.5 gap-y-0.5 leading-tight text-center">
                                    <span className="font-semibold opacity-95">
                                      Student: <span className="font-bold">{studentDisplayTime}</span>
                                    </span>
                                    <span className="font-semibold opacity-85">
                                      {slotData.teacher?.name || 'Instructor'}:{' '}
                                      <span className="font-bold">{teacherDisplayTime}</span>
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Course Title */}
                              {slotData.course?.title ? (
                                <span
                                  className="text-[9px] font-normal opacity-75 truncate max-w-[125px] mt-0.5"
                                  title={slotData.course.title}
                                >
                                  {slotData.course.title}
                                </span>
                              ) : studentList.length === 0 ? (
                                <span className="text-[9px] font-normal opacity-60 italic">Open Roster</span>
                              ) : null}
                            </div>
                          ) : isWeekend ? (
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                              WEEKEND OFF
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Summary daily classes footer */}
              <tr className="bg-muted/30 border-t-2 border-border font-semibold">
                <td className="p-4 text-xs text-muted-foreground uppercase tracking-wider border-r border-border">
                  Daily Classes
                </td>
                {DAYS.map((day) => (
                  <td
                    key={`classes-${day}`}
                    className="p-4 text-center text-foreground font-mono border-r border-border last:border-0"
                  >
                    {calculateDailyClasses(day)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
