'use client';

import React from 'react';
import {
  X,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Smile,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { formatPKTDate, formatPKTTime } from '@/utils/islamabadTime';

interface ViewClassReportModalProps {
  isOpen: boolean;
  report?: {
    attendanceStatus?: string;
    topicsCovered?: string;
    surahOrLesson?: string;
    performanceRating?: number;
    understandingLevel?: string;
    behavior?: string;
    studentBehavior?: string;
    homeworkAssignment?: string;
    teacherNotes?: string;
    submittedAt?: string | Date;
  } | null;
  session?: {
    scheduledAt?: string;
    durationMinutes?: number;
    course?: { title?: string; type?: string };
    teacher?: { name?: string };
    student?: { name?: string; preferredName?: string };
  } | null;
  onClose: () => void;
}

const BEHAVIOR_LABELS: Record<string, string> = {
  ATTENTIVE: 'Attentive & Focused',
  ACTIVE_PARTICIPANT: 'Active & Engaged',
  COOPERATIVE: 'Cooperative & Responsive',
  DISTRACTED: 'Occasionally Distracted',
  NEEDS_FOCUS: 'Needs Encouragement',
  TIRED: 'Tired / Low Energy',
};

const UNDERSTANDING_LABELS: Record<string, string> = {
  EXCELLENT: 'Excellent (Grasped quickly)',
  GOOD: 'Good (Understood well)',
  AVERAGE: 'Satisfactory (Needs revision)',
  NEEDS_HELP: 'Needs Extra Practice',
};

export default function ViewClassReportModal({
  isOpen,
  report,
  session,
  onClose,
}: ViewClassReportModalProps) {
  if (!isOpen) return null;

  const studentName =
    session?.student?.preferredName || session?.student?.name || 'Student';
  const teacherName = session?.teacher?.name || 'Assigned Teacher';
  const courseTitle = session?.course?.title || 'Quranic Course';

  const formattedDate = session?.scheduledAt
    ? `${formatPKTDate(session.scheduledAt)} at ${formatPKTTime(session.scheduledAt)} PKT`
    : 'Recently';

  const lessonContent = report?.topicsCovered || report?.surahOrLesson || 'Class session completed';
  const behaviorKey = report?.studentBehavior || report?.behavior || 'ATTENTIVE';
  const behaviorLabel = BEHAVIOR_LABELS[behaviorKey] || behaviorKey;

  const understandingKey = report?.understandingLevel || 'GOOD';
  const understandingLabel = UNDERSTANDING_LABELS[understandingKey] || understandingKey;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-border bg-card text-foreground">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Official Class Report
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {session?.durationMinutes || 30} mins
                </span>
              </div>
              <h3 className="text-lg font-bold font-display text-foreground mt-0.5">
                {courseTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                Student: <span className="font-semibold text-foreground">{studentName}</span> &bull; Teacher: {teacherName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!report ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-amber-500/70" />
            <p className="text-sm font-bold text-foreground">Report Not Yet Submitted</p>
            <p className="text-xs text-muted-foreground">
              The teacher has not yet filed the detailed lesson evaluation for this completed class.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Attendance & Rating Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Attendance Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    report.attendanceStatus === 'PRESENT'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : report.attendanceStatus === 'LATE'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}
                >
                  {report.attendanceStatus === 'PRESENT'
                    ? '✓ Present'
                    : report.attendanceStatus === 'LATE'
                    ? '⏱ Late'
                    : '✕ Absent'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Performance Evaluation
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        (report.performanceRating ?? 5) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-mono font-bold ml-1 text-foreground">
                    {report.performanceRating ?? 5}/5
                  </span>
                </div>
              </div>
            </div>

            {/* What Was Taught */}
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>What was taught in the class</span>
              </span>
              <p className="text-xs text-foreground leading-relaxed font-medium">
                {lessonContent}
              </p>
            </div>

            {/* Student Behavior & Understanding */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Smile className="h-3 w-3 text-brand" />
                  <span>Student Behavior</span>
                </span>
                <p className="font-bold text-foreground">{behaviorLabel}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3 text-primary" />
                  <span>Understanding Level</span>
                </span>
                <p className="font-bold text-foreground">{understandingLabel}</p>
              </div>
            </div>

            {/* Homework Assignment */}
            {report.homeworkAssignment && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Homework &amp; Next Class Tasks</span>
                </span>
                <p className="text-xs text-foreground leading-relaxed">
                  {report.homeworkAssignment}
                </p>
              </div>
            )}

            {/* Teacher Notes */}
            {report.teacherNotes && (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-brand" />
                  <span>Teacher Notes &amp; Guidance</span>
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  &ldquo;{report.teacherNotes}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Recorded on: {formattedDate}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border/50 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
