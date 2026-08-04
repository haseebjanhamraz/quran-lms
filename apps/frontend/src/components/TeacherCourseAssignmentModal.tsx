'use client';

import React, { useState, useEffect } from 'react';
import { XCircle, Loader2, BookOpen, CheckSquare, Square, Save, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

export interface CourseOption {
  id: string;
  _id?: string;
  title: string;
  type: string;
  curriculum?: string;
}

export interface TeacherTarget {
  id: string;
  _id?: string;
  name: string;
  email: string;
}

interface TeacherCourseAssignmentModalProps {
  isOpen: boolean;
  teacher: TeacherTarget | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeacherCourseAssignmentModal({
  isOpen,
  teacher,
  onClose,
  onSuccess,
}: TeacherCourseAssignmentModalProps) {
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen && teacher) {
      const teacherId = teacher.id || teacher._id;
      if (teacherId) {
        fetchCoursesAndTeacherAssignments(teacherId);
      }
    }
  }, [isOpen, teacher]);

  const fetchCoursesAndTeacherAssignments = async (teacherId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [allCoursesRes, teacherCoursesRes] = await Promise.all([
        apiFetch(`${API_URL}/courses`),
        apiFetch(`${API_URL}/courses/teacher/${teacherId}`),
      ]);

      if (allCoursesRes.ok) {
        const data = await allCoursesRes.json();
        setAllCourses(Array.isArray(data) ? data : []);
      }

      if (teacherCoursesRes.ok) {
        const assignedData = await teacherCoursesRes.json();
        if (Array.isArray(assignedData)) {
          const ids = assignedData.map((c: any) => c.id || c._id);
          setSelectedCourseIds(ids);
        }
      }
    } catch (err: any) {
      console.error('Failed to load courses for assignment:', err);
      setErrorMsg('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!teacher) return;
    const teacherId = teacher.id || teacher._id;
    if (!teacherId) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`${API_URL}/courses/teacher/${teacherId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ courseIds: selectedCourseIds }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save course assignments.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand/15 text-brand border border-brand/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Assign Courses to Teacher
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assigning courses for <span className="font-semibold text-foreground">{teacher.name}</span> ({teacher.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-xl hover:bg-muted transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-xs text-muted-foreground">Loading available courses...</p>
          </div>
        ) : allCourses.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground glass-panel p-4 rounded-2xl border border-border">
            No courses available in system. Please create courses first.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
              <span>Select Courses ({selectedCourseIds.length} Selected)</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedCourseIds.length === allCourses.length) {
                    setSelectedCourseIds([]);
                  } else {
                    setSelectedCourseIds(allCourses.map((c) => c.id || c._id || ''));
                  }
                }}
                className="text-brand hover:underline font-bold"
              >
                {selectedCourseIds.length === allCourses.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Courses Checkbox List */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {allCourses.map((c) => {
                const cId = c.id || c._id || '';
                const isSelected = selectedCourseIds.includes(cId);

                return (
                  <div
                    key={cId}
                    onClick={() => toggleCourseSelection(cId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-brand/10 border-brand/40 shadow-sm'
                        : 'bg-card/50 border-border/60 hover:bg-card/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-brand shrink-0">
                        {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-muted-foreground/60" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{c.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border mt-1 inline-block">
                          {c.type}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        Assigned
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <span className="text-xs font-mono text-muted-foreground">
                {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} assigned
              </span>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAssignments}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Course Assignments</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
