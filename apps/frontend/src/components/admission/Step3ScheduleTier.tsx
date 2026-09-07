'use client';

import React from 'react';
import { GraduationCap, Calendar, Clock } from 'lucide-react';
import { EnrollmentStatusState } from './types';

interface Step3ScheduleTierProps {
  enrollmentStatus: EnrollmentStatusState;
  setEnrollmentStatus: React.Dispatch<React.SetStateAction<EnrollmentStatusState>>;
}

export default function Step3ScheduleTier({
  enrollmentStatus,
  setEnrollmentStatus,
}: Step3ScheduleTierProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Header */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-3">
        <div className="p-2.5 rounded-2xl bg-brand/15 text-brand border border-brand/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 3: Student Tier &amp; Enrollment
          </h3>
          <p className="text-xs text-muted-foreground">
            Configure the student learning tier, class session length, and enrollment details.
          </p>
        </div>
      </div>

      {/* Tier & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tier Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-brand" />
            <span>Student Tier / Level *</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {['Beginner', 'Intermediate', 'Advanced'].map((tier) => {
              const isSelected = enrollmentStatus.tier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setEnrollmentStatus((prev) => ({ ...prev, tier }))}
                  className={`p-3.5 rounded-2xl text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102 ring-2 ring-primary/20'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            Indicates curriculum pacing and syllabus depth for this student.
          </p>
        </div>

        {/* Class Duration Selector (30m is default) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand" />
            <span>Class Duration *</span>
          </label>
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
                  className={`p-3.5 rounded-2xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102 ring-2 ring-primary/20'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{dur.label}</span>
                  <span className="text-[10px] opacity-75 font-normal">{dur.sub}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            Duration per class session across all scheduled weekdays.
          </p>
        </div>
      </div>

      {/* Enrollment Info */}
      <div className="glass-panel rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-brand" />
          <span>Enrollment Information</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Enrollment Start Date *
            </label>
            <input
              type="date"
              value={enrollmentStatus.enrollmentDate}
              onChange={(e) => setEnrollmentStatus((prev) => ({ ...prev, enrollmentDate: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Student Admission Status *
            </label>
            <select
              value={enrollmentStatus.status}
              onChange={(e) => setEnrollmentStatus((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="Regular">Regular (Active Student)</option>
              <option value="Trial">Trial Period (Introductory)</option>
              <option value="On Hold">On Hold (Pending Commencement)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
