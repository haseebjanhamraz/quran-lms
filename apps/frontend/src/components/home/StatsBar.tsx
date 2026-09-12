import React from 'react';

export default function StatsBar() {
  return (
    <section className="bg-blue-50/70 dark:bg-[#0A1628] py-8 border-y border-blue-200/70 dark:border-blue-950/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 items-center justify-center">
          {/* Stat 1 */}
          <div className="flex flex-col items-center text-center">
            <span className="font-headline text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              5,000+
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1">
              Students Worldwide
            </span>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center text-center border-l md:border-l border-slate-300 dark:border-slate-800 pl-4">
            <span className="font-headline text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              100%
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1">
              Certified Alims & Alimahs
            </span>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center text-center border-t md:border-t-0 md:border-l border-slate-300 dark:border-slate-800 pt-4 md:pt-0 pl-0 md:pl-4">
            <span className="font-headline text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              15+
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1">
              Countries Reached
            </span>
          </div>

          {/* Stat 4 */}
          <div className="flex flex-col items-center text-center border-t md:border-t-0 border-l border-slate-300 dark:border-slate-800 pt-4 md:pt-0 pl-4">
            <span className="font-headline text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              99.8%
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-1">
              Parent Satisfaction
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
