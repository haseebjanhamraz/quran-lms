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
  Save
} from 'lucide-react';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import ThemeToggle from '@/components/ThemeToggle';

function SupervisorSettingsTab() {
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

  if (loading) return <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="glass-panel p-6 rounded-2xl max-w-xl">
      <h2 className="text-xl font-bold font-display mb-2">Platform Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">Configure AI automation for compliance reviews.</p>

      <div className="flex items-center justify-between mb-6 border border-border p-4 rounded-xl bg-card/40">
        <div>
          <label className="text-sm font-semibold text-foreground">Enable AI Analysis</label>
          <p className="text-xs text-muted-foreground mt-1">If enabled, transcripts are auto-analyzed for compliance.</p>
        </div>
        <button
          type="button"
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${aiEnabled ? 'bg-primary' : 'bg-muted'
            }`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${aiEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </button>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-md">
        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
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
  supervisor?: { name: string };
  reviewer?: { name: string };
}

interface SupervisorStats {
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

export default function SupervisorDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'history' | 'assignments' | 'settings'>('pending');
  const [pendingSessions, setPendingSessions] = useState<SessionItem[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([]);
  const [historyReviews, setHistoryReviews] = useState<ReviewHistoryItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [stats, setStats] = useState<SupervisorStats | null>(null);

  const [loadingData, setLoadingData] = useState(true);

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
        fetch(`${API_BASE}/supervisor-assignments/supervisor/${user.id}`, { credentials: 'include' }),
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
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-brand/30 bg-brand/10 p-2 text-brand">
              <ShieldCheck size={20} />
            </div>
            <span className="font-display text-base font-bold text-foreground">Supervisor Portal</span>
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
        <section className="mb-8">
          <h1 className="text-3xl font-display font-bold">Welcome back, {user?.name ?? 'Supervisor'}</h1>
          <p className="text-muted-foreground mt-1">
            Your evaluations preserve teaching quality and platform guidelines compliance.
          </p>
        </section>

        {/* Stats Roster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4" key={s.label}>
              <div className="p-3 rounded-xl flex items-center justify-center" style={{ background: s.accentBg, color: s.accent }}>
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: s.accent }}>{s.value}</div>
                <div className="text-xs font-medium text-foreground">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs bar */}
        <div className="flex border-b border-border mb-6 gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            Pending Reviews ({pendingSessions.length})
          </button>
          <button onClick={() => setActiveTab('flagged')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'flagged' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            Escalated Flags ({flaggedReviews.length})
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            My Completed Evaluations ({historyReviews.length})
          </button>
          <button onClick={() => setActiveTab('assignments')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'assignments' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            Assigned Courses ({assignments.length})
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            System Settings
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          {loadingData ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* PENDING TAB */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {pendingSessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-10">No pending sessions awaiting evaluation.</p>
                  ) : (
                    pendingSessions.map((session) => (
                      <div className="glass-card p-4 rounded-xl border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4" key={session.id}>
                        <div>
                          <h3 className="font-semibold text-foreground text-base">{session.course.title}</h3>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-4 mt-1">
                            <span>Scheduled: {formatDate(session.scheduledAt)}</span>
                            <span>Duration: {session.durationMinutes} min</span>
                            <span>Instructor: {session.course.teacher?.name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!hasSubmittedReview(session) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Needs Review</span>
                          )}
                          <button
                            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                            onClick={() => router.push(`/supervisor/review/${session.id}`)}
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
                    <p className="text-muted-foreground text-center py-10">No flagged reviews escalated.</p>
                  ) : (
                    flaggedReviews.map((review) => {
                      const colors = severityColor(review.flagSeverity);
                      return (
                        <div className="glass-card p-4 rounded-xl border flex flex-col gap-3" key={review.id} style={{ borderColor: `${colors.badge}40` }}>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-semibold text-foreground">{review.session.course.title}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.badge}30` }}>
                              {review.flagSeverity} Severity
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-4">
                            <span>Instructor: {review.session.course.teacher?.name || 'N/A'}</span>
                            <span>Supervisor: {review.supervisor?.name || review.reviewer?.name || 'N/A'}</span>
                          </div>
                          {review.flagReason && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive italic">
                              &ldquo;{review.flagReason}&rdquo;
                            </div>
                          )}
                          <div className="pt-2 self-start">
                            <button
                              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg"
                              onClick={() => router.push(`/supervisor/review/${review.session.id}`)}
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
                    <p className="text-muted-foreground text-center py-10">No evaluations submitted yet.</p>
                  ) : (
                    historyReviews.map((rev) => (
                      <div className="glass-card p-4 rounded-xl border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4" key={rev.id}>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{rev.session.course.title}</h3>
                            <span className="font-mono text-xs font-bold text-amber-500">Score: {rev.overallScore.toFixed(1)}/5.0</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-4 mt-1">
                            <span>Scheduled: {formatDate(rev.session.scheduledAt)}</span>
                            <span>Reviewed: {formatDate(rev.reviewedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {rev.isFlagged ? (
                            <span className="text-xs text-destructive font-semibold flex items-center gap-1">
                              <AlertTriangle size={12} /> Flagged ({rev.flagSeverity})
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Passed Guidelines
                            </span>
                          )}
                          <button
                            className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold px-3 py-2 rounded-lg"
                            onClick={() => router.push(`/supervisor/review/${rev.session.id}`)}
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
                    <p className="text-muted-foreground text-center py-10">No courses assigned to your queue.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {assignments.map((ass) => (
                        <div className="glass-card p-4 rounded-xl border border-border/50" key={ass.id}>
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <BookOpen size={16} className="text-primary" />
                            {ass.course.title}
                          </h3>
                          <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            <p>Category: <span className="text-foreground">{ass.course.type}</span></p>
                            <p>Primary Instructor: <span className="text-foreground">{ass.course.teacher.name} ({ass.course.teacher.email})</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <SupervisorSettingsTab />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
