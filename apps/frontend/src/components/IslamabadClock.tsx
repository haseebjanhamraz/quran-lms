'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';
import { ACADEMY_TIMEZONE } from '@/utils/islamabadTime';

interface IslamabadClockProps {
  variant?: 'header' | 'badge' | 'card' | 'compact';
  className?: string;
  showDate?: boolean;
}

export default function IslamabadClock({
  variant = 'badge',
  className = '',
  showDate = true,
}: IslamabadClockProps) {
  const [mounted, setMounted] = useState(false);
  const [timeState, setTimeState] = useState<{
    timeString: string;
    seconds: string;
    period: string;
    dateString: string;
    dayName: string;
  }>({
    timeString: '--:--',
    seconds: '00',
    period: 'PKT',
    dateString: '',
    dayName: '',
  });

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();

      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: ACADEMY_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const parts = timeFormatter.formatToParts(now);
      let hour = '12';
      let minute = '00';
      let second = '00';
      let period = 'AM';

      for (const p of parts) {
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
        if (p.type === 'second') second = p.value;
        if (p.type === 'dayPeriod') period = p.value;
      }

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: ACADEMY_TIMEZONE,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: ACADEMY_TIMEZONE,
        weekday: 'long',
      });

      setTimeState({
        timeString: `${hour}:${minute}`,
        seconds: second,
        period,
        dateString: dateFormatter.format(now),
        dayName: dayFormatter.format(now),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 border border-border/60 text-xs font-mono text-muted-foreground ${className}`}>
        <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
        <span>Loading PKT...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-mono font-semibold text-primary shadow-xs ${className}`}
        title="Academy Standard Time: Islamabad (Asia/Karachi, UTC+5)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>{timeState.timeString} {timeState.period} PKT</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`glass-panel p-4 rounded-2xl border border-border/60 shadow-sm flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Academy Standard Time</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <p className="text-sm font-bold text-foreground">Islamabad, Pakistan (PKT &bull; UTC+5)</p>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="flex items-baseline justify-end gap-1 text-xl font-extrabold text-foreground">
            <span>{timeState.timeString}</span>
            <span className="text-xs text-primary font-bold">:{timeState.seconds}</span>
            <span className="text-xs text-muted-foreground ml-0.5">{timeState.period}</span>
          </div>
          {showDate && (
            <p className="text-xs text-muted-foreground">{timeState.dayName}, {timeState.dateString}</p>
          )}
        </div>
      </div>
    );
  }

  // Header / Badge variant (Default)
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card/80 dark:bg-card/40 border border-border/70 shadow-xs backdrop-blur-md text-xs font-mono transition-all hover:border-primary/40 ${className}`}
      title="Academy Standard Operating Time (Islamabad, Asia/Karachi, UTC+5)"
    >
      <div className="flex items-center gap-1.5 text-primary font-bold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Globe className="w-3.5 h-3.5 text-primary shrink-0 hidden sm:inline" />
        <span className="text-[11px] font-semibold text-muted-foreground hidden md:inline">Islamabad:</span>
      </div>

      <div className="flex items-baseline gap-1 font-bold text-foreground">
        <span>{timeState.timeString}</span>
        <span className="text-[10px] text-primary/80 font-normal">:{timeState.seconds}</span>
        <span className="text-[10px] text-muted-foreground">{timeState.period}</span>
        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-sans font-extrabold ml-0.5">
          PKT
        </span>
      </div>

      {showDate && (
        <span className="text-[11px] text-muted-foreground border-l border-border/80 pl-2 hidden lg:inline font-sans">
          {timeState.dateString}
        </span>
      )}
    </div>
  );
}
