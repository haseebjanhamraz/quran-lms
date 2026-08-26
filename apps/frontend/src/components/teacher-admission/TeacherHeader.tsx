'use client';

import React from 'react';
import { GraduationCap, XCircle } from 'lucide-react';

interface TeacherHeaderProps {
  step: number;
  totalSteps: number;
  editingTeacher?: any | null;
  onClose: () => void;
}

export default function TeacherHeader({
  step,
  totalSteps = 5,
  editingTeacher = null,
  onClose,
}: TeacherHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border/60 bg-card/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-brand/15 text-brand border border-brand/20 shadow-inner">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {editingTeacher ? 'Update Teacher Profile' : 'Teacher Admission Onboarding'}
            </h2>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
              Step {step} of {totalSteps}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {editingTeacher
              ? 'Update instructor profile, salary structure, guarantors, and permissions.'
              : 'Complete the multi-step onboarding wizard to register a new teacher.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
        title="Close Onboarding Wizard"
      >
        <XCircle className="h-7 w-7" />
      </button>
    </div>
  );
}
