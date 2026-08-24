'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Award, PlayCircle, MonitorPlay, Users,
  TrendingUp, Video, ArrowRight, ShieldCheck, Plus, CheckCircle2,
  AlertCircle, ChevronRight, Copy, Check, PlaneTakeoff, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  onOpenInstantModal: () => void;
  onNavigateTab: (tab: any) => void;
  router: any;
  canStartInstantClass?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  NAZIRA: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  ARABIC: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  TAJWEED: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  HIFZ_UL_QURAN: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  ISLAMIC_STUDIES: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DashboardTab({
  user,
  stats,
  sessions,
  courses,
  students,
  recentReviews,
  leaves = [],
  leaveBalance,
  handleStartClass,
  onOpenInstantModal,
  onNavigateTab,
  router,
  canStartInstantClass = true,
}: DashboardTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyLink = (sessionId: string) => {
    const link = `${window.location.origin}/classroom/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(sessionId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter today's sessions
  const todayDateStr = new Date().toDateString();
  const todaySessions = sessions.filter((s) => {
    return new Date(s.scheduledAt).toDateString() === todayDateStr && s.status !== 'CANCELLED';
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Next upcoming class (live first, or nearest scheduled)
  const nextSession = sessions.find((s) => s.status === 'LIVE') ||
    sessions
      .filter((s) => s.status === 'SCHEDULED' && new Date(s.scheduledAt).getTime() >= Date.now() - 30 * 60 * 1000)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  // Recent 3 leaves
  const recentLeaves = leaves.slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Welcome & Time Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-primary/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl border-2 border-primary/40 bg-primary/10 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {user?.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold font-display text-primary">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground tracking-tight">
                  Assalamu Alaikum, {user?.name || 'Teacher'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} &bull; <span className="font-mono text-foreground font-semibold">{currentTime || 'Loading...'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenInstantModal}
              title={canStartInstantClass ? 'Start Instant Class' : 'Instant class creation disabled in Roles & Permissions (schedule.create)'}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                canStartInstantClass
                  ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105'
                  : 'bg-muted text-muted-foreground border border-border opacity-70 hover:opacity-100'
              }`}
            >
              <Sparkles size={16} />
              <span>Instant Class</span>
              {!canStartInstantClass && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded ml-1">Disabled</span>}
            </button>
            <Link
              href="/teacher/leave"
              className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-xs font-bold text-foreground shadow-sm hover:border-brand/50 hover:bg-card transition-all"
            >
              <PlaneTakeoff size={16} className="text-brand" />
              <span>Apply for Leave</span>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* 2. Key Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Calendar size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats?.today ?? todaySessions.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Classes Today</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <Clock size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Hours</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats?.totalHours ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Hours Taught</p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between text-violet-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats?.completed ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed Sessions</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Users size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats?.totalStudents ?? students.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active Learners</p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <Video size={18} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats?.live ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Live Classes Now</p>
        </div>

        <Link
          href="/teacher/leave"
          className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <PlaneTakeoff size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:underline">Balance</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {leaveBalance?.summary?.totalRemaining ?? stats?.remainingLeaves?.totalRemaining ?? 37}
            <span className="text-xs font-normal text-muted-foreground ml-1">days left</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats?.pendingLeaves ? `${stats.pendingLeaves} pending` : 'Leave Balance'}
          </p>
        </Link>
      </div>

      {/* 3. Main Dashboard Body: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upcoming Class & Today's Schedule & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Next Class Hero Card */}
          {nextSession ? (
            <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card/90 p-6 shadow-lg backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {nextSession.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Class is Live Right Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-extrabold text-primary uppercase tracking-wider">
                        <Clock size={12} />
                        Next Scheduled Session
                      </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[nextSession.course?.type] || 'text-muted-foreground bg-muted'}`}>
                      {nextSession.course?.type?.replace(/_/g, ' ') || 'QURAN'}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-foreground">
                    {nextSession.course?.title || 'Quran Recitation Session'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-primary" />
                      {formatDate(nextSession.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-primary" />
                      {formatTime(nextSession.scheduledAt)} ({nextSession.durationMinutes} mins)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
                  <button
                    onClick={() => handleCopyLink(nextSession.id)}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      copiedId === nextSession.id
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'border-border bg-muted/40 text-foreground hover:bg-muted'
                    }`}
                  >
                    {copiedId === nextSession.id ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === nextSession.id ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  {nextSession.status === 'LIVE' ? (
                    <button
                      onClick={() => router.push(`/classroom/${nextSession.id}`)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                    >
                      <MonitorPlay size={16} />
                      <span>Enter Classroom</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartClass(nextSession.id)}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                    >
                      <PlayCircle size={16} />
                      <span>Start Class</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card/60 p-6 text-center backdrop-blur-sm">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">No upcoming classes right now</p>
              <p className="text-xs text-muted-foreground mt-1">You are all caught up for the moment!</p>
            </div>
          )}

          {/* Today's Schedule Card */}
          <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-md backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-display font-bold text-foreground flex items-center gap-2">
                  <Calendar size={18} className="text-brand" />
                  Today&apos;s Schedule
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} scheduled for today
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('Schedule')}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
              >
                View Full Timetable <ChevronRight size={14} />
              </button>
            </div>

            {todaySessions.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border/80 rounded-2xl">
                <p className="text-xs text-muted-foreground">No classes scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {formatTime(session.scheduledAt).split(' ')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground">{session.course?.title}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[session.course?.type] || 'text-muted-foreground bg-muted'}`}>
                            {session.course?.type?.replace(/_/g, ' ')}
                          </span>
                          {session.status === 'LIVE' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatTime(session.scheduledAt)} &bull; {session.durationMinutes} mins
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {session.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStartClass(session.id)}
                          className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                        >
                          <PlayCircle size={13} />
                          Start
                        </button>
                      )}
                      {session.status === 'LIVE' && (
                        <button
                          onClick={() => router.push(`/classroom/${session.id}`)}
                          className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-all shadow-sm"
                        >
                          <MonitorPlay size={13} />
                          Enter
                        </button>
                      )}
                      {session.status === 'COMPLETED' && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <CheckCircle2 size={13} className="text-emerald-500" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={onOpenInstantModal}
              title={canStartInstantClass ? 'Start Instant Class' : 'Instant class creation disabled in Roles & Permissions (schedule.create)'}
              className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 text-left transition-all group shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-3 group-hover:scale-110 transition-transform">
                <Sparkles size={18} />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-foreground">Instant Class</p>
                {!canStartInstantClass && (
                  <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded">Off</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {canStartInstantClass ? 'Start now (30-60m)' : 'Permission required'}
              </p>
            </button>

            <button
              onClick={() => router.push('/teacher/schedule')}
              className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-brand/40 text-left transition-all group shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-brand/10 text-brand w-fit mb-3 group-hover:scale-110 transition-transform">
                <Plus size={18} />
              </div>
              <p className="text-xs font-bold text-foreground">Schedule Class</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Plan ahead</p>
            </button>

            <Link
              href="/teacher/leave"
              className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-indigo-500/40 text-left transition-all group shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                <PlaneTakeoff size={18} />
              </div>
              <p className="text-xs font-bold text-foreground">Leave Portal</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Manage leaves</p>
            </Link>

            <button
              onClick={() => onNavigateTab('Class Recordings')}
              className="p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-violet-500/40 text-left transition-all group shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                <Video size={18} />
              </div>
              <p className="text-xs font-bold text-foreground">Recordings</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Watch archives</p>
            </button>
          </div>
        </div>

        {/* Right Column: Leave Quota & Recent QA Feedback */}
        <div className="space-y-6">

          {/* Leave Quota & Requests Widget */}
          <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-md backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-foreground flex items-center gap-2">
                <PlaneTakeoff size={18} className="text-indigo-400" />
                Leave Overview
              </h3>
              <Link href="/teacher/leave" className="text-xs font-bold text-brand hover:underline">
                View All &rarr;
              </Link>
            </div>

            {/* Leave Balances Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Sick Leave</p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {leaveBalance?.remaining?.sick ?? 10} <span className="text-[10px] text-muted-foreground font-normal">/ {leaveBalance?.allocated?.sick ?? 10}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Casual Leave</p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {leaveBalance?.remaining?.casual ?? 12} <span className="text-[10px] text-muted-foreground font-normal">/ {leaveBalance?.allocated?.casual ?? 12}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Annual Leave</p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {leaveBalance?.remaining?.annual ?? 15} <span className="text-[10px] text-muted-foreground font-normal">/ {leaveBalance?.allocated?.annual ?? 15}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Other Leave</p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {leaveBalance?.remaining?.other ?? 5} <span className="text-[10px] text-muted-foreground font-normal">/ {leaveBalance?.allocated?.other ?? 5}</span>
                </p>
              </div>
            </div>

            {/* Recent Leaves Status */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Recent Applications</p>
              {recentLeaves.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No leave applications recorded.</p>
              ) : (
                recentLeaves.map((l) => (
                  <div key={l._id || l.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs">
                    <div>
                      <p className="font-bold text-foreground">{l.leaveType} ({l.totalDays}d)</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(l.startDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      l.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      l.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      l.status === 'CANCELLED' ? 'bg-muted text-muted-foreground' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QA Feedback Widget */}
          <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-md backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-foreground flex items-center gap-2">
                <Award size={18} className="text-brand" />
                QA Scorecards
              </h3>
              <Link href="/teacher/feedback" className="text-xs font-bold text-brand hover:underline">
                View All &rarr;
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-border/80 rounded-2xl">
                <p className="text-xs text-muted-foreground">No evaluation scorecards yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReviews.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => router.push(`/teacher/feedback/${rev.session?.id || rev.id}`)}
                    className="p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground truncate max-w-[150px]">
                        {rev.session?.course?.title || 'Class Evaluation'}
                      </p>
                      <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        {rev.overallScore ? rev.overallScore.toFixed(1) : '5.0'}/5.0
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                      &ldquo;{rev.strengths || rev.improvements || 'Evaluation complete.'}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
