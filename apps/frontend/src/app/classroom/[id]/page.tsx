'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ParticipantTile,
  VideoTrack,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useIsSpeaking,
  StartAudio,
} from '@livekit/components-react';
import { Track, MediaDeviceFailure } from 'livekit-client';
import { Loader2, AlertCircle, Mic, MicOff, Video, VideoOff, ScreenShare, LogOut, ShieldAlert, Volume2, GripHorizontal, Minus, Maximize2, Minimize2, Users } from 'lucide-react';
import '@livekit/components-styles';
import ThemeToggle from '@/components/ThemeToggle';
import { getImageUrl } from '@/utils/image';
import PostClassReportModal from '@/components/classroom/PostClassReportModal';

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

export default function ClassroomPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ token: string; roomName: string; serverUrl: string } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    const fetchTokenAndSession = async () => {
      try {
        const res = await fetch(`${API_URL}/class-sessions/${id}/token`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch classroom session token.');
        }
        setTokenInfo(data);

        // Fetch detailed session information
        const sessionRes = await fetch(`${API_URL}/class-sessions/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSessionInfo(sessionData);
        }
      } catch (err: any) {
        setError(err.message || 'Error joining classroom.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Securing video tunnel and generating classroom tokens...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold font-display mb-2">Failed to Enter Classroom</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
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

  if (!tokenInfo) return null;

  const canPublishMedia = user?.role !== 'REVIEWER' && user?.role !== 'ADMIN';

  return (
    <LiveKitRoom
      token={tokenInfo.token}
      serverUrl={tokenInfo.serverUrl}
      connect={true}
      video={false}
      audio={false}
      onDisconnected={() => {
        if (!isReportModalOpen && user?.role !== 'TEACHER') {
          router.push('/');
        }
      }}
      className="relative flex flex-col h-screen min-h-screen bg-background text-foreground overflow-hidden animate-fadeIn"
    >
      <StartAudio
        label="🔊 Audio playback is paused by browser policy — Click here to enable classroom audio"
        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-b border-amber-500/30 text-xs py-2 px-4 text-center font-medium cursor-pointer transition-colors flex items-center justify-center gap-2 z-50"
      />
      <ClassroomHeader roomName={tokenInfo.roomName} sessionInfo={sessionInfo} />

      {/* Dynamic Video Layout */}
      <div className="flex-1 relative flex flex-col p-2 sm:p-4 overflow-hidden min-h-0">
        <VideoGrid />
      </div>

      <ControlBarCustom
        role={user?.role}
        sessionId={id}
        canPublishMedia={canPublishMedia}
        onRequestReportModal={() => setIsReportModalOpen(true)}
      />

      <RoomAudioRenderer />

      <PostClassReportModal
        isOpen={isReportModalOpen}
        sessionId={id}
        sessionInfo={sessionInfo}
        onClose={() => {
          setIsReportModalOpen(false);
          router.push('/teacher/dashboard?tab=Classes History');
        }}
        onSuccess={() => {
          setIsReportModalOpen(false);
          router.push('/teacher/dashboard?tab=Classes History');
        }}
      />
    </LiveKitRoom>
  );
}

function ClassroomHeader({ roomName, sessionInfo }: { roomName: string; sessionInfo: any }) {
  const { user } = useAuth();
  const router = useRouter();
  const [elapsed, setElapsed] = useState<string>('00:00');
  const [remaining, setRemaining] = useState<string>('00:00');
  const [isOvertime, setIsOvertime] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionInfo) return;

    const timer = setInterval(() => {
      // Use actualStartTime or startedAt; DO NOT fall back to scheduledAt
      const startTimeVal = sessionInfo.actualStartTime || sessionInfo.startedAt;
      if (!startTimeVal) {
        setElapsed('00:00');
        const durationMins = sessionInfo.durationMinutes || 30;
        setRemaining(`${String(durationMins).padStart(2, '0')}:00`);
        return;
      }

      const start = new Date(startTimeVal).getTime();
      const now = Date.now();
      const elapsedMs = Math.max(0, now - start);

      const elapsedSec = Math.floor(elapsedMs / 1000);
      const elapsedMins = Math.floor(elapsedSec / 60);
      const elapsedSecs = elapsedSec % 60;
      setElapsed(`${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`);

      const totalDurationSec = (sessionInfo.durationMinutes || 0) * 60;
      const remainingSec = totalDurationSec - elapsedSec;

      if (remainingSec >= 0) {
        const remMins = Math.floor(remainingSec / 60);
        const remSecs = remainingSec % 60;
        setRemaining(`${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`);
        setIsOvertime(false);
      } else {
        const overtimeSec = Math.abs(remainingSec);
        const otMins = Math.floor(overtimeSec / 60);
        const otSecs = overtimeSec % 60;
        setRemaining(`+${String(otMins).padStart(2, '0')}:${String(otSecs).padStart(2, '0')}`);
        setIsOvertime(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionInfo]);

  const room = useRoomContext();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const handleLeave = async () => {
    if (room) {
      await room.disconnect();
    }
    router.push('/');
  };

  const displayTitle = sessionInfo?.course?.title
    ? `${sessionInfo.course.title}${sessionInfo.student?.name ? ` • ${sessionInfo.student.name}` : ''}`
    : roomName.startsWith('room-') ? roomName.substring(5) : roomName;

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
        <span className="font-semibold tracking-wide font-display text-sm md:text-base">
          Classroom: <span className="text-primary">{displayTitle}</span>
        </span>

        {/* Realtime Timers */}
        {sessionInfo && (
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <span className="text-slate-400">⏱️ {elapsed}</span>
            <span className="text-slate-600">|</span>
            <span className={isOvertime ? "text-red-400 animate-pulse" : "text-emerald-400"}>
              {isOvertime ? "⚠️ Overtime: " : "⌛ Left: "}{remaining}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {(user?.role === 'REVIEWER' || user?.role === 'ADMIN') && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Auditing Live Mode</span>
          </div>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors outline-none cursor-pointer"
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>

        <button
          onClick={handleLeave}
          className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-semibold text-xs py-1.5 px-3.5 rounded-lg transition-colors outline-none cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}

function VideoGrid() {
  const { user } = useAuth();
  const { id: sessionId } = useParams() as { id: string };
  const room = useRoomContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Subscribed tracks only for stability
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true },
  );

  const handleMuteParticipant = async (participant: any) => {
    const audioPub = participant.getTrackPublication(Track.Source.Microphone);
    const trackSid = audioPub?.trackSid;
    if (!trackSid) {
      alert('Participant microphone track not found or inactive.');
      return;
    }

    if (confirm(`Are you sure you want to remote mute ${participant.name || participant.identity}?`)) {
      try {
        const res = await fetch(`${API_URL}/livekit/mute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: `room-${sessionId}`,
            identity: participant.identity,
            trackSid,
            muted: true,
          }),
          credentials: 'include',
        });
        if (!res.ok) {
          const errData = await res.json();
          alert(`Failed to remote mute: ${errData.message || 'Unknown error'}`);
        }
      } catch (err: any) {
        console.error('Mute error:', err);
        alert('Network error while attempting to mute student.');
      }
    }
  };

  const handleStopScreenShare = async () => {
    if (room?.localParticipant) {
      try {
        await room.localParticipant.setScreenShareEnabled(false);
      } catch (e) {
        console.error('Failed to stop screen share:', e);
      }
    }
  };

  const screenShareTrack = useMemo(() => {
    return tracks.find(
      (t) =>
        t.source === Track.Source.ScreenShare &&
        t.publication &&
        !t.publication.isMuted &&
        (t.participant.isLocal || t.publication.track || t.publication.isSubscribed)
    );
  }, [tracks]);

  const cameraTracks = useMemo(() => {
    return tracks.filter((t) => t.source === Track.Source.Camera);
  }, [tracks]);

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card/25 rounded-2xl border border-border/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Waiting for participants to connect video stream...</p>
      </div>
    );
  }

  // ─── Screen Share Active: Full Screen Width & Height + Floating Draggable Overlay ───
  if (screenShareTrack) {
    const isLocalPresenter = screenShareTrack.participant.isLocal;
    const presenterName = screenShareTrack.participant.name || (isLocalPresenter ? 'You' : 'Presenter');

    return (
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 rounded-2xl border border-border/40 shadow-xl select-none"
      >
        {/* Screen Share Header Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/70 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 pointer-events-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <ScreenShare className="h-3.5 w-3.5 text-blue-400" />
            <span>
              {isLocalPresenter ? 'You are presenting your screen' : `${presenterName} is presenting`}
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={toggleFullscreen}
              className="bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
            </button>

            {isLocalPresenter && (
              <button
                onClick={handleStopScreenShare}
                className="bg-red-500/90 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Stop sharing your screen"
              >
                <ScreenShare className="h-3.5 w-3.5" />
                <span>Stop Sharing</span>
              </button>
            )}
          </div>
        </div>

        {/* Screen Share Video Track - Full Width & Height */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <VideoTrack
            trackRef={screenShareTrack as any}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Floating, Draggable & Minimizable Participant Avatars Overlay */}
        <DraggableParticipantOverlay
          containerRef={containerRef}
          cameraTracks={cameraTracks}
          user={user}
          onMuteParticipant={handleMuteParticipant}
        />
      </div>
    );
  }

  // ─── Normal View: Balanced Participant Grid including demo_supervisor ───
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto pr-1">
      {cameraTracks.map((track) => (
        <div key={`${track.participant.identity}-${track.source}`} className="relative group w-full aspect-video">
          <CustomParticipantTile
            track={track}
            className="w-full h-full shadow-lg"
            compact={false}
            showMuteButton={user?.role === 'TEACHER' && track.participant.identity !== user.id}
            onMute={() => handleMuteParticipant(track.participant)}
          />
        </div>
      ))}

      {/* Dummy User: demo_supervisor */}
      <div className="relative group w-full aspect-video">
        <DemoSupervisorTile compact={false} />
      </div>
    </div>
  );
}

interface DraggableParticipantOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cameraTracks: any[];
  user: any;
  onMuteParticipant: (participant: any) => void;
}

const OVERLAY_STORAGE_KEY = 'classroom_participant_overlay_settings';

interface PersistedOverlaySettings {
  isMinimized: boolean;
  corner?: 'TL' | 'TR' | 'BL' | 'BR' | null;
  pos?: { x: number; y: number } | null;
  ratio?: { xRatio: number; yRatio: number } | null;
}

const saveOverlaySettings = (settings: Partial<PersistedOverlaySettings>) => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    const existing: PersistedOverlaySettings = raw ? JSON.parse(raw) : { isMinimized: false };
    const updated = { ...existing, ...settings };
    localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save participant overlay settings:', err);
  }
};

function DraggableParticipantOverlay({
  containerRef,
  cameraTracks,
  user,
  onMuteParticipant,
}: DraggableParticipantOverlayProps) {
  // Initialize minimize state from browser cache (localStorage)
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Boolean(parsed.isMinimized);
      }
    } catch (_) {}
    return false;
  });

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [activeCorner, setActiveCorner] = useState<'TL' | 'TR' | 'BL' | 'BR' | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Calculate restored or default position (Top-Right) when container and overlay are mounted
  useEffect(() => {
    if (pos !== null || !containerRef.current || !overlayRef.current) return;
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;
    const oWidth = overlayRef.current.offsetWidth || 340;
    const oHeight = overlayRef.current.offsetHeight || 140;
    const pad = 16;

    let saved: PersistedOverlaySettings | null = null;
    try {
      const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (_) {}

    if (saved?.corner) {
      setActiveCorner(saved.corner);
      switch (saved.corner) {
        case 'TL':
          setPos({ x: pad, y: pad });
          return;
        case 'TR':
          setPos({ x: Math.max(pad, cWidth - oWidth - pad), y: pad });
          return;
        case 'BL':
          setPos({ x: pad, y: Math.max(pad, cHeight - oHeight - pad) });
          return;
        case 'BR':
          setPos({
            x: Math.max(pad, cWidth - oWidth - pad),
            y: Math.max(pad, cHeight - oHeight - pad),
          });
          return;
      }
    }

    if (saved?.ratio) {
      const calcX = Math.round(saved.ratio.xRatio * cWidth);
      const calcY = Math.round(saved.ratio.yRatio * cHeight);
      setPos({
        x: Math.max(8, Math.min(calcX, cWidth - oWidth - 8)),
        y: Math.max(8, Math.min(calcY, cHeight - oHeight - 8)),
      });
      return;
    }

    if (saved?.pos) {
      setPos({
        x: Math.max(8, Math.min(saved.pos.x, cWidth - oWidth - 8)),
        y: Math.max(8, Math.min(saved.pos.y, cHeight - oHeight - 8)),
      });
      return;
    }

    // Default to Top-Right
    const defaultX = Math.max(pad, cWidth - oWidth - pad);
    const defaultY = pad;
    setPos({ x: defaultX, y: defaultY });
    setActiveCorner('TR');
  }, [containerRef, pos]);

  // Keep inside container bounds on resize, preserving corner snap if set
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !overlayRef.current) return;
      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;
      const oWidth = overlayRef.current.offsetWidth;
      const oHeight = overlayRef.current.offsetHeight;
      const pad = 16;

      if (activeCorner) {
        switch (activeCorner) {
          case 'TL':
            setPos({ x: pad, y: pad });
            return;
          case 'TR':
            setPos({ x: Math.max(pad, cWidth - oWidth - pad), y: pad });
            return;
          case 'BL':
            setPos({ x: pad, y: Math.max(pad, cHeight - oHeight - pad) });
            return;
          case 'BR':
            setPos({
              x: Math.max(pad, cWidth - oWidth - pad),
              y: Math.max(pad, cHeight - oHeight - pad),
            });
            return;
        }
      }

      setPos((prev) => {
        if (!prev) return prev;
        return {
          x: Math.max(8, Math.min(prev.x, cWidth - oWidth - 8)),
          y: Math.max(8, Math.min(prev.y, cHeight - oHeight - 8)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef, activeCorner]);

  const snapToCorner = (corner: 'TL' | 'TR' | 'BL' | 'BR') => {
    if (!containerRef.current || !overlayRef.current) return;
    const cWidth = containerRef.current.clientWidth;
    const cHeight = containerRef.current.clientHeight;
    const oWidth = overlayRef.current.offsetWidth;
    const oHeight = overlayRef.current.offsetHeight;
    const pad = 16;

    let targetX = pad;
    let targetY = pad;

    switch (corner) {
      case 'TL':
        targetX = pad;
        targetY = pad;
        break;
      case 'TR':
        targetX = Math.max(pad, cWidth - oWidth - pad);
        targetY = pad;
        break;
      case 'BL':
        targetX = pad;
        targetY = Math.max(pad, cHeight - oHeight - pad);
        break;
      case 'BR':
        targetX = Math.max(pad, cWidth - oWidth - pad);
        targetY = Math.max(pad, cHeight - oHeight - pad);
        break;
    }

    const newPos = { x: targetX, y: targetY };
    setPos(newPos);
    setActiveCorner(corner);
    saveOverlaySettings({
      corner,
      pos: newPos,
      ratio: { xRatio: targetX / (cWidth || 1), yRatio: targetY / (cHeight || 1) },
    });
  };

  const toggleMinimize = (minimized: boolean) => {
    setIsMinimized(minimized);
    saveOverlaySettings({ isMinimized: minimized });

    setTimeout(() => {
      if (!containerRef.current || !overlayRef.current) return;
      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;
      const oWidth = overlayRef.current.offsetWidth;
      const oHeight = overlayRef.current.offsetHeight;

      setPos((prev) => {
        if (!prev) return prev;
        const clampedX = Math.max(8, Math.min(prev.x, cWidth - oWidth - 8));
        const clampedY = Math.max(8, Math.min(prev.y, cHeight - oHeight - 8));
        const newPos = { x: clampedX, y: clampedY };
        saveOverlaySettings({
          pos: newPos,
          ratio: { xRatio: clampedX / (cWidth || 1), yRatio: clampedY / (cHeight || 1) },
        });
        return newPos;
      });
    }, 50);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent dragging when clicking buttons inside the overlay
    if ((e.target as HTMLElement).closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (!overlayRef.current || !containerRef.current) return;

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const currentX = pos !== null ? pos.x : overlayRect.left - containerRect.left;
    const currentY = pos !== null ? pos.y : overlayRect.top - containerRect.top;

    dragStateRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };

    const handlePointerMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!dragStateRef.current.isDragging || !containerRef.current || !overlayRef.current) return;

      const curX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = curX - dragStateRef.current.startX;
      const deltaY = curY - dragStateRef.current.startY;

      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;
      const oWidth = overlayRef.current.offsetWidth;
      const oHeight = overlayRef.current.offsetHeight;

      const nextX = Math.max(8, Math.min(dragStateRef.current.initialX + deltaX, cWidth - oWidth - 8));
      const nextY = Math.max(8, Math.min(dragStateRef.current.initialY + deltaY, cHeight - oHeight - 8));

      setPos({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      dragStateRef.current.isDragging = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      // Save position to localStorage
      if (overlayRef.current && containerRef.current) {
        const cWidth = containerRef.current.clientWidth;
        const cHeight = containerRef.current.clientHeight;
        const overlayRect = overlayRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const finalX = Math.max(8, Math.min(overlayRect.left - containerRect.left, cWidth - overlayRect.width - 8));
        const finalY = Math.max(8, Math.min(overlayRect.top - containerRect.top, cHeight - overlayRect.height - 8));

        setActiveCorner(null);
        saveOverlaySettings({
          corner: null,
          pos: { x: finalX, y: finalY },
          ratio: { xRatio: finalX / (cWidth || 1), yRatio: finalY / (cHeight || 1) },
        });
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const totalParticipants = cameraTracks.length + 1; // including supervisor

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 35,
    ...(pos !== null
      ? { left: `${pos.x}px`, top: `${pos.y}px` }
      : { right: '16px', top: '16px' }),
    touchAction: 'none',
  };

  if (isMinimized) {
    return (
      <div
        ref={overlayRef}
        style={overlayStyle}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full shadow-2xl text-white cursor-grab active:cursor-grabbing select-none hover:border-brand/60 transition-colors"
        title="Drag anywhere or click maximize to view participant avatars"
      >
        <GripHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-brand" />
          <span className="text-xs font-semibold">{totalParticipants}</span>
        </div>
        <button
          onClick={() => toggleMinimize(false)}
          className="p-1 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
          title="Expand participants"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      style={overlayStyle}
      className="flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-w-[calc(100%-24px)] select-none transition-shadow"
    >
      {/* Draggable Header Bar */}
      <div
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-white/10 cursor-grab active:cursor-grabbing gap-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 truncate">
            <Users className="h-3.5 w-3.5 text-brand shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">
              Participants ({totalParticipants})
            </span>
          </div>
        </div>

        {/* Action Controls: Corner Snap + Minimize */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center bg-white/5 rounded-md p-0.5 border border-white/10">
            {(['TL', 'TR', 'BL', 'BR'] as const).map((corner) => (
              <button
                key={corner}
                onClick={() => snapToCorner(corner)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition cursor-pointer ${
                  activeCorner === corner
                    ? 'bg-brand/30 text-brand font-extrabold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={`Snap to ${
                  corner === 'TL'
                    ? 'Top-Left'
                    : corner === 'TR'
                    ? 'Top-Right'
                    : corner === 'BL'
                    ? 'Bottom-Left'
                    : 'Bottom-Right'
                }`}
              >
                {corner}
              </button>
            ))}
          </div>

          <button
            onClick={() => toggleMinimize(true)}
            className="p-1 rounded-md hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
            title="Minimize participant avatars"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Participant Compact Tiles Row */}
      <div className="flex flex-row gap-2.5 p-2.5 overflow-x-auto max-w-[85vw] sm:max-w-xl max-h-[30vh]">
        {cameraTracks.map((track) => (
          <div
            key={`${track.participant.identity}-${track.source}`}
            className="w-36 sm:w-40 aspect-video shrink-0 relative group rounded-xl overflow-hidden shadow-md"
          >
            <CustomParticipantTile
              track={track}
              className="w-full h-full shadow-sm"
              compact={true}
              showMuteButton={user?.role === 'TEACHER' && track.participant.identity !== user.id}
              onMute={() => onMuteParticipant(track.participant)}
            />
          </div>
        ))}

        {/* Dummy User: demo_supervisor */}
        <div className="w-36 sm:w-40 aspect-video shrink-0 relative group rounded-xl overflow-hidden shadow-md">
          <DemoSupervisorTile compact={true} />
        </div>
      </div>
    </div>
  );
}

function DemoSupervisorTile({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative w-full h-full shadow-lg bg-slate-900 border border-purple-500/40 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200 ring-1 ring-purple-500/20`}
    >
      {/* Live Observer / Auditing Badge in top corner */}
      <div
        className={`absolute ${
          compact ? 'top-1.5 left-1.5 px-1.5 py-0 text-[8px]' : 'top-2 left-2 px-2 py-0.5 text-[9px]'
        } z-20 flex items-center gap-1 bg-purple-950/80 backdrop-blur-md rounded-md border border-purple-500/30 text-purple-200 font-bold uppercase tracking-wider shadow`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
        <span>QA Monitor</span>
      </div>

      {/* Avatar / Placeholder */}
      <div
        className={`flex flex-col items-center justify-center ${
          compact ? 'p-1.5 space-y-1' : 'p-3 space-y-2'
        } text-center select-none`}
      >
        <div
          className={`${
            compact ? 'w-10 h-10 text-xs' : 'w-20 h-20 sm:w-24 sm:h-24 text-lg'
          } rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-purple-300 font-bold shadow-xl`}
        >
          <ShieldAlert className={compact ? 'h-5 w-5' : 'h-10 w-10'} />
        </div>
        <div>
          <h4
            className={`${
              compact ? 'text-[11px] max-w-[110px]' : 'text-xs sm:text-sm max-w-[200px]'
            } font-bold text-white tracking-wide truncate`}
          >
            Supervisor
          </h4>
          <span
            className={`${
              compact ? 'text-[8px] px-1.5 py-0' : 'text-[9px] px-2 py-0.5'
            } font-bold uppercase tracking-wider rounded-full inline-block mt-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30`}
          >
            SUPERVISOR
          </span>
        </div>
      </div>

      {/* Bottom Name & Mic status */}
      <div
        className={`absolute ${
          compact ? 'bottom-1.5 left-1.5 px-1.5 py-0.5' : 'bottom-2 left-2 px-2.5 py-1'
        } z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 text-white shadow-md`}
      >
        <span title="Monitoring Audio" className="text-purple-300 flex items-center">
          <MicOff size={compact ? 10 : 11} />
        </span>
        <span
          className={`${
            compact ? 'text-[9px] max-w-[70px]' : 'text-[11px] max-w-[100px] sm:max-w-[140px]'
          } font-medium truncate`}
        >
          Supervisor
        </span>
      </div>

      <div
        className={`absolute ${
          compact ? 'bottom-1.5 right-1.5 px-1.5 py-0.5' : 'bottom-2 right-2 px-2 py-1'
        } z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 text-white shadow-md`}
      >
        <VideoOff size={compact ? 10 : 11} className="text-slate-400" />
      </div>
    </div>
  );
}

function CustomParticipantTile({
  track,
  className = '',
  compact = false,
  showMuteButton = false,
  onMute,
}: {
  track: any;
  className?: string;
  compact?: boolean;
  showMuteButton?: boolean;
  onMute?: () => void;
}) {
  const isCameraOff =
    ('isPlaceholder' in track && track.isPlaceholder) ||
    !track.publication?.track ||
    track.publication?.isMuted;
  const participant = track.participant;
  const isSpeaking = useIsSpeaking(participant);

  let profilePicture = '';
  let role = '';
  try {
    const meta = JSON.parse(participant?.metadata || '{}');
    profilePicture = meta.profilePicture || '';
    role = meta.role || '';
  } catch (_) {}

  const displayName = participant?.name || participant?.identity || 'User';
  const isMicMuted = !participant?.isMicrophoneEnabled;

  return (
    <div
      className={`relative ${className} bg-slate-900 border rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200 ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
          : 'border-slate-800'
      }`}
    >
      {/* Participant Video or Avatar Placeholder */}
      {isCameraOff ? (
        <div
          className={`flex flex-col items-center justify-center ${
            compact ? 'p-1.5 space-y-1' : 'p-3 space-y-2'
          } text-center select-none`}
        >
          {profilePicture ? (
            <img
              src={getImageUrl(profilePicture)}
              alt={displayName}
              className={`${
                compact ? 'w-10 h-10' : 'w-20 h-20 sm:w-24 sm:h-24'
              } rounded-full object-cover border-2 border-brand/50 shadow-xl`}
            />
          ) : (
            <div
              className={`${
                compact ? 'w-10 h-10 text-xs' : 'w-20 h-20 sm:w-24 sm:h-24 text-xl'
              } rounded-full bg-brand/20 border-2 border-brand/40 flex items-center justify-center text-brand font-bold shadow-xl`}
            >
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h4
              className={`${
                compact ? 'text-[11px] max-w-[110px]' : 'text-xs sm:text-sm max-w-[200px]'
              } font-bold text-white tracking-wide truncate`}
            >
              {displayName}
            </h4>
            {role && (
              <span
                className={`${
                  compact ? 'text-[8px] px-1.5 py-0' : 'text-[9px] px-2 py-0.5'
                } font-bold uppercase tracking-wider rounded-full inline-block mt-0.5 ${
                  role === 'TEACHER'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}
              >
                {role}
              </span>
            )}
          </div>
        </div>
      ) : (
        <ParticipantTile trackRef={track} className="w-full h-full object-cover" />
      )}

      {/* Participant Name Badge + Speaking/Mic Status Overlay */}
      <div
        className={`absolute ${
          compact ? 'bottom-1.5 left-1.5 px-1.5 py-0.5' : 'bottom-2 left-2 px-2.5 py-1'
        } z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 text-white shadow-md`}
      >
        {isMicMuted ? (
          <span title="Microphone muted" className="text-red-400 flex items-center">
            <MicOff size={compact ? 10 : 11} />
          </span>
        ) : isSpeaking ? (
          <span title="Speaking" className="text-emerald-400 flex items-center animate-pulse">
            <Mic size={compact ? 10 : 11} />
          </span>
        ) : (
          <span title="Microphone active" className="text-slate-400 flex items-center">
            <Mic size={compact ? 10 : 11} />
          </span>
        )}
        <span
          className={`${
            compact ? 'text-[9px] max-w-[70px]' : 'text-[11px] max-w-[100px] sm:max-w-[140px]'
          } font-medium truncate`}
        >
          {displayName}
        </span>
        {role && (
          <span
            className={`text-[8px] font-bold uppercase tracking-wider px-1 rounded ${
              role === 'TEACHER' ? 'text-amber-300' : 'text-sky-300'
            }`}
          >
            {role === 'TEACHER' ? 'T' : 'S'}
          </span>
        )}
      </div>

      {/* Remote Mute Button (for teacher hovering over student) */}
      {showMuteButton && onMute && (
        <button
          onClick={onMute}
          className="absolute top-1.5 right-1.5 z-30 p-1 sm:p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs shadow-md cursor-pointer outline-none"
          title="Mute student microphone"
        >
          <MicOff size={compact ? 11 : 12} />
          <span className="hidden sm:inline text-[9px]">Mute</span>
        </button>
      )}
    </div>
  );
}

function getMediaDeviceErrorMessage(error: unknown, device: 'microphone' | 'camera'): string {
  const failure = MediaDeviceFailure.getFailure(error as Error);

  if (failure === MediaDeviceFailure.PermissionDenied) {
    return `${device === 'microphone' ? 'Microphone' : 'Camera'} access was blocked. Click the lock icon in your browser address bar, allow ${device} access for this site, then try again.`;
  }
  if (failure === MediaDeviceFailure.NotFound) {
    return `No ${device} was found. Please connect a ${device} and try again.`;
  }
  if (failure === MediaDeviceFailure.DeviceInUse) {
    return `Your ${device} is already in use by another application. Close other apps using it and try again.`;
  }
  return `Could not enable ${device}. Please check your device settings and try again.`;
}

async function requestMediaPermission(kind: 'audio' | 'video'): Promise<void> {
  const constraints = kind === 'audio' ? { audio: true } : { video: true };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  stream.getTracks().forEach((track) => track.stop());
}

function ControlBarCustom({
  role,
  sessionId,
  canPublishMedia,
  onRequestReportModal,
}: {
  role?: string;
  sessionId: string;
  canPublishMedia: boolean;
  onRequestReportModal?: () => void;
}) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [togglingMic, setTogglingMic] = useState(false);
  const [togglingCamera, setTogglingCamera] = useState(false);
  const [togglingScreenShare, setTogglingScreenShare] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  if (role === 'REVIEWER' || role === 'ADMIN') {
    return (
      <footer className="h-20 border-t border-border bg-card/60 backdrop-blur-md flex items-center justify-center gap-4 px-6 z-10">
        <p className="text-xs text-muted-foreground italic">
          Auditing active streams. Audio publishing disabled in compliance review config.
        </p>
      </footer>
    );
  }

  const handleMicrophoneToggle = async () => {
    if (!localParticipant || togglingMic) return;
    setMediaError(null);

    if (isMicrophoneEnabled) {
      await localParticipant.setMicrophoneEnabled(false);
      return;
    }

    setTogglingMic(true);
    try {
      await requestMediaPermission('audio');
      await localParticipant.setMicrophoneEnabled(true);
    } catch (err) {
      console.error('Microphone permission error:', err);
      setMediaError(getMediaDeviceErrorMessage(err, 'microphone'));
    } finally {
      setTogglingMic(false);
    }
  };

  const { user } = useAuth();
  const isCameraRestricted = useMemo(() => {
    try {
      if (localParticipant?.metadata) {
        const meta = JSON.parse(localParticipant.metadata);
        if (meta.cameraRestricted) return true;
      }
    } catch (_) {}
    return Boolean((user as any)?.cameraRestricted);
  }, [localParticipant?.metadata, user]);

  const handleCameraToggle = async () => {
    if (isCameraRestricted) {
      setMediaError('Camera has been restricted for your account by the administrator.');
      return;
    }
    if (!localParticipant || togglingCamera) return;
    setMediaError(null);

    if (isCameraEnabled) {
      await localParticipant.setCameraEnabled(false);
      return;
    }

    setTogglingCamera(true);
    try {
      await requestMediaPermission('video');
      await localParticipant.setCameraEnabled(true);
    } catch (err) {
      console.error('Camera permission error:', err);
      setMediaError(getMediaDeviceErrorMessage(err, 'camera'));
    } finally {
      setTogglingCamera(false);
    }
  };

  const handleScreenShareToggle = async () => {
    if (!localParticipant || togglingScreenShare) return;
    setTogglingScreenShare(true);
    setMediaError(null);
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        console.error('Screen share error:', err);
        setMediaError(err?.message || 'Could not toggle screen sharing.');
      }
    } finally {
      setTogglingScreenShare(false);
    }
  };

  const room = useRoomContext();

  const handleLeaveRoom = async () => {
    if (confirm('Are you sure you want to disconnect from this class?')) {
      if (room) {
        await room.disconnect();
      }
      router.push('/');
    }
  };

  const handleEndClass = async () => {
    if (confirm('Are you sure you want to end this class for everyone? This will save the actual class duration and prompt for the class report.')) {
      setEnding(true);
      try {
        if (room) {
          await room.disconnect();
        }
        const res = await fetch(`${API_URL}/class-sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' }),
          credentials: 'include',
        });
        if (res.ok) {
          if (role === 'TEACHER' && onRequestReportModal) {
            onRequestReportModal();
          } else {
            router.push('/');
          }
        } else {
          alert('Failed to end the class session properly.');
        }
      } catch (err) {
        console.error('Error ending class:', err);
        alert('Network error while ending class.');
      } finally {
        setEnding(false);
      }
    }
  };

  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-md z-10">
      {mediaError && canPublishMedia && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{mediaError}</span>
          </div>
          <button
            onClick={() => setMediaError(null)}
            className="shrink-0 text-amber-300 hover:text-amber-100 transition-colors outline-none"
            aria-label="Dismiss media error"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="h-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Microphone Toggle Button */}
          <button
            onClick={handleMicrophoneToggle}
            disabled={togglingMic}
            className={`p-3 rounded-xl transition-all duration-200 outline-none border disabled:opacity-50 ${isMicrophoneEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
              }`}
            title={isMicrophoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {togglingMic ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Camera Toggle Button */}
          <button
            onClick={handleCameraToggle}
            disabled={isCameraRestricted || togglingCamera}
            className={`p-3 rounded-xl transition-all duration-200 outline-none border ${
              isCameraRestricted
                ? 'bg-muted/40 text-muted-foreground border-border/50 opacity-40 cursor-not-allowed'
                : isCameraEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
            }`}
            title={
              isCameraRestricted
                ? 'Camera Restricted by Administrator'
                : isCameraEnabled
                ? 'Disable Camera'
                : 'Enable Camera'
            }
          >
            {togglingCamera ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isCameraRestricted ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </button>

          {isCameraRestricted && (
            <span className="hidden sm:inline-block text-[11px] text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md font-medium">
              Camera Restricted
            </span>
          )}

          {/* Screen Share Toggle Button */}
          {role === 'TEACHER' && (
            <button
              onClick={handleScreenShareToggle}
              disabled={togglingScreenShare}
              className={`p-3 rounded-xl transition-all duration-200 outline-none border cursor-pointer disabled:opacity-50 ${
                isScreenShareEnabled
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'bg-slate-700/50 text-slate-400 border-slate-700/60 hover:bg-slate-700 hover:text-white'
              }`}
              title={isScreenShareEnabled ? 'Stop Screen Share' : 'Share Screen'}
            >
              {togglingScreenShare ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ScreenShare className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-3 rounded-xl transition-all duration-200 outline-none border cursor-pointer ${
              isFullscreen
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                : 'bg-slate-700/50 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 border border-slate-700 hover:bg-slate-800 text-slate-350 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors outline-none"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave Room</span>
          </button>

          {role === 'TEACHER' && (
            <button
              onClick={handleEndClass}
              disabled={ending}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-650 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors outline-none shadow-md hover:shadow-red-500/10 disabled:opacity-50"
            >
              {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span>End Class for All</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
