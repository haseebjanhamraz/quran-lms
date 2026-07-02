'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  ExternalLink, 
  Play, 
  Loader2, 
  Volume2 
} from 'lucide-react';

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speakerLabel: string | null;
  confidence: number;
  language: string;
}

interface SessionDetail {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  course: {
    title: string;
    teacher: {
      name: string;
      email: string;
    };
  };
  recording?: {
    driveUrl: string | null;
  };
}

export default function TranscriptViewerPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'ADMIN' && user.role !== 'REVIEWER' && user.role !== 'TEACHER') {
      router.push('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionRes, transcriptRes] = await Promise.all([
          fetch(`${API_URL}/class-sessions/${sessionId}`, { credentials: 'include' }),
          fetch(`${API_URL}/transcripts/${sessionId}`, { credentials: 'include' })
        ]);

        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          setSession(sData);
        }
        if (transcriptRes.ok) {
          const tData = await transcriptRes.json();
          setSegments(tData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, user]);

  // Track player time to highlight active transcript segment
  const handleTimeUpdate = () => {
    if (!videoRef.current || segments.length === 0) return;
    const currentTime = videoRef.current.currentTime;
    
    const index = segments.findIndex(
      (seg) => currentTime >= seg.startTime && currentTime <= seg.endTime
    );
    if (index !== -1 && index !== activeSegmentIndex) {
      setActiveSegmentIndex(index);
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const filteredSegments = segments.filter(seg => 
    seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (seg.speakerLabel && seg.speakerLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
        <p className="text-xs text-slate-400">Loading transcript data...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-sm text-slate-400 mb-4">Class session details could not be found.</p>
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
              <h1 className="text-sm font-bold text-slate-200">Transcript Analysis Dashboard</h1>
            </div>
          </div>
          {session.recording?.driveUrl && (
            <a
              href={session.recording.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-4 rounded-xl transition"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">Google Drive Link</span>
            </a>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Session details & Video Player */}
        <div className="lg:col-span-5 space-y-6">
          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-5 backdrop-blur-md">
            <h2 className="font-display text-lg font-bold text-amber-500 mb-4">{session.course.title}</h2>
            <div className="space-y-3.5 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <User size={14} className="text-slate-500 shrink-0" />
                <span>Teacher: <strong className="text-slate-200">{session.course.teacher.name}</strong> ({session.course.teacher.email})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar size={14} className="text-slate-500 shrink-0" />
                <span>{formatDate(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-slate-500 shrink-0" />
                <span>Scheduled Duration: {session.durationMinutes} minutes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Volume2 size={14} className="text-slate-500 shrink-0" />
                <span>Speech-to-Text: <span className="text-emerald-400 font-semibold">Processed (100%)</span></span>
              </div>
            </div>
          </div>

          {/* Simple Player Placeholder or Video Link */}
          <div className="rounded-2xl border border-slate-855 bg-slate-900/60 p-5 backdrop-blur-md">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recording Media File</h3>
            {session.recording?.driveUrl ? (
              <div className="space-y-4">
                <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-850 flex items-center justify-center relative">
                  {/* Using standard HTML5 video tag if a direct streamable file is set, otherwise showing standard placeholder */}
                  <video 
                    ref={videoRef}
                    onTimeUpdate={handleTimeUpdate}
                    src="" // In production this would be Google Drive direct link / local path if available
                    controls 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
                    <Volume2 size={36} className="text-amber-500/80 animate-pulse mb-3" />
                    <p className="text-xs text-slate-350 max-w-xs font-medium">Google Drive streamable player is enabled.</p>
                    <p className="text-[10px] text-slate-500 mt-1.5 max-w-[240px]">Clicking on transcripts triggers local seeking actions for timestamps.</p>
                  </div>
                </div>
                <a
                  href={session.recording.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl transition w-full shadow-lg shadow-amber-500/5"
                >
                  <ExternalLink size={14} />
                  <span>Open Video in Google Drive</span>
                </a>
              </div>
            ) : (
              <div className="py-12 text-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40">
                <Clock size={28} className="text-slate-600 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Recording is still being uploaded or processed.</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto">Refresh page to check latest pipeline updates.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Transcript Segment timeline */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-160px)] min-h-[500px]">
          {/* Transcript Panel container */}
          <div className="flex-1 flex flex-col rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-md overflow-hidden">
            {/* Header controls */}
            <div className="p-4 border-b border-slate-850/80 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-200 text-sm font-display flex items-center gap-1.5">
                <span>Class Transcript Timeline</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-sans">
                  {segments.length} blocks
                </span>
              </h3>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 w-full sm:max-w-xs">
                <Search size={14} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-655 text-slate-200"
                />
              </div>
            </div>

            {/* List segments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-1">
              {filteredSegments.length === 0 ? (
                <div className="py-24 text-center text-slate-500 text-xs">
                  {searchQuery ? 'No matching segments found.' : 'No transcript segments cataloged.'}
                </div>
              ) : (
                filteredSegments.map((seg, idx) => {
                  const isTeacher = seg.speakerLabel === 'Teacher';
                  const isActive = idx === activeSegmentIndex;
                  
                  return (
                    <div
                      key={seg.id}
                      onClick={() => handleSeek(seg.startTime)}
                      className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-950/40 border-slate-855/50 hover:bg-slate-900/50 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isTeacher
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {seg.speakerLabel || 'Speaker'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                          </span>
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
                          title="Seek player to segment"
                        >
                          <Play size={10} fill="currentColor" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{seg.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
