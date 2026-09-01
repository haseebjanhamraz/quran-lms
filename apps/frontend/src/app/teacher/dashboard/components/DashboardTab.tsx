import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, PlayCircle, PlaneTakeoff,
  History, Sparkles, X, Loader2, CheckCircle2, Zap
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/utils/apiFetch';
import { formatPKTTime, formatPKTDate } from '@/utils/islamabadTime';
import { useUrlState } from '@/hooks/useUrlState';

interface DashboardTabProps {
  user: any;
  stats: any;
  sessions: any[];
  courses: any[];
  students: any[];
  recentReviews: any[];
  leaves: any[];
  leaveBalance: any;
  handleStartClass: (id: string) => void;
  handleActivateClass?: (id: string) => void;
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
  handleStartClass,
  handleActivateClass,
  onOpenInstantModal,
  canStartInstantClass = true,
}: DashboardTabProps) {
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const daySessions = useMemo(() => {
    return sessions
      .filter((s) => {
        try {
          const sDate = new Date(s.scheduledAt).toISOString().split('T')[0];
          return sDate === selectedDate;
        } catch (_) {
          return false;
        }
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const studentName = s.student?.name || s.student?.preferredName || '';
        const courseTitle = s.course?.title || '';
        return studentName.toLowerCase().includes(q) || courseTitle.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [sessions, selectedDate, searchQuery]);

  const handleSetToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);
  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  const handleSetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              Teacher Student's List
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
                  selectedDate === new Date().toISOString().split('T')[0]
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
              {daySessions.length} {daySessions.length === 1 ? 'Class' : 'Classes'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Classes Schedule Table matching reference */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        {daySessions.length === 0 ? (
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
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-muted-foreground text-[11px] text-center">Advance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {daySessions.map((session, idx) => {
                  const studentName = session.student?.name || session.student?.preferredName || 'Unassigned Student';
                  const isLive = session.status === 'LIVE';

                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-muted/30 transition-colors ${
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
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[10px] shrink-0 border border-brand/20">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{studentName}</p>
                            {session.student?.email && (
                              <p className="text-[10px] text-muted-foreground">{session.student.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground">
                          {session.course?.title || session.course?.type || 'Quran Recitation'}
                        </span>
                      </td>

                      {/* History Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(session)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
                          title="View Attendance & Progress History"
                        >
                          <History className="h-3.5 w-3.5 text-brand" />
                          <span>History</span>
                        </button>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            session.status === 'LIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                              : session.status === 'ACTIVATED'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                              : session.status === 'COMPLETED'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : session.status === 'CANCELLED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : session.student?.studentStatus === 'Trial' || session.student?.status === 'Trial'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {session.status === 'LIVE'
                            ? '● Live Now'
                            : session.status === 'ACTIVATED'
                            ? '⚡ Activated'
                            : session.status === 'COMPLETED'
                            ? 'Completed'
                            : session.status === 'CANCELLED'
                            ? 'Cancelled'
                            : session.student?.studentStatus === 'Trial'
                            ? 'Trial'
                            : 'Regular'}
                        </span>
                      </td>

                      {/* Leave Button (Blue) */}
                      <td className="py-3.5 px-4 text-center">
                        {(() => {
                          const isEndedOrCompleted =
                            session.status === 'COMPLETED' ||
                            session.status === 'ENDED' ||
                            session.status === 'CANCELLED';
                          return (
                            <button
                              type="button"
                              disabled={isEndedOrCompleted}
                              onClick={() => handleOpenLeaveModal(session)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                isEndedOrCompleted
                                  ? 'bg-muted text-muted-foreground border border-border opacity-50 cursor-not-allowed'
                                  : 'bg-sky-500 hover:bg-sky-600 text-white'
                              }`}
                              title={
                                isEndedOrCompleted
                                  ? 'Leave request disabled for completed or ended classes'
                                  : 'Request Leave for this Class'
                              }
                            >
                              Leave
                            </button>
                          );
                        })()}
                      </td>

                      {/* Action Button: Activate (Amber) vs Start Class (Green) */}
                      <td className="py-3.5 px-4 text-center">
                        {session.status === 'SCHEDULED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (handleActivateClass) {
                                handleActivateClass(session.id);
                              } else {
                                handleStartClass(session.id);
                              }
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm flex items-center justify-center gap-1 mx-auto"
                            title="Activate session to prepare for class"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Activate</span>
                          </button>
                        ) : session.status === 'ACTIVATED' ? (
                          <button
                            type="button"
                            onClick={() => handleStartClass(session.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md flex items-center justify-center gap-1 mx-auto animate-pulse"
                            title="Start Live Class Now"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Start Class</span>
                          </button>
                        ) : session.status === 'LIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleStartClass(session.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center justify-center gap-1 mx-auto"
                            title="Enter Ongoing Live Class"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Enter Class</span>
                          </button>
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
    </div>
  );
}
