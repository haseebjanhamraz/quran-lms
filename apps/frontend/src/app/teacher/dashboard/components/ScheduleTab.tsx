import React from 'react';
import { Calendar, Clock, Loader2, PlayCircle, MonitorPlay, Award } from 'lucide-react';
import Link from 'next/link';

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
}

interface ScheduleTabProps {
  sessions: SessionItem[];
  sessionsLoading: boolean;
  startingId: string | null;
  recentReviews: any[];
  reviewsLoading: boolean;
  handleStartClass: (id: string) => void;
  router: any;
}

const TYPE_COLORS: Record<string, string> = {
  NAZIRA: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  ARABIC: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  TAJWEED: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  ISLAMIC_STUDIES: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

const CIRCLE_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

function circleColor(index: number): string {
  return CIRCLE_COLORS[index % CIRCLE_COLORS.length];
}

function typeLabel(type: string): string {
  return type.replace(/_/g, ' ');
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ScheduleTab({
  sessions,
  sessionsLoading,
  startingId,
  recentReviews,
  reviewsLoading,
  handleStartClass,
  router,
}: ScheduleTabProps) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Class schedule */}
      <div className="xl:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold" style={{ color: '#C9A84C' }}>
            Your Class Schedule
          </h2>
          <span className="rounded-full border border-slate-700/50 bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            {sessions.filter((s) => s.status !== 'CANCELLED').length} active sessions
          </span>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-emerald-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-16 text-center backdrop-blur-sm">
            <p className="font-semibold text-slate-350">No sessions scheduled yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session, i) => (
              <div key={session.id} className="relative">
                {startingId === session.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm">
                    <Loader2 size={22} className="animate-spin text-emerald-400" />
                  </div>
                )}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-600/60 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4 sm:items-center">
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${circleColor(i)} text-base font-bold text-white shadow-lg`}>
                      {session.course.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-100">{session.course.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[session.course.type] || 'text-slate-400 bg-slate-400/10'}`}>
                          {typeLabel(session.course.type)}
                        </span>
                        {session.status === 'LIVE' && (
                          <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDateTime(session.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {session.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
                    {session.status === 'SCHEDULED' && (
                      <>
                        <button
                          onClick={() => router.push(`/teacher/schedule?id=${session.id}`)}
                          className="rounded-xl border border-slate-600/50 px-3 py-1.5 text-xs font-medium text-slate-350 hover:border-slate-500 hover:text-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStartClass(session.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-400"
                        >
                          <PlayCircle size={14} />
                          Start Class
                        </button>
                      </>
                    )}
                    {session.status === 'LIVE' && (
                      <button
                        onClick={() => router.push(`/classroom/${session.id}`)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-400"
                      >
                        <MonitorPlay size={14} />
                        Enter Classroom
                      </button>
                    )}
                    {session.status === 'COMPLETED' && (
                      <button
                        onClick={() => router.push(`/teacher/feedback/${session.id}`)}
                        className="flex items-center gap-1.5 rounded-xl border border-teal-500/50 px-4 py-1.5 text-xs font-semibold text-teal-400 transition-all duration-200 hover:bg-teal-500/10"
                      >
                        <Award size={14} />
                        View Feedback
                      </button>
                    )}
                    {session.status === 'CANCELLED' && (
                      <span className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-700">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QA Feedback summary */}
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: '#C9A84C' }}>
            <Award size={20} className="text-[#C9A84C]" />
            QA Feedback summary
          </h2>
          <Link href="/teacher/feedback" className="text-xs text-[#C9A84C] hover:underline font-semibold">
            See all &rarr;
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          {reviewsLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
            </div>
          ) : recentReviews.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No evaluation scorecards yet.</p>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  onClick={() => router.push(`/teacher/feedback/${rev.session.id}`)}
                  className="cursor-pointer border-b border-slate-800/80 pb-3 last:border-0 last:pb-0 hover:bg-white/[0.01] p-1.5 rounded transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-xs text-slate-200 truncate">{rev.session.course.title}</p>
                    <span className="text-xs font-mono font-bold text-amber-400">{rev.overallScore.toFixed(1)}/5.0</span>
                  </div>
                  <p className="text-[11px] text-slate-450 mt-1 line-clamp-2 italic">
                    &ldquo;{rev.strengths || rev.improvements || 'Evaluation complete.'}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
