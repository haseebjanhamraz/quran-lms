'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, Clock, User, BookOpen, AlertTriangle, CheckCircle2,
  X, Loader2, Save, Plus, Trash2, Shield, RefreshCw, Zap
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { toast } from 'react-toastify';

export interface DayTimeSlot {
  day: string;
  time: string;
}

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'student' | 'teacher';
  entity: any; // student or teacher user object
  onScheduleUpdated: () => void;
}

const WEEKDAYS = [
  { key: 'Mon', label: 'Monday', short: 'Mon' },
  { key: 'Tue', label: 'Tuesday', short: 'Tue' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed' },
  { key: 'Thu', label: 'Thursday', short: 'Thu' },
  { key: 'Fri', label: 'Friday', short: 'Fri' },
  { key: 'Sat', label: 'Saturday', short: 'Sat' },
  { key: 'Sun', label: 'Sunday', short: 'Sun' },
];

const STANDARD_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
];

function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + (durationMinutes || 60);
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export default function ScheduleEditorModal({
  isOpen,
  onClose,
  mode,
  entity,
  onScheduleUpdated,
}: ScheduleEditorModalProps) {
  // Common states
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Student mode states
  const [classDuration, setClassDuration] = useState<number>(60);
  const [classDays, setClassDays] = useState<DayTimeSlot[]>([]);
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>('');
  const [bulkTime, setBulkTime] = useState<string>('16:00');
  const [teachersList, setTeachersList] = useState<any[]>([]);

  // Teacher mode states
  const [teacherScheduleSlots, setTeacherScheduleSlots] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [newSlotDay, setNewSlotDay] = useState<string>('Monday');
  const [newSlotStart, setNewSlotStart] = useState<string>('16:00');
  const [newSlotDuration, setNewSlotDuration] = useState<number>(60);
  const [newSlotStudentId, setNewSlotStudentId] = useState<string>('');
  const [newSlotCourseId, setNewSlotCourseId] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Initialize data on modal open
  useEffect(() => {
    if (!isOpen || !entity) return;

    if (mode === 'student') {
      setClassDuration(entity.classDuration || entity.profile?.classDuration || 60);
      const days = entity.classDays || entity.profile?.classDays || [];
      setClassDays(Array.isArray(days) ? [...days] : []);
      const teacherId = entity.assignedTeacher?._id || entity.assignedTeacher?.id || entity.assignedTeacher || entity.profile?.assignedTeacher || '';
      setAssignedTeacherId(typeof teacherId === 'string' ? teacherId : teacherId?.id || '');

      // Fetch teachers list
      apiFetch(`${API_URL}/users/role/TEACHER`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setTeachersList(Array.isArray(data) ? data : []))
        .catch(() => {});
    } else {
      // Teacher mode: fetch teacher's schedule grid and rosters
      loadTeacherScheduleData();
    }
  }, [isOpen, entity, mode]);

  const loadTeacherScheduleData = async () => {
    if (!entity?.id && !entity?._id) return;
    const tId = entity.id || entity._id;
    setLoading(true);
    try {
      const [scheduleRes, studentsRes, coursesRes] = await Promise.all([
        apiFetch(`${API_URL}/schedule/grid`),
        apiFetch(`${API_URL}/users/role/STUDENT`),
        apiFetch(`${API_URL}/courses`),
      ]);

      if (scheduleRes.ok) {
        const slots = await scheduleRes.json();
        const mySlots = Array.isArray(slots)
          ? slots.filter((s: any) => (s.teacherId === tId || s.teacher?.id === tId || s.teacher?._id === tId))
          : [];
        setTeacherScheduleSlots(mySlots);
      }

      if (studentsRes.ok) {
        const students = await studentsRes.json();
        setAllStudents(Array.isArray(students) ? students : []);
      }

      if (coursesRes.ok) {
        const courses = await coursesRes.json();
        setAllCourses(Array.isArray(courses) ? courses : []);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // Student mode handlers
  const handleToggleDay = (dayShort: string) => {
    const existing = classDays.find((d) => d.day === dayShort);
    if (existing) {
      setClassDays(classDays.filter((d) => d.day !== dayShort));
    } else {
      setClassDays([...classDays, { day: dayShort, time: bulkTime }]);
    }
  };

  const handleTimeChange = (dayShort: string, newTime: string) => {
    setClassDays(
      classDays.map((d) => (d.day === dayShort ? { ...d, time: newTime } : d))
    );
  };

  const handleApplyBulkTime = () => {
    setClassDays(classDays.map((d) => ({ ...d, time: bulkTime })));
    toast.info(`Applied ${bulkTime} to all ${classDays.length} selected days.`);
  };

  // Save student schedule
  const handleSaveStudentSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const studentId = entity.id || entity._id;
      const res = await apiFetch(`${API_URL}/users/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          classDuration: Number(classDuration),
          classesPerWeek: classDays.length,
          classDays,
          assignedTeacher: assignedTeacherId || null,
        }),
      });

      if (res.ok) {
        toast.success('Student schedule updated successfully!');
        onScheduleUpdated();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update student schedule');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error while updating schedule');
    } finally {
      setSaving(false);
    }
  };

  // Teacher mode: Add Slot
  const handleAddTeacherSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = entity.id || entity._id;
    const end = calculateEndTime(newSlotStart, newSlotDuration);

    setSaving(true);
    try {
      const slotIndex = STANDARD_TIMES.indexOf(newSlotStart) >= 0 ? STANDARD_TIMES.indexOf(newSlotStart) : 0;
      const res = await apiFetch(`${API_URL}/schedule/slot`, {
        method: 'POST',
        body: JSON.stringify({
          dayOfWeek: newSlotDay,
          timeSlotIndex: slotIndex,
          startTime: newSlotStart,
          endTime: end,
          teacherId: tId,
          studentId: newSlotStudentId || undefined,
          courseId: newSlotCourseId || undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Schedule slot added for ${newSlotDay} at ${newSlotStart}`);
        await loadTeacherScheduleData();
        onScheduleUpdated();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to add schedule slot');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  // Teacher mode: Delete Slot
  const handleDeleteTeacherSlot = async (slot: any) => {
    if (!confirm(`Remove slot for ${slot.dayOfWeek} (${slot.startTime} - ${slot.endTime})?`)) return;

    setSaving(true);
    try {
      const res = await apiFetch(
        `${API_URL}/schedule/slot?dayOfWeek=${slot.dayOfWeek}&timeSlotIndex=${slot.timeSlotIndex}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('Slot removed successfully');
        await loadTeacherScheduleData();
        onScheduleUpdated();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to remove slot');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative border border-border bg-card max-h-[90vh] flex flex-col my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-4 shrink-0">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              {mode === 'student' ? 'Edit Student Schedule & Timings' : 'Manage Teacher Schedule & Slots'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {entity.name} &bull; {entity.email} &bull; {entity.timezone || 'UTC'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {mode === 'student' ? (
            /* STUDENT SCHEDULE FORM */
            <form id="student-schedule-form" onSubmit={handleSaveStudentSchedule} className="space-y-6">
              {/* Duration & Teacher Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Class Duration *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[30, 60, 120].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setClassDuration(dur)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          classDuration === dur
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {dur} Mins
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Assigned Instructor
                  </label>
                  <select
                    value={assignedTeacherId}
                    onChange={(e) => setAssignedTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Assign Teacher Later --</option>
                    {teachersList.map((t) => (
                      <option key={t.id || t._id} value={t.id || t._id}>
                        {t.name} ({t.specialization || t.qualification || 'Quran Teacher'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day Selection Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Class Weekdays ({classDays.length} Days / Wk)
                  </label>
                  {classDays.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <input
                        type="time"
                        value={bulkTime}
                        onChange={(e) => setBulkTime(e.target.value)}
                        className="rounded-lg border border-input bg-background px-2 py-0.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkTime}
                        className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                      >
                        Apply to All
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((wd) => {
                    const isSelected = classDays.some((d) => d.day === wd.short);
                    return (
                      <button
                        key={wd.short}
                        type="button"
                        onClick={() => handleToggleDay(wd.short)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{wd.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-Day Timings Configuration */}
              {classDays.length > 0 ? (
                <div className="space-y-2.5 p-4 rounded-2xl bg-muted/40 border border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Configured Class Timings ({classDuration}m duration)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {classDays.map((d) => {
                      const fullDay = WEEKDAYS.find((w) => w.short === d.day)?.label || d.day;
                      const endTime = calculateEndTime(d.time, classDuration);
                      return (
                        <div
                          key={d.day}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/80 shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {d.day}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-foreground leading-none">{fullDay}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {d.time} &rarr; {endTime}
                              </p>
                            </div>
                          </div>

                          <input
                            type="time"
                            value={d.time}
                            onChange={(e) => handleTimeChange(d.day, e.target.value)}
                            className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No weekdays selected yet. Click the day chips above to enable class days.
                </div>
              )}
            </form>
          ) : (
            /* TEACHER SCHEDULE MATRIX & SLOT MANAGER */
            <div className="space-y-6">
              {/* Add Slot Sub-form */}
              <form onSubmit={handleAddTeacherSlot} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Assign New Time Slot & Student</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Day of Week
                    </label>
                    <select
                      value={newSlotDay}
                      onChange={(e) => setNewSlotDay(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs"
                    >
                      {WEEKDAYS.map((w) => (
                        <option key={w.label} value={w.label}>{w.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Duration
                    </label>
                    <select
                      value={newSlotDuration}
                      onChange={(e) => setNewSlotDuration(Number(e.target.value))}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs"
                    >
                      <option value={30}>30 Mins</option>
                      <option value={60}>60 Mins</option>
                      <option value={120}>120 Mins</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Student (Optional)
                    </label>
                    <select
                      value={newSlotStudentId}
                      onChange={(e) => setNewSlotStudentId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs"
                    >
                      <option value="">-- Open Slot --</option>
                      {allStudents.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-muted-foreground">
                    Ends at: <strong className="text-foreground">{calculateEndTime(newSlotStart, newSlotDuration)}</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    <span>Assign Slot</span>
                  </button>
                </div>
              </form>

              {/* Current Slots List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Current Assigned Slots ({teacherScheduleSlots.length})
                  </h4>
                  <button
                    onClick={loadTeacherScheduleData}
                    disabled={loading}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {teacherScheduleSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {teacherScheduleSlots.map((slot, idx) => (
                      <div
                        key={slot.id || `${slot.dayOfWeek}-${slot.startTime}-${idx}`}
                        className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                              {slot.dayOfWeek}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {slot.student?.name ? (
                              <span>Student: <strong className="text-foreground">{slot.student.name}</strong></span>
                            ) : (
                              <span className="italic">Open / Unassigned</span>
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTeacherSlot(slot)}
                          disabled={saving}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No schedule slots assigned to this teacher yet. Add a slot above.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted border border-border text-foreground transition-colors"
          >
            Close
          </button>

          {mode === 'student' && (
            <button
              type="submit"
              form="student-schedule-form"
              disabled={saving}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-md flex items-center gap-2 transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Schedule</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
