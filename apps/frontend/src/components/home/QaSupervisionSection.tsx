import React from 'react';
import { Check } from 'lucide-react';

export default function QaSupervisionSection() {
  return (
    <section id="qa-monitoring" className="scroll-mt-24 py-16 md:py-20 bg-gradient-to-br from-[#0B1E3B] via-[#0D254C] to-[#08172E] text-white relative overflow-hidden transition-colors">
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-800/80 dark:bg-blue-900/60 text-blue-200 mb-4 border border-blue-700/40">
              The Ain Ul Quran Differentiator
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Dual-Layer Human Supervision & QA Monitoring
            </h2>
            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed mb-6">
              Most online platforms leave lessons completely unsupervised. At Ain Ul Quran, an independent team of pedagogical supervisors and Tajweed scholars routinely inspects classes to guarantee quality, punctuality, and a safe learning environment.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Strict Teacher Verification & Auditing</h4>
                  <p className="text-blue-200/80 text-xs mt-0.5">
                    Scholarly credentials, recitation accuracy, and teaching pedagogy are evaluated continuously.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Post-Evaluation Supervisor Sign-off</h4>
                  <p className="text-blue-200/80 text-xs mt-0.5">
                    Teacher class evaluation reports are reviewed by supervisors before appearing in the student portal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Parent Portal Transparency</h4>
                  <p className="text-blue-200/80 text-xs mt-0.5">
                    Full visibility into attendance, class recordings, teacher remarks, and syllabus milestones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 rounded-2xl bg-white/10 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-xs font-mono text-blue-200 ml-2">QA-Live-Monitor.v4.0</span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Active System
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-blue-100">
                <div className="p-3 rounded-lg bg-black/20 flex items-center justify-between">
                  <span>Teacher Punctuality Audit</span>
                  <span className="text-blue-300 font-bold">100% On-Time</span>
                </div>
                <div className="p-3 rounded-lg bg-black/20 flex items-center justify-between">
                  <span>Tajweed Makharij Precision</span>
                  <span className="text-blue-300 font-bold">Certified Sanad</span>
                </div>
                <div className="p-3 rounded-lg bg-black/20 flex items-center justify-between">
                  <span>Student Engagement Index</span>
                  <span className="text-blue-300 font-bold">98.4% Optimal</span>
                </div>
                <div className="p-3 rounded-lg bg-black/20 flex items-center justify-between">
                  <span>Supervisor Class Sign-off</span>
                  <span className="text-blue-300 font-bold">Verified & Logged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
