'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Star, Clock, AlertTriangle, Loader2, Award, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ReviewItem {
  id: string;
  reviewedAt: string;
  curriculumAdherenceScore: number;
  teachingQualityScore: number;
  engagementScore: number;
  overallScore: number;
  strengths: string;
  improvements: string;
  isFlagged: boolean;
  flagSeverity: string | null;
  flagReason: string | null;
  session: {
    id: string;
    scheduledAt: string;
    course: {
      title: string;
      type: string;
    };
    recording: {
      filePath: string | null;
    } | null;
  };
  reviewer: {
    name: string;
  };
}

export default function TeacherFeedbackIndex() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (!user?.id) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/class-reviews/teacher/${user.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Error fetching teacher feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="font-semibold text-lg text-slate-200">Class Feedback History</h1>
          <div />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            <p className="text-sm text-slate-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 py-16 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/80">
              <Award className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-300">No feedback submitted yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Reviews will appear here once Compliance Reviewers assess your recorded sessions.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/85 p-6 backdrop-blur-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800/60">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{review.session.course.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{new Date(review.session.scheduledAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}</span>
                      <span className="text-slate-600">•</span>
                      <span>Category: {review.session.course.type}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-slate-400">Evaluator: <span className="text-slate-300 font-semibold">{review.reviewer.name}</span></span>
                    <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 font-mono text-sm font-bold py-1 px-3">
                      {review.overallScore.toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Curriculum Adherence</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.curriculumAdherenceScore ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Teaching Quality</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.teachingQualityScore ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Student Engagement</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.engagementScore ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {review.strengths || 'No comments on strengths.'}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Areas of Improvement</p>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {review.improvements || 'No specific areas noted.'}
                    </p>
                  </div>
                </div>

                {/* Warning / Flags */}
                {review.isFlagged && (
                  <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Review Flagged ({review.flagSeverity} Severity)</p>
                      <p className="text-xs text-red-400 mt-1 leading-relaxed italic">&ldquo;{review.flagReason}&rdquo;</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  {review.session.recording?.filePath ? (
                    <a
                      href={`${API_URL}/recordings/${review.session.id}/stream`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Watch Recording</span>
                    </a>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => router.push(`/teacher/feedback/${review.session.id}`)}
                    className="text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all py-1.5 px-4 rounded-xl font-semibold"
                  >
                    View Annotations
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
