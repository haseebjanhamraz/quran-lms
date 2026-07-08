'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { 
  ArrowLeft, Play, Pause, ShieldAlert, Award, MessageSquare, BookOpen, ThumbsUp, Loader2
} from 'lucide-react';

interface Annotation {
  id: string;
  timestamp: number;
  note: string;
  category: string;
}

interface ReviewData {
  id: string;
  sessionId: string;
  curriculumAdherenceScore: number;
  teachingQualityScore: number;
  engagementScore: number;
  overallScore: number;
  strengths: string;
  improvements: string;
  status: string;
  annotations: Annotation[];
  session: {
    course: {
      title: string;
      type: string;
    };
    recording?: {
      filePath?: string;
    };
  };
}

export default function TeacherFeedbackPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch(`${API_URL}/class-reviews/session/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          // Verify that review has actually been submitted (not in draft)
          if (data.status !== 'SUBMITTED' && user?.role !== 'ADMIN') {
            setError('Evaluation feedback is currently being processed by the QA Reviewer.');
          } else {
            setReview(data);
          }
        } else {
          setError('No QA evaluation has been submitted for this session yet.');
        }
      } catch (err: any) {
        setError('Error fetching evaluation data.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [id, user]);

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Positive':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Concern':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Policy Violation':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading QA Evaluation Feedback...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl flex flex-col items-center text-center">
          <Award className="h-12 w-12 text-primary mb-4 animate-pulse" />
          <h2 className="text-xl font-bold font-display mb-2">QA Feedback Processing</h2>
          <p className="text-sm text-muted-foreground mb-6">{error || 'Review under drafting.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors outline-none"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const videoStreamUrl = review.session.recording?.filePath 
    ? `${API_URL}/recordings/${id}/stream`
    : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          
          <div className="text-center">
            <h1 className="font-bold text-base md:text-lg font-display">QA Feedback Report</h1>
            <p className="text-xs text-muted-foreground">Class: {review.session.course.title}</p>
          </div>

          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Video and Annotations */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            <video
              ref={videoRef}
              src={videoStreamUrl}
              controls
              crossOrigin="use-credentials"
              className="w-full aspect-video bg-black"
            />
            <div className="p-4 bg-card/30 flex items-center justify-between border-t border-border/40">
              <span className="text-xs text-muted-foreground font-semibold">
                Class Session Recording Playback
              </span>
            </div>
          </div>

          {/* Annotations Timeline */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50">
            <h3 className="text-lg font-bold font-display mb-4">Reviewer Annotation Timeline</h3>
            
            {review.annotations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No specific timeline notes recorded by the reviewer.
              </p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {review.annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/50 hover:border-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => seekTo(ann.timestamp)}
                        className="font-mono text-xs bg-primary/20 text-primary py-1 px-2.5 rounded hover:bg-primary hover:text-primary-foreground transition-colors font-bold"
                      >
                        {formatTime(ann.timestamp)}
                      </button>
                      <div>
                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full uppercase tracking-wider ${getCategoryBadge(ann.category)}`}>
                          {ann.category}
                        </span>
                        <p className="text-sm text-foreground/90 mt-1">{ann.note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Scores & Written Feedback */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-border/50 space-y-6">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 border-b border-border/40 pb-3">
              <Award className="h-6 w-6 text-primary" />
              <span>QA Scores</span>
            </h2>

            {/* Scorecard Displays */}
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-sm font-semibold">Curriculum Adherence Score</span>
                <span className="text-lg font-bold text-primary">{review.curriculumAdherenceScore} / 5</span>
              </div>

              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-sm font-semibold">Teaching Quality Score</span>
                <span className="text-lg font-bold text-primary">{review.teachingQualityScore} / 5</span>
              </div>

              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-sm font-semibold">Student Engagement Score</span>
                <span className="text-lg font-bold text-primary">{review.engagementScore} / 5</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground">Cumulative Average</span>
                <span className="text-3xl font-black text-primary font-display">
                  {review.overallScore.toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            {/* Written feedbacks */}
            <div className="space-y-6 pt-4 border-t border-border/40">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Demonstrated Strengths
                </h3>
                <div className="p-4 rounded-xl bg-card/50 border border-border/40 text-sm text-foreground/90 whitespace-pre-wrap">
                  {review.strengths || 'No specific strengths detailed.'}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Areas of Improvement
                </h3>
                <div className="p-4 rounded-xl bg-card/50 border border-border/40 text-sm text-foreground/90 whitespace-pre-wrap">
                  {review.improvements || 'No specific improvements detailed.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
