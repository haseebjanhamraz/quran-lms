'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Calendar as CalendarIcon, Clock, Plus, Loader2, BookOpen, Edit, Copy, Check, CheckCircle } from 'lucide-react';

function ScheduleForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  // Form state
  const [courseId, setCourseId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load teacher's courses for dropdown (simple fetch)
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatToLocalDatetime = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

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

  // Fetch session info if editing
  const fetchSessionInfo = async () => {
    if (!sessionId) return;
    setSessionLoading(true);
    try {
      const res = await fetch(`${API_URL}/class-sessions/${sessionId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setCourseId(data.courseId);
        setScheduledAt(formatToLocalDatetime(data.scheduledAt));
        setDuration(data.durationMinutes);
      } else {
        setError('Failed to load session details.');
      }
    } catch (e) {
      console.error('Unable to fetch session details', e);
      setError('Error loading session details.');
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionInfo();
    }
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(duration),
      };

      let res;
      if (sessionId) {
        // Edit mode (PUT)
        res = await fetch(`${API_URL}/class-sessions/${sessionId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode (POST)
        payload.courseId = courseId;
        res = await fetch(`${API_URL}/class-sessions`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        if (sessionId) {
          router.push('/teacher/dashboard');
        } else {
          const data = await res.json();
          setCreatedSessionId(data.id);
        }
      } else {
        const err = await res.json();
        setError(err.message || `Failed to ${sessionId ? 'update' : 'create'} class`);
      }
    } catch (e) {
      setError(`Network error while ${sessionId ? 'updating' : 'creating'} class`);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const classLink = typeof window !== 'undefined' ? `${window.location.origin}/classroom/${createdSessionId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(classLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetForm = () => {
    setCreatedSessionId(null);
    setCourseId('');
    setScheduledAt('');
    setDuration(60);
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
          <h1 className="font-display font-bold text-lg">{sessionId ? 'Edit Class Session' : 'Create New Class'}</h1>
          <div />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
        {createdSessionId ? (
          <div className="glass-panel p-8 rounded-2xl border border-border/50 text-center flex flex-col items-center">
            <CheckCircle className="h-14 w-14 text-emerald-400 mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold font-display mb-2 text-slate-100" style={{ color: '#C9A84C' }}>
              Class Scheduled!
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Your online class session has been scheduled. Copy the link below and share it with your students so they can join.
            </p>

            <div className="w-full flex items-center gap-2 bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 mb-6 text-left">
              <span className="font-mono text-xs text-slate-300 truncate flex-1 select-all">
                {classLink}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border transition-all duration-200 shrink-0 ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 border-slate-750 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex gap-3 w-full justify-center">
              <button
                onClick={resetForm}
                className="flex-1 max-w-[200px] border border-slate-750 bg-slate-900/40 hover:bg-slate-800/40 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors outline-none"
              >
                Schedule Another
              </button>
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="flex-1 max-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl text-sm transition-colors outline-none shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-border/50">
            <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
              {sessionId ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
              <span>{sessionId ? 'Update Class Details' : 'Schedule a Class Session'}</span>
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
                    disabled={!!sessionId}
                    required
                    className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary disabled:opacity-60 transition-colors"
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
                    <span>{sessionId ? 'Save Changes' : 'Create Class'}</span>
                  </>}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TeacherSchedule() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ScheduleForm />
    </Suspense>
  );
}
