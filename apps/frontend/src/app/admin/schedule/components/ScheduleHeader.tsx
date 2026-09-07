'use client';

import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import IslamabadClock from '@/components/IslamabadClock';

interface ScheduleHeaderProps {
  view: 'weekly' | 'daily';
  setView: (val: 'weekly' | 'daily') => void;
}

export default function ScheduleHeader({
  view,
  setView,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-foreground">Schedule &amp; Timetable Master View</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border-sky-500/30">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Read-Only View
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Master timetable of weekly class sessions with independent Teacher &amp; Student class timings.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <IslamabadClock variant="badge" />

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-card border border-border rounded-xl shadow-sm">
          <button
            onClick={() => setView('weekly')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === 'weekly' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <CalendarIcon size={14} />
            Weekly Grid
          </button>
          <button
            onClick={() => setView('daily')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Clock size={14} />
            Daily View
          </button>
        </div>
      </div>
    </div>
  );
}
