'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookUser, User, Clock, FileText, VideoOff, Loader2, XCircle,
  Calendar, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Globe, BookOpen, Users, Sparkles, Award
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { apiFetch } from '@/utils/apiFetch';
import { getCountryByCode, getCountryByName } from '@/utils/countries';
import { DEFAULT_TIME_SLOTS } from '@/hooks/useTimeSlots';
import { TeacherUser, EnrollmentStatusState, WEEKDAYS } from './types';

interface Step5TeacherAssignmentProps {
  teachers: TeacherUser[];
  loadingTeachers: boolean;
  selectedTeacherId: string;
  setSelectedTeacherId: React.Dispatch<React.SetStateAction<string>>;
  assignTeacherLater: boolean;
  setAssignTeacherLater: React.Dispatch<React.SetStateAction<boolean>>;
  enrollmentStatus: EnrollmentStatusState;
  onToggleDay: (dayKey: string) => void;
  onUpdateDayTime: (dayKey: string, newTime: string) => void;
  bulkTime: string;
  setBulkTime: React.Dispatch<React.SetStateAction<string>>;
  onApplyBulkTime: () => void;
  noteToTeacher: string;
  setNoteToTeacher: React.Dispatch<React.SetStateAction<string>>;
  cameraRestricted: boolean;
  setCameraRestricted: (restricted: boolean) => void;
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

export default function Step5TeacherAssignment({
  teachers,
  loadingTeachers,
  selectedTeacherId,
  setSelectedTeacherId,
  assignTeacherLater,
  setAssignTeacherLater,
  enrollmentStatus,
  onToggleDay,
  onUpdateDayTime,
  bulkTime,
  setBulkTime,
  onApplyBulkTime,
  noteToTeacher,
  setNoteToTeacher,
  cameraRestricted,
  setCameraRestricted,
}: Step5TeacherAssignmentProps) {
  const [teacherSlots, setTeacherSlots] = useState<TeacherSlot[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [showFullGrid, setShowFullGrid] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Find currently selected teacher details
  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => (t.id || t._id) === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  // Fetch teacher's existing schedule grid
  const fetchTeacherSchedule = useCallback(async (teacherId: string) => {
    if (!teacherId) {
      setTeacherSlots([]);
      return;
    }
    setLoadingSchedule(true);
    try {
      const res = await apiFetch(`${API_URL}/schedule/grid`);
      if (res.ok) {
        const data: any[] = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((s) => {
              const tId = typeof s.teacherId === 'object' ? s.teacherId?._id || s.teacherId?.id : s.teacherId;
              const tObjId = s.teacher?._id || s.teacher?.id;
              return tId === teacherId || tObjId === teacherId;
            })
          : [];
        setTeacherSlots(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch teacher schedule in admission wizard:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (selectedTeacherId && !assignTeacherLater) {
      fetchTeacherSchedule(selectedTeacherId);
    } else {
      setTeacherSlots([]);
    }
  }, [selectedTeacherId, assignTeacherLater, fetchTeacherSchedule]);

  // Group slots by day
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
      if (map[norm]) {
        map[norm].push(slot);
      }
    });

    return map;
  }, [teacherSlots]);

  // Conflict Detection: Check if any student requested day & time overlaps with teacher's booked slots
  const conflicts = useMemo(() => {
    const list: Array<{
      day: string;
      studentTime: string;
      conflictingSlot: TeacherSlot;
    }> = [];

    if (!enrollmentStatus.classDays || enrollmentStatus.classDays.length === 0) {
      return list;
    }

    enrollmentStatus.classDays.forEach((stSlot) => {
      const dayKey = normalizeDay(stSlot.day);
      const bookedOnDay = slotsByDay[dayKey] || [];

      // Convert student time to minutes
      const [sh, sm] = (stSlot.time || '16:00').split(':').map(Number);
      const studentStartMins = (sh || 0) * 60 + (sm || 0);
      const studentEndMins = studentStartMins + (enrollmentStatus.classDuration || 60);

      bookedOnDay.forEach((bSlot) => {
        const [bh, bm] = (bSlot.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (bSlot.endTime || '00:00').split(':').map(Number);
        const bookedStartMins = (bh || 0) * 60 + (bm || 0);
        const bookedEndMins = (eh || 0) * 60 + (em || 0);

        // Check if intervals overlap
        const isOverlap =
          (studentStartMins >= bookedStartMins && studentStartMins < bookedEndMins) ||
          (studentEndMins > bookedStartMins && studentEndMins <= bookedEndMins) ||
          (studentStartMins <= bookedStartMins && studentEndMins >= bookedEndMins);

        if (isOverlap) {
          list.push({
            day: dayKey,
            studentTime: stSlot.time,
            conflictingSlot: bSlot,
          });
        }
      });
    });

    return list;
  }, [enrollmentStatus.classDays, enrollmentStatus.classDuration, slotsByDay]);

  const teacherPhoto = selectedTeacher?.profilePicture || selectedTeacher?.avatar;
  const countryObj = selectedTeacher?.country
    ? getCountryByCode(selectedTeacher.country) || getCountryByName(selectedTeacher.country)
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-3">
        <div className="p-2.5 rounded-2xl bg-brand/15 text-brand border border-brand/20">
          <BookUser className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 5: Teacher Assignment &amp; Instructions
          </h3>
          <p className="text-xs text-muted-foreground">
            Assign the teacher, review their existing schedule &amp; availability, and configure class timings.
          </p>
        </div>
      </div>

      {/* 1. Teacher Selection Dropdown */}
      <div className="glass-panel rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User className="h-4 w-4 text-brand" />
            <span>Select Instructor / Teacher *</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={assignTeacherLater}
              onChange={(e) => setAssignTeacherLater(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span>Assign teacher later</span>
          </label>
        </div>

        {!assignTeacherLater && (
          <div className="space-y-1">
            {loadingTeachers ? (
              <div className="py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading active teachers...</span>
              </div>
            ) : (
              <select
                required={!assignTeacherLater}
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer"
              >
                <option value="">-- Choose a Teacher to View Schedule &amp; Assign --</option>
                {teachers.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name} {t.preferredName ? `(${t.preferredName})` : ''} • {t.specialization || 'Tajweed & Nazira'} • {t.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* 2. SELECTED TEACHER CURRENT SCHEDULE & WORKLOAD PREVIEW */}
      {!assignTeacherLater && selectedTeacherId && (
        <div className="glass-panel rounded-3xl bg-card/80 border border-brand/40 p-5 sm:p-6 space-y-5 shadow-lg animate-fadeIn">
          {/* Teacher Summary Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand font-bold text-lg overflow-hidden shrink-0 shadow-inner">
                {teacherPhoto ? (
                  <img src={getImageUrl(teacherPhoto)} alt={selectedTeacher?.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedTeacher?.name?.charAt(0) || 'T'}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold font-display text-foreground">
                    {selectedTeacher?.name}
                  </h4>
                  {selectedTeacher?.preferredName && (
                    <span className="text-xs text-muted-foreground">({selectedTeacher.preferredName})</span>
                  )}
                  {countryObj && <span className="text-base">{countryObj.flag}</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="bg-brand/10 text-brand border border-brand/20 font-bold px-2 py-0.5 rounded-md">
                    {selectedTeacher?.specialization || 'Tajweed & Quran'}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{selectedTeacher?.email}</span>
                  {selectedTeacher?.timezone && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-muted-foreground">TZ: {selectedTeacher.timezone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Workload Badge */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="px-4 py-2 rounded-2xl bg-brand/10 border border-brand/20 text-center">
                <p className="text-base font-bold font-mono text-brand">
                  {teacherSlots.length} Active Slots
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Current Workload</p>
              </div>
            </div>
          </div>

          {/* Conflict Analysis Alert Banner */}
          {loadingSchedule ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
              <span>Analyzing teacher schedule availability...</span>
            </div>
          ) : conflicts.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-fadeIn shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Scheduling Conflict Warning ({conflicts.length} Overlapping Slot{conflicts.length !== 1 ? 's' : ''})</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                This teacher already has scheduled classes during the requested student timing. You can adjust the days or timings below:
              </p>
              <div className="space-y-1 pt-1">
                {conflicts.map((c, cIdx) => (
                  <div key={cIdx} className="text-[11px] font-mono bg-amber-500/15 p-2 rounded-xl border border-amber-500/25 flex items-center justify-between">
                    <span>
                      <strong>{c.day}:</strong> Requested {c.studentTime} conflicts with{' '}
                      <strong>{c.conflictingSlot.startTime} - {c.conflictingSlot.endTime}</strong>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
                      {c.conflictingSlot.course?.title || 'Existing Session'}
                      {c.conflictingSlot.student?.name ? ` (${c.conflictingSlot.student.name})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="font-medium">
                Teacher is available! No scheduling conflicts found with the student&apos;s requested days &amp; timings.
              </span>
            </div>
          )}

          {/* 7-Day Day-by-Day Current Load Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-brand" />
                <span>Teacher&apos;s Current Weekly Schedule (Day-by-Day Load)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowFullGrid(!showFullGrid)}
                className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showFullGrid ? 'Hide Full Matrix' : 'View Full Schedule Matrix'}</span>
                {showFullGrid ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {WEEKDAYS.map((wd) => {
                const dayKey = wd.key;
                const slotsOnDay = slotsByDay[dayKey] || [];
                const isAssignedToStudent = enrollmentStatus.classDays.some((d) => normalizeDay(d.day) === dayKey);
                const hasConflict = conflicts.some((c) => c.day === dayKey);

                return (
                  <div
                    key={dayKey}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 flex flex-col justify-between ${
                      hasConflict
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : isAssignedToStudent
                        ? 'bg-brand/10 border-brand/40 text-foreground'
                        : slotsOnDay.length > 0
                        ? 'bg-card border-border/70 text-foreground'
                        : 'bg-muted/30 border-border/40 text-muted-foreground opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-border/30 pb-1">
                      <span className="font-bold text-[11px]">{wd.short}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          hasConflict
                            ? 'bg-amber-500/20 text-amber-300'
                            : isAssignedToStudent
                            ? 'bg-brand/20 text-brand'
                            : slotsOnDay.length > 0
                            ? 'bg-muted text-foreground'
                            : 'bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {slotsOnDay.length} {slotsOnDay.length === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>

                    <div className="min-h-[38px] flex flex-col justify-center text-[10px]">
                      {slotsOnDay.length > 0 ? (
                        <div className="space-y-1">
                          {slotsOnDay.slice(0, 2).map((s, idx) => (
                            <p key={idx} className="font-mono text-[9px] truncate text-muted-foreground">
                              • {s.startTime}-{s.endTime}
                            </p>
                          ))}
                          {slotsOnDay.length > 2 && (
                            <p className="text-[9px] font-bold text-brand">+{slotsOnDay.length - 2} more</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Free Day</span>
                      )}
                    </div>

                    {isAssignedToStudent && (
                      <div className="pt-1 border-t border-border/30 text-[9px] font-bold text-brand flex items-center gap-1">
                        <span>★ New Student Day</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expandable Full 7-Day Matrix Table */}
          {showFullGrid && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card/90 shadow-md animate-fadeIn">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-muted/70 border-b border-border sticky top-0 z-10 backdrop-blur-md">
                      <th className="p-2.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider w-28 border-r border-border">
                        Slot Time
                      </th>
                      {WEEKDAYS.map((wd) => (
                        <th key={wd.key} className="p-2.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider text-center border-r border-border last:border-0">
                          {wd.short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {DEFAULT_TIME_SLOTS.map((slotTime, tIdx) => (
                      <tr key={slotTime} className="hover:bg-card/40 transition-colors">
                        <td className="p-2 font-mono text-[10px] text-foreground/80 border-r border-border whitespace-nowrap bg-muted/20">
                          {slotTime}
                        </td>
                        {WEEKDAYS.map((wd) => {
                          const matchingSlot = (slotsByDay[wd.key] || []).find((s) => s.timeSlotIndex === tIdx);
                          const isStudentDay = enrollmentStatus.classDays.some((d) => normalizeDay(d.day) === wd.key);

                          return (
                            <td key={wd.key} className="p-1.5 text-center border-r border-border last:border-0">
                              {matchingSlot ? (
                                <div className="p-1 rounded-lg bg-brand/15 border border-brand/30 text-[9px] font-bold text-brand truncate max-w-[90px] mx-auto">
                                  <span>{matchingSlot.course?.title || 'Booked Slot'}</span>
                                  {matchingSlot.student?.name && (
                                    <span className="block text-[8px] opacity-80 font-normal truncate">
                                      {matchingSlot.student.name}
                                    </span>
                                  )}
                                </div>
                              ) : isStudentDay ? (
                                <span className="text-[9px] text-emerald-400 font-bold">Open</span>
                              ) : (
                                <span className="text-muted-foreground/30 text-[10px]">—</span>
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
      )}

      {/* 3. Teacher Schedule & Timetable (Pre-populated from Step 3 & Changeable) */}
      {!assignTeacherLater && selectedTeacherId && (
        <div className="glass-panel rounded-3xl bg-card border border-border p-5 sm:p-6 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-brand" />
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Student Schedule for this Teacher
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Pre-populated with assigned class weekdays &amp; timings. Adjust specific slot times if needed.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap self-start sm:self-auto">
              {enrollmentStatus.classDays.length} {enrollmentStatus.classDays.length === 1 ? 'Day' : 'Days'} / Week • {enrollmentStatus.classDuration}m
            </span>
          </div>

          {/* Weekday Selection Pills */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Class Days for this Teacher:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {WEEKDAYS.map((wd) => {
                const isSelected = enrollmentStatus.classDays.some((d) => d.day === wd.key);
                const hasConflictOnDay = conflicts.some((c) => c.day === wd.key);

                return (
                  <button
                    key={wd.key}
                    type="button"
                    onClick={() => onToggleDay(wd.key)}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all text-center border relative ${
                      isSelected
                        ? hasConflictOnDay
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-primary text-primary-foreground border-primary shadow-md scale-102'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div>{wd.short}</div>
                    {hasConflictOnDay && isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-amber-500 text-black text-[9px] font-extrabold rounded-full flex items-center justify-center shadow">
                        !
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Timings Editor per Day */}
          {enrollmentStatus.classDays.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Assigned Class Timings:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={bulkTime}
                    onChange={(e) => setBulkTime(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-mono outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={onApplyBulkTime}
                    className="px-3 py-1.5 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-colors whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {enrollmentStatus.classDays.map((slot) => {
                  const dayObj = WEEKDAYS.find((w) => w.key === slot.day) || { label: slot.day, short: slot.day };
                  const [h, m] = (slot.time || '16:00').split(':').map(Number);
                  const endH = Math.floor(((h || 0) * 60 + (m || 0) + enrollmentStatus.classDuration) / 60) % 24;
                  const endM = ((h || 0) * 60 + (m || 0) + enrollmentStatus.classDuration) % 60;
                  const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                  const conflictForSlot = conflicts.find((c) => c.day === normalizeDay(slot.day));

                  return (
                    <div
                      key={slot.day}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-sm transition-colors ${
                        conflictForSlot
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-border/80 bg-background/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground">{dayObj.label}</span>
                          {conflictForSlot && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded">
                              Conflict
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {slot.time} - {endTimeFormatted} ({enrollmentStatus.classDuration}m)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot.time}
                          onChange={(e) => onUpdateDayTime(slot.day, e.target.value)}
                          className="bg-card border border-border focus:border-brand rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-foreground outline-none shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => onToggleDay(slot.day)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove Day"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 text-center text-xs text-amber-300">
              No days selected. Please select at least one day for this student&apos;s schedule.
            </div>
          )}
        </div>
      )}

      {/* 4. Note to Teacher */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-brand" />
          <span>Note to Teacher (Instructions &amp; Student Background)</span>
        </label>
        <textarea
          rows={3}
          placeholder="e.g. Focus on Quran pronunciation and Makharij. Student is at Beginner tier and prefers a slow, gentle learning pace..."
          value={noteToTeacher}
          onChange={(e) => setNoteToTeacher(e.target.value)}
          className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl p-3 text-xs outline-none resize-none font-medium shadow-sm"
        />
      </div>

      {/* 5. Admin Camera Restriction Toggle */}
      <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shrink-0">
            <VideoOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Restrict Student Camera</p>
            <p className="text-[10px] text-muted-foreground">Disables video camera publishing during online classes</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={cameraRestricted}
            onChange={(e) => setCameraRestricted(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
        </label>
      </div>
    </div>
  );
}
