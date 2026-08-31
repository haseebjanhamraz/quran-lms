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

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/class-sessions/calendar`);
      if (res.ok) {
        const sessions: SessionItem[] = await res.json();
        if (Array.isArray(sessions)) {
          const now = new Date().getTime();
          const live = sessions.find((s) => s.status === 'LIVE');
          if (live) {
            setUpcomingSession(live);
          } else {
            const scheduled = sessions
              .filter((s) => s.status === 'SCHEDULED' && new Date(s.scheduledAt).getTime() >= now - 15 * 60 * 1000)
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
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 30000);
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

  if (loading || !upcomingSession) return null;

  const sessionId = upcomingSession.id || upcomingSession._id;
  const isLive = upcomingSession.status === 'LIVE';
  const courseTitle = upcomingSession.course?.title || 'Quranic Studies';
  const courseType = upcomingSession.course?.type || 'STANDARD';

  // Only allow joining when the session is LIVE or current time has reached scheduledAt
  const scheduledMs = new Date(upcomingSession.scheduledAt).getTime();
  const canJoin = isLive || Date.now() >= scheduledMs;

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
                  : 'bg-brand/15 text-brand border-brand/30'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-blue-400 animate-ping' : 'bg-brand'}`} />
                {isLive ? 'LIVE NOW' : 'NEXT UPCOMING CLASS'}
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
                {new Date(upcomingSession.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  : 'bg-brand hover:bg-brand/90 text-brand-foreground shadow-brand/20 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-60'
            }`}
          >
            {isLive ? <MonitorPlay size={16} /> : <PlayCircle size={16} />}
            <span>{isLive ? 'Enter Live Classroom' : canJoin ? 'Join Session' : 'Not Yet Open'}</span>
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
