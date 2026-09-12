import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, PlayCircle, PlaneTakeoff,
  History, Sparkles, X, Loader2, CheckCircle2, Zap,
  UserX, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { apiFetch } from '@/utils/apiFetch';
import { formatPKTTime, formatPKTDate } from '@/utils/islamabadTime';
import { useUrlState } from '@/hooks/useUrlState';
import { getClassRowHighlight } from '@/utils/classHighlight';

interface DashboardTabProps {
  user: any;
  stats: any;
  sessions: any[];
  sessionsLoading?: boolean;
  loading?: boolean;
  courses: any[];
  students: any[];
  recentReviews: any[];
  leaves: any[];
  leaveBalance: any;
  handleStartClass: (id: string) => void;
  handleActivateClass?: (id: string) => void;
  handleMarkAbsent?: (id: string, note?: string) => void;
  onRefresh?: () => void;
  onOpenInstantModal: () => void;
  onNavigateTab: (tab: any) => void;
  router: any;
  canStartInstantClass?: boolean;
}

function formatPKTTimeRange(isoDate: string, durationMinutes: number): string {
  try {
    const start = new Date(isoDate);
    const end = new Date(start.getTime() + (durationMinutes || 30) * 60000);
    const sStr = formatPKTTime(start);
    const eStr = formatPKTTime(end);
    return `${sStr} - ${eStr} PKT`;
  } catch (_) {
    return 'N/A';
  }
}

export default function DashboardTab({
  user,
  sessions,
  sessionsLoading,
  loading,
  handleStartClass,
  handleActivateClass,
  handleMarkAbsent,
  onRefresh,
  onOpenInstantModal,
  canStartInstantClass = true,
  router,
}: DashboardTabProps) {
  const isLoading = loading ?? sessionsLoading ?? false;
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  }, []);

  const [selectedDate, setSelectedDate] = useUrlState('date', todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [historyStudent, setHistoryStudent] = useState<any | null>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [leaveSession, setLeaveSession] = useState<any | null>(null);
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [leaveSubmitting, setLeaveSubmitting] = useState<boolean>(false);
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState<string | null>(null);
  const [leaveErrorMsg, setLeaveErrorMsg] = useState<string | null>(null);

  // Absent Confirmation State
  const [absentSession, setAbsentSession] = useState<any | null>(null);
  const [absentNote, setAbsentNote] = useState<string>('');
  const [absentSubmitting, setAbsentSubmitting] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const isSameDay = (isoDate: string, targetDateStr: string) => {
    try {
      const d = new Date(isoDate);
      const isoYMD = d.toISOString().split('T')[0];
      if (isoYMD === targetDateStr) return true;
      const localYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (localYMD === targetDateStr) return true;
      const pktYMD = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
      return pktYMD === targetDateStr;
    } catch (_) {
      return false;
    }
  };

  const daySessions = useMemo(() => {
    return sessions
      .filter((s) => isSameDay(s.scheduledAt, selectedDate))
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const studentName = s.student?.name || s.student?.preferredName || '';
        const courseTitle = s.course?.title || '';
        return studentName.toLowerCase().includes(q) || courseTitle.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [sessions, selectedDate, searchQuery]);

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };
  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
  };
  const handleSetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
  };

  const handleOpenHistory = async (session: any) => {
    const student = session.student;
    if (!student) {
      alert('Student record not available for this session.');
      return;
    }
    setHistoryStudent(student);
    setLoadingHistory(true);
    try {
      const studentId = student.id || student._id;
      const sRes = await apiFetch(`${API_URL}/class-sessions/calendar`).catch(() => null);
      if (sRes && sRes.ok) {
        const all = await sRes.json();
        const filtered = Array.isArray(all)
          ? all.filter((item) => (item.studentId === studentId || item.student?.id === studentId || item.student?._id === studentId))
          : [];
        setHistorySessions(filtered);
      } else {
        const fallback = sessions.filter((item) => item.student?.id === studentId || item.student?._id === studentId);
        setHistorySessions(fallback);
      }
    } catch (_) {
      setHistorySessions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenLeaveModal = (session: any) => {
    setLeaveSession(session);
    setLeaveReason('');
    setLeaveSuccessMsg(null);
    setLeaveErrorMsg(null);
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveSession) return;
    setLeaveSubmitting(true);
    setLeaveErrorMsg(null);
    try {
      const payload = {
        startDate: new Date(leaveSession.scheduledAt).toISOString().split('T')[0],
        endDate: new Date(leaveSession.scheduledAt).toISOString().split('T')[0],
        reason: leaveReason || `Leave requested for ${leaveSession.student?.name || 'student'} on ${new Date(leaveSession.scheduledAt).toDateString()}`,
        type: 'CASUAL',
      };
      const res = await apiFetch(`${API_URL}/leave`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit leave request.');
      }
      setLeaveSuccessMsg('Leave request submitted successfully!');
      setTimeout(() => {
        setLeaveSession(null);
      }, 1500);
    } catch (err: any) {
      setLeaveErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // Open Absent Confirmation Modal
  const handleOpenAbsentModal = (session: any) => {
    setAbsentSession(session);
    setAbsentNote('');
  };

  const handleConfirmAbsent = async () => {
    if (!absentSession) return;
    setAbsentSubmitting(true);
    try {
      const sId = absentSession.id || absentSession._id;
      if (handleMarkAbsent) {
        await handleMarkAbsent(sId, absentNote);
      } else {
        const res = await apiFetch(`${API_URL}/class-sessions/${sId}/mark-absent`, {
          method: 'POST',
          body: JSON.stringify({ note: absentNote.trim() || undefined }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to mark student absent.');
        }
        toast.success('Student marked as absent. Class completed.');
        if (onRefresh) onRefresh();
      }
      setAbsentSession(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark student absent.');
    } finally {
      setAbsentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              Teacher
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
              <span>Home</span>
              <span>&raquo;</span>
              <span className="text-primary font-semibold">Current Day Class List</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenInstantModal}
              title={canStartInstantClass ? 'Start Instant Live Class' : 'Instant class creation disabled in Roles & Permissions'}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${
                canStartInstantClass
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                  : 'bg-muted text-muted-foreground border border-border opacity-70'
              }`}
            >
              <Sparkles size={14} />
              <span>Instant Class</span>
              {!canStartInstantClass && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded ml-1">Disabled</span>}
            </button>
            <Link
              href="/teacher/leave"
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
            >
              <PlaneTakeoff size={14} className="text-brand" />
              <span>Apply for Leave</span>
            </Link>
          </div>
        </div>

        {/* 2. Date Filter Controls */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              List of Classes on:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-mono"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSetYesterday}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                  selectedDate === todayStr
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleSetTomorrow}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                Tomorrow
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search student or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary w-48 sm:w-56"
            />
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              {isLoading ? 'Loading...' : `${daySessions.length} ${daySessions.length === 1 ? 'Class' : 'Classes'}`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Classes Schedule Table matching reference */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Class Timing (PKT)</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Duration</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Student</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Course</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">History</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Leave</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Start Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-4 bg-muted/80 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-32 bg-muted/80 rounded-lg" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-16 bg-muted/70 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-muted/80 shrink-0" />
                        <div className="space-y-1">
                          <div className="h-4 w-28 bg-muted/90 rounded" />
                          <div className="h-3 w-16 bg-muted/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-28 bg-muted/80 rounded-lg" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-16 bg-muted/60 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-20 bg-muted/80 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-14 bg-muted/60 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-8 w-24 bg-muted/80 rounded-xl mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : daySessions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="h-7 w-7 opacity-60" />
            </div>
            <p className="text-base font-bold text-foreground">No Classes Scheduled</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are no classes scheduled on {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Class Timing (PKT)</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Duration</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Student</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px]">Course</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">History</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Leave</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Start Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {daySessions.map((session, idx) => {
                  const studentCandidates: Array<{ name: string }> = [];
                  if (session.student?.name) {
                    studentCandidates.push({ name: session.student.name });
                  }
                  if (Array.isArray((session as any).students)) {
                    (session as any).students.forEach((st: any) => {
                      if (st?.name && !studentCandidates.some(e => e.name === st.name)) {
                        studentCandidates.push({ name: st.name });
                      }
                    });
                  }
                  if (Array.isArray((session as any).enrolledStudents)) {
                    (session as any).enrolledStudents.forEach((st: any) => {
                      if (st?.name && !studentCandidates.some(e => e.name === st.name)) {
                        studentCandidates.push({ name: st.name });
                      }
                    });
                  }
                  const hasStudents = studentCandidates.length > 0;
                  const isLive = session.status === 'LIVE';
                  const id = session.id || session._id || `session-${idx}`;
                  const highlightClass = getClassRowHighlight(session);

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-muted/30 transition-colors ${highlightClass} ${
                        isLive ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      {/* # Index */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-muted-foreground">
                        {idx + 1}
                      </td>

                      {/* Class Time Interval in PKT */}
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                        {formatPKTTimeRange(session.scheduledAt, session.durationMinutes)}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-muted-foreground whitespace-nowrap">
                        {session.durationMinutes || 30} Mins
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        {hasStudents ? (
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {studentCandidates.map((st, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[9px] shrink-0 border border-brand/20">
                                  {st.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground text-xs leading-tight">{st.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-[9px] shrink-0 border border-border">
                              U
                            </div>
                            <p className="text-xs text-muted-foreground italic">Unassigned</p>
                          </div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground">
                          {session.course?.title || 'Quranic Course'}
                        </span>
                      </td>

                      {/* History Column (View previous reports) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenHistoryModal(session)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center justify-center gap-1 mx-auto"
                          title="View past class evaluations and lesson history for this student"
                        >
                          <History className="h-3 w-3 text-muted-foreground" />
                          <span>History</span>
                        </button>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4 text-center">
                        {isLive ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Now
                          </span>
                        ) : session.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : session.status === 'ACTIVATED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center gap-1 mx-auto w-fit">
                            <Zap className="h-3 w-3" />
                            Activated
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border flex items-center justify-center gap-1 mx-auto w-fit">
                            <Clock className="h-3 w-3" />
                            Scheduled
                          </span>
                        )}
                      </td>

                      {/* Leave Column */}
                      <td className="py-3.5 px-4 text-center">
                        {(() => {
                          const isLeaveDisabled = session.status === 'COMPLETED' || session.status === 'ENDED' || session.status === 'CANCELLED';
                          return (
                            <button
                              type="button"
                              disabled={isLeaveDisabled}
                              onClick={() => !isLeaveDisabled && handleOpenLeaveModal(session)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1 mx-auto ${
                                isLeaveDisabled
                                  ? 'bg-muted/40 text-muted-foreground/40 border border-border/40 cursor-not-allowed'
                                  : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 cursor-pointer'
                              }`}
                              title={
                                isLeaveDisabled
                                  ? 'Leave request disabled for completed or ended classes'
                                  : 'Request Leave for this Class'
                              }
                            >
                              Leave
                            </button>
                          );
                        })()}
                      </td>

                      {/* Start Class Column (Start Class / Absent) */}
                      <td className="py-3.5 px-4 text-center">
                        {session.status === 'SCHEDULED' ? (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-muted text-muted-foreground border border-border opacity-50 cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
                            title="Class must be activated before starting"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Start Class</span>
                          </button>
                        ) : session.status === 'ACTIVATED' ? (
                          <button
                            type="button"
                            onClick={() => handleStartClass(session.id || session._id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center justify-center gap-1 mx-auto animate-pulse"
                            title="Start Live Class Now"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Start Class</span>
                          </button>
                        ) : session.status === 'LIVE' ? (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAbsentModal(session)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm flex items-center justify-center gap-1 mx-auto"
                              title="Student did not attend — Mark Absent"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              <span>Absent</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/classroom/${session.id || session._id}`)}
                              className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 hover:underline transition-colors"
                              title="Enter Ongoing Live Classroom"
                            >
                              Enter Class &rarr;
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {session.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Student History Modal */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20">
                  {historyStudent.name ? historyStudent.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Class History: {historyStudent.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Timezone: <span className="font-mono text-foreground">{historyStudent.timezone || 'UTC'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sessions List */}
            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : historySessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No past class sessions recorded yet for this student.
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {historySessions.map((hs, i) => (
                  <div
                    key={hs.id || i}
                    className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {new Date(hs.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {new Date(hs.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} &bull; {hs.durationMinutes || 30} mins &bull; {hs.course?.title || 'Quran Class'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          hs.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : hs.status === 'LIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {hs.status}
                      </span>
                      {hs.recording?.filePath && (
                        <a
                          href={hs.recording.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                          title="Watch Recording"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Leave Request Modal */}
      {leaveSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <PlaneTakeoff className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Submit Leave Application</h3>
                  <p className="text-xs text-muted-foreground">Class with {leaveSession.student?.name || 'Student'}</p>
                </div>
              </div>
              <button
                onClick={() => setLeaveSession(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {leaveSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-foreground">{leaveSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLeave} className="space-y-4">
                {leaveErrorMsg && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                    {leaveErrorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Class Date</label>
                  <input
                    type="text"
                    disabled
                    value={new Date(leaveSession.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2.5 text-xs font-medium text-foreground outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Reason for Leave *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide reason for missing / rescheduling this session..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-2.5 text-xs outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setLeaveSession(null)}
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={leaveSubmitting}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {leaveSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Submit Leave</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}



      {/* 6. Mark Absent Confirmation Modal */}
      {absentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <UserX size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Mark Student Absent
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Record absent status for this live session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAbsentSession(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs">
              <p className="font-bold text-foreground">
                Student: {absentSession.student?.name || absentSession.student?.preferredName || 'Student'}
              </p>
              <p className="text-muted-foreground">
                Course: {absentSession.course?.title || 'Quran Recitation'}
              </p>
              <p className="font-mono text-muted-foreground">
                Scheduled: {formatPKTTime(new Date(absentSession.scheduledAt))} PKT
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Are you sure the student did not attend? This will mark the student absent, log 0 attendance minutes, and complete this class.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Optional Note</label>
              <input
                type="text"
                value={absentNote}
                onChange={(e) => setAbsentNote(e.target.value)}
                placeholder="e.g. Student did not join after 15 minutes of waiting..."
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={() => setAbsentSession(null)}
                disabled={absentSubmitting}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAbsent}
                disabled={absentSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {absentSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Absent</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
