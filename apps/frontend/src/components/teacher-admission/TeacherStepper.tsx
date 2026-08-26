'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { StepItem } from './types';

interface TeacherStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick: (stepNum: number) => void;
}

export default function TeacherStepper({
  steps,
  currentStep,
  onStepClick,
}: TeacherStepperProps) {
  return (
    <div className="shrink-0 border-b border-border/60 bg-card/40 backdrop-blur-md px-6 py-3.5 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;

          return (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => onStepClick(s.num)}
                className="flex items-center gap-2.5 group cursor-pointer focus:outline-none transition-all"
              >
                <div
                  className={`h-9 w-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-brand text-brand-foreground ring-4 ring-brand/20 shadow-lg shadow-brand/20 scale-105'
                      : 'bg-muted/80 text-muted-foreground border border-border group-hover:bg-muted'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Step 0{s.num}
                  </span>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isCurrent ? 'text-brand' : isDone ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 sm:mx-5 rounded-full transition-all duration-500 ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
