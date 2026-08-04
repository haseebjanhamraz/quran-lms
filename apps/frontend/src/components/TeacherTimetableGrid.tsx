'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Loader2, BookOpen } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

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
}

const TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherTimetableGrid({ teacherId, teacherName }: TeacherTimetableGridProps) {
  const [gridAssignments, setGridAssignments] = useState<Record<string, SlotAssignment>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchSchedule = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/schedule/grid`);
      if (res.ok) {
        const data: SlotAssignment[] = await res.json();
        // Filter slots specifically for this teacher
        const teacherSlots = data.filter((s) => {
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
  }, [API_URL, teacherId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const calculateDailyClasses = (day: string) => {
    let count = 0;
    TIME_SLOTS.forEach((_, index) => {
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
              Weekly Timetable for {teacherName || 'Teacher'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">Assigned time slots across weekly schedule</p>
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
              {TIME_SLOTS.map((slot, timeIdx) => (
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
