'use client';

import React from 'react';
import {
  XCircle, BookOpen, User, Sparkles, FileText, Calendar, Edit, Trash2, Mail
} from 'lucide-react';
import { CourseItem } from './CourseModal';

interface CourseDetailModalProps {
  isOpen: boolean;
  course: CourseItem | null;
  onClose: () => void;
  onEdit?: (course: CourseItem) => void;
  onDelete?: (courseId: string) => void;
}

export default function CourseDetailModal({
  isOpen,
  course,
  onClose,
  onEdit,
  onDelete,
}: CourseDetailModalProps) {
  if (!isOpen || !course) return null;

  const courseId = course.id || course._id || '';

  const getCategoryBadgeClass = (type: string) => {
    switch (type) {
      case 'TAJWEED':
        return 'bg-brand/10 text-brand border-brand/20';
      case 'HIFZ_UL_QURAN':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'NAZIRA':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ISLAMIC_STUDIES':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-border flex flex-col bg-card/95 my-auto">
        {/* Glow effects */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand/15 text-brand border border-brand/20 shadow-inner">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display font-bold text-foreground">{course.title}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(course.type)}`}>
                  {course.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">Course ID: {courseId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(course);
                }}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition-all"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(courseId);
                }}
                className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold py-2 px-3 rounded-xl border border-destructive/20 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full ml-1"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-6 my-6 z-10">
          {/* Instructor Card */}
          <div className="glass-panel p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
              <User className="h-4 w-4 text-brand" />
              <span>Assigned Primary Instructor</span>
            </h4>
            {course.teacher ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20 shrink-0">
                  {course.teacher.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{course.teacher.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 text-brand" />
                    <span>{course.teacher.email}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No instructor assigned.</p>
            )}
          </div>

          {/* Curriculum Syllabus Card */}
          <div className="glass-panel p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
              <FileText className="h-4 w-4 text-brand" />
              <span>Curriculum & Syllabus Breakdown</span>
            </h4>
            <div className="text-xs w-fit text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans p-3 rounded-xl bg-background/50 border border-border/40">
              {course.curriculum || 'No curriculum breakdown provided.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between z-10 shrink-0">
          <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created: {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
