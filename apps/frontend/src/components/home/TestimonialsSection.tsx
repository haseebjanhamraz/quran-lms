import React from 'react';
import { Star, Globe } from 'lucide-react';
import { TESTIMONIALS } from './homeData';

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
          Voices of Trust
        </span>
        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          Loved by Parents Worldwide
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
          Hear from families across the globe who have entrusted their children's Quranic education to Ain Ul Quran.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col justify-between hover-lift"
          >
            <div>
              <div className="flex items-center gap-1 text-sunflower-yellow mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-sunflower-yellow" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base italic leading-relaxed mb-6">
                "{t.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-headline font-bold text-slate-900 dark:text-white text-sm">
                {t.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                {t.location}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[11px] rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold">
                {t.course}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
