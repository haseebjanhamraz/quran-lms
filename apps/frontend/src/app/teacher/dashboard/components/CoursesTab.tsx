import React from 'react';
import { BookOpen, Users, Video, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  type: string;
  _count?: { enrollments: number; classSessions: number };
}

interface CoursesTabProps {
  courses: Course[];
  coursesLoading: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  NAZIRA: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  ARABIC: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  TAJWEED: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  ISLAMIC_STUDIES: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

function typeLabel(type: string): string {
  return type.replace(/_/g, ' ');
}

export default function CoursesTab({ courses, coursesLoading }: CoursesTabProps) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-display text-xl font-bold text-brand">
          My Courses
        </h2>
        <span className="rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {courses.length} courses
        </span>
      </div>

      {coursesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 py-16 text-center shadow-sm">
          <p className="text-muted-foreground">No courses assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="group rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 shadow-sm hover:border-brand/40">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-2.5">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[course.type] || 'text-muted-foreground bg-muted'}`}>
                  {typeLabel(course.type)}
                </span>
              </div>
              <h3 className="mb-3 font-semibold text-foreground leading-snug">{course.title}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {course._count?.enrollments ?? 0} students
                </span>
                <span className="flex items-center gap-1">
                  <Video size={12} />
                  {course._count?.classSessions ?? 0} sessions
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
