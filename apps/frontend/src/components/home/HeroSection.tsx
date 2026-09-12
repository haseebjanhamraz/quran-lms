import React from 'react';
import { ArrowRight, Sparkles, Star, ShieldCheck } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-28 sm:pt-32 md:pt-36 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Decorative Background Ambient Glow Orbs */}
      <div className="absolute top-10 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-sky-blue/20 dark:bg-sky-blue/15 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-0 w-72 sm:w-80 h-72 sm:h-80 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-cheerful-orange" />
            <span>Dedicated 1-on-1 Monitored Quran Education</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-[1.15] mb-6">
            Empower Your Child with the{' '}
            <span className="text-cheerful-orange relative inline-block">
              Light of Quran
              <span className="absolute bottom-1.5 left-0 w-full h-3.5 bg-sunflower-yellow/45 dark:bg-sunflower-yellow/30 -z-10 rounded-full"></span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
            Global online classes designed for serene, focused learning. Our monitored platform connects your child with expert tutors in a secure, engaging environment rooted in traditional Islamic aesthetics and modern pedagogical clarity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-8">
            <a
              href="#cta"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-headline font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 dark:shadow-blue-950/50 transition-all hover-lift active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 text-blue-200" />
            </a>
            <a
              href="#courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-headline font-bold text-base border-2 border-blue-600 dark:border-blue-500/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <span>Explore Courses</span>
            </a>
          </div>

          {/* Social Trust Proof Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="flex -space-x-2 overflow-hidden">
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-blue-600 text-white font-bold flex items-center justify-center text-xs">A</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-amber-500 text-white font-bold flex items-center justify-center text-xs">F</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-sky-600 text-white font-bold flex items-center justify-center text-xs">M</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-purple-600 text-white font-bold flex items-center justify-center text-xs">Z</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-sunflower-yellow fill-sunflower-yellow" />
              ))}
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              4.9 / 5.0 Rating from 1,200+ Muslim Families
            </span>
          </div>
        </div>

        {/* Hero Right Visual Showcase */}
        <div className="lg:col-span-5 relative z-10">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500/20 dark:border-blue-400/30 group">
            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />

            {/* Serene Child Learning Image */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHTXnv5hDhjAy9JleuEGFcV872CDf4G2NM3iB903g8Vn1iYBPbSsNLkKdsPyqQYTbSg2rlpB2Lyqmid8r-7n9cHN_gdRaG6k2Zod1Es2no7GSr7HfvHrpOQ5fkHQLrOMPElz91qIaD-3LinKz8WMZETObOa_oPEutg1f5jBIee6YGo_Kom-R6jqITmMDv6LMcy_9dMZC4ajjAZQehNgq0-JzXVazlWvgRoCR5bntTOY2TssdhWXIXp"
              alt="Smiling young Muslim child learning Quran online"
              className="w-full h-[380px] sm:h-[460px] md:h-[500px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
            />

            {/* Floating Badge 1: Top Right */}
            <div className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 animate-float">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Live 1-on-1 Session
              </span>
            </div>

            {/* Floating Badge 2: Bottom Card */}
            <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-white/95 dark:bg-[#070D1A]/95 backdrop-blur-md shadow-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Ain Ul Quran Standard
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      100% Monitored by QA Team
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-600 text-white">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
