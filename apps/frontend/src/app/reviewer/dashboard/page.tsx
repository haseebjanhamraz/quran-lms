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
} from 'lucide-react';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ThemeToggle from '@/components/ThemeToggle';

function ReviewerSettingsTab() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${API_URL}/system-settings/ai_analysis_enabled`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setAiEnabled(data.value === 'true');
        }
      } catch (err) { }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      await fetch(`${API_URL}/system-settings/ai_analysis_enabled`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: aiEnabled ? 'true' : 'false' }),
      });
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="qa-loader"><Loader2 size={24} className="qa-spin" /></div>;

  return (
    <div className="qa-card" style={{ maxWidth: 600 }}>
      <h2 className="qa-card-title text-xl mb-2">Platform Settings</h2>
      <p className="text-sm text-slate-400 mb-6">Configure AI automation for compliance reviews.</p>

      <div className="flex items-center justify-between mb-6 border border-slate-700/50 p-4 rounded-xl bg-slate-800/30">
        <div>
          <label className="text-sm font-semibold text-slate-200">Enable AI Analysis</label>
          <p className="text-xs text-slate-400 mt-1">If enabled, transcripts are auto-analyzed for compliance.</p>
        </div>
        <button
          type="button"
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${aiEnabled ? 'bg-[#C9A84C]' : 'bg-slate-700'
            }`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${aiEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </button>
      </div>

      <button onClick={handleSave} disabled={saving} className="qa-btn-primary self-start">
        {saving ? <Loader2 className="qa-spin" size={14} /> : <Save size={14} />}
        Save Settings
      </button>
    </div>
  );
}

interface SessionItem {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  course: { title: string; type: string; teacher?: { name: string; email?: string } };
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

  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'history' | 'assignments' | 'settings'>('pending');
  const [pendingSessions, setPendingSessions] = useState<SessionItem[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([]);
  const [historyReviews, setHistoryReviews] = useState<ReviewHistoryItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [stats, setStats] = useState<ReviewerStats | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [selectedSession, setSelectedSession] = useState<{ id: string; title: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

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
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-brand/30 bg-brand/10 p-2 text-brand">
              <ShieldCheck size={20} />
            </div>
            <span className="font-display text-base font-bold text-foreground">Reviewer Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationsDropdown />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground leading-none">{user?.name ?? ''}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
            <button onClick={() => setActiveTab('settings')} className={`qa-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}>
              System Settings
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
                              <div className="flex items-center gap-3">
                                {!hasSubmittedReview(session) && (
                                  <span className="qa-badge qa-badge-amber">Needs Review</span>
                                )}
                              </div>
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

                  {/* SETTINGS TAB */}
                  {activeTab === 'settings' && (
                    <ReviewerSettingsTab />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
    </div>
  );
}
