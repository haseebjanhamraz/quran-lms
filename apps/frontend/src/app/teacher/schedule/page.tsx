'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Calendar as CalendarIcon, Clock, Plus, Loader2, BookOpen } from 'lucide-react';

export default function TeacherSchedule() {
  const { user } = useAuth();
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  // Form state
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load teacher's courses for dropdown (simple fetch)
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/courses/teacher/${user?.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.error('Unable to fetch courses', e);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchCourses();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        courseId,
        title,
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(duration),
      };
      const res = await fetch(`${API_URL}/class-sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/teacher/dashboard');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to create class');
      }
    } catch (e) {
      setError('Network error while creating class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="font-display font-bold text-lg">Create New Class</h1>
          <div />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-panel p-8 rounded-2xl border border-border/50">
          <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            <span>Schedule a Class Session</span>
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course selector */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Course</label>
              {coursesLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title} – {c.type}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Class Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Surah Al-Fatiha Review"
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Class Type</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                placeholder="e.g., Tajweed, Memorization"
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
                className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors outline-none shadow-md"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                  <BookOpen className="h-4 w-4" />
                  <span>Create Class</span>
                </>}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
