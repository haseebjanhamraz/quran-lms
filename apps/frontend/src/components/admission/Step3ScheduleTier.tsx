'use client';

import React from 'react';
import { GraduationCap, Clock, XCircle } from 'lucide-react';
import { EnrollmentStatusState, WEEKDAYS } from './types';

interface Step3ScheduleTierProps {
  enrollmentStatus: EnrollmentStatusState;
  setEnrollmentStatus: React.Dispatch<React.SetStateAction<EnrollmentStatusState>>;
  bulkTime: string;
  setBulkTime: React.Dispatch<React.SetStateAction<string>>;
  onToggleDay: (dayKey: string) => void;
  onUpdateDayTime: (dayKey: string, newTime: string) => void;
  onApplyBulkTime: () => void;
}

export default function Step3ScheduleTier({
  enrollmentStatus,
  setEnrollmentStatus,
  bulkTime,
  setBulkTime,
  onToggleDay,
  onUpdateDayTime,
  onApplyBulkTime,
}: Step3ScheduleTierProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <GraduationCap className="h-5 w-5 text-brand" />
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 3: Student Tier, Class Schedule &amp; Weekdays
          </h3>
          <p className="text-xs text-muted-foreground">
            Assign the student learning tier, class session length, and specific weekly timings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Student Tier / Level *</label>
          <div className="grid grid-cols-3 gap-2.5">
            {['Beginner', 'Intermediate', 'Advanced'].map((tier) => {
              const isSelected = enrollmentStatus.tier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setEnrollmentStatus((prev) => ({ ...prev, tier }))}
                  className={`p-3 rounded-xl text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Duration Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Class Duration *</label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { val: 30, label: '30 Mins', sub: 'Standard' },
              { val: 60, label: '60 Mins', sub: 'Recommended' },
              { val: 120, label: '120 Mins', sub: 'Intensive' },
            ].map((dur) => {
              const isSelected = enrollmentStatus.classDuration === dur.val;
              return (
                <button
                  key={dur.val}
                  type="button"
                  onClick={() => setEnrollmentStatus((prev) => ({ ...prev, classDuration: dur.val }))}
                  className={`p-3 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{dur.label}</span>
                  <span className="text-[10px] opacity-75 font-normal">{dur.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekday Selection & Timings Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Assigned Class Weekdays &amp; Timings
            </h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap self-start sm:self-auto">
            {enrollmentStatus.classDays.length} {enrollmentStatus.classDays.length === 1 ? 'Day' : 'Days'} / Week
          </span>
        </div>

        {/* 7-day Multi-select Chips */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Select Active Class Days:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {WEEKDAYS.map((wd) => {
              const isSelected = enrollmentStatus.classDays.some((d) => d.day === wd.key);
              return (
                <button
                  key={wd.key}
                  type="button"
                  onClick={() => onToggleDay(wd.key)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div>{wd.short}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Pickers for Active Days */}
        {enrollmentStatus.classDays.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Class Starting Timings:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={bulkTime}
                  onChange={(e) => setBulkTime(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs font-mono outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={onApplyBulkTime}
                  className="px-2.5 py-1 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground rounded-lg border border-border transition-colors whitespace-nowrap"
                >
                  Apply to All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {enrollmentStatus.classDays.map((slot) => {
                const dayObj = WEEKDAYS.find((w) => w.key === slot.day) || { label: slot.day, short: slot.day };
                const [h, m] = slot.time.split(':').map(Number);
                const endH = Math.floor((h * 60 + m + enrollmentStatus.classDuration) / 60) % 24;
                const endM = (h * 60 + m + enrollmentStatus.classDuration) % 60;
                const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

                return (
                  <div
                    key={slot.day}
                    className="p-3 rounded-xl border border-border/80 bg-background/80 flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <span className="font-bold text-xs text-foreground">{dayObj.label}</span>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {slot.time} - {endTimeFormatted} ({enrollmentStatus.classDuration}m)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.time}
                        onChange={(e) => onUpdateDayTime(slot.day, e.target.value)}
                        className="bg-card border border-border focus:border-primary rounded-lg px-2 py-1 text-xs font-mono font-bold text-foreground outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onToggleDay(slot.day)}
                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Remove Day"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 text-center text-xs text-amber-300">
            No days selected. Please select at least one weekday above.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Enrollment Start Date</label>
          <input
            type="date"
            value={enrollmentStatus.enrollmentDate}
            onChange={(e) => setEnrollmentStatus((prev) => ({ ...prev, enrollmentDate: e.target.value }))}
            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Student Status</label>
          <select
            value={enrollmentStatus.status}
            onChange={(e) => setEnrollmentStatus((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
          >
            <option value="Regular">Regular</option>
            <option value="Trial">Trial</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>
    </div>
  );
}
