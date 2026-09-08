'use client';

import React, { useMemo } from 'react';
import { Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import { DAYS, TeacherItem, SlotAssignment, getTeacherColor } from './types';

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
    return timeSlots
      .map((slot, timeIdx) => ({ slot, timeIdx }))
      .filter(({ timeIdx }) => {
        return DAYS.some((day) => {
          const slotData = gridAssignments[`${day}-${timeIdx}`];
          if (!slotData) return false;
          if (activeFilter) {
            return (
              activeFilter === slotData.teacherId ||
              activeFilter === (slotData.teacher as any)?.id ||
              activeFilter === slotData.teacher?.name
            );
          }
          return true;
        });
      });
  }, [timeSlots, gridAssignments, activeFilter]);

  const calculateDailyClasses = (day: string) => {
    let count = 0;
    timeSlots.forEach((_, index) => {
      const slot = gridAssignments[`${day}-${index}`];
      if (slot && (!activeFilter || activeFilter === slot.teacherId || activeFilter === slot.teacher?.name)) {
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
                <th className="p-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider w-48 border-r border-border">
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
              {assignedSlotsList.map(({ slot, timeIdx }, rowIdx) => (
                <tr key={`${slot}-${timeIdx}`} className="hover:bg-card/30 transition-colors">
                  {/* Time slot label */}
                  <td className="p-3 font-mono text-xs text-foreground/80 border-r border-border whitespace-nowrap bg-card/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-bold">#{rowIdx + 1}</span>
                      <span>{slot}</span>
                    </div>
                  </td>

                  {/* 7 Days columns */}
                  {DAYS.map((day) => {
                    const slotKey = `${day}-${timeIdx}`;
                    const slotData = gridAssignments[slotKey];
                    const isWeekend = day === 'Saturday' || day === 'Sunday';

                    const teacherIndex = teachers.findIndex((t) => t.id === slotData?.teacherId);
                    const isVisible =
                      !activeFilter || activeFilter === slotData?.teacherId || activeFilter === slotData?.teacher?.name;

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

                    const teacherDisplayTime = slotData?.teacherStartTime || slotData?.startTime;
                    const studentDisplayTime = slotData?.studentStartTime || slotData?.startTime;

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
                            <div className="w-full py-1 border-t border-b border-current/15 flex flex-col items-center gap-0.5 font-mono text-[10px]">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-sans opacity-75 font-semibold">Teacher:</span>
                                <span className="font-bold">{teacherDisplayTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-sans opacity-75 font-semibold">Student:</span>
                                <span className="font-bold">{studentDisplayTime}</span>
                              </div>
                            </div>

                            {/* Enrolled Students Real Names */}
                            {studentList.length > 0 ? (
                              <div className="w-full flex flex-col items-center gap-0.5">
                                {studentList.map((st, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[11px] font-semibold opacity-95 truncate max-w-[130px] leading-tight"
                                  >
                                    {st.name}
                                  </span>
                                ))}
                                {slotData.course?.title && (
                                  <span className="text-[9px] font-normal opacity-75 truncate max-w-[120px] mt-0.5">
                                    {slotData.course.title}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] font-normal opacity-60 italic">Open Roster</span>
                            )}
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
              ))}

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
