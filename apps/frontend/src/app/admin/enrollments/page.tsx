'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, ArrowLeft, Plus, Search, UserPlus, Trash2, Loader2, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface EnrollmentItem {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    type: string;
  };
  enrolledAt: string;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CourseItem {
  id: string;
  title: string;
}

export default function EnrollmentManagement() {
  const { logout } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Enroll Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchData = async () => {
    try {
      // Fetch enrollments
      const enrollRes = await fetch(`${API_URL}/enrollments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const enrollData = await enrollRes.json();
      setEnrollments(enrollData);

      // Fetch users to filter students
      const usersRes = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const usersData = await usersRes.json();
      const studentsOnly = usersData.filter((u: any) => u.role === 'STUDENT');
      setStudents(studentsOnly);
      if (studentsOnly.length > 0) {
        setStudentId(studentsOnly[0].id);
      }

      // Fetch courses
      const courseRes = await fetch(`${API_URL}/courses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const coursesData = await courseRes.json();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setCourseId(coursesData[0].id);
      }
    } catch (err) {
      console.error('Error loading enrollments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to enroll student');
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenroll = async (id: string) => {
    if (!confirm('Are you sure you want to unenroll this student from the course?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/enrollments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete enrollment.');
      }
    } catch (err) {
      console.error('Error unenrolling student:', err);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const query = searchQuery.toLowerCase().trim();
    return e.student.name.toLowerCase().includes(query) || e.course.title.toLowerCase().includes(query);
  });

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Manage Course Enrollments</h1>
          <p className="text-muted-foreground mt-1">Enroll registered students into courses, and view active classes roster lists.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
        >
          <UserPlus className="h-5 w-5" />
          <span>Enroll Student</span>
        </button>
      </div>

      {/* Toolbar (Search) */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search enrollments by student name or course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Enrollments Table */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading enrollments...</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            No enrollments found. Click "Enroll Student" to enroll.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Student Name</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Course Title</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Category</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Enrolled At</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-card/20 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-foreground">{e.student.name}</p>
                      <p className="text-xs text-muted-foreground">{e.student.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-foreground">{e.course.title}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold py-1 px-2.5 rounded-full">
                        {e.course.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-xs">
                      {new Date(e.enrolledAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleUnenroll(e.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                        title="Unenroll Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Enroll Student Modal */ }
  {
    showAddModal && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
          <h2 className="text-2xl font-display font-bold mb-4">Enroll Student</h2>

          <form onSubmit={handleEnroll} className="space-y-4">
            {submitError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3">
                {submitError}
              </div>
            )}

            {/* Student selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Student</label>
              {students.length === 0 ? (
                <p className="text-xs text-destructive">No student accounts registered! Please create a Student first.</p>
              ) : (
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Course selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Course</label>
              {courses.length === 0 ? (
                <p className="text-xs text-destructive">No active courses registered! Please create a Course first.</p>
              ) : (
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || students.length === 0 || courses.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Enroll</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    )
  }
    </div >

  );
}

