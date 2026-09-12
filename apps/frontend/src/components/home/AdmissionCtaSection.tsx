'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdmissionCtaSection() {
  const [admissionFormData, setAdmissionFormData] = useState({
    parentName: '',
    email: '',
    phone: '',
    studentAge: '',
    coursePreference: 'noorani-qaida',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <section id="cta" className="scroll-mt-24 py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 p-8 sm:p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-blue/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sunflower-yellow/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left pitch */}
          <div className="lg:col-span-7">
            <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white mb-4 backdrop-blur-sm">
              Admissions Open Worldwide
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Begin Your Child’s Quran Journey Today
            </h2>
            <p className="text-blue-50 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              Experience our 1-on-1 personalized teaching, learn with certified scholars, and witness our interactive virtual classroom.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sunflower-yellow" />
                <span>1-on-1 Dedicated Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sunflower-yellow" />
                <span>Male & Female Tutors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sunflower-yellow" />
                <span>Flexible Global Time Slots</span>
              </div>
            </div>
          </div>

          {/* Right Admission Application Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl border border-white/20 dark:border-slate-800">
              {formSubmitted ? (
                <div className="py-8 text-center space-y-3 animate-fadeIn">
                  <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
                    Application Received!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    JazakAllah Khair! Our academic admissions team will contact you within 2-4 hours to complete your enrollment and schedule your first class.
                  </p>
                  <div className="pt-4">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                    >
                      <span>Access Student Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                  <h3 className="font-headline text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Apply for Admission
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Parent's Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Al-Mansoor"
                      value={admissionFormData.parentName}
                      onChange={(e) =>
                        setAdmissionFormData({ ...admissionFormData, parentName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="parent@example.com"
                      value={admissionFormData.email}
                      onChange={(e) =>
                        setAdmissionFormData({ ...admissionFormData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        WhatsApp / Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 555-0123"
                        value={admissionFormData.phone}
                        onChange={(e) =>
                          setAdmissionFormData({ ...admissionFormData, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Student's Age *
                      </label>
                      <input
                        type="number"
                        required
                        min="4"
                        max="99"
                        placeholder="e.g. 7"
                        value={admissionFormData.studentAge}
                        onChange={(e) =>
                          setAdmissionFormData({ ...admissionFormData, studentAge: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course Preference
                    </label>
                    <select
                      value={admissionFormData.coursePreference}
                      onChange={(e) =>
                        setAdmissionFormData({ ...admissionFormData, coursePreference: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    >
                      <option value="noorani-qaida">Noorani Qaida (Beginners / Kids)</option>
                      <option value="tajweed-recitation">Quran Reading with Tajweed</option>
                      <option value="hifz-program">Hifz-ul-Quran Memorization</option>
                      <option value="islamic-studies">Islamic Studies & Daily Duas</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-headline font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover-lift active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Submit Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    🔒 Direct academy admissions. We will contact you via WhatsApp / Email within 24 hours.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
