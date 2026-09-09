'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlayCircle, MonitorPlay, Clock, Calendar, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/apiFetch';

interface SessionItem {
  id: string;
  _id?: string;
  course?: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  teacherId?: any;
  studentId?: any;
  livekitRoomId?: string;
}

interface UpcomingClassBannerProps {
  userRole?: string;
  userId?: string;
  className?: string;
}

export default function UpcomingClassBanner({ userRole = 'STUDENT', userId, className = '' }: UpcomingClassBannerProps) {
  const router = useRouter();
  const [upcomingSession, setUpcomingSession] = useState<SessionItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchUpcoming = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      const res = await apiFetch(`${API_URL}/class-sessions/calendar`);
      if (res.ok) {
        const sessions: SessionItem[] = await res.json();
        if (Array.isArray(sessions)) {
          const now = new Date().getTime();
          const liveOrActive = sessions.find((s) => s.status === 'LIVE' || s.status === 'ACTIVATED');
          if (liveOrActive) {
            setUpcomingSession(liveOrActive);
          } else {
            const scheduled = sessions
              .filter((s) => (s.status === 'SCHEDULED' || s.status === 'ACTIVATED') && (new Date(s.scheduledAt).getTime() + (s.durationMinutes || 30) * 60000 + 45 * 60000) >= now)
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
            setUpcomingSession(scheduled[0] || null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch upcoming session:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUpcoming(true);
    const interval = setInterval(() => fetchUpcoming(false), 30000);
    return () => clearInterval(interval);
  }, [fetchUpcoming]);

  useEffect(() => {
    if (!upcomingSession) return;

    const updateTimer = () => {
      if (upcomingSession.status === 'LIVE') {
        setTimeRemaining('LIVE IN PROGRESS');
        return;
      }

      const now = Date.now();
      const start = new Date(upcomingSession.scheduledAt).getTime();
      const diffMs = start - now;

      if (diffMs <= 0) {
        setTimeRemaining('Starting Now');
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

        if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeRemaining(`In ${days} day${days > 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeRemaining(`In ${hours}h ${mins}m ${secs}s`);
        } else {
          setTimeRemaining(`In ${mins}m ${secs}s`);
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [upcomingSession]);

  // Render loading skeleton while fetching upcoming session
  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card/80 via-card/40 to-muted/20 p-4 sm:p-5 shadow-lg backdrop-blur-xs transition-all ${className}`}
      >
        {/* Subtle background glow effect */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none animate-pulse" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {/* Pulsing Icon Box Skeleton */}
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted/80 border border-border/60 animate-pulse flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground/30 animate-pulse" />
            </div>

            <div className="space-y-2 flex-1 sm:flex-initial">
              {/* Badges Row Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 rounded-full bg-muted/80 animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted/60 animate-pulse" />
              </div>

              {/* Course Title Skeleton */}
              <div className="h-5 w-48 sm:w-64 rounded-md bg-muted/90 animate-pulse" />

              {/* Date & Countdown Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-36 sm:w-44 rounded bg-muted/60 animate-pulse" />
                <span className="text-muted-foreground/30 text-xs">•</span>
                <div className="h-3.5 w-24 sm:w-28 rounded bg-muted/70 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="self-end sm:self-center shrink-0 w-full sm:w-auto flex flex-col items-end sm:items-center gap-1.5">
            <div className="h-10 w-36 sm:w-44 rounded-xl bg-muted/80 animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted/40 animate-pulse hidden sm:block" />
          </div>
        </div>
      </div>
    );
  }

  if (!upcomingSession) return null;

  const sessionId = upcomingSession.id || upcomingSession._id;
  const isLive = upcomingSession.status === 'LIVE';
  const isActivated = upcomingSession.status === 'ACTIVATED';
  const courseTitle = upcomingSession.course?.title || 'Quranic Studies';
  const courseType = upcomingSession.course?.type || 'STANDARD';

  // Only allow joining when the session is LIVE, ACTIVATED, or current time has reached scheduledAt
  const scheduledMs = new Date(upcomingSession.scheduledAt).getTime();
  const canJoin = isLive || isActivated || Date.now() >= scheduledMs;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-xl transition-all ${
      isLive
        ? 'bg-gradient-to-r from-blue-950/90 via-card to-sky-950/70 border-blue-500/60 shadow-blue-500/15 ring-1 ring-blue-500/40'
        : 'bg-gradient-to-r from-brand/15 via-card to-primary/10 border-brand/30 shadow-brand/5 ring-1 ring-brand/20'
    } ${className}`}>

      {/* Blinking Background Glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl pointer-events-none ${
        isLive ? 'bg-blue-500/30 animate-pulse' : 'bg-brand/20 animate-pulse'
      }`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          {/* Pulsing Live / Upcoming Icon Pill */}
          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner ${
            isLive
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
              : 'bg-brand/20 text-brand border-brand/30'
          }`}>
            {isLive ? (
              <>
                <span className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping" />
                <Radio className="h-6 w-6 relative z-10 animate-pulse" />
              </>
            ) : (
              <Clock className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                isLive
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse'
                  : isActivated
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                  : 'bg-brand/15 text-brand border-brand/30'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-blue-400 animate-ping' : isActivated ? 'bg-amber-400 animate-ping' : 'bg-brand'}`} />
                {isLive ? 'LIVE NOW' : isActivated ? 'ACTIVATED & READY' : 'NEXT UPCOMING CLASS'}
              </span>

              <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted/60 border border-border">
                {courseType.replace(/_/g, ' ')}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-bold font-display text-foreground mt-1">
              {courseTitle}
            </h4>

            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-brand" />
                {new Date(upcomingSession.scheduledAt).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(upcomingSession.scheduledAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' })} PKT
              </span>
              <span>•</span>
              <span className={`font-bold font-mono ${isLive ? 'text-blue-400 animate-pulse' : 'text-brand'}`}>
                {timeRemaining}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="self-end sm:self-center shrink-0 flex flex-col items-center gap-1">
          <button
            onClick={() => canJoin && router.push(`/classroom/${sessionId}`)}
            disabled={!canJoin}
            title={canJoin ? undefined : `Class opens at ${new Date(upcomingSession.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all transform ${
              canJoin
                ? isLive
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 animate-bounce hover:scale-105 active:scale-95 cursor-pointer'
                  : isActivated
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/30 animate-pulse hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-brand hover:bg-brand/90 text-brand-foreground shadow-brand/20 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-60'
            }`}
          >
            {isLive ? <MonitorPlay size={16} /> : <PlayCircle size={16} />}
            <span>{isLive ? 'Enter Live Classroom' : isActivated ? 'Start / Enter Classroom' : canJoin ? 'Join Session' : 'Not Yet Open'}</span>
          </button>
          {!canJoin && (
            <span className="text-[10px] text-muted-foreground font-mono text-center">
              Opens in {timeRemaining}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
