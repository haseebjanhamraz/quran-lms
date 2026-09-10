'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlayCircle,
  Loader2,
  BookOpen,
  Search,
  Plus,
  Star,
  Sparkles,
} from 'lucide-react';
import { formatPKTDate, formatPKTTime } from '@/utils/islamabadTime';
import ViewClassReportModal from '@/components/ViewClassReportModal';
import PostClassReportModal from '@/components/classroom/PostClassReportModal';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';

interface SessionItem {
  id: string;
  _id?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  course?: { title: string; type: string };
  student?: { id?: string; _id?: string; name?: string; preferredName?: string; email?: string; studentId?: string | number };
  recording?: { filePath?: string | null; status?: string } | null;
  teacherReport?: {
    attendanceStatus: string;
    topicsCovered?: string;
    surahOrLesson?: string;
    fromAyahOrPage?: string;
    toAyahOrPage?: string;
    sabaqiRevision?: string;
    manzilRevision?: string;
    performanceRating?: number;
    understandingLevel?: string;
    tajweedLevel?: string;
    behavior?: string;
    homeworkAssignment?: string;
    teacherNotes?: string;
    submittedAt?: string;
  } | null;
}

interface ClassesHistoryTabProps {
  sessions: SessionItem[];
  sessionsLoading: boolean;
  onRefresh: () => void;
}

export default function ClassesHistoryTab({
  sessions,
  sessionsLoading,
  onRefresh,
}: ClassesHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedReportSession, setSelectedReportSession] = useState<SessionItem | null>(null);
  const [reportingSession, setReportingSession] = useState<SessionItem | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const pastSessions = sessions.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'CANCELLED' || s.status === 'EXPIRED'
  );

  const filteredSessions = pastSessions.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const course = s.course?.title?.toLowerCase() || '';
    const student = (s.student?.preferredName || s.student?.name || '').toLowerCase();
    return course.includes(q) || student.includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground">
            Classes History &amp; Lesson Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review completed lessons, submit pending class reports, and inspect student recordings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border">
            {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? 'All History' : st === 'COMPLETED' ? 'Completed' : 'Cancelled'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-primary text-foreground"
            />
          </div>
        </div>
      </div>

      {sessionsLoading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-mono">Loading class history...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-border bg-card/20 max-w-xl mx-auto space-y-3">
          <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Historical Classes Found</h3>
          <p className="text-xs text-muted-foreground">
            No completed or cancelled classes match your selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const sessId = session.id || session._id;
            const studentName = session.student?.preferredName || session.student?.name || 'Student';
            const courseTitle = session.course?.title || 'Course';
            const hasReport = Boolean(session.teacherReport);
            const isReadyRecording = session.recording?.status === 'READY';

            return (
              <div
                key={sessId}
                className="glass-panel rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-primary/40 transition-all relative"
              >
                <div className="space-y-3">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        session.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {session.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.durationMinutes} mins
                    </span>
                  </div>

                  {/* Course & Student */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {courseTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Student: <span className="font-semibold text-foreground">{studentName}</span>
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/20 p-2 rounded-xl border border-border/40">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      {formatPKTDate(session.scheduledAt)} at {formatPKTTime(session.scheduledAt)} PKT
                    </span>
                  </div>

                  {/* Report summary preview if available */}
                  {hasReport ? (
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Report Filed
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span className="font-mono font-bold text-foreground">
                            {session.teacherReport?.performanceRating}/5
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-foreground truncate">
                        Lesson: {session.teacherReport?.topicsCovered || session.teacherReport?.surahOrLesson}
                      </p>
                    </div>
                  ) : session.status === 'COMPLETED' ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Report Pending
                      </span>
                      <button
                        onClick={() => setReportingSession(session)}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Submit Now &rarr;
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                  {hasReport ? (
                    <button
                      onClick={() => setSelectedReportSession(session)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span>View Report</span>
                    </button>
                  ) : session.status === 'COMPLETED' ? (
                    <button
                      onClick={() => setReportingSession(session)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Submit Report</span>
                    </button>
                  ) : (
                    <span className="flex-1 text-center text-xs text-muted-foreground italic">
                      No report required
                    </span>
                  )}

                  {isReadyRecording && (
                    <button
                      onClick={() => {
                        const url = `${API_URL}/recordings/${sessId}/stream`;
                        setActiveVideoUrl(url);
                      }}
                      className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      title="Watch Recording"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Report Modal */}
      <ViewClassReportModal
        isOpen={Boolean(selectedReportSession)}
        report={selectedReportSession?.teacherReport}
        session={selectedReportSession}
        onClose={() => setSelectedReportSession(null)}
      />

      {/* Post Class Report Modal */}
      {reportingSession && (
        <PostClassReportModal
          isOpen={Boolean(reportingSession)}
          sessionId={reportingSession.id || (reportingSession as any)._id}
          sessionInfo={reportingSession}
          onClose={() => setReportingSession(null)}
          onSuccess={() => {
            setReportingSession(null);
            onRefresh();
          }}
        />
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        videoUrl={activeVideoUrl}
        onClose={() => setActiveVideoUrl(null)}
      />
    </div>
  );
}
