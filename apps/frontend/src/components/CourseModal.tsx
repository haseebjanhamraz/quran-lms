'use client';

import React, { useState, useEffect } from 'react';
import { XCircle, Loader2, BookOpen, User, FileText, Sparkles, CheckSquare, Square } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

export interface CourseItem {
  feeStructures: any;
  id: string;
  _id?: string;
  title: string;
  type: 'NAZIRA' | 'TAJWEED' | 'HIFZ_UL_QURAN' | 'ISLAMIC_STUDIES';
  curriculum: string;
  teacherId?: string;
  teacherIds?: string[];
  teacher?: {
    id: string;
    _id?: string;
    name: string;
    email: string;
  };
  teachers?: Array<{
    id: string;
    _id?: string;
    name: string;
    email: string;
  }>;
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
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title || '');
      setType(editingCourse.type || 'TAJWEED');
      setCurriculum(editingCourse.curriculum || '');
      const rawIds = editingCourse.teacherIds || (editingCourse.teachers ? editingCourse.teachers.map((t) => t.id || t._id || '') : []);
      const primaryId = editingCourse.teacherId || editingCourse.teacher?.id || editingCourse.teacher?._id;
      if (rawIds.length > 0) {
        setSelectedTeacherIds(rawIds);
      } else if (primaryId) {
        setSelectedTeacherIds([primaryId]);
      } else {
        setSelectedTeacherIds([]);
      }
    } else {
      setTitle('');
      setType('TAJWEED');
      setCurriculum('');
      setSelectedTeacherIds(teachers.length > 0 ? [(teachers[0].id || teachers[0]._id || '')] : []);
    }
    setSubmitError(null);
  }, [editingCourse, isOpen, teachers]);

  if (!isOpen) return null;

  const toggleTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (selectedTeacherIds.length === 0) {
      setSubmitError('Please select at least one instructor for this course.');
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
          teacherId: selectedTeacherIds[0],
          teacherIds: selectedTeacherIds,
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
                {editingCourse ? 'Modify course syllabus, category, or instructors.' : 'Define new subject, syllabus curriculum, and assign instructors.'}
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

          {/* Multi-Teacher Checkbox Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 justify-between">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand" />
                <span>Assign Instructors</span>
              </span>
              <span className="text-[10px] text-brand font-mono font-bold">
                {selectedTeacherIds.length} Selected
              </span>
            </label>
            {teachers.length === 0 ? (
              <p className="text-xs text-rose-500 font-semibold p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                No active Teachers found! Please create a Teacher account first.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-background border border-border rounded-xl">
                {teachers.map((t) => {
                  const id = t.id || t._id || '';
                  const isChecked = selectedTeacherIds.includes(id);

                  return (
                    <div
                      key={id}
                      onClick={() => toggleTeacher(id)}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${isChecked ? 'bg-brand/10 text-brand border border-brand/30' : 'hover:bg-muted text-foreground'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {isChecked ? <CheckSquare className="h-4 w-4 text-brand shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <span>{t.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{t.email}</span>
                    </div>
                  );
                })}
              </div>
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
              rows={3}
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
