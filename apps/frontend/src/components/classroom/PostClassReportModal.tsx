'use client';

import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  BookOpen,
  User,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Clock,
  Sparkles,
  Smile,
  Brain,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

interface PostClassReportModalProps {
  isOpen: boolean;
  sessionId: string;
  sessionInfo?: {
    course?: { title?: string; type?: string };
    student?: { name?: string; preferredName?: string; studentId?: string | number };
    durationMinutes?: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostClassReportModal({
  isOpen,
  sessionId,
  sessionInfo,
  onClose,
  onSuccess,
}: PostClassReportModalProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE'>('PRESENT');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [performanceRating, setPerformanceRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [behavior, setBehavior] = useState<
    'ATTENTIVE' | 'ACTIVE_PARTICIPANT' | 'COOPERATIVE' | 'DISTRACTED' | 'NEEDS_FOCUS' | 'TIRED'
  >('ATTENTIVE');
  const [understandingLevel, setUnderstandingLevel] = useState<
    'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_HELP'
  >('GOOD');
  const [homeworkAssignment, setHomeworkAssignment] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicsCovered.trim()) {
      setError('Please specify what was taught in the class today.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        attendanceStatus,
        topicsCovered: topicsCovered.trim(),
        surahOrLesson: topicsCovered.trim(), // backward compatibility
        performanceRating,
        behavior,
        studentBehavior: behavior,
        understandingLevel,
        homeworkAssignment: homeworkAssignment.trim() || undefined,
        teacherNotes: teacherNotes.trim() || undefined,
      };

      const res = await apiFetch(`${API_URL}/class-sessions/${sessionId}/report`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit class report.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipDismiss = () => {
    if (
      confirm(
        'Are you sure you want to exit without submitting the class report? This report will be saved as Pending in your Classes History.'
      )
    ) {
      onClose();
    }
  };

  const studentDisplayName =
    sessionInfo?.student?.preferredName || sessionInfo?.student?.name || 'Student';
  const courseTitle = sessionInfo?.course?.title || 'Quranic Studies';

  const ratingDescriptions: Record<number, string> = {
    5: '5/5 — Outstanding',
    4: '4/5 — Very Good',
    3: '3/5 — Satisfactory',
    2: '2/5 — Needs Practice',
    1: '1/5 — Struggling',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="glass-panel my-8 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-border bg-card text-foreground">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Class Completed
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {sessionInfo?.durationMinutes || 30} mins
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground mt-1">
                Post-Class Evaluation Report
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record lesson overview, student behavior, and feedback for{' '}
                <span className="font-semibold text-foreground">{studentDisplayName}</span> ({courseTitle})
              This report will be sent to the Supervisor and Parents.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkipDismiss}
            className="text-muted-foreground hover:text-foreground p-1 rounded-xl transition-colors cursor-pointer"
            title="Skip & Submit Later"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 mb-5 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Attendance Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Student Attendance *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['PRESENT', 'LATE', 'ABSENT'] as const).map((status) => {
                const isSelected = attendanceStatus === status;
                const colors = {
                  PRESENT: isSelected
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-card hover:bg-emerald-500/10 text-foreground border-border',
                  LATE: isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-card hover:bg-amber-500/10 text-foreground border-border',
                  ABSENT: isSelected
                    ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20'
                    : 'bg-card hover:bg-red-500/10 text-foreground border-border',
                };
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setAttendanceStatus(status)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${colors[status]}`}
                  >
                    {status === 'PRESENT' ? '✓ Present' : status === 'LATE' ? '⏱ Late' : '✕ Absent'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* What Was Taught in Class */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>What was taught in the class? *</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the lesson, chapters, exercises, or topics covered today (e.g. Practiced Surah Al-Mulk verses 1-15, focused on correct pronunciation of throat letters, and reviewed lesson 6 exercises)..."
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-xs outline-none resize-none text-foreground leading-relaxed"
            />
          </div>

          {/* Performance Rating & Behavior & Understanding */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/40">
            {/* Performance Stars */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Overall Performance
              </label>
              <div className="flex items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoverRating ?? performanceRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setPerformanceRating(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          isActive
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/30 stroke-current'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {ratingDescriptions[hoverRating ?? performanceRating]}
              </p>
            </div>

            {/* Student Behavior */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Smile className="h-3.5 w-3.5 text-brand" />
                <span>Student Behavior</span>
              </label>
              <select
                value={behavior}
                onChange={(e) => setBehavior(e.target.value as any)}
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3 py-2 text-xs outline-none text-foreground font-semibold"
              >
                <option value="ATTENTIVE">Attentive &amp; Focused</option>
                <option value="ACTIVE_PARTICIPANT">Active &amp; Engaged</option>
                <option value="COOPERATIVE">Cooperative &amp; Responsive</option>
                <option value="DISTRACTED">Occasionally Distracted</option>
                <option value="NEEDS_FOCUS">Needs Encouragement</option>
                <option value="TIRED">Tired / Low Energy</option>
              </select>
            </div>

            {/* Understanding & Comprehension */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <span>Understanding Level</span>
              </label>
              <select
                value={understandingLevel}
                onChange={(e) => setUnderstandingLevel(e.target.value as any)}
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3 py-2 text-xs outline-none text-foreground font-semibold"
              >
                <option value="EXCELLENT">Excellent (Grasped quickly)</option>
                <option value="GOOD">Good (Understood well)</option>
                <option value="AVERAGE">Satisfactory (Needs revision)</option>
                <option value="NEEDS_HELP">Needs Extra Practice</option>
              </select>
            </div>
          </div>

          {/* Homework Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Homework &amp; Next Class Task (Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Read pages 14-16 twice, review rules learned today, and prepare next exercise..."
              value={homeworkAssignment}
              onChange={(e) => setHomeworkAssignment(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs outline-none resize-none text-foreground"
            />
          </div>

          {/* Teacher Remarks & Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-brand" />
              <span>Teacher Remarks &amp; Feedback (Shared with Parents / Student)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Share encouraging feedback, areas of improvement, or general observations..."
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary rounded-xl p-3 text-xs outline-none resize-none text-foreground"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={handleSkipDismiss}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              Skip for now
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Class Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
