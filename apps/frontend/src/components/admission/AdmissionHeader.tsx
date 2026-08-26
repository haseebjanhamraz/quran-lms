'use client';

import React from 'react';
import { GraduationCap, XCircle } from 'lucide-react';

interface AdmissionHeaderProps {
  step: number;
  totalSteps: number;
  editingStudent?: any | null;
  onClose: () => void;
}

export default function AdmissionHeader({
  step,
  totalSteps,
  editingStudent,
  onClose,
}: AdmissionHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border/80 px-4 sm:px-8 md:px-12 py-3.5 flex items-center justify-between shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-brand/10 text-brand border border-brand/20">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-display font-extrabold text-foreground tracking-tight">
              {editingStudent ? 'Update Student Profile' : 'Student Admission & Onboarding'}
            </h2>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              Step {step} of {totalSteps}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            {editingStudent
              ? 'Modify personal details, guardian info, schedule timings, and teacher assignments.'
              : 'Complete the student onboarding wizard to create student account and schedule.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
        title="Close Admission Onboarding"
      >
        <XCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Close</span>
      </button>
    </header>
  );
}
