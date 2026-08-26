'use client';

import React from 'react';
import { LucideIcon, Check } from 'lucide-react';

export interface StepItem {
  num: number;
  label: string;
  icon: LucideIcon;
}

interface AdmissionStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick: (stepNum: number) => void;
}

export default function AdmissionStepper({
  steps,
  currentStep,
  onStepClick,
}: AdmissionStepperProps) {
  return (
    <div className="bg-muted/30 border-b border-border/60 px-4 sm:px-8 md:px-12 py-3 shrink-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <div
                className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group py-1"
                onClick={() => onStepClick(s.num)}
              >
                <div
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isCurrent
                      ? 'bg-brand text-brand-foreground ring-2 ring-brand/30 shadow-md scale-105'
                      : 'bg-card border border-border text-muted-foreground group-hover:border-border/80 group-hover:text-foreground'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="hidden md:block text-left">
                  <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-brand' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">Step {s.num}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${currentStep > s.num ? 'bg-primary' : 'bg-border/60'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
