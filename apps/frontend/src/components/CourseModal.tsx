'use client';

import React, { useState, useEffect } from 'react';
import { XCircle, Loader2, BookOpen, User, FileText, Sparkles } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

export interface CourseItem {
  id: string;
  _id?: string;
  title: string;
  type: 'NAZIRA' | 'TAJWEED' | 'HIFZ_UL_QURAN' | 'ISLAMIC_STUDIES';
  curriculum: string;
  teacherId?: string;
  teacher?: {
    id: string;
    _id?: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCourse?: CourseItem | null;
  teachers: TeacherItem[];
}

export default function CourseModal({
  isOpen,
  onClose,
  onSuccess,
  editingCourse,
  teachers,
}: CourseModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'NAZIRA' | 'TAJWEED' | 'HIFZ_UL_QURAN' | 'ISLAMIC_STUDIES'>('TAJWEED');
  const [curriculum, setCurriculum] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title || '');
      setType(editingCourse.type || 'TAJWEED');
      setCurriculum(editingCourse.curriculum || '');
      const tId = editingCourse.teacherId || editingCourse.teacher?.id || editingCourse.teacher?._id || '';
      setTeacherId(tId);
    } else {
      setTitle('');
      setType('TAJWEED');
      setCurriculum('');
      setTeacherId(teachers.length > 0 ? (teachers[0].id || teachers[0]._id || '') : '');
    }
    setSubmitError(null);
  }, [editingCourse, isOpen, teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!teacherId) {
      setSubmitError('Please select a primary teacher for this course.');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = Boolean(editingCourse);
      const courseId = editingCourse?.id || editingCourse?._id;
      const url = isEdit ? `${API_URL}/courses/${courseId}` : `${API_URL}/courses`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          title,
          type,
          curriculum,
          teacherId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} course.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {editingCourse ? 'Edit Course Details' : 'Create New Course'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editingCourse ? 'Modify course syllabus, category, or instructor.' : 'Define new subject, syllabus curriculum, and assign an instructor.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Error notification */}
        {submitError && (
          <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-brand" />
              <span>Course Title</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Tajweed Rules & Makharij"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-2.5 text-sm outline-none transition-all"
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span>Subject Category</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-2.5 text-sm outline-none transition-all"
            >
              <option value="TAJWEED">TAJWEED (Pronunciation & Recitation Rules)</option>
              <option value="NAZIRA">NAZIRA (Reading Fluency)</option>
              <option value="HIFZ_UL_QURAN">HIFZ_UL_QURAN (Memorization Program)</option>
              <option value="ISLAMIC_STUDIES">ISLAMIC_STUDIES (Fiqh, Hadith & Seerah)</option>
            </select>
          </div>

          {/* Teacher Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-brand" />
              <span>Assign Primary Instructor</span>
            </label>
            {teachers.length === 0 ? (
              <p className="text-xs text-rose-500 font-semibold p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                No active Teachers found! Please create a Teacher account first.
              </p>
            ) : (
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-2.5 text-sm outline-none transition-all"
              >
                {teachers.map((t) => {
                  const id = t.id || t._id;
                  return (
                    <option key={id} value={id}>
                      {t.name} ({t.email})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Curriculum Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-brand" />
              <span>Curriculum Syllabus / Milestones</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Outline daily goals, reading targets, or memorization milestones..."
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-2.5 text-sm outline-none transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-xl text-xs font-bold transition-colors outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || teachers.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{editingCourse ? 'Save Changes' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
