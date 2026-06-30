'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, ArrowLeft, Plus, Search, BookOpen, Trash2, Loader2, Award } from 'lucide-react';
import Link from 'next/link';

interface CourseItem {
  id: string;
  title: string;
  type: 'NAZIRA' | 'TAJWEED' | 'HIFZ_UL_QURAN' | 'ISLAMIC_STUDIES';
  curriculum: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CourseManagement() {
  const { logout } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Course Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'NAZIRA' | 'TAJWEED' | 'HIFZ_UL_QURAN' | 'ISLAMIC_STUDIES'>('TAJWEED');
  const [curriculum, setCurriculum] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchData = async () => {
    try {
      // Fetch courses
      const courseRes = await fetch(`${API_URL}/courses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const coursesData = await courseRes.json();
      setCourses(coursesData);

      // Fetch users to filter teachers
      const usersRes = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const usersData = await usersRes.json();
      const teachersOnly = usersData.filter((u: any) => u.role === 'TEACHER');
      setTeachers(teachersOnly);
      if (teachersOnly.length > 0) {
        setTeacherId(teachersOnly[0].id);
      }
    } catch (err) {
      console.error('Error loading courses/teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, curriculum, teacherId }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      setShowAddModal(false);
      setTitle('');
      setCurriculum('');
      setType('TAJWEED');
      fetchData();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? All associated schedules will be deleted.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete course.');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    return c.title.toLowerCase().includes(query) || c.type.toLowerCase().includes(query);
  });

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Manage Courses</h1>
            <p className="text-muted-foreground mt-1">Configure subjects, define day-to-day syllabi, and assign primary instructors.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
          >
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </button>
        </div>

        {/* Toolbar (Search) */}
        <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search courses by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Courses Table */}
        <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No courses configured yet. Click "Create Course" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/30">
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Course Details</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Subject Category</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Instructor</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Curriculum Syllabus</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {c.id.substring(0, 8)}...</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold py-1 px-2.5 rounded-full">
                          {c.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold">{c.teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{c.teacher.email}</p>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-muted-foreground" title={c.curriculum}>
                        {c.curriculum}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                          title="Delete Course"
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


      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-2xl font-display font-bold mb-4">Create Course</h2>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              {submitError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3">
                  {submitError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intermediate Tajweed rules"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                />
              </div>

              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                >
                  <option value="NAZIRA">NAZIRA</option>
                  <option value="TAJWEED">TAJWEED</option>
                  <option value="HIFZ_UL_QURAN">HIFZ_UL_QURAN</option>
                  <option value="ISLAMIC_STUDIES">ISLAMIC_STUDIES</option>
                </select>
              </div>

              {/* Teacher selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign Teacher</label>
                {teachers.length === 0 ? (
                  <p className="text-xs text-destructive">No teachers registered! Please add a Teacher account first.</p>
                ) : (
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Curriculum input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Curriculum Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the day-by-day plan or milestones..."
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300 resize-none"
                />
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
                  disabled={submitting || teachers.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
