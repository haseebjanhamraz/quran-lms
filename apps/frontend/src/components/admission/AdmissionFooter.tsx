'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { StepItem } from './AdmissionStepper';

interface AdmissionFooterProps {
  step: number;
  totalSteps: number;
  currentStepItem?: StepItem;
  submitting: boolean;
  editingStudent?: any | null;
  onBack: () => void;
  onNext: () => void;
}

export default function AdmissionFooter({
  step,
  totalSteps,
  currentStepItem,
  submitting,
  editingStudent,
  onBack,
  onNext,
}: AdmissionFooterProps) {
  return (
    <div className="shrink-0 bg-card/95 backdrop-blur-xl border-t border-border/80 px-4 sm:px-8 md:px-12 py-3.5 flex items-center justify-between shadow-lg z-20">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground py-2.5 px-5 rounded-xl text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      ) : (
        <div />
      )}

      <div className="text-xs font-semibold text-muted-foreground hidden sm:block">
        Step {step} of {totalSteps} {currentStepItem ? `• ${currentStepItem.label}` : ''}
      </div>

      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-6 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <span>Continue to Step {step + 1}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          form="admission-wizard-form"
          onClick={onNext}
          disabled={submitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-8 rounded-xl text-sm font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{editingStudent ? 'Save Profile Updates' : 'Complete Admission'}</span>
        </button>
      )}
    </div>
  );
}
