'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { 
  ArrowLeft, Play, Pause, Plus, Trash2, ShieldAlert, 
  Award, MessageSquare, BookOpen, ThumbsUp, HelpCircle, AlertTriangle, CheckCircle, Loader2
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
  reviewerId: string;
  reviewMode: 'LIVE_MONITOR' | 'RECORDING_REVIEW';
  curriculumAdherenceScore: number;
  teachingQualityScore: number;
  engagementScore: number;
  overallScore: number;
  strengths: string;
  improvements: string;
  privateNotes: string;
  isFlagged: boolean;
  flagSeverity?: 'LOW' | 'MEDIUM' | 'HIGH';
  flagReason?: string;
  status: 'DRAFT' | 'SUBMITTED';
  annotations: Annotation[];
  session: {
    course: {
      title: string;
      type: string;
      teacher: {
        name: string;
      };
    };
    recording?: {
      driveUrl?: string;
    };
  };
}

export default function ReviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scorecard values
  const [curriculumScore, setCurriculumScore] = useState(5);
  const [qualityScore, setQualityScore] = useState(5);
  const [engagementScore, setEngagementScore] = useState(5);
  
  // Feedback text
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  // Flag escalation
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagSeverity, setFlagSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [flagReason, setFlagReason] = useState('');

  // New annotation input
  const [noteText, setNoteText] = useState('');
  const [category, setCategory] = useState('Positive');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchReview = async () => {
    try {
      const res = await fetch(`${API_URL}/class-reviews/session/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReview(data);
        
        // Populate inputs
        setCurriculumScore(data.curriculumAdherenceScore);
        setQualityScore(data.teachingQualityScore);
        setEngagementScore(data.engagementScore);
        setStrengths(data.strengths);
        setImprovements(data.improvements);
        setPrivateNotes(data.privateNotes);
        setIsFlagged(data.isFlagged);
        if (data.flagSeverity) setFlagSeverity(data.flagSeverity);
        if (data.flagReason) setFlagReason(data.flagReason);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/class-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: id,
          reviewMode: 'RECORDING_REVIEW',
          curriculumAdherenceScore: curriculumScore,
          teachingQualityScore: qualityScore,
          engagementScore: engagementScore,
          strengths,
          improvements,
          privateNotes,
          isFlagged,
          flagSeverity: isFlagged ? flagSeverity : undefined,
          flagReason: isFlagged ? flagReason : undefined,
          status,
        }),
      });

      if (res.ok) {
        alert(status === 'SUBMITTED' ? 'Evaluation submitted successfully!' : 'Draft review saved!');
        if (status === 'SUBMITTED') {
          router.push('/reviewer/dashboard');
        } else {
          fetchReview();
        }
      }
    } catch (err) {
      console.error('Error saving review scorecard:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!review || !noteText.trim()) return;

    // Read current time of video
    const timestamp = videoRef.current ? videoRef.current.currentTime : 0;

    try {
      const res = await fetch(`${API_URL}/class-reviews/${review.id}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          timestamp,
          note: noteText,
          category,
        }),
      });

      if (res.ok) {
        setNoteText('');
        fetchReview();
      }
    } catch (err) {
      console.error('Error adding annotation:', err);
    }
  };

  const handleDeleteAnnotation = async (annId: string) => {
    try {
      const res = await fetch(`${API_URL}/class-reviews/annotations/${annId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        fetchReview();
      }
    } catch (err) {
      console.error('Error deleting annotation:', err);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  // Helper to get category style badges
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

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading review details and streaming video...</p>
      </div>
    );
  }

  if (!review) return null;

  // Stream URL fallback for local development testing
  const videoStreamUrl = review.session.recording?.driveUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/reviewer/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Reviewer Dashboard</span>
          </button>
          
          <div className="text-center">
            <h1 className="font-bold text-base md:text-lg font-display">{review.session.course.title}</h1>
            <p className="text-xs text-muted-foreground">Teacher: {review.session.course.teacher?.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors outline-none"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave('SUBMITTED')}
              disabled={saving}
              className="bg-primary hover:bg-primary/95 text-primary-foreground py-2 px-4 rounded-lg text-sm font-bold transition-colors outline-none shadow-md"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
            </button>
          </div>
        </div>
      </header>

      {/* Main split-screen panel */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Video & Annotations */}
        <div className="space-y-6">
          {/* Glassmorphic Video Box */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            <video
              ref={videoRef}
              src={videoStreamUrl}
              controls
              className="w-full aspect-video bg-black"
            />
            <div className="p-4 bg-card/30 flex items-center justify-between border-t border-border/40">
              <span className="text-xs text-muted-foreground font-semibold">
                Class recording stream (Google Drive authorized)
              </span>
              <span className="text-xs bg-primary/10 text-primary py-0.5 px-2 rounded-full font-semibold">
                {review.reviewMode.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Add Annotation Form */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Record Annotation Timeline Note</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-1/3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="Positive">Positive feedback</option>
                  <option value="Concern">Concern</option>
                  <option value="Policy Violation">Policy Violation</option>
                  <option value="General">General Note</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Commentary
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Capture feedback at current playback timestamp..."
                    className="w-full bg-background border border-border rounded-lg py-2 pl-3 pr-10 text-sm outline-none focus:border-primary transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddAnnotation();
                    }}
                  />
                  <button
                    onClick={handleAddAnnotation}
                    className="absolute right-1 top-1 p-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Annotations Timeline Roster */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50">
            <h3 className="text-lg font-bold font-display mb-4">Annotations Timeline</h3>
            
            {review.annotations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No annotations added. Use the capture bar above during video playback.
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
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

                    <button
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors outline-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Scorecard & Feedback */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-border/50 space-y-6">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 border-b border-border/40 pb-3">
              <Award className="h-6 w-6 text-primary" />
              <span>QA Quality Scorecard</span>
            </h2>

            {/* Scorecard Sliders */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold">Curriculum Adherence Score</label>
                  <span className="text-lg font-bold text-primary">{curriculumScore}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={curriculumScore}
                  onChange={(e) => setCurriculumScore(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold">Teaching Quality Score</label>
                  <span className="text-lg font-bold text-primary">{qualityScore}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold">Student Engagement Score</label>
                  <span className="text-lg font-bold text-primary">{engagementScore}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={engagementScore}
                  onChange={(e) => setEngagementScore(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground">Cumulative Average</span>
                <span className="text-2xl font-black text-primary font-display">
                  {((curriculumScore + qualityScore + engagementScore) / 3).toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            {/* Text feedbacks */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Demonstrated Strengths
                </label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="What did the teacher excel in? (e.g. pronunciation correction, tajweed compliance, engagement)"
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Areas of Improvement
                </label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Suggestions for progress..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Private Administration Notes (Only visible to Admins)
                </label>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Confidential admin comments..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>

            {/* Flag Escalation Workflow */}
            <div className="border-t border-border/40 pt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="escalateFlag"
                  checked={isFlagged}
                  onChange={(e) => setIsFlagged(e.target.checked)}
                  className="h-5 w-5 accent-red-500 rounded border-border"
                />
                <label htmlFor="escalateFlag" className="text-sm font-semibold flex items-center gap-1.5 text-red-400 select-none cursor-pointer">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Escalate and Flag this session to Administration</span>
                </label>
              </div>

              {isFlagged && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3 animate-fadeIn">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Flag Severity
                    </label>
                    <div className="flex gap-2">
                      {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFlagSeverity(level as any)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            flagSeverity === level
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-background border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Reason for Escalation
                    </label>
                    <input
                      type="text"
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="Specify the reason (e.g. teacher absence, behavioral issue, bad internet connection)..."
                      className="w-full bg-background border border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-red-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
