'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  ShieldCheck,
  Calendar,
  MonitorPlay,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Flag,
  Eye,
  Activity,
  TrendingUp,
  BookOpen,
  Plus,
  Star,
} from 'lucide-react';

interface SessionItem {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  course: { title: string; type: string };
  classReviews: Array<{ status: string; id: string }>;
}

interface FlaggedReview {
  id: string;
  flagSeverity: string;
  flagReason: string;
  session: {
    id: string;
    course: { title: string; teacher: { name: string } };
  };
  reviewer: { name: string };
}

interface ReviewerStats {
  total: number;
  pending: number;
  flagged: number;
  completedReviews: number;
  avgScore: number;
}

interface AssignmentItem {
  id: string;
  course: {
    id: string;
    title: string;
    type: string;
    teacher: {
      name: string;
      email: string;
    };
  };
}

interface ReviewHistoryItem {
  id: string;
  reviewedAt: string;
  overallScore: number;
  isFlagged: boolean;
  flagSeverity: string | null;
  session: {
    id: string;
    scheduledAt: string;
    course: {
      title: string;
    };
  };
}

export default function ReviewerDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'history' | 'assignments'>('pending');
  const [pendingSessions, setPendingSessions] = useState<SessionItem[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([]);
  const [historyReviews, setHistoryReviews] = useState<ReviewHistoryItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [stats, setStats] = useState<ReviewerStats | null>(null);

  const [loadingData, setLoadingData] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

  const loadData = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const [pendRes, flagRes, statsRes, histRes, assignRes] = await Promise.all([
        fetch(`${API_BASE}/class-reviews/pending`, { credentials: 'include' }),
        fetch(`${API_BASE}/class-reviews/flagged`, { credentials: 'include' }),
        fetch(`${API_BASE}/class-sessions/stats`, { credentials: 'include' }),
        fetch(`${API_BASE}/class-reviews/history`, { credentials: 'include' }),
        fetch(`${API_BASE}/reviewer-assignments/reviewer/${user.id}`, { credentials: 'include' }),
      ]);

      const [pendData, flagData, statsData, histData, assignData] = await Promise.all([
        pendRes.ok ? pendRes.json() : [],
        flagRes.ok ? flagRes.json() : [],
        statsRes.ok ? statsRes.json() : null,
        histRes.ok ? histRes.json() : [],
        assignRes.ok ? assignRes.json() : [],
      ]);

      setPendingSessions(Array.isArray(pendData) ? pendData : []);
      setFlaggedReviews(Array.isArray(flagData) ? flagData : []);
      setStats(statsData);
      setHistoryReviews(Array.isArray(histData) ? histData : []);
      setAssignments(Array.isArray(assignData) ? assignData : []);
    } catch (_) {
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function severityColor(s: string) {
    if (s === 'HIGH') return { badge: '#ef4444', bg: 'rgba(239,68,68,0.12)', text: '#f87171' };
    if (s === 'MEDIUM') return { badge: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' };
    return { badge: '#3b82f6', bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' };
  }

  function hasSubmittedReview(session: SessionItem) {
    return session.classReviews.some((r) => r.status === 'SUBMITTED');
  }

  const statCards = [
    {
      label: 'Pending Reviews',
      value: loadingData ? '—' : String(stats?.pending ?? 0),
      icon: <Clock size={20} />,
      accent: '#8b5cf6',
      accentBg: 'rgba(139,92,246,0.12)',
      sub: 'awaiting assessment',
    },
    {
      label: 'Flagged Issues',
      value: loadingData ? '—' : String(stats?.flagged ?? 0),
      icon: <Flag size={20} />,
      accent: '#ef4444',
      accentBg: 'rgba(239,68,68,0.10)',
      sub: 'escalated sessions',
    },
    {
      label: 'Avg Score Given',
      value: loadingData ? '—' : `${stats?.avgScore ?? 0.0} / 5.0`,
      icon: <TrendingUp size={20} />,
      accent: '#10b981',
      accentBg: 'rgba(16,185,129,0.10)',
      sub: 'compliance average',
    },
    {
      label: 'Completed Reviews',
      value: loadingData ? '—' : String(stats?.completedReviews ?? 0),
      icon: <CheckCircle size={20} />,
      accent: '#C9A84C',
      accentBg: 'rgba(201,168,76,0.10)',
      sub: 'submitted scorecard count',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020617; }
        .qa-root {
          min-height: 100vh;
          background: #020617;
          font-family: 'Inter', sans-serif;
          color: #f1f5f9;
        }
        .qa-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 64px;
          background: rgba(2,6,23,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .qa-navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.125rem;
          font-weight: 700;
          color: #f1f5f9;
        }
        .qa-navbar-brand .shield-icon {
          color: #C9A84C;
          flex-shrink: 0;
        }
        .qa-navbar-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .qa-user-info {
          text-align: right;
        }
        .qa-user-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .qa-user-email {
          font-size: 0.75rem;
          color: #64748b;
        }
        .qa-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(148,163,184,0.15);
          background: rgba(148,163,184,0.06);
          color: #94a3b8;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .qa-logout-btn:hover {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }
        .qa-main {
          max-width: 1440px;
          margin: 0 auto;
          padding: 2.5rem 2rem 4rem;
        }
        .qa-hero {
          margin-bottom: 2.5rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .qa-hero-heading {
          font-size: clamp(1.6rem, 3vw, 2.25rem);
          font-weight: 800;
          color: #C9A84C;
        }
        .qa-hero-sub {
          margin-top: 0.5rem;
          font-size: 0.9375rem;
          color: #94a3b8;
          max-width: 520px;
        }
        .qa-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 1024px) { .qa-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px) { .qa-stats { grid-template-columns: 1fr; } }
        .qa-stat-card {
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(148,163,184,0.1);
          border-radius: 1rem;
          padding: 1.25rem 1.375rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .qa-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qa-stat-value {
          font-size: 1.65rem;
          font-weight: 800;
          line-height: 1;
        }
        .qa-stat-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #cbd5e1;
          margin-top: 0.25rem;
        }
        .qa-stat-sub {
          font-size: 0.75rem;
          color: #475569;
          margin-top: 0.2rem;
        }
        .qa-tab-btn {
          background: transparent;
          color: #94a3b8;
          border: none;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .qa-tab-btn.active {
          color: #C9A84C;
          border-bottom-color: #C9A84C;
        }
        .qa-panel {
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(100,116,139,0.2);
          border-radius: 1.25rem;
          overflow: hidden;
        }
        .qa-panel-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(100,116,139,0.15);
        }
        .qa-panel-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .qa-card {
          background: rgba(30,41,59,0.6);
          border: 1px solid rgba(100,116,139,0.15);
          border-radius: 0.875rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .qa-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
        }
        .qa-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.5rem;
          font-size: 0.78rem;
          color: #64748b;
        }
        .qa-badge {
          padding: 0.2rem 0.625rem;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .qa-badge-amber {
          background: rgba(245,158,11,0.12);
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,0.2);
        }
        .qa-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 1rem;
          border-radius: 0.5rem;
          background: #C9A84C;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }
        .qa-btn-primary:hover {
          background: #b59238;
        }
        .qa-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem;
          color: #C9A84C;
        }
        .qa-spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="qa-root">
        <nav className="qa-navbar">
          <div className="qa-navbar-brand">
            <ShieldCheck size={24} className="shield-icon" />
            Compliance QA Portal
          </div>
          <div className="qa-navbar-right">
            <div className="qa-user-info">
              <div className="qa-user-name">{user?.name ?? 'Reviewer'}</div>
              <div className="qa-user-email">{user?.email ?? ''}</div>
            </div>
            <button
              className="qa-logout-btn"
              onClick={() => { logout(); router.push('/login'); }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </nav>

        <main className="qa-main">
          <section className="qa-hero">
            <div>
              <h1 className="qa-hero-heading">Welcome back, {user?.name ?? 'Reviewer'}</h1>
              <p className="qa-hero-sub">
                Your evaluations preserve teaching quality and platform guidelines compliance.
              </p>
            </div>
          </section>

          {/* Stats Roster */}
          <div className="qa-stats">
            {statCards.map((s) => (
              <div className="qa-stat-card" key={s.label}>
                <div className="qa-stat-icon" style={{ background: s.accentBg, color: s.accent }}>
                  {s.icon}
                </div>
                <div>
                  <div className="qa-stat-value" style={{ color: s.accent }}>{s.value}</div>
                  <div className="qa-stat-label">{s.label}</div>
                  <div className="qa-stat-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs bar */}
          <div className="flex border-b border-slate-800 mb-6 gap-2">
            <button onClick={() => setActiveTab('pending')} className={`qa-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}>
              Pending Reviews ({pendingSessions.length})
            </button>
            <button onClick={() => setActiveTab('flagged')} className={`qa-tab-btn ${activeTab === 'flagged' ? 'active' : ''}`}>
              Escalated Flags ({flaggedReviews.length})
            </button>
            <button onClick={() => setActiveTab('history')} className={`qa-tab-btn ${activeTab === 'history' ? 'active' : ''}`}>
              My Completed Evaluations ({historyReviews.length})
            </button>
            <button onClick={() => setActiveTab('assignments')} className={`qa-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}>
              Assigned Courses ({assignments.length})
            </button>
          </div>

          <div className="qa-panel">
            <div className="qa-panel-body">
              {loadingData ? (
                <div className="qa-loader">
                  <Loader2 size={32} className="qa-spin" />
                </div>
              ) : (
                <>
                  {/* PENDING TAB */}
                  {activeTab === 'pending' && (
                    <div className="space-y-4">
                      {pendingSessions.length === 0 ? (
                        <p className="text-slate-500 text-center py-10">No pending sessions awaiting evaluation.</p>
                      ) : (
                        pendingSessions.map((session) => (
                          <div className="qa-card" key={session.id}>
                            <h3 className="qa-card-title">{session.course.title}</h3>
                            <div className="qa-card-meta">
                              <span>Scheduled: {formatDate(session.scheduledAt)}</span>
                              <span>Duration: {session.durationMinutes} min</span>
                              <span>Instructor: {session.course.teacher?.name || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              {!hasSubmittedReview(session) && (
                                <span className="qa-badge qa-badge-amber">Needs Review</span>
                              )}
                              <button
                                className="qa-btn-primary"
                                onClick={() => router.push(`/reviewer/review/${session.id}`)}
                              >
                                <MonitorPlay size={13} />
                                Evaluate Recording
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* FLAGGED TAB */}
                  {activeTab === 'flagged' && (
                    <div className="space-y-4">
                      {flaggedReviews.length === 0 ? (
                        <p className="text-slate-500 text-center py-10">No flagged reviews escalated.</p>
                      ) : (
                        flaggedReviews.map((review) => {
                          const colors = severityColor(review.flagSeverity);
                          return (
                            <div className="qa-card" key={review.id} style={{ borderColor: `${colors.badge}40` }}>
                              <div className="flex justify-between items-start gap-4">
                                <h3 className="qa-card-title">{review.session.course.title}</h3>
                                <span className="qa-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.badge}30` }}>
                                  {review.flagSeverity} Severity
                                </span>
                              </div>
                              <div className="qa-card-meta">
                                <span>Instructor: {review.session.course.teacher?.name || 'N/A'}</span>
                                <span>Reviewer: {review.reviewer.name}</span>
                              </div>
                              {review.flagReason && (
                                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 italic">
                                  &ldquo;{review.flagReason}&rdquo;
                                </div>
                              )}
                              <div className="pt-2 self-start">
                                <button
                                  className="qa-btn-primary"
                                  onClick={() => router.push(`/reviewer/review/${review.session.id}`)}
                                >
                                  <Eye size={13} />
                                  Check Details
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* HISTORY TAB */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {historyReviews.length === 0 ? (
                        <p className="text-slate-500 text-center py-10">No evaluations submitted yet.</p>
                      ) : (
                        historyReviews.map((rev) => (
                          <div className="qa-card" key={rev.id}>
                            <div className="flex justify-between items-center">
                              <h3 className="qa-card-title">{rev.session.course.title}</h3>
                              <span className="font-mono text-sm font-bold text-amber-400">Score: {rev.overallScore.toFixed(1)}/5.0</span>
                            </div>
                            <div className="qa-card-meta">
                              <span>Session Scheduled: {formatDate(rev.session.scheduledAt)}</span>
                              <span>Reviewed On: {formatDate(rev.reviewedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              {rev.isFlagged ? (
                                <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                                  <AlertTriangle size={12} /> Flagged ({rev.flagSeverity})
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle size={12} /> Passed Guidelines
                                </span>
                              )}
                              <button
                                className="qa-btn-primary"
                                onClick={() => router.push(`/reviewer/review/${rev.session.id}`)}
                              >
                                <Eye size={13} />
                                View Scorecard
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ASSIGNMENTS TAB */}
                  {activeTab === 'assignments' && (
                    <div className="space-y-4">
                      {assignments.length === 0 ? (
                        <p className="text-slate-500 text-center py-10">No courses assigned to your queue.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {assignments.map((ass) => (
                            <div className="qa-card" key={ass.id}>
                              <h3 className="qa-card-title flex items-center gap-1.5">
                                <BookOpen size={16} className="text-[#C9A84C]" />
                                {ass.course.title}
                              </h3>
                              <div className="text-xs text-slate-400 space-y-1 mt-2">
                                <p>Category: <span className="text-slate-350">{ass.course.type}</span></p>
                                <p>Primary Instructor: <span className="text-slate-350">{ass.course.teacher.name} ({ass.course.teacher.email})</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
