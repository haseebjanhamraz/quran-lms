'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Loader2, BookOpen } from 'lucide-react';
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
}: TeacherTimetableGridProps) {
  const { timeSlots: hookTimeSlots } = useTimeSlots();
  const timeSlots = customTimeSlots || hookTimeSlots || DEFAULT_TIME_SLOTS;
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchSchedule = useCallback(async () => {
    if (!teacherId && !selfView) return;
    setLoading(true);
    try {
      // If selfView, query scoped endpoint /schedule/grid/my for privacy and speed
      const endpoint = selfView ? `${API_URL}/schedule/grid/my` : `${API_URL}/schedule/grid`;
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data: SlotAssignment[] = await res.json();
        // Filter slots specifically for this teacher if not already scoped
        const teacherSlots = selfView
          ? data
          : data.filter((s) => {
              const tId = typeof s.teacherId === 'object' ? (s.teacherId as any)?._id || (s.teacherId as any)?.id : s.teacherId;
              return tId === teacherId || s.teacher?.id === teacherId;
            });

        const map: Record<string, SlotAssignment> = {};
        teacherSlots.forEach((slot) => {
          map[`${slot.dayOfWeek}-${slot.timeSlotIndex}`] = slot;
        });
        setGridAssignments(map);
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

  const calculateDailyClasses = (day: string) => {
    let count = 0;
    timeSlots.forEach((_, index) => {
      if (gridAssignments[`${day}-${index}`]) {
        count++;
      }
    });
    return count;
  };

  const totalWeeklySlots = Object.keys(gridAssignments).length;

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-brand" />
        <p className="text-xs text-muted-foreground">Loading teacher weekly timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Metric */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-border/60 shadow-sm bg-card/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Weekly Timetable Grid {teacherName ? `for ${teacherName}` : ''}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">Assigned recurring time slots across the week (Read-Only)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/15 text-brand border border-brand/25">
            {totalWeeklySlots} Weekly Slot{totalWeeklySlots !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Timetable Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="p-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider w-32 border-r border-border">
                  Time Slot
                </th>
                {DAYS.map((day) => (
                  <th key={day} className="p-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeSlots.map((slot, timeIdx) => (
                <tr key={slot} className="hover:bg-card/40 transition-colors">
                  <td className="p-2.5 font-mono text-[11px] text-foreground/80 border-r border-border whitespace-nowrap">
                    {slot}
                  </td>
                  {DAYS.map((day) => {
                    const slotKey = `${day}-${timeIdx}`;
                    const slotData = gridAssignments[slotKey];
                    const isWeekend = day === 'Saturday' || day === 'Sunday';

                    return (
                      <td key={slotKey} className={`p-2 text-center border-r border-border last:border-0 ${isWeekend && !slotData ? 'bg-card/20' : ''}`}>
                        {slotData ? (
                          <div className="inline-flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-brand/15 text-brand border border-brand/30 shadow-sm w-full">
                            <span className="truncate max-w-[90px]">{slotData.course?.title || 'Class Session'}</span>
                            <span className="text-[9px] font-medium opacity-80">{slotData.startTime}</span>
                          </div>
                        ) : isWeekend ? (
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">WEEKEND OFF</span>
                        ) : (
                          <span className="text-muted-foreground/25 text-xs">—</span>
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
                  <td key={`classes-${day}`} className="p-3 text-center text-foreground font-mono text-xs border-r border-border last:border-0">
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
