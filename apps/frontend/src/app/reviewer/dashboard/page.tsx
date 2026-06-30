'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

interface SessionItem {
  id: string
  status: string
  scheduledAt: string
  durationMinutes: number
  course: { title: string; type: string }
  classReviews: Array<{ status: string; id: string }>
}

interface FlaggedReview {
  id: string
  flagSeverity: string
  flagReason: string
  session: {
    id: string
    course: { title: string; teacher: { name: string } }
  }
  reviewer: { name: string }
}

export default function ReviewerDashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [pendingSessions, setPendingSessions] = useState<SessionItem[]>([])
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [loadingFlagged, setLoadingFlagged] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  useEffect(() => {
    fetch(`${API_BASE}/class-reviews/pending`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SessionItem[]) => setPendingSessions(Array.isArray(data) ? data : []))
      .catch(() => setPendingSessions([]))
      .finally(() => setLoadingPending(false))

    fetch(`${API_BASE}/class-reviews/flagged`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: FlaggedReview[]) => setFlaggedReviews(Array.isArray(data) ? data : []))
      .catch(() => setFlaggedReviews([]))
      .finally(() => setLoadingFlagged(false))
  }, [API_BASE])

  const pendingDraftCount = pendingSessions.filter(
    (s) =>
      s.classReviews.length === 0 ||
      s.classReviews.every((r) => r.status === 'DRAFT'),
  ).length

  const completedCount = 12 // static placeholder

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function severityColor(s: string) {
    if (s === 'HIGH') return { badge: '#ef4444', bg: 'rgba(239,68,68,0.12)', text: '#f87171' }
    if (s === 'MEDIUM') return { badge: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' }
    return { badge: '#3b82f6', bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' }
  }

  function hasSubmittedReview(session: SessionItem) {
    return session.classReviews.some((r) => r.status === 'SUBMITTED')
  }

  const stats = [
    {
      label: 'Pending Reviews',
      value: loadingPending ? '—' : String(pendingDraftCount),
      icon: <Clock size={22} />,
      accent: '#8b5cf6',
      accentBg: 'rgba(139,92,246,0.12)',
      sub: 'awaiting your attention',
    },
    {
      label: 'Flagged Issues',
      value: loadingFlagged ? '—' : String(flaggedReviews.length),
      icon: <Flag size={22} />,
      accent: '#ef4444',
      accentBg: 'rgba(239,68,68,0.10)',
      sub: 'require follow-up',
    },
    {
      label: 'Avg Score',
      value: '4.1 / 5.0',
      icon: <TrendingUp size={22} />,
      accent: '#10b981',
      accentBg: 'rgba(16,185,129,0.10)',
      sub: 'session quality avg',
    },
    {
      label: 'Completed Reviews',
      value: String(completedCount),
      icon: <CheckCircle size={22} />,
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.10)',
      sub: 'this month',
    },
  ]

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

        /* ── NAVBAR ── */
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
          letter-spacing: -0.01em;
        }
        .qa-navbar-brand .shield-icon {
          color: #8b5cf6;
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
          line-height: 1.3;
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

        /* ── MAIN ── */
        .qa-main {
          max-width: 1440px;
          margin: 0 auto;
          padding: 2.5rem 2rem 4rem;
        }

        /* ── HERO ── */
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
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .qa-hero-sub {
          margin-top: 0.5rem;
          font-size: 0.9375rem;
          color: #94a3b8;
          max-width: 520px;
        }
        .qa-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.875rem;
          border-radius: 999px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #34d399;
          white-space: nowrap;
          align-self: flex-start;
        }
        .qa-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          position: relative;
          flex-shrink: 0;
        }
        .qa-pulse::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: rgba(16,185,129,0.35);
          animation: pulse-ring 1.6s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.2); }
        }

        /* ── STATS ── */
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
          transition: transform 0.2s, border-color 0.2s;
        }
        .qa-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(148,163,184,0.2);
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
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.03em;
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

        /* ── COLUMNS ── */
        .qa-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 1024px) { .qa-columns { grid-template-columns: 1fr; } }

        /* ── PANEL ── */
        .qa-panel {
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(100,116,139,0.2);
          border-radius: 1.25rem;
          overflow: hidden;
        }
        .qa-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(100,116,139,0.15);
        }
        .qa-panel-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9375rem;
          font-weight: 700;
          color: #e2e8f0;
        }
        .qa-panel-count {
          padding: 0.2rem 0.625rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(139,92,246,0.15);
          color: #a78bfa;
        }
        .qa-panel-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ── SESSION CARD ── */
        .qa-session-card {
          background: rgba(30,41,59,0.6);
          border: 1px solid rgba(100,116,139,0.15);
          border-radius: 0.875rem;
          padding: 1rem 1.125rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .qa-session-card:hover {
          border-color: rgba(139,92,246,0.35);
          background: rgba(30,41,59,0.9);
        }
        .qa-session-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 0.375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .qa-session-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1rem;
          margin-bottom: 0.75rem;
        }
        .qa-meta-item {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: #64748b;
        }
        .qa-session-footer {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-wrap: wrap;
        }
        .qa-badge {
          padding: 0.2rem 0.625rem;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .qa-badge-amber {
          background: rgba(245,158,11,0.12);
          color: #fbbf24;
          border: 1px solid rgba(245,158,11,0.2);
        }
        .qa-badge-violet {
          background: rgba(139,92,246,0.12);
          color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.2);
        }
        .qa-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.875rem;
          border-radius: 0.5rem;
          background: #7c3aed;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          text-decoration: none;
        }
        .qa-btn-primary:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }
        .qa-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.875rem;
          border-radius: 0.5rem;
          background: rgba(148,163,184,0.06);
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(148,163,184,0.15);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .qa-btn-secondary:hover {
          background: rgba(148,163,184,0.12);
          color: #cbd5e1;
        }
        .qa-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.875rem;
          border-radius: 0.5rem;
          background: transparent;
          color: #8b5cf6;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(139,92,246,0.25);
          cursor: pointer;
          transition: all 0.2s;
        }
        .qa-btn-ghost:hover {
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.4);
        }

        /* ── FLAGGED CARD ── */
        .qa-flagged-card {
          background: rgba(30,41,59,0.6);
          border: 1px solid rgba(100,116,139,0.15);
          border-radius: 0.875rem;
          padding: 1rem 1.125rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .qa-flagged-card:hover {
          border-color: rgba(239,68,68,0.3);
          background: rgba(30,41,59,0.9);
        }
        .qa-flagged-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .qa-flagged-course {
          font-size: 0.9rem;
          font-weight: 700;
          color: #f1f5f9;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .qa-flagged-meta {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }
        .qa-flagged-reason {
          font-size: 0.8125rem;
          color: #94a3b8;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .qa-flagged-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        /* ── EMPTY STATE ── */
        .qa-empty {
          text-align: center;
          padding: 2.5rem 1rem;
        }
        .qa-empty-icon {
          margin: 0 auto 0.75rem;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(16,185,129,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #34d399;
        }
        .qa-empty-text {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        /* ── LOADER ── */
        .qa-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2.5rem;
          color: #8b5cf6;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qa-spin { animation: spin 0.9s linear infinite; }
      `}</style>

      <div className="qa-root">
        {/* ── NAVBAR ── */}
        <nav className="qa-navbar">
          <div className="qa-navbar-brand">
            <ShieldCheck size={24} className="shield-icon" />
            QA Reviewer Portal
          </div>
          <div className="qa-navbar-right">
            <div className="qa-user-info">
              <div className="qa-user-name">{user?.name ?? 'Reviewer'}</div>
              <div className="qa-user-email">{user?.email ?? ''}</div>
            </div>
            <button
              className="qa-logout-btn"
              onClick={() => { logout(); router.push('/login') }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className="qa-main">

          {/* HERO */}
          <section className="qa-hero">
            <div>
              <h1 className="qa-hero-heading">
                Welcome back, {user?.name ?? 'Reviewer'}
              </h1>
              <p className="qa-hero-sub">
                Your quality assurance mission protects every student&apos;s learning experience.
              </p>
            </div>
            <div className="qa-status-badge">
              <span className="qa-pulse" />
              Monitoring Active
            </div>
          </section>

          {/* STATS */}
          <div className="qa-stats">
            {stats.map((s) => (
              <div className="qa-stat-card" key={s.label}>
                <div
                  className="qa-stat-icon"
                  style={{ background: s.accentBg, color: s.accent }}
                >
                  {s.icon}
                </div>
                <div>
                  <div className="qa-stat-value" style={{ color: s.accent }}>
                    {s.value}
                  </div>
                  <div className="qa-stat-label">{s.label}</div>
                  <div className="qa-stat-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* COLUMNS */}
          <div className="qa-columns">

            {/* LEFT — Pending Reviews */}
            <div className="qa-panel">
              <div className="qa-panel-header">
                <div className="qa-panel-title">
                  <Activity size={18} style={{ color: '#8b5cf6' }} />
                  Pending Reviews Queue
                </div>
                {!loadingPending && (
                  <span className="qa-panel-count">{pendingSessions.length}</span>
                )}
              </div>

              <div className="qa-panel-body">
                {loadingPending ? (
                  <div className="qa-loader">
                    <Loader2 size={28} className="qa-spin" />
                  </div>
                ) : pendingSessions.length === 0 ? (
                  <div className="qa-empty">
                    <div className="qa-empty-icon">
                      <CheckCircle size={22} />
                    </div>
                    <p className="qa-empty-text">No pending reviews. Great work!</p>
                  </div>
                ) : (
                  pendingSessions.map((session) => (
                    <div className="qa-session-card" key={session.id}>
                      <div className="qa-session-title">{session.course.title}</div>
                      <div className="qa-session-meta">
                        <span className="qa-meta-item">
                          <Calendar size={12} />
                          {formatDate(session.scheduledAt)}
                        </span>
                        <span className="qa-meta-item">
                          <Clock size={12} />
                          {session.durationMinutes} min
                        </span>
                      </div>
                      <div className="qa-session-footer">
                        {!hasSubmittedReview(session) && (
                          <span className="qa-badge qa-badge-amber">Needs Review</span>
                        )}
                        <button
                          className="qa-btn-primary"
                          onClick={() => router.push(`/reviewer/review/${session.id}`)}
                        >
                          <MonitorPlay size={13} />
                          Review Recording
                        </button>
                        {session.status === 'LIVE' && (
                          <button
                            className="qa-btn-secondary"
                            onClick={() => router.push(`/classroom/${session.id}`)}
                          >
                            <Eye size={13} />
                            Monitor Silently
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT — Flagged Issues */}
            <div className="qa-panel">
              <div className="qa-panel-header">
                <div className="qa-panel-title">
                  <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                  Flagged Issues
                </div>
                {!loadingFlagged && (
                  <span
                    className="qa-panel-count"
                    style={{
                      background: flaggedReviews.length > 0
                        ? 'rgba(239,68,68,0.12)'
                        : undefined,
                      color: flaggedReviews.length > 0 ? '#f87171' : undefined,
                    }}
                  >
                    {flaggedReviews.length}
                  </span>
                )}
              </div>

              <div className="qa-panel-body">
                {loadingFlagged ? (
                  <div className="qa-loader">
                    <Loader2 size={28} className="qa-spin" />
                  </div>
                ) : flaggedReviews.length === 0 ? (
                  <div className="qa-empty">
                    <div className="qa-empty-icon">
                      <CheckCircle size={22} />
                    </div>
                    <p className="qa-empty-text">
                      No flagged issues currently. Keep up the great work!
                    </p>
                  </div>
                ) : (
                  flaggedReviews.map((review) => {
                    const sev = severityColor(review.flagSeverity)
                    return (
                      <div className="qa-flagged-card" key={review.id}>
                        <div className="qa-flagged-top">
                          <span className="qa-flagged-course">
                            {review.session.course.title}
                          </span>
                          <span
                            className="qa-badge"
                            style={{
                              background: sev.bg,
                              color: sev.text,
                              border: `1px solid ${sev.badge}40`,
                              flexShrink: 0,
                            }}
                          >
                            {review.flagSeverity}
                          </span>
                        </div>
                        <div className="qa-flagged-meta">
                          Teacher: {review.session.course.teacher.name}
                          &nbsp;&nbsp;·&nbsp;&nbsp;
                          Reviewer: {review.reviewer.name}
                        </div>
                        <div className="qa-flagged-reason">{review.flagReason}</div>
                        <div className="qa-flagged-footer">
                          <button
                            className="qa-btn-ghost"
                            onClick={() =>
                              router.push(`/reviewer/review/${review.session.id}`)
                            }
                          >
                            <Eye size={13} />
                            View Details
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
