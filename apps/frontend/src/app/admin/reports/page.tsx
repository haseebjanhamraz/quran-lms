'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, 
  Search, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Sparkles, 
  Loader2,
  Calendar,
  ExternalLink,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface Violation {
  id: string;
  type: string;
  evidence: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ReportItem {
  id: string;
  sessionId: string;
  riskScore: number;
  teachingQualityScore: number;
  topicRelevanceScore: number;
  summary: string;
  createdAt: string;
  violations: Violation[];
  session: {
    scheduledAt: string;
    course: {
      title: string;
    };
    teacher: {
      name: string;
      email: string;
    };
  };
}

export default function AIReportsListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
      router.push('/');
      return;
    }
  }, [authLoading, user, router]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai-reports`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching AI reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchReports();
  }, [user]);

  const handleDeleteClass = async (sessionId: string) => {
    if (confirm('Are you sure you want to permanently delete this recorded class? This will delete the Google Drive recording, transcript database entries, compliance reports, and pipeline logs.')) {
      try {
        const res = await fetch(`${API_URL}/class-sessions/${sessionId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          fetchReports();
        } else {
          alert('Failed to delete recorded class.');
        }
      } catch (err) {
        console.error('Error deleting session:', err);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 60) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (score >= 20) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 60) return 'High Risk';
    if (score >= 20) return 'Medium Risk';
    return 'Clear / Low Risk';
  };

  const filteredReports = reports.filter(r => 
    r.session.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.session.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReports = reports.length;
  const highRiskCount = reports.filter(r => r.riskScore >= 60).length;
  const avgRiskScore = totalReports > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.riskScore, 0) / totalReports) 
    : 0;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs text-slate-400">Loading AI analysis reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800/80 text-slate-350 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold font-display">Compliance Portal</span>
              <h1 className="text-sm font-bold text-slate-200">AI Quality Reports Archive</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Aggregated Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-blue-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Audited Sessions</span>
              <p className="text-2xl font-bold text-slate-100 font-display mt-0.5">{totalReports}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 flex items-center gap-4">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">High Risk Flagged</span>
              <p className="text-2xl font-bold text-slate-100 font-display mt-0.5">{highRiskCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 flex items-center gap-4">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-400">
              <Shield size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Average Risk Rating</span>
              <p className="text-2xl font-bold text-slate-100 font-display mt-0.5">{avgRiskScore}%</p>
            </div>
          </div>
        </section>

        {/* Filters and List */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span>AI Evaluation Logs</span>
            </h2>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:max-w-xs">
              <Search size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by course or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-600 text-slate-200"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-850 shadow-xl">
            {filteredReports.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No evaluation reports found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/60">
                      <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Class Session</th>
                      <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Instructor</th>
                      <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Date Evaluated</th>
                      <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Risk Score</th>
                      <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider">Audit Findings</th>
                      <th className="py-4 px-6 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-200">{report.session.course.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Session ID: {report.sessionId.slice(0, 8)}...</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-slate-350">{report.session.teacher.name}</p>
                          <p className="text-[10px] text-slate-550">{report.session.teacher.email}</p>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-xs whitespace-nowrap">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs rounded-full px-2.5 py-0.5 border ${getRiskColor(report.riskScore)}`}>
                            {report.riskScore}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {report.violations.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
                              <AlertTriangle size={12} />
                              <span>{report.violations.length} Violation{report.violations.length !== 1 ? 's' : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <CheckCircle size={12} />
                              <span>Clear</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              onClick={() => router.push(`/admin/reports/${report.sessionId}`)}
                              className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-400 text-xs font-semibold py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 transition shadow-sm"
                            >
                              <span>Open Report</span>
                              <ExternalLink size={10} />
                            </button>
                            {user?.role === 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteClass(report.sessionId)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-xl inline-block border border-transparent hover:border-destructive/20"
                                title="Delete Recorded Class permanently"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
