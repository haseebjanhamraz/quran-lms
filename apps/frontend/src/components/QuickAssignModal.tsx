'use client';

import React, { useState, useEffect } from 'react';
import { XCircle, BookOpen, BookUser, Check, Loader2 } from 'lucide-react';

interface CourseItem {
  id: string;
  _id?: string;
  title: string;
  type: string;
  teacherId?: string;
  teacher?: { id?: string; name: string; email?: string };
}

interface TeacherUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
}

interface StudentUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
}

interface QuickAssignModalProps {
  isOpen: boolean;
  mode: 'course' | 'teacher';
  student: StudentUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickAssignModal({
  isOpen,
  mode,
  student,
  onClose,
  onSuccess,
}: QuickAssignModalProps) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedCourseId('');
      setSelectedTeacherId('');
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch(`${API_URL}/courses`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/users/role/TEACHER`, { credentials: 'include' }).catch(() => null),
      ]);

      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        setCourses(Array.isArray(cData) ? cData : []);
      }

      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        setTeachers(Array.isArray(tData) ? tData : []);
      }
    } catch (err) {
      console.error('Error fetching quick assign data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen || !student) return null;

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setErrorMsg('Please select a course to assign.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const studentId = student.id || student._id;
      const res = await fetch(`${API_URL}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId, courseId: selectedCourseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to assign course.');
      }

      setSuccessMsg(`Successfully enrolled ${student.name} into the selected course!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedTeacherId) {
      setErrorMsg('Please select both a course and a teacher.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Update course teacher
      const res = await fetch(`${API_URL}/courses/${selectedCourseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacherId: selectedTeacherId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update course teacher.');
      }

      // 2. Ensure student is enrolled in this course
      const studentId = student.id || student._id;
      await fetch(`${API_URL}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId, courseId: selectedCourseId }),
      }).catch(() => null); // ignore duplicate enrollment error if already enrolled

      setSuccessMsg(`Teacher successfully assigned to course for ${student.name}!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
              {mode === 'course' ? <BookOpen className="h-5 w-5" /> : <BookUser className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {mode === 'course' ? 'Quick Assign Course' : 'Quick Assign Teacher'}
              </h3>
              <p className="text-xs text-muted-foreground">Student: <span className="font-semibold text-foreground">{student.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {loadingData ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : mode === 'course' ? (
          <form onSubmit={handleAssignCourse} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Select Course to Assign *</label>
              <select
                required
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.title} ({c.type}) {c.teacher ? `- Instructor: ${c.teacher.name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCourseId}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Assign Course Now</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Select Course *</label>
              <select
                required
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.title} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Select Teacher to Assign *</label>
              <select
                required
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCourseId || !selectedTeacherId}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Assign Teacher Now</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
