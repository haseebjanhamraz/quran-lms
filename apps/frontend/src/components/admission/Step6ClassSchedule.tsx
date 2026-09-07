'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, User, AlertTriangle, CheckCircle2,
  XCircle, Sparkles, Check, ArrowRight, ShieldAlert, GraduationCap
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { EnrollmentStatusState, ClassDaySchedule, TeacherUser, WEEKDAYS } from './types';

interface Step6ClassScheduleProps {
  enrollmentStatus: EnrollmentStatusState;
  setEnrollmentStatus: React.Dispatch<React.SetStateAction<EnrollmentStatusState>>;
  selectedTeacherId: string;
  teachers: TeacherUser[];
  onToggleDay: (dayKey: string) => void;
  onUpdateDayStudentTime: (dayKey: string, newTime: string) => void;
  onUpdateDayTeacherTime: (dayKey: string, newTime: string) => void;
  bulkStudentTime: string;
  setBulkStudentTime: (t: string) => void;
  bulkTeacherTime: string;
  setBulkTeacherTime: (t: string) => void;
  onApplyBulkStudentTime: () => void;
  onApplyBulkTeacherTime: () => void;
  onConflictsChange?: (hasConflict: boolean) => void;
}

interface TeacherSlot {
  id?: string;
  dayOfWeek: string;
  timeSlotIndex: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacher?: { id: string; name: string };
  course?: { id: string; title: string };
  student?: { id: string; name: string };
}

const normalizeDay = (day: string) => {
  const d = (day || '').toLowerCase();
  if (d.startsWith('mon')) return 'Mon';
  if (d.startsWith('tue')) return 'Tue';
  if (d.startsWith('wed')) return 'Wed';
  if (d.startsWith('thu')) return 'Thu';
  if (d.startsWith('fri')) return 'Fri';
  if (d.startsWith('sat')) return 'Sat';
  if (d.startsWith('sun')) return 'Sun';
  return day;
};

// Convert any time string (12h AM/PM or 24h) to { hour: string, minute: string, period: 'AM'|'PM' }
function parse12Hour(raw: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  if (!raw) return { hour: '04', minute: '00', period: 'PM' };
  const trimmed = raw.trim();

  // If already contains AM or PM
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    const h = String(parseInt(match12[1], 10)).padStart(2, '0');
    const m = match12[2];
    const p = match12[3].toUpperCase() as 'AM' | 'PM';
    return { hour: h, minute: m, period: p };
  }

  // If in 24h format "HH:MM"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = match24[2];
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { hour: String(h).padStart(2, '0'), minute: m, period };
  }

  return { hour: '04', minute: '00', period: 'PM' };
}

// Convert 12h or 24h time to total minutes from midnight for interval math
function timeToMinutes(raw: string): number {
  const { hour, minute, period } = parse12Hour(raw);
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

// Reusable 12-Hour AM/PM Time Picker Component
function TimePicker12Hour({
  value,
  onChange,
  label,
  accentColor = 'primary',
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  accentColor?: 'primary' | 'amber' | 'emerald';
}) {
  const parsed = parse12Hour(value);

  const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutes = ['00', '15', '30', '45'];

  const update = (h: string, m: string, p: 'AM' | 'PM') => {
    onChange(`${h}:${m} ${p}`);
  };

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
        {label}
      </span>
      <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 shadow-xs">
        {/* Hour Select */}
        <select
          value={parsed.hour}
          onChange={(e) => update(e.target.value, parsed.minute, parsed.period)}
          className="bg-transparent text-xs font-mono font-bold text-foreground py-1 px-1.5 rounded-lg outline-none cursor-pointer hover:bg-muted"
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground font-bold text-xs">:</span>

        {/* Minute Select */}
        <select
          value={parsed.minute}
          onChange={(e) => update(parsed.hour, e.target.value, parsed.period)}
          className="bg-transparent text-xs font-mono font-bold text-foreground py-1 px-1.5 rounded-lg outline-none cursor-pointer hover:bg-muted"
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* AM/PM Toggle */}
        <div className="flex items-center ml-auto bg-muted/60 rounded-lg p-0.5 border border-border/50">
          <button
            type="button"
            onClick={() => update(parsed.hour, parsed.minute, 'AM')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              parsed.period === 'AM'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => update(parsed.hour, parsed.minute, 'PM')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              parsed.period === 'PM'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step6ClassSchedule({
  enrollmentStatus,
  setEnrollmentStatus,
  selectedTeacherId,
  teachers,
  onToggleDay,
  onUpdateDayStudentTime,
  onUpdateDayTeacherTime,
  bulkStudentTime,
  setBulkStudentTime,
  bulkTeacherTime,
  setBulkTeacherTime,
  onApplyBulkStudentTime,
  onApplyBulkTeacherTime,
  onConflictsChange,
}: Step6ClassScheduleProps) {
  const [teacherSlots, setTeacherSlots] = useState<TeacherSlot[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Find selected teacher
  const assignedTeacher = useMemo(() => {
    return teachers.find((t) => (t._id || t.id) === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  // Fetch teacher's current weekly slots
  useEffect(() => {
    if (!selectedTeacherId) {
      setTeacherSlots([]);
      return;
    }

    const fetchTeacherSlots = async () => {
      setLoadingSchedule(true);
      try {
        const res = await apiFetch(`${API_URL}/schedule/grid`);
        if (res.ok) {
          const allSlots: TeacherSlot[] = await res.json();
          // Filter slots for this teacher
          const teacherOnly = allSlots.filter((s) => {
            const tId = s.teacherId || s.teacher?.id;
            return tId === selectedTeacherId;
          });
          setTeacherSlots(teacherOnly);
        }
      } catch (err) {
        console.error('Failed to load teacher schedule:', err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchTeacherSlots();
  }, [selectedTeacherId, API_URL]);

  // Group booked slots by day
  const slotsByDay = useMemo(() => {
    const map: Record<string, TeacherSlot[]> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };
    teacherSlots.forEach((slot) => {
      const norm = normalizeDay(slot.dayOfWeek);
      if (map[norm]) map[norm].push(slot);
    });
    return map;
  }, [teacherSlots]);

  // Check conflicts with teacher time
  const conflicts = useMemo(() => {
    const list: Array<{ day: string; teacherTime: string; conflictingSlot: TeacherSlot }> = [];
    if (!enrollmentStatus.classDays || enrollmentStatus.classDays.length === 0 || !selectedTeacherId) {
      return list;
    }

    enrollmentStatus.classDays.forEach((stSlot) => {
      const dayKey = normalizeDay(stSlot.day);
      const bookedOnDay = slotsByDay[dayKey] || [];
      const teacherStartMins = timeToMinutes(stSlot.teacherTime || '04:00 PM');
      const teacherEndMins = teacherStartMins + (enrollmentStatus.classDuration || 30);

      bookedOnDay.forEach((bSlot) => {
        const bookedStartMins = timeToMinutes(bSlot.startTime || '00:00');
        const bookedEndMins = timeToMinutes(bSlot.endTime || '00:00');

        const isOverlap =
          (teacherStartMins >= bookedStartMins && teacherStartMins < bookedEndMins) ||
          (teacherEndMins > bookedStartMins && teacherEndMins <= bookedEndMins) ||
          (teacherStartMins <= bookedStartMins && teacherEndMins >= bookedEndMins);

        if (isOverlap) {
          list.push({
            day: dayKey,
            teacherTime: stSlot.teacherTime,
            conflictingSlot: bSlot,
          });
        }
      });
    });

    return list;
  }, [enrollmentStatus.classDays, enrollmentStatus.classDuration, slotsByDay, selectedTeacherId]);

  // Notify parent component whenever conflicts status changes
  useEffect(() => {
    onConflictsChange?.(conflicts.length > 0);
  }, [conflicts, onConflictsChange]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-3">
        <div className="p-2.5 rounded-2xl bg-brand/15 text-brand border border-brand/20">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 6: Class Schedule &amp; Weekday Timings
          </h3>
          <p className="text-xs text-muted-foreground">
            Assign class weekdays and configure independent Student and Teacher class timings (AM/PM).
          </p>
        </div>
      </div>

      {/* Teacher Assignment Badge / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-muted/40 border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
            {assignedTeacher?.name?.charAt(0) || <User className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {assignedTeacher ? assignedTeacher.name : 'No Teacher Assigned Yet (Assigned Later)'}
              </span>
              {assignedTeacher?.specialization && (
                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-md font-semibold border border-brand/20">
                  {assignedTeacher.specialization}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Class session duration: <strong>{enrollmentStatus.classDuration} Minutes</strong> • {enrollmentStatus.classDays.length} Days / Week
            </p>
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Strict Conflict: {conflicts.length} Overlapping Slot{conflicts.length !== 1 ? 's' : ''}</div>
              <div className="text-[11px] font-normal text-destructive/90 mt-0.5">
                Teacher already has another class scheduled during the marked slot(s). A single slot cannot be assigned to multiple students. Please select open timings to proceed.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekday Selection Chips */}
      <div className="glass-panel rounded-2xl bg-card border border-border p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-brand" />
            <span>Select Active Class Days *</span>
          </label>
          <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            {enrollmentStatus.classDays.length} {enrollmentStatus.classDays.length === 1 ? 'Day' : 'Days'} Selected
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {WEEKDAYS.map((wd) => {
            const isSelected = enrollmentStatus.classDays.some((d) => d.day === wd.key);
            const hasConflict = conflicts.some((c) => c.day === wd.key);

            return (
              <button
                key={wd.key}
                type="button"
                onClick={() => onToggleDay(wd.key)}
                className={`p-3 rounded-2xl text-xs font-bold transition-all text-center border relative ${
                  isSelected
                    ? hasConflict
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-primary text-primary-foreground border-primary shadow-md scale-102 ring-2 ring-primary/20'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                <div>{wd.short}</div>
                {hasConflict && isSelected && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border border-card shadow" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Bulk Time Setter Toolbar */}
      {enrollmentStatus.classDays.length > 1 && (
        <div className="glass-panel rounded-2xl bg-card border border-border p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span>Bulk Timings Setter (Apply across all active days)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Bulk Student Time */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border">
              <div className="flex-1">
                <TimePicker12Hour
                  value={bulkStudentTime}
                  onChange={setBulkStudentTime}
                  label="Bulk Student Time"
                />
              </div>
              <button
                type="button"
                onClick={onApplyBulkStudentTime}
                className="mt-4 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs whitespace-nowrap transition-all"
              >
                Apply to All
              </button>
            </div>

            {/* Bulk Teacher Time */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border">
              <div className="flex-1">
                <TimePicker12Hour
                  value={bulkTeacherTime}
                  onChange={setBulkTeacherTime}
                  label="Bulk Teacher Time"
                />
              </div>
              <button
                type="button"
                onClick={onApplyBulkTeacherTime}
                className="mt-4 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs whitespace-nowrap transition-all"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-Day Dual Time Pickers */}
      {enrollmentStatus.classDays.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand" />
              <span>Daily Class Timings ({enrollmentStatus.classDuration}m Duration)</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              Student and Teacher times are managed individually
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {enrollmentStatus.classDays.map((slot) => {
              const dayObj = WEEKDAYS.find((w) => w.key === slot.day) || { label: slot.day, short: slot.day };
              const conflictForSlot = conflicts.find((c) => c.day === normalizeDay(slot.day));

              return (
                <div
                  key={slot.day}
                  className={`p-4 rounded-2xl border space-y-3 transition-all shadow-sm ${
                    conflictForSlot
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-card border-border'
                  }`}
                >
                  {/* Day Title Bar */}
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">
                        {dayObj.short}
                      </span>
                      <span className="font-bold text-sm text-foreground">{dayObj.label}</span>
                      {conflictForSlot && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Teacher Conflict
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleDay(slot.day)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove Day"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Dual Times Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Student Time */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                      <TimePicker12Hour
                        value={slot.studentTime || '04:00 PM'}
                        onChange={(newVal) => onUpdateDayStudentTime(slot.day, newVal)}
                        label="🎓 Student Time"
                      />
                    </div>

                    {/* Teacher Time */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                      <TimePicker12Hour
                        value={slot.teacherTime || '04:00 PM'}
                        onChange={(newVal) => onUpdateDayTeacherTime(slot.day, newVal)}
                        label="👨‍🏫 Teacher Time"
                      />
                    </div>
                  </div>

                  {/* Conflict detail if any */}
                  {conflictForSlot && (
                    <div className="text-[11px] font-mono text-amber-300 bg-amber-500/15 p-2 rounded-xl border border-amber-500/25 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Teacher has booked slot: {conflictForSlot.conflictingSlot.startTime} - {conflictForSlot.conflictingSlot.endTime}
                        {conflictForSlot.conflictingSlot.student?.name ? ` (${conflictForSlot.conflictingSlot.student.name})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl border border-dashed border-border text-center space-y-2">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">No Class Weekdays Selected</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Please choose at least one day from the weekday chips above to configure the student and teacher class timings.
          </p>
        </div>
      )}
    </div>
  );
}
