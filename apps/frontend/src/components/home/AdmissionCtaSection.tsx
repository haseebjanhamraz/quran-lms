'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

import StudentInquiryForm from '@/components/StudentInquiryForm';

export default function AdmissionCtaSection() {
  return (
    <section id="cta" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 p-6 sm:p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-blue/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sunflower-yellow/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative z-10">
          {/* Left pitch */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white mb-4 backdrop-blur-sm">
              Admissions Open Worldwide
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Begin Your Child’s Quran Journey Today
            </h2>
            <p className="text-blue-50 text-base sm:text-lg leading-relaxed mb-8">
              Experience our 1-on-1 personalized teaching, learn with certified scholars, and witness our interactive virtual classroom.
            </p>

            <div className="flex flex-col gap-4 text-sm text-blue-100 mb-8">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-sunflower-yellow shrink-0" />
                <span>1-on-1 Dedicated Classes with Live QA</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-sunflower-yellow shrink-0" />
                <span>Male & Female Certified Scholars</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-sunflower-yellow shrink-0" />
                <span>Custom Timetable & Flexible Global Slots</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <p className="text-xs text-blue-100 leading-relaxed">
                Need direct help or have questions? You can also contact our academic support desk 24/7.
              </p>
            </div>
          </div>

          {/* Right Admission Application Form (All 9 fields) */}
          <div className="lg:col-span-7">
            <StudentInquiryForm variant="card" />
          </div>
        </div>
      </div>
    </section>
  );
}
