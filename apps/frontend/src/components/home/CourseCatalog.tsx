import React from 'react';
import { Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { CourseDetail } from './CourseModal';
import { COURSES } from './homeData';

interface CourseCatalogProps {
  onSelectCourse: (course: CourseDetail) => void;
}

export default function CourseCatalog({ onSelectCourse }: CourseCatalogProps) {
  return (
    <section id="courses" className="scroll-mt-24 py-16 md:py-24 bg-slate-50/80 dark:bg-[#091122] border-y border-slate-200/70 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
            Comprehensive Curriculum
          </span>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            Explore Our Quranic Courses
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
            Carefully structured learning pathways from foundational letter phonetics to advanced Tajweed and complete Quran memorization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-[#0B1528] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover-lift group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                    {course.level}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {course.duration}
                  </span>
                </div>

                <h3 className="font-headline text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                  {course.title}
                </h3>

                {course.arabicTitle && (
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    {course.arabicTitle}
                  </p>
                )}

                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                  {course.tagline}
                </p>

                <ul className="space-y-1.5 mb-6 text-xs text-slate-600 dark:text-slate-400">
                  {course.modules.slice(0, 3).map((mod, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectCourse(course)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View Syllabus
                  <ExternalLink className="w-3 h-3" />
                </button>
                <a
                  href="#cta"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                >
                  Enroll Now
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
