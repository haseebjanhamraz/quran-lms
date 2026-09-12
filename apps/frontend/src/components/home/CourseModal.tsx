'use client';

import React from 'react';
import { X, CheckCircle2, BookOpen, Clock, Users, Award, ArrowRight } from 'lucide-react';

export interface CourseDetail {
  id: string;
  title: string;
  arabicTitle?: string;
  tagline: string;
  level: string;
  duration: string;
  ageGroup: string;
  modules: string[];
  features: string[];
  description: string;
  color: string;
}

interface CourseModalProps {
  course: CourseDetail | null;
  onClose: () => void;
}

export default function CourseModal({ course, onClose }: CourseModalProps) {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0B1528] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with brand accent */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent flex items-start justify-between">
          <div>
            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 mb-2">
              {course.level} • {course.ageGroup}
            </span>
            <h3 className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
              {course.title}
            </h3>
            {course.arabicTitle && (
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {course.arabicTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {course.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Duration
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{course.duration}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Format
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">1-on-1 Dedicated</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Certificate
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Included</p>
            </div>
          </div>

          {/* Syllabus Modules */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Course Syllabus Highlights
            </h4>
            <div className="space-y-2">
              {course.modules.map((mod, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 text-slate-700 dark:text-slate-300 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{mod}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Included Benefits
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {course.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
          <a
            href="#cta"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all hover-lift"
          >
            <span>Enroll in This Course</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
