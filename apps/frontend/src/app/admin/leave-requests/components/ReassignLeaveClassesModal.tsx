'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Calendar, Clock, BookOpen, User, Users,
  CheckCircle2, AlertTriangle, AlertCircle, Loader2, ArrowRight, Sparkles
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { toast } from 'react-toastify';
import { formatPKTTime } from '@/utils/islamabadTime';

interface AffectedClassSession {
  _id?: string;
  id?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  teacherId: string;
  course?: {
    _id?: string;
    id?: string;
    title: string;
    type?: string;
  };
  student?: {
    _id?: string;
    id?: string;
    name: string;
    preferredName?: string;
    email?: string;
    studentId?: string | number;
  };
}

interface TeacherOption {
  id: string;
  name: string;
  email?: string;
}

interface ReassignLeaveClassesModalProps {
  isOpen: boolean;
  leave: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function ReassignLeaveClassesModal({
  isOpen,
  leave,
  onClose,
  onSuccess,
}: ReassignLeaveClassesModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [affectedClasses, setAffectedClasses] = useState<AffectedClassSession[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<Record<string, string>>({});
  const [bulkTeacherId, setBulkTeacherId] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const leaveId = leave?.id || leave?._id;
  const teacherIdOnLeave = (typeof leave?.teacherId === 'object' ? leave?.teacherId?._id || leave?.teacherId?.id : leave?.teacherId) || leave?.teacher?.id || leave?.teacher?._id;

  const fetchData = useCallback(async () => {
    if (!leaveId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch affected classes for this leave
      const affRes = await apiFetch(`${API_URL}/leave/${leaveId}/affected-classes`);
      if (affRes.ok) {
        const affData = await affRes.json();
        const classes: AffectedClassSession[] = affData.affectedClasses || [];
        setAffectedClasses(classes);

        // Initialize selections
        const initMap: Record<string, string> = {};
        classes.forEach((c) => {
          const sId = (c.id || c._id)?.toString();
          if (sId) initMap[sId] = '';
        });
        setSelectedSubstitutes(initMap);
      } else {
        const err = await affRes.json().catch(() => ({}));
        setErrorMessage(err.message || 'Failed to load affected classes');
      }

      // 2. Fetch available teachers for substitute selection
      const tRes = await apiFetch(`${API_URL}/schedule/teachers`);
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData)) {
          // Filter out the teacher who is on leave
          const filtered = tData
            .filter((t: any) => {
              const tId = (t.id || t._id)?.toString();
              return tId && tId !== teacherIdOnLeave?.toString();
            })
            .map((t: any) => ({
              id: (t.id || t._id)?.toString(),
              name: t.name || 'Teacher',
              email: t.email,
            }));
          setTeachers(filtered);
        }
      }
    } catch (err: any) {
      console.error('Error fetching affected classes:', err);
      setErrorMessage(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [leaveId, teacherIdOnLeave]);

  useEffect(() => {
    if (isOpen && leaveId) {
      fetchData();
      setBulkTeacherId('');
      setAdminNote('');
    }
  }, [isOpen, leaveId, fetchData]);

  if (!isOpen || !leave) return null;

  // Handle individual substitute change
  const handleSelectSubstitute = (sessionId: string, substituteId: string) => {
    setSelectedSubstitutes((prev) => ({
      ...prev,
      [sessionId]: substituteId,
    }));
  };

  // Handle bulk substitute assignment
  const handleApplyBulk = () => {
    if (!bulkTeacherId) return;
    const updated: Record<string, string> = {};
    affectedClasses.forEach((c) => {
      const sId = (c.id || c._id)?.toString();
      if (sId) updated[sId] = bulkTeacherId;
    });
    setSelectedSubstitutes(updated);
    toast.info('Applied substitute teacher to all affected classes');
  };

  // Submit reassignments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const reassignments = Object.entries(selectedSubstitutes)
      .filter(([_, subId]) => Boolean(subId))
      .map(([sessionId, substituteTeacherId]) => ({
        sessionId,
        substituteTeacherId,
      }));

    if (reassignments.length === 0) {
      setErrorMessage('Please select a substitute teacher for at least one class session.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_URL}/leave/${leaveId}/reassign-classes`, {
        method: 'POST',
        body: JSON.stringify({
          reassignments,
          note: adminNote.trim() || undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || 'Classes reassigned successfully!');
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reassign classes.');
      }
    } catch (err: any) {
      console.error('Reassign error:', err);
      setErrorMessage(err.message || 'An error occurred while reassigning classes.');
    } finally {
      setSubmitting(false);
    }
  };

  const teacherName = leave.teacher?.name || 'Teacher';
  const assignedCount = Object.values(selectedSubstitutes).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                Leave Reassignment
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground mt-1">
              Reassign Classes: {teacherName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select substitute teachers for the classes scheduled while {teacherName} is on leave.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-3 text-xs text-destructive">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reassignment Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Scanning scheduled classes in leave range...</p>
            </div>
          ) : affectedClasses.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-muted/20">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/60" />
              <h3 className="text-base font-bold text-foreground">No Affected Classes Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                There are no scheduled or activated class sessions for {teacherName} between{' '}
                {new Date(leave.startDate).toLocaleDateString()} and {new Date(leave.endDate).toLocaleDateString()}.
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Reassign Bar */}
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-brand" />
                  <span className="text-xs font-bold text-foreground">Bulk Substitute Assignment:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkTeacherId}
                    onChange={(e) => setBulkTeacherId(e.target.value)}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary outline-none max-w-xs"
                  >
                    <option value="">Choose Substitute Teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!bulkTeacherId}
                    onClick={handleApplyBulk}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    Assign All
                  </button>
                </div>
              </div>

              {/* Class Sessions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Affected Class Sessions ({affectedClasses.length})
                  </h4>
                  <span className="text-xs text-brand font-semibold">
                    {assignedCount} of {affectedClasses.length} assigned
                  </span>
                </div>

                <div className="divide-y divide-border/60 rounded-2xl border border-border bg-card overflow-hidden">
                  {affectedClasses.map((session, idx) => {
                    const sId = (session.id || session._id)?.toString() || `session-${idx}`;
                    const currentSub = selectedSubstitutes[sId] || '';
                    const studentName = session.student?.name || session.student?.preferredName || 'Student';
                    const courseTitle = session.course?.title || 'Quran Recitation';
                    const scheduledDate = new Date(session.scheduledAt);

                    return (
                      <div
                        key={sId}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                      >
                        {/* Class Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {scheduledDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-muted-foreground text-xs">&bull;</span>
                            <span className="font-mono text-xs font-bold text-brand">
                              {formatPKTTime(scheduledDate)} PKT
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                              {session.durationMinutes || 30} mins
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <BookOpen size={13} className="text-brand shrink-0" />
                            <span className="font-bold text-foreground">{courseTitle}</span>
                            <span className="text-muted-foreground">&bull;</span>
                            <User size={13} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">{studentName}</span>
                          </div>
                        </div>

                        {/* Substitute Selector */}
                        <div className="flex items-center gap-2 shrink-0">
                          <ArrowRight size={14} className="text-muted-foreground hidden md:block" />
                          <select
                            value={currentSub}
                            onChange={(e) => handleSelectSubstitute(sId, e.target.value)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus:border-primary outline-none min-w-[200px] transition-all ${
                              currentSub
                                ? 'border-emerald-500/50 bg-emerald-500/5 text-foreground'
                                : 'border-border bg-background text-muted-foreground'
                            }`}
                          >
                            <option value="">Select Substitute...</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Note Input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Optional Reassignment Note / Instructions</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    (included in notifications to substitute teachers and students)
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Please cover lesson 14 tajweed rules and notify guardian after class."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-bold text-foreground transition-all"
          >
            Cancel
          </button>

          {affectedClasses.length > 0 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || assignedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Reassigning Classes...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Confirm Reassignment ({assignedCount} classes)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
