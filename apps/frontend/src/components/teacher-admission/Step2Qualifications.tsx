'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { TeacherQualificationsInfo } from './types';

interface Step2QualificationsProps {
  qualificationsInfo: TeacherQualificationsInfo;
  setQualificationsInfo: React.Dispatch<React.SetStateAction<TeacherQualificationsInfo>>;
}

export default function Step2Qualifications({
  qualificationsInfo,
  setQualificationsInfo,
}: Step2QualificationsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-brand" />
            <span>Step 2: Qualifications &amp; Specialization</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Academic degrees, teaching specializations, employee ID, and biography.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-border/60 space-y-6 bg-card/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Specialization</label>
            <input
              type="text"
              placeholder="e.g. Nazira & Tajweed"
              value={qualificationsInfo.specialization}
              onChange={(e) => setQualificationsInfo((prev) => ({ ...prev, specialization: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Degree / Qualification</label>
            <input
              type="text"
              placeholder="e.g. Certified Hafiz & Qari"
              value={qualificationsInfo.qualification}
              onChange={(e) => setQualificationsInfo((prev) => ({ ...prev, qualification: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Employee ID / System Code</label>
            <input
              type="text"
              placeholder="EMP-1001"
              value={qualificationsInfo.employeeId}
              onChange={(e) => setQualificationsInfo((prev) => ({ ...prev, employeeId: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-mono font-medium text-foreground outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Academy Joining Date</label>
            <input
              type="date"
              value={qualificationsInfo.joiningDate}
              onChange={(e) => setQualificationsInfo((prev) => ({ ...prev, joiningDate: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Teacher Biography / Introduction</label>
            <textarea
              rows={4}
              placeholder="Short teacher introduction, teaching experience, Quranic certifications..."
              value={qualificationsInfo.bio}
              onChange={(e) => setQualificationsInfo((prev) => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
