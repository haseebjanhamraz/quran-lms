'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { StepItem } from './types';

interface TeacherFooterProps {
  step: number;
  totalSteps: number;
  steps: StepItem[];
  submitting: boolean;
  editingTeacher?: any | null;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}

export default function TeacherFooter({
  step,
  totalSteps = 5,
  steps,
  submitting,
  editingTeacher = null,
  onBack,
  onNext,
  onClose,
}: TeacherFooterProps) {
  return (
    <div className="shrink-0 border-t border-border/60 bg-card/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20 shadow-lg">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground py-2.5 px-5 rounded-xl text-xs font-bold transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="py-2.5 px-5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          Cancel
        </button>
      )}

      <div className="flex items-center gap-2">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`h-2 rounded-full transition-all duration-300 ${
              s.num === step
                ? 'w-6 bg-brand'
                : s.num < step
                ? 'w-2 bg-emerald-500'
                : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>

      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-6 rounded-xl text-xs font-bold shadow-md hover:shadow-primary/20 hover:scale-105 transition-all"
        >
          <span>Next Step</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          form="teacher-wizard-form"
          disabled={submitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-7 rounded-xl text-xs font-bold shadow-xl hover:shadow-primary/25 hover:scale-105 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span>{editingTeacher ? 'Update Teacher' : 'Register Teacher'}</span>
        </button>
      )}
    </div>
  );
}
