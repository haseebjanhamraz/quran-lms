'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  BookOpen,
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlayCircle,
  Loader2,
  RefreshCw,
  Star,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { formatPKTDate, formatPKTTime } from '@/utils/islamabadTime';
import ViewClassReportModal from '@/components/ViewClassReportModal';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { getClassRowHighlight } from '@/utils/classHighlight';

interface ClassHistoryItem {
  id: string;
  _id?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  course?: { id: string; title: string; type: string };
  teacher?: { id: string; name: string; email: string; profilePicture?: string };
  student?: { id: string; name: string; preferredName?: string; email: string; studentId?: string | number };
  recording?: { filePath?: string; status: string } | null;
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

export default function AdminClassesHistoryPage() {
  const [sessions, setSessions] = useState<ClassHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportSession, setSelectedReportSession] = useState<ClassHistoryItem | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await apiFetch(`${API_URL}/class-sessions/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching class history:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const course = s.course?.title?.toLowerCase() || '';
    const teacher = s.teacher?.name?.toLowerCase() || '';
    const student = (s.student?.preferredName || s.student?.name || '').toLowerCase();
    return course.includes(q) || teacher.includes(q) || student.includes(q);
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              Academy Classes History Audit
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Historical record of completed sessions, student attendance, teacher lesson reports, and recordings.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchHistory()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border w-full sm:w-auto">
          {['ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All Sessions' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search course, teacher, or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-primary text-foreground"
          />
        </div>
      </div>

      {/* Sessions Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-mono">Loading classes history audit...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-border bg-card/20 max-w-xl mx-auto space-y-3">
          <History className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Classes History Found</h3>
          <p className="text-xs text-muted-foreground">
            No class records match the current filter or search criteria.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">Course</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">Teacher</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Date</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">Teacher Report</th>
                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSessions.map((session) => {
                  const hasReport = Boolean(session.teacherReport);
                  const isReadyRecording = session.recording?.status === 'READY';
                  const studentName = session.student?.preferredName || session.student?.name || 'Assigned Student';
                  const teacherName = session.teacher?.name || 'Assigned Teacher';

                  const highlightClass = getClassRowHighlight(session);

                  return (
                    <tr key={session.id || session._id} className={`hover:bg-muted/20 transition-colors ${highlightClass}`}>
                      {/* Course */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground truncate max-w-[180px]">
                              {session.course?.title || 'Quranic Session'}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              {session.durationMinutes} mins
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {teacherName}
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {studentName}
                      </td>

                      {/* Scheduled Date */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-foreground">
                          {formatPKTDate(session.scheduledAt)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatPKTTime(session.scheduledAt)} PKT
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            session.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : session.status === 'CANCELLED'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>

                      {/* Teacher Report */}
                      <td className="px-4 py-3.5">
                        {hasReport ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="h-3 w-3" /> Filed
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {session.teacherReport?.topicsCovered || session.teacherReport?.surahOrLesson}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            Pending Report
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReportSession(session)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span>{hasReport ? 'View Report' : 'Report Details'}</span>
                          </button>

                          {isReadyRecording && (
                            <button
                              onClick={() => {
                                const url = `${API_URL}/recordings/${session.id || session._id}/stream`;
                                setActiveVideoUrl(url);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all cursor-pointer"
                              title="Watch Class Recording"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              <span>Recording</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      <ViewClassReportModal
        isOpen={Boolean(selectedReportSession)}
        report={selectedReportSession?.teacherReport}
        session={selectedReportSession}
        onClose={() => setSelectedReportSession(null)}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        videoUrl={activeVideoUrl}
        onClose={() => setActiveVideoUrl(null)}
      />
    </div>
  );
}
