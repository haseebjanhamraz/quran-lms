'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, ArrowLeft, Plus, Calendar, Trash2, Loader2, Video, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface SessionItem {
  id: string;
  course: {
    title: string;
    teacher: {
      name: string;
    };
  };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}

interface CourseItem {
  id: string;
  title: string;
}

export default function ScheduleManagement() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchData = async () => {
    try {
      // Fetch sessions
      const sessionsRes = await fetch(`${API_URL}/class-sessions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData);

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
      console.error('Error fetching schedules data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/class-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: Number(durationMinutes),
        }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to schedule class session');
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during scheduling.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSession = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled class session?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/class-sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to cancel session.');
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold py-1 px-2.5 rounded-full">{status}</span>;
      case 'LIVE':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold py-1 px-2.5 rounded-full animate-pulse">{status}</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold py-1 px-2.5 rounded-full">{status}</span>;
      default:
        return <span className="bg-muted text-muted-foreground border border-border text-xs py-1 px-2.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Class Sessions Roster</h1>
            <p className="text-muted-foreground mt-1">Schedule live classes and check for timing conflicts automatically.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-primary/10 transition-all duration-300 outline-none hover-lift self-start"
          >
            <Plus className="h-5 w-5" />
            <span>Schedule Session</span>
          </button>
        </div>

        {/* Schedule List Table */}
        <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading schedules...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No classes scheduled. Click "Schedule Session" to start.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/30">
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Course Details</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Teacher</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Scheduled Date / Time</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Duration</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground">
                        {s.course.title}
                      </td>
                      <td className="py-4 px-6">
                        {s.course.teacher.name}
                      </td>
                      <td className="py-4 px-6 text-foreground/90 font-mono text-xs">
                        {new Date(s.scheduledAt).toLocaleString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {s.durationMinutes} mins
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(s.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {s.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => handleCancelSession(s.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                            title="Cancel Class Session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


      {/* Schedule Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-2xl font-display font-bold mb-4">Schedule Class</h2>

            <form onSubmit={handleSchedule} className="space-y-4">
              {submitError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3.5 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

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

              {/* Scheduled At input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date &amp; Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
                />
              </div>

              {/* Duration input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg p-2.5 text-sm outline-none transition-all duration-300"
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
                  disabled={submitting || courses.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
