'use client';

import React, { useState, useEffect } from 'react';
import {
  XCircle, BookOpen, BookUser, Check, Loader2,
  Trash2, AlertCircle, CheckCircle2, Plus, UserMinus, Sparkles
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

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
  specialization?: string;
}

interface EnrollmentItem {
  id: string;
  _id?: string;
  studentId: string;
  courseId: string;
  course?: CourseItem;
  enrolledAt: string;
}

interface StudentUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  assignedTeacher?: any;
  teacher?: any;
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

  // Currently assigned details
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<TeacherUser | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<string | null>(null);
  const [unassigningTeacher, setUnassigningTeacher] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    if (isOpen && student) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSelectedCourseId('');
      setSelectedTeacherId('');
      setEnrollments([]);
      setCurrentTeacher(null);
      fetchData();
    }
  }, [isOpen, student, mode]);

  const fetchData = async () => {
    if (!student) return;
    setLoadingData(true);
    const studentId = student.id || student._id;

    try {
      const [cRes, tRes, eRes, sRes] = await Promise.all([
        apiFetch(`${API_URL}/courses`).catch(() => null),
        apiFetch(`${API_URL}/users/role/TEACHER`).catch(() => null),
        studentId ? apiFetch(`${API_URL}/enrollments/student/${studentId}`).catch(() => null) : null,
        studentId ? apiFetch(`${API_URL}/users/${studentId}`).catch(() => null) : null,
      ]);

      let allCourses: CourseItem[] = [];
      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        allCourses = Array.isArray(cData) ? cData : [];
        setCourses(allCourses);
      }

      let allTeachers: TeacherUser[] = [];
      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        allTeachers = Array.isArray(tData) ? tData : [];
        setTeachers(allTeachers);
      }

      // Resolve Current Enrolled Courses
      if (eRes && eRes.ok) {
        const eData = await eRes.json();
        if (Array.isArray(eData)) {
          setEnrollments(eData);
        }
      }

      // Resolve Current Assigned Teacher
      let resolvedTeacher: TeacherUser | null = null;
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        const tVal = sData.assignedTeacher || sData.teacher;
        if (tVal) {
          if (typeof tVal === 'object') {
            resolvedTeacher = {
              id: tVal.id || tVal._id,
              name: tVal.name,
              email: tVal.email,
              specialization: tVal.specialization,
            };
          } else if (typeof tVal === 'string') {
            const matched = allTeachers.find((t) => (t.id || t._id) === tVal);
            if (matched) resolvedTeacher = matched;
          }
        }
      } else if (student.assignedTeacher || student.teacher) {
        const tVal = student.assignedTeacher || student.teacher;
        if (typeof tVal === 'object') {
          resolvedTeacher = {
            id: tVal.id || tVal._id,
            name: tVal.name,
            email: tVal.email,
          };
        } else if (typeof tVal === 'string') {
          const matched = allTeachers.find((t) => (t.id || t._id) === tVal);
          if (matched) resolvedTeacher = matched;
        }
      }

      if (resolvedTeacher) {
        setCurrentTeacher(resolvedTeacher);
        setSelectedTeacherId(resolvedTeacher.id || resolvedTeacher._id || '');
      }
    } catch (err) {
      console.error('Error fetching quick assign data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen || !student) return null;

  // Immediately assign new course on selection
  const handleImmediateCourseSelect = async (courseId: string) => {
    if (!courseId) return;

    // Check duplicate
    const isAlreadyEnrolled = enrollments.some(
      (e) => e.courseId === courseId || e.course?.id === courseId || e.course?._id === courseId
    );
    if (isAlreadyEnrolled) {
      setErrorMsg('This student is already enrolled in this course.');
      setSelectedCourseId('');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const studentId = student.id || student._id;
      const res = await apiFetch(`${API_URL}/enrollments`, {
        method: 'POST',
        body: JSON.stringify({ studentId, courseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to assign course.');
      }

      const assignedCourse = courses.find((c) => (c.id || c._id) === courseId);
      const courseTitle = assignedCourse?.title || data.course?.title || 'Course';

      // Add to current enrollments list
      const newEnrollmentItem: EnrollmentItem = {
        id: data.id || data._id || `temp-${Date.now()}`,
        studentId: studentId || '',
        courseId,
        course: assignedCourse || data.course,
        enrolledAt: new Date().toISOString(),
      };

      setEnrollments((prev) => [...prev, newEnrollmentItem]);
      setSelectedCourseId('');
      setSuccessMsg(`Added "${courseTitle}" to ${student.name}'s assigned courses!`);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning course.');
      setSelectedCourseId('');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Course Enrollment
  const handleDeleteEnrollment = async (enrollmentId: string, courseTitle?: string) => {
    if (!confirm(`Are you sure you want to remove "${courseTitle || 'this course'}" from ${student.name}?`)) {
      return;
    }

    setDeletingEnrollmentId(enrollmentId);
    setErrorMsg(null);

    try {
      const res = await apiFetch(`${API_URL}/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to remove course assignment.');
      }

      setEnrollments((prev) => prev.filter((e) => (e.id || e._id) !== enrollmentId));
      setSuccessMsg(`Removed "${courseTitle || 'Course'}" from ${student.name}.`);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing course assignment.');
    } finally {
      setDeletingEnrollmentId(null);
    }
  };

  // Immediately assign / update Teacher on selection
  const handleImmediateTeacherSelect = async (teacherId: string) => {
    if (!teacherId) return;

    setSelectedTeacherId(teacherId);
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const studentId = student.id || student._id;
      const res = await apiFetch(`${API_URL}/users/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedTeacher: teacherId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to assign teacher to student.');
      }

      const assignedTeacher = teachers.find((t) => (t.id || t._id) === teacherId);
      if (assignedTeacher) {
        setCurrentTeacher(assignedTeacher);
      }

      setSuccessMsg(`Assigned ${assignedTeacher?.name || 'Teacher'} to ${student.name}!`);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  // Unassign Teacher
  const handleUnassignTeacher = async () => {
    if (!confirm(`Are you sure you want to remove the assigned teacher from ${student.name}?`)) {
      return;
    }

    setUnassigningTeacher(true);
    setErrorMsg(null);

    try {
      const studentId = student.id || student._id;
      const res = await apiFetch(`${API_URL}/users/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedTeacher: null }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to unassign teacher.');
      }

      setCurrentTeacher(null);
      setSelectedTeacherId('');
      setSuccessMsg(`Removed assigned teacher from ${student.name}.`);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error unassigning teacher.');
    } finally {
      setUnassigningTeacher(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
              {mode === 'course' ? <BookOpen className="h-5 w-5" /> : <BookUser className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {mode === 'course' ? 'Manage Course Enrollments' : 'Manage Teacher Assignment'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Student: <span className="font-semibold text-foreground">{student.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-brand h-8 w-8" />
            <p className="text-xs text-muted-foreground">Loading current assignments &amp; options...</p>
          </div>
        ) : mode === 'course' ? (
          <div className="space-y-5">
            {/* 1. SELECT COURSE TO ASSIGN (INSTANTLY ADDS ON SELECT) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand/5 via-card to-muted/20 border border-brand/30 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-brand" />
                  <span>Select Course to Assign *</span>
                </label>
                {submitting && (
                  <span className="text-[11px] text-brand font-semibold flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Adding course...</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  disabled={submitting}
                  value={selectedCourseId}
                  onChange={(e) => handleImmediateCourseSelect(e.target.value)}
                  className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <option value="">+ Choose course from dropdown to assign instantly...</option>
                  {courses.map((c) => {
                    const cId = c.id || c._id;
                    const isAlreadyEnrolled = enrollments.some(
                      (e) => e.courseId === cId || e.course?.id === cId || e.course?._id === cId
                    );
                    return (
                      <option key={cId} value={cId} disabled={isAlreadyEnrolled}>
                        {c.title} ({c.type}) {c.teacher ? `- Instructor: ${c.teacher.name}` : ''} {isAlreadyEnrolled ? '✓ (Already Enrolled)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Selecting a course above will immediately enroll the student and list it below.
              </p>
            </div>

            {/* 2. CURRENT ASSIGNED COURSES LIST (WITH DELETE BUTTONS) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-brand" />
                  <span>Assigned Courses List ({enrollments.length})</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {enrollments.length} Active Enrollment{enrollments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {enrollments.length === 0 ? (
                <div className="p-6 rounded-2xl bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                  No courses are currently assigned to this student. Select a course from the dropdown above to add.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {enrollments.map((enroll) => {
                    const eId = enroll.id || enroll._id || '';
                    const course = enroll.course;
                    const isDeleting = deletingEnrollmentId === eId;

                    return (
                      <div
                        key={eId}
                        className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3 hover:border-brand/40 transition-colors animate-fadeIn"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-foreground truncate">
                              {course?.title || 'Enrolled Course'}
                            </p>
                            {course?.type && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 shrink-0">
                                {course.type}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>Instructor: <strong className="text-foreground font-medium">{course?.teacher?.name || 'Assigned Instructor'}</strong></span>
                            <span>•</span>
                            <span>Enrolled: {new Date(enroll.enrolledAt).toLocaleDateString()}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteEnrollment(eId, course?.title)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all shrink-0"
                          title="Remove this course assignment"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. SELECT TEACHER TO ASSIGN (INSTANTLY UPDATES ON SELECT) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-card to-muted/20 border border-emerald-500/30 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookUser className="h-4 w-4 text-emerald-500" />
                  <span>Select Teacher to Assign *</span>
                </label>
                {submitting && (
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Assigning teacher...</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  disabled={submitting}
                  value={selectedTeacherId}
                  onChange={(e) => handleImmediateTeacherSelect(e.target.value)}
                  className="w-full bg-background border border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <option value="">-- Choose Teacher to Assign Immediately --</option>
                  {teachers.map((t) => {
                    const tId = t.id || t._id;
                    const isCurrent = currentTeacher && (currentTeacher.id || currentTeacher._id) === tId;
                    return (
                      <option key={tId} value={tId}>
                        {isCurrent ? '★ ' : ''}{t.name} ({t.email}){t.specialization ? ` - ${t.specialization}` : ''} {isCurrent ? '(Currently Assigned)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Selecting a teacher above immediately updates the student&apos;s assigned teacher record.
              </p>
            </div>

            {/* 2. CURRENT ASSIGNED TEACHER CARD (WITH UNASSIGN BUTTON) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookUser className="h-4 w-4 text-emerald-500" />
                  <span>Currently Assigned Teacher</span>
                </span>
                {currentTeacher ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Active Teacher
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    Unassigned
                  </span>
                )}
              </div>

              {currentTeacher ? (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                      {currentTeacher.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {currentTeacher.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentTeacher.email}
                        {currentTeacher.specialization && ` • ${currentTeacher.specialization}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={unassigningTeacher}
                    onClick={handleUnassignTeacher}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                    title="Remove assigned teacher"
                  >
                    {unassigningTeacher ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <UserMinus className="h-4 w-4 text-destructive" />
                    )}
                    <span className="hidden sm:inline text-destructive">Unassign</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                  No teacher is currently assigned to this student. Select a teacher from the dropdown above to assign.
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
