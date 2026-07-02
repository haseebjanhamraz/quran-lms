'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Import Modular Components
import StatsRow from './components/StatsRow';
import ScheduleTab from './components/ScheduleTab';
import CoursesTab from './components/CoursesTab';
import StudentsTab from './components/StudentsTab';
import RecordingsTab from './components/RecordingsTab';
import NotificationsDropdown from '@/components/NotificationsDropdown';

// Interfaces
interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
  recording?: { driveUrl: string | null; status: string } | null;
}

interface Course {
  id: string;
  title: string;
  type: string;
  _count?: { enrollments: number; classSessions: number };
}

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  courseTitle: string;
}

interface TeacherStats {
  total: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  today: number;
  totalHours: number;
  totalStudents: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      )}
    </button>
  );
}

export default function TeacherDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'Schedule' | 'My Courses' | 'My Students' | 'Class Recordings'>('Schedule');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`${API_URL}/class-sessions/calendar`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (_) {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  const refreshSessionsSilently = async () => {
    try {
      const res = await fetch(`${API_URL}/class-sessions/calendar`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (_) {}
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/class-sessions/stats`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (_) {}
  };

  // Fetch courses
  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch(`${API_URL}/courses/teacher/${user?.id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (_) {
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      // Find all students enrolled in teacher's courses
      const coursesRes = await fetch(`${API_URL}/courses/teacher/${user?.id}`, {
        credentials: 'include',
      });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const roster: StudentRecord[] = [];
        
        for (const c of coursesData) {
          const detailRes = await fetch(`${API_URL}/courses/${c.id}`, {
            credentials: 'include',
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData.enrollments) {
              detailData.enrollments.forEach((enroll: any) => {
                roster.push({
                  id: enroll.student.id,
                  name: enroll.student.name,
                  email: enroll.student.email,
                  courseTitle: c.title,
                });
              });
            }
          }
        }
        setStudents(roster);
      }
    } catch (_) {
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch recent reviews
  const fetchReviews = async () => {
    if (!user) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_URL}/class-reviews/teacher/${user.id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setRecentReviews(data.slice(0, 5)); // show latest 5
      }
    } catch (_) {
    } finally {
      setReviewsLoading(false);
    }
  };

  // Start class session action
  const handleStartClass = async (id: string) => {
    setStartingId(id);
    try {
      // Update session status to LIVE
      const res = await fetch(`${API_URL}/class-sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIVE' }),
        credentials: 'include',
      });

      if (res.ok) {
        // Redirect to classroom
        router.push(`/classroom/${id}`);
      } else {
        alert('Failed to start class. Please verify schedule timing.');
      }
    } catch (err) {
      console.error('Error starting class:', err);
    } finally {
      setStartingId(null);
    }
  };

  // Retry recording upload action
  const handleRetryUpload = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/recordings/${id}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        alert('Retry job registered in background queue. Upload monitoring initiated.');
        fetchSessions();
      } else {
        alert('Retry trigger failed. Please check backend queue status.');
      }
    } catch (err) {
      console.error('Error retrying upload:', err);
    }
  };

  // Trigger loading based on active tab
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();
    fetchSessions();

    if (activeTab === 'My Courses') {
      fetchCourses();
    } else if (activeTab === 'My Students') {
      fetchStudents();
    } else if (activeTab === 'Schedule') {
      fetchReviews();
    }
  }, [user, authLoading, activeTab]);

  // Periodic polling for recording upload status updates (every 5 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      // Only refresh if there is a session processing
      const hasProcessing = sessions.some(
        (s) => s.status === 'COMPLETED' && (!s.recording || s.recording.status === 'PROCESSING' || s.recording.status === 'UPLOADING')
      );
      if (hasProcessing) {
        refreshSessionsSilently();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [sessions, user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap');
        .font-display { font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgb(2 6 23); }
        ::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 3px; }
      `}</style>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5">
              <BookOpen size={18} className="text-emerald-400" />
            </div>
            <span className="font-display text-base font-bold text-slate-100">Teacher Portal</span>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {(['Schedule', 'My Courses', 'My Students', 'Class Recordings'] as const).map((tab) => (
              <NavTab
                key={tab}
                label={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-200 leading-none">{user.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-880/60 px-3 py-1.5 text-xs font-medium text-slate-450 transition-all duration-205 hover:border-rose-505/40 hover:bg-rose-505/10 hover:text-rose-400"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex border-t border-slate-800/60 sm:hidden overflow-x-auto">
          {(['Schedule', 'My Courses', 'My Students', 'Class Recordings'] as const).map((tab) => (
            <NavTab
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 backdrop-blur-sm">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl" style={{ color: '#C9A84C' }}>
                Assalamu Alaikum, {user.name}
              </h1>
              <p className="mt-2 text-slate-400">May Allah bless your teaching efforts and your students.</p>
            </div>
            <button
              onClick={() => router.push('/teacher/schedule')}
              className="group flex w-fit items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-emerald-400"
            >
              <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
              Create New Class
            </button>
          </div>
        </section>

        {/* Stats row */}
        <StatsRow stats={stats} />

        {/* Dynamic tabs render */}
        {activeTab === 'Schedule' && (
          <ScheduleTab
            sessions={sessions}
            sessionsLoading={sessionsLoading}
            startingId={startingId}
            recentReviews={recentReviews}
            reviewsLoading={reviewsLoading}
            handleStartClass={handleStartClass}
            router={router}
          />
        )}

        {activeTab === 'My Courses' && (
          <CoursesTab
            courses={courses}
            coursesLoading={coursesLoading}
          />
        )}

        {activeTab === 'My Students' && (
          <StudentsTab
            students={students}
            studentsLoading={studentsLoading}
          />
        )}

        {activeTab === 'Class Recordings' && (
          <RecordingsTab
            sessions={sessions}
            sessionsLoading={sessionsLoading}
            handleRetryUpload={handleRetryUpload}
          />
        )}
      </main>
    </div>
  );
}
