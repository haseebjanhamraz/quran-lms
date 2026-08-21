'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Plus, Loader2, PlayCircle, PlaneTakeoff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Import Modular Components
import DashboardTab from './components/DashboardTab';
import StatsRow from './components/StatsRow';
import ScheduleTab from './components/ScheduleTab';
import CoursesTab from './components/CoursesTab';
import StudentsTab from './components/StudentsTab';
import RecordingsTab from './components/RecordingsTab';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import InstantClassModal from './components/InstantClassModal';
import ThemeToggle from '@/components/ThemeToggle';
import UpcomingClassBanner from '@/components/UpcomingClassBanner';
import { apiFetch } from '@/utils/apiFetch';
import { useWebSocket } from '@/hooks/useWebSocket';

// Interfaces
interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
  recording?: { filePath: string | null; status: string } | null;
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
  pendingLeaves?: number;
  approvedLeaves?: number;
  remainingLeaves?: any;
  nextClass?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const TABS = ['Dashboard', 'Schedule', 'My Courses', 'My Students', 'Class Recordings'] as const;
type TabType = (typeof TABS)[number];

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
        active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      )}
    </button>
  );
}

export default function TeacherDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);

  const handleOpenInstantModal = () => {
    setIsInstantModalOpen(true);
    fetchCourses();
  };

  const handleStartInstantClass = async (courseId: string, durationMinutes: number) => {
    const res = await apiFetch(`${API_URL}/class-sessions`, {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        scheduledAt: new Date().toISOString(),
        durationMinutes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create instant class session.');
    }

    const newSession = await res.json();
    await handleStartClass(newSession.id);
  };

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/class-sessions/calendar`);
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (_) {
    } finally {
      setSessionsLoading(false);
    }
  }, [API_URL]);

  const refreshSessionsSilently = async () => {
    try {
      const res = await apiFetch(`${API_URL}/class-sessions/calendar`);
      if (res.ok) {
        const data: SessionItem[] = await res.json();
        setSessions(data);
      }
    } catch (_) {}
  };

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/class-sessions/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (_) {}
  }, [API_URL]);

  // Fetch leave requests
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/leave/my`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (_) {}
  }, [API_URL]);

  // Fetch leave balance
  const fetchLeaveBalance = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/leave/my/balance`);
      if (res.ok) {
        const data = await res.json();
        setLeaveBalance(data);
      }
    } catch (_) {}
  }, [API_URL]);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    if (!user?.id) return;
    setCoursesLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/courses/teacher/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (_) {
    } finally {
      setCoursesLoading(false);
    }
  }, [API_URL, user?.id]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!user?.id) return;
    setStudentsLoading(true);
    try {
      const coursesRes = await apiFetch(`${API_URL}/courses/teacher/${user.id}`);
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const roster: StudentRecord[] = [];

        for (const c of coursesData) {
          const detailRes = await apiFetch(`${API_URL}/courses/${c.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData.enrollments) {
              detailData.enrollments.forEach((enroll: any) => {
                roster.push({
                  id: enroll.student?.id || enroll.student?._id,
                  name: enroll.student?.name || 'Enrolled Student',
                  email: enroll.student?.email || '',
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
  }, [API_URL, user?.id]);

  // Fetch recent reviews
  const fetchReviews = useCallback(async () => {
    if (!user?.id) return;
    setReviewsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/class-reviews/teacher/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecentReviews(data.slice(0, 5));
      }
    } catch (_) {
    } finally {
      setReviewsLoading(false);
    }
  }, [API_URL, user?.id]);

  // Real-time WebSocket hook
  useWebSocket({
    onMessage: (msg) => {
      if (msg.event === 'leave_status_changed' || msg.event === 'leave_update') {
        fetchLeaves();
        fetchLeaveBalance();
        fetchStats();
      }
      if (msg.event === 'schedule_update') {
        fetchSessions();
        fetchStats();
      }
    },
  });

  // Start class session action
  const handleStartClass = async (id: string) => {
    setStartingId(id);
    try {
      const res = await apiFetch(`${API_URL}/class-sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'LIVE' }),
      });

      if (res.ok) {
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
      const res = await apiFetch(`${API_URL}/recordings/${id}/retry`, {
        method: 'POST',
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

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();
    fetchSessions();
    fetchLeaves();
    fetchLeaveBalance();
    fetchReviews();

    if (activeTab === 'My Courses') {
      fetchCourses();
    } else if (activeTab === 'My Students') {
      fetchStudents();
    }
  }, [user, authLoading, activeTab, fetchStats, fetchSessions, fetchLeaves, fetchLeaveBalance, fetchReviews, fetchCourses, fetchStudents, router]);

  // Periodic polling for recording upload status updates (every 5 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-1.5 flex items-center justify-center">
              <Image src="/logo.png" width={24} height={24} alt="Logo" />
            </div>
            <span className="font-display text-base font-bold text-foreground">Teacher Portal</span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((tab) => (
              <NavTab
                key={tab}
                label={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </nav>

          {/* Right Header Items */}
          <div className="flex items-center gap-3">
            {/* Quick Leave Portal Link */}
            <Link
              href="/teacher/leave"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-card/60 text-xs font-semibold text-foreground hover:border-brand/40 hover:bg-card transition-all"
              title="Leave Management"
            >
              <PlaneTakeoff size={14} className="text-brand" />
              <span>Leaves</span>
            </Link>

            <ThemeToggle />
            <NotificationsDropdown />

            <div className="hidden text-right lg:block">
              <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs bar */}
        <div className="flex border-t border-border/60 md:hidden overflow-x-auto px-2">
          {TABS.map((tab) => (
            <NavTab
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
          <Link
            href="/teacher/leave"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1"
          >
            <PlaneTakeoff size={13} />
            <span>Leaves</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Blinking Live / Upcoming Class Alert Banner */}
        <UpcomingClassBanner userRole="TEACHER" className="mb-6" />

        {/* 1. Default Tab: Comprehensive Teacher Dashboard */}
        {activeTab === 'Dashboard' && (
          <DashboardTab
            user={user}
            stats={stats}
            sessions={sessions}
            courses={courses}
            students={students}
            recentReviews={recentReviews}
            leaves={leaves}
            leaveBalance={leaveBalance}
            handleStartClass={handleStartClass}
            onOpenInstantModal={handleOpenInstantModal}
            onNavigateTab={(tab) => setActiveTab(tab)}
            router={router}
          />
        )}

        {/* 2. Schedule Tab (Daily Timetable, Weekly Grid, Session List) */}
        {activeTab === 'Schedule' && (
          <>
            <StatsRow stats={stats} />
            <ScheduleTab
              sessions={sessions}
              sessionsLoading={sessionsLoading}
              startingId={startingId}
              recentReviews={recentReviews}
              reviewsLoading={reviewsLoading}
              handleStartClass={handleStartClass}
              router={router}
              teacherId={user?.id}
            />
          </>
        )}

        {/* 3. My Courses Tab */}
        {activeTab === 'My Courses' && (
          <>
            <StatsRow stats={stats} />
            <CoursesTab
              courses={courses}
              coursesLoading={coursesLoading}
            />
          </>
        )}

        {/* 4. My Students Tab */}
        {activeTab === 'My Students' && (
          <>
            <StatsRow stats={stats} />
            <StudentsTab
              students={students}
              studentsLoading={studentsLoading}
            />
          </>
        )}

        {/* 5. Class Recordings Tab */}
        {activeTab === 'Class Recordings' && (
          <>
            <StatsRow stats={stats} />
            <RecordingsTab
              sessions={sessions}
              sessionsLoading={sessionsLoading}
              handleRetryUpload={handleRetryUpload}
            />
          </>
        )}
      </main>

      <InstantClassModal
        isOpen={isInstantModalOpen}
        onClose={() => setIsInstantModalOpen(false)}
        courses={courses}
        coursesLoading={coursesLoading}
        onStartInstantClass={handleStartInstantClass}
      />
    </div>
  );
}
