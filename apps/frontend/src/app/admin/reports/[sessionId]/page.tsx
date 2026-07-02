'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  Loader2,
  Calendar,
  ExternalLink,
  BookOpen,
  User,
  Clock,
  Download,
  AlertOctagon
} from 'lucide-react';
import Link from 'next/link';

interface Violation {
  id: string;
  type: string;
  evidence: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ReportDetail {
  id: string;
  sessionId: string;
  riskScore: number;
  teachingQualityScore: number;
  topicRelevanceScore: number;
  summary: string;
  mainTopics: string[];
  offTopicAnalysis: string;
  contactSharingDetection: string;
  complianceFindings: string;
  teachingAssessment: string;
  engagementAssessment: string;
  recommendations: string;
  createdAt: string;
  violations: Violation[];
  session: {
    scheduledAt: string;
    durationMinutes: number;
    course: {
      title: string;
    };
    teacher: {
      name: string;
      email: string;
    };
    recording?: {
      driveUrl: string | null;
    };
  };
}

export default function AIReportDetailPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
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

  useEffect(() => {
    if (!sessionId || !user) return;
    
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/ai-reports/${sessionId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error('Error fetching report details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [sessionId, user]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/reports/${sessionId}/pdf`, {
        credentials: 'include',
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI_Report_${report.session.course.title.replace(/\s+/g, '_')}_${sessionId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('PDF report generation is being initialized on the server. Please try again in a moment.');
      }
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error fetching report PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/10 border-red-500/25';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs text-slate-400">Loading detailed AI audit scorecard...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-sm text-slate-400 mb-4">AI audit report could not be found.</p>
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs transition"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 bg-slate-900 hover:bg-slate-855 rounded-xl border border-slate-800/80 text-slate-350 transition"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold font-display">Compliance Portal</span>
              <h1 className="text-sm font-bold text-slate-200">AI Evaluation Audit Report</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition disabled:opacity-50"
            >
              {downloading ? <Loader2 size={12} className="animate-spin text-amber-500" /> : <Download size={12} />}
              <span>{downloading ? 'Downloading...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Session summary, scores, violations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Info Box */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-5 mb-5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Evaluation Target</span>
                <h2 className="font-display text-xl font-bold text-slate-200 mt-1">{report.session.course.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><User size={12} /> {report.session.teacher.name}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(report.session.scheduledAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {report.session.durationMinutes} mins</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Risk Rating</span>
                  <p className={`font-mono text-2xl font-bold ${report.riskScore >= 60 ? 'text-red-400' : report.riskScore >= 20 ? 'text-amber-400' : 'text-emerald-400'} mt-0.5`}>
                    {report.riskScore}%
                  </p>
                </div>
                <div className={`rounded-xl border p-3 flex items-center justify-center shrink-0 ${
                  report.riskScore >= 60 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  report.riskScore >= 20 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {report.riskScore >= 60 ? <AlertOctagon size={24} /> : report.riskScore >= 20 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Class Summary</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{report.summary}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Topics Discussed</h3>
                <div className="flex flex-wrap gap-2">
                  {report.mainTopics.map((topic, i) => (
                    <span key={i} className="text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg text-slate-300 font-sans">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Violations Timeline */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold font-display text-slate-200 mb-4 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-red-400" />
              <span>Safety Infractions & Compliance Log</span>
            </h3>
            {report.violations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                No policy violations detected. This session complies with platform safety requirements.
              </div>
            ) : (
              <div className="space-y-4">
                {report.violations.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl border border-slate-850 bg-slate-950/40 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-red-400 font-mono uppercase tracking-wider">{v.type.replace(/_/g, ' ')}</span>
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${getSeverityBadgeColor(v.severity)}`}>
                        {v.severity} Severity
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono bg-slate-900/40 p-2.5 rounded border border-slate-850/30 leading-relaxed italic">
                      {v.evidence}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance & Quality Assessments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-6 backdrop-blur-md space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Teaching Quality Assessment</h4>
              <p className="text-xs text-slate-350 leading-relaxed font-sans">{report.teachingAssessment}</p>
            </div>
            <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-6 backdrop-blur-md space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Engagement Analysis</h4>
              <p className="text-xs text-slate-350 leading-relaxed font-sans">{report.engagementAssessment}</p>
            </div>
          </div>
        </div>

        {/* Right column: Metric sliders, quick links, recommendations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Metrics */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 backdrop-blur-md space-y-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Scores</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Teaching Quality</span>
                  <span className="text-amber-500 font-mono">{report.teachingQualityScore.toFixed(1)} / 5.0</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${(report.teachingQualityScore / 5.0) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Topic Relevance</span>
                  <span className="text-blue-500 font-mono">{report.topicRelevanceScore.toFixed(1)} / 5.0</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${(report.topicRelevanceScore / 5.0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions/links */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Workspace Navigation</h3>
            <Link
              href={`/admin/transcripts/${sessionId}`}
              className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition w-full shadow-sm"
            >
              <FileText size={14} className="text-amber-500" />
              <span>Analyze Transcript Segments</span>
            </Link>
            {report.session.recording?.driveUrl && (
              <a
                href={report.session.recording.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition w-full shadow-sm"
              >
                <ExternalLink size={14} className="text-blue-500" />
                <span>Open Google Drive Recording</span>
              </a>
            )}
          </div>

          {/* Recommendations Card */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 backdrop-blur-md space-y-3.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>Corrective Recommendations</span>
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed font-sans">{report.recommendations}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
