import React from 'react';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
          Simple 4-Step Process
        </span>
        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          How Ain Ul Quran Works
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
          Starting your child’s Quran journey is simple, transparent, and completely risk-free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Step 1 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col items-start hover-lift">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-headline font-bold text-lg flex items-center justify-center mb-4">
            01
          </div>
          <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white mb-2">
            Initial Assessment
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Quick registration. We evaluate current recitation level and schedule your preferred days and time slots.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col items-start hover-lift">
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-headline font-bold text-lg flex items-center justify-center mb-4">
            02
          </div>
          <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white mb-2">
            Matched with Scholar
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            We match your student with a verified Alim or Alimah tailored to their age, gender, and learning pace.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col items-start hover-lift">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-headline font-bold text-lg flex items-center justify-center mb-4">
            03
          </div>
          <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white mb-2">
            Interactive 1-on-1 Class
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Join the live virtual classroom with high-def video, synchronized Qaida/Mushaf, and digital whiteboard.
          </p>
        </div>

        {/* Step 4 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-sm relative flex flex-col items-start hover-lift">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-headline font-bold text-lg flex items-center justify-center mb-4">
            04
          </div>
          <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white mb-2">
            QA Monitored Progress
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Our QA supervisors evaluate sessions, post-class feedback is approved, and sent directly to parent dashboards.
          </p>
        </div>
      </div>
    </section>
  );
}
