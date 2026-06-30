'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  GraduationCap,
  Calendar,
  Video,
  Clock,
  Loader2,
  BookOpen,
  Star,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}

interface Course {
  id: string;
  title: string;
  type: string;
  teacher?: { name: string };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
}

function CourseTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    QURAN: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    TAJWEED: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    ARABIC: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
    ISLAMIC: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  };
  const cls =
    map[type] ??
    'from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/30';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r border ${cls}`}
    >
      {type}
    </span>
  );
}

export default function StudentDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [sessRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/class-sessions/calendar`, {
            credentials: 'include',
          }),
          fetch(`${API_URL}/courses`, { credentials: 'include' }),
        ]);
        if (sessRes.ok) {
          const d = await sessRes.json();
          setSessions(Array.isArray(d) ? d : d.sessions ?? []);
        }
        if (coursesRes.ok) {
          const d = await coursesRes.json();
          setCourses(Array.isArray(d) ? d : d.courses ?? []);
        }
      } catch {
        // network errors silently ignored; UI shows empty states
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [authLoading, user]);

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const scheduledSessions = sessions.filter((s) => s.status === 'SCHEDULED');
  const liveSessions = sessions.filter((s) => s.status === 'LIVE');
  const totalHours =
    completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;

  const upcomingSessions = [...liveSessions, ...scheduledSessions].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ─── Global Styles injected via style tag ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }

        .glass-card {
          background: rgba(15,23,42,0.80);
          border: 1px solid rgba(51,65,85,0.5);
          border-radius: 1rem;
          backdrop-filter: blur(12px);
        }
        .stat-card {
          background: linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%);
          border: 1px solid rgba(51,65,85,0.5);
          border-radius: 1rem;
          backdrop-filter: blur(12px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        .session-card {
          background: rgba(15,23,42,0.85);
          border: 1px solid rgba(51,65,85,0.4);
          border-radius: 0.875rem;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .session-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96,165,250,0.35);
          box-shadow: 0 8px 32px rgba(59,130,246,0.15);
        }
        .course-card {
          background: rgba(15,23,42,0.85);
          border: 1px solid rgba(51,65,85,0.4);
          border-radius: 0.875rem;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .course-card:hover {
          transform: translateY(-3px);
          border-color: rgba(96,165,250,0.35);
          box-shadow: 0 12px 40px rgba(59,130,246,0.12);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          border: none;
          border-radius: 0.625rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-primary:hover { opacity: 0.9; transform: scale(1.03); }

        .btn-live {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          border-radius: 0.625rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          box-shadow: 0 0 16px rgba(16,185,129,0.4);
        }
        .btn-live:hover { opacity: 0.9; transform: scale(1.04); }

        .btn-logout {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 0.625rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: background 0.2s;
        }
        .btn-logout:hover { background: rgba(239,68,68,0.2); }

        .pulse-live {
          width: 10px; height: 10px;
          background: #10b981;
          border-radius: 50%;
          position: relative;
          display: inline-block;
        }
        .pulse-live::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: rgba(16,185,129,0.4);
          border-radius: 50%;
          animation: pulse-ring 1.4s ease-out infinite;
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .gold-text { color: #C9A84C; }
        .gradient-hero {
          background: linear-gradient(135deg, #0d2137 0%, #0c1a2e 40%, #0d1e38 70%, #0b1929 100%);
          border: 1px solid rgba(96,165,250,0.15);
          border-radius: 1.25rem;
          position: relative;
          overflow: hidden;
        }
        .gradient-hero::before {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .gradient-hero::after {
          content: '';
          position: absolute;
          bottom: -80px; right: -40px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .verse-banner {
          background: linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(20,184,166,0.14) 100%);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 0.875rem;
        }
        .section-heading {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem 1.5rem;
          color: #64748b;
        }
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(2,6,23,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(51,65,85,0.4);
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .courses-grid { grid-template-columns: 1fr !important; }
          .hero-inner { flex-direction: column !important; gap: 1.5rem !important; }
        }
      `}</style>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className="navbar">
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.875rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                borderRadius: '0.625rem',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap style={{ color: '#fff', width: 20, height: 20 }} />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: '#f1f5f9',
                letterSpacing: '-0.01em',
              }}
            >
              Student Portal
            </span>
          </div>

          {/* User area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    margin: 0,
                  }}
                >
                  {user.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                  {user.email}
                </p>
              </div>
            )}
            <button className="btn-logout" onClick={logout}>
              <LogOut style={{ width: 15, height: 15 }} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════ MAIN ═══════════════ */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* ── HERO ── */}
        <section className="gradient-hero" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <div
            className="hero-inner"
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '2rem',
            }}
          >
            <div style={{ flex: 1 }}>
              {/* Small pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(96,165,250,0.25)',
                  borderRadius: '999px',
                  padding: '0.3rem 0.9rem',
                  marginBottom: '1rem',
                }}
              >
                <Star style={{ width: 13, height: 13, color: '#C9A84C' }} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                  Daily Progress
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                  fontWeight: 800,
                  color: '#f8fafc',
                  margin: '0 0 0.5rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Assalamu Alaikum,{' '}
                <span className="gold-text">{user?.name ?? 'Student'}</span>
              </h1>

              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '1rem',
                  margin: '0 0 1.75rem',
                  fontWeight: 400,
                }}
              >
                Your Quran learning journey continues. Keep going!
              </p>

              {/* Verse banner */}
              <div className="verse-banner" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <BookOpen style={{ width: 20, height: 20, color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
                <p
                  style={{
                    color: '#a7f3d0',
                    fontSize: '0.95rem',
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  &ldquo;Read in the name of your Lord who created.&rdquo;
                  <span style={{ color: '#6ee7b7', fontWeight: 600, fontStyle: 'normal' }}>
                    {' '}— Al-Alaq 96:1
                  </span>
                </p>
              </div>
            </div>

            {/* Decorative element */}
            <div
              style={{
                flexShrink: 0,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(99,102,241,0.15))',
                border: '1px solid rgba(96,165,250,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap style={{ width: 52, height: 52, color: '#60a5fa' }} />
            </div>
          </div>
        </section>

        {/* ── STATS ROW ── */}
        <section
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {/* Classes Attended */}
          <div className="stat-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem',
                  display: 'flex',
                }}
              >
                <CheckCircle style={{ width: 22, height: 22, color: '#60a5fa' }} />
              </div>
              <TrendingUp style={{ width: 16, height: 16, color: '#22c55e' }} />
            </div>
            <p
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 800,
                color: '#f1f5f9',
                margin: '0 0 0.25rem',
                lineHeight: 1,
              }}
            >
              {dataLoading ? (
                <Loader2 style={{ width: 20, height: 20, display: 'inline', animation: 'spin 1s linear infinite', color: '#60a5fa' }} />
              ) : (
                completedSessions.length
              )}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
              Classes Attended
            </p>
          </div>

          {/* Upcoming Classes */}
          <div className="stat-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem',
                  display: 'flex',
                }}
              >
                <Calendar style={{ width: 22, height: 22, color: '#34d399' }} />
              </div>
              <TrendingUp style={{ width: 16, height: 16, color: '#22c55e' }} />
            </div>
            <p
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 800,
                color: '#f1f5f9',
                margin: '0 0 0.25rem',
                lineHeight: 1,
              }}
            >
              {dataLoading ? (
                <Loader2 style={{ width: 20, height: 20, display: 'inline', animation: 'spin 1s linear infinite', color: '#34d399' }} />
              ) : (
                scheduledSessions.length
              )}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
              Upcoming Classes
            </p>
          </div>

          {/* Learning Hours */}
          <div className="stat-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div
                style={{
                  background: 'rgba(201,168,76,0.15)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem',
                  display: 'flex',
                }}
              >
                <Clock style={{ width: 22, height: 22, color: '#C9A84C' }} />
              </div>
              <TrendingUp style={{ width: 16, height: 16, color: '#22c55e' }} />
            </div>
            <p
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                fontWeight: 800,
                color: '#f1f5f9',
                margin: '0 0 0.25rem',
                lineHeight: 1,
              }}
            >
              {dataLoading ? (
                <Loader2 style={{ width: 20, height: 20, display: 'inline', animation: 'spin 1s linear infinite', color: '#C9A84C' }} />
              ) : (
                totalHours.toFixed(1)
              )}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
              Total Learning Hours
            </p>
          </div>
        </section>

        {/* ── UPCOMING CLASSES ── */}
        <section className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <h2 className="section-heading">
              <Video style={{ width: 20, height: 20, color: '#60a5fa' }} />
              Upcoming Classes
            </h2>
            {upcomingSessions.length > 0 && (
              <span
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(96,165,250,0.2)',
                  borderRadius: '999px',
                  padding: '0.2rem 0.75rem',
                  fontSize: '0.75rem',
                  color: '#60a5fa',
                  fontWeight: 600,
                }}
              >
                {upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
              <Loader2 style={{ width: 28, height: 28, color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="empty-state">
              <Calendar style={{ width: 40, height: 40, margin: '0 auto 1rem', color: '#334155' }} />
              <p style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>No upcoming classes</p>
              <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                Ask your academy to enroll you in a course.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {upcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} router={router} />
              ))}
            </div>
          )}
        </section>

        {/* ── ENROLLED COURSES ── */}
        <section className="glass-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <h2 className="section-heading">
              <BookOpen style={{ width: 20, height: 20, color: '#C9A84C' }} />
              <span className="gold-text">Enrolled Courses</span>
            </h2>
            {courses.length > 0 && (
              <span
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '999px',
                  padding: '0.2rem 0.75rem',
                  fontSize: '0.75rem',
                  color: '#C9A84C',
                  fontWeight: 600,
                }}
              >
                {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
              <Loader2 style={{ width: 28, height: 28, color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <BookOpen style={{ width: 40, height: 40, margin: '0 auto 1rem', color: '#334155' }} />
              <p style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                You are not enrolled in any courses yet.
              </p>
              <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                Contact your academy administrator to get started.
              </p>
            </div>
          ) : (
            <div
              className="courses-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1rem',
              }}
            >
              {courses.map((course) => (
                <div key={course.id} className="course-card" style={{ padding: '1.25rem' }}>
                  {/* Icon strip */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '0.625rem',
                      background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(99,102,241,0.1))',
                      border: '1px solid rgba(96,165,250,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.875rem',
                    }}
                  >
                    <BookOpen style={{ width: 18, height: 18, color: '#60a5fa' }} />
                  </div>

                  <h3
                    style={{
                      color: '#f1f5f9',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      margin: '0 0 0.4rem',
                      lineHeight: 1.35,
                    }}
                  >
                    {course.title}
                  </h3>

                  {course.teacher && (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
                      {course.teacher.name}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                    }}
                  >
                    <CourseTypeBadge type={course.type} />
                    <button
                      className="btn-primary"
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                    >
                      View
                      <ChevronRight style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── FOOTER QUOTE ── */}
        <footer
          style={{
            textAlign: 'center',
            padding: '1.5rem',
            borderTop: '1px solid rgba(51,65,85,0.4)',
          }}
        >
          <p
            style={{
              fontStyle: 'italic',
              color: '#475569',
              fontSize: '0.9rem',
              letterSpacing: '0.02em',
              margin: '0 0 0.3rem',
            }}
          >
            &ldquo;Seek knowledge from the cradle to the grave.&rdquo;
          </p>
          <p style={{ color: '#334155', fontSize: '0.75rem', margin: 0 }}>
            — Prophet Muhammad (PBUH)
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ─── Session Card (extracted for clarity) ─── */
function SessionCard({
  session,
  router,
}: {
  session: SessionItem;
  router: ReturnType<typeof useRouter>;
}) {
  const isLive = session.status === 'LIVE';
  const isScheduled = session.status === 'SCHEDULED';
  const isCompleted = session.status === 'COMPLETED';
  const isCancelled = session.status === 'CANCELLED';

  return (
    <div
      className="session-card"
      style={{
        padding: '1.125rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '0.75rem',
          background: isLive
            ? 'rgba(16,185,129,0.15)'
            : isCompleted
            ? 'rgba(20,184,166,0.12)'
            : isCancelled
            ? 'rgba(239,68,68,0.1)'
            : 'rgba(59,130,246,0.12)',
          border: `1px solid ${
            isLive
              ? 'rgba(16,185,129,0.3)'
              : isCompleted
              ? 'rgba(20,184,166,0.25)'
              : isCancelled
              ? 'rgba(239,68,68,0.2)'
              : 'rgba(96,165,250,0.2)'
          }`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isLive ? (
          <PlayCircle style={{ width: 20, height: 20, color: '#34d399' }} />
        ) : isCompleted ? (
          <CheckCircle style={{ width: 20, height: 20, color: '#2dd4bf' }} />
        ) : (
          <Video
            style={{
              width: 20,
              height: 20,
              color: isCancelled ? '#f87171' : '#60a5fa',
            }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.9rem',
            margin: '0 0 0.25rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.course.title}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <CourseTypeBadge type={session.course.type} />
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}
          </span>
          <span style={{ color: '#475569', fontSize: '0.78rem' }}>
            {session.durationMinutes}min
          </span>
        </div>
      </div>

      {/* Status / Action */}
      <div style={{ flexShrink: 0 }}>
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span className="pulse-live" />
            <button
              className="btn-live"
              onClick={() => router.push(`/classroom/${session.id}`)}
            >
              <PlayCircle style={{ width: 15, height: 15 }} />
              Join Now
            </button>
          </div>
        )}

        {isScheduled && (
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(96,165,250,0.25)',
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                color: '#60a5fa',
                fontWeight: 600,
                marginBottom: '0.25rem',
              }}
            >
              Upcoming
            </span>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0, textAlign: 'center' }}>
              {getCountdown(session.scheduledAt)}
            </p>
          </div>
        )}

        {isCompleted && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(20,184,166,0.12)',
              border: '1px solid rgba(45,212,191,0.25)',
              borderRadius: '999px',
              padding: '0.3rem 0.875rem',
              fontSize: '0.75rem',
              color: '#2dd4bf',
              fontWeight: 600,
            }}
          >
            <CheckCircle style={{ width: 13, height: 13 }} />
            Attended
          </span>
        )}

        {isCancelled && (
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '999px',
              padding: '0.3rem 0.875rem',
              fontSize: '0.75rem',
              color: '#f87171',
              fontWeight: 600,
            }}
          >
            Cancelled
          </span>
        )}
      </div>
    </div>
  );
}
