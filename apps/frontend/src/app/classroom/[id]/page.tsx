'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ParticipantTile,
  useTracks,
  useLocalParticipant,
} from '@livekit/components-react';
import { Track, MediaDeviceFailure } from 'livekit-client';
import { Loader2, AlertCircle, Mic, MicOff, Video, ScreenShare, LogOut, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';
import '@livekit/components-styles';

export default function ClassroomPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ token: string; roomName: string; serverUrl: string } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
        router.push('/');
      }}
      className="relative flex flex-col min-h-screen bg-background text-foreground overflow-hidden animate-fadeIn"
    >
      <ClassroomHeader roomName={tokenInfo.roomName} sessionInfo={sessionInfo} />
      
      {/* Dynamic Video Layout */}
      <div className="flex-1 relative flex flex-col p-4 overflow-hidden h-[calc(100vh-140px)]">
        <VideoGrid />
      </div>

      <ControlBarCustom role={user?.role} sessionId={id} canPublishMedia={canPublishMedia} />
      
      <RoomAudioRenderer />
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
      const startTimeVal = sessionInfo.startedAt || sessionInfo.scheduledAt;
      if (!startTimeVal) return;

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

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
        <span className="font-semibold tracking-wide font-display text-sm md:text-base">
          Classroom: <span className="text-primary">{roomName.startsWith('room-') ? roomName.substring(5) : roomName}</span>
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

      {(user?.role === 'REVIEWER' || user?.role === 'ADMIN') && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Silent Monitor Mode (Hidden Observer)</span>
        </div>
      )}

      <div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-colors outline-none"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Exit Room</span>
        </button>
      </div>
    </header>
  );
}

function VideoGrid() {
  const { user } = useAuth();
  const { id: sessionId } = useParams() as { id: string };
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, name: 'camera' },
      { source: Track.Source.ScreenShare, name: 'screen_share' },
    ],
    { onlySubscribed: false },
  );

  const [isFullScreenShare, setIsFullScreenShare] = useState(false);

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

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card/25 rounded-2xl border border-border/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Waiting for participants to connect video stream...</p>
      </div>
    );
  }

  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  if (screenShareTrack) {
    if (isFullScreenShare) {
      return (
        <div className="relative flex-1 w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-border/40">
          <div className="w-full h-full">
            <ParticipantTile
              trackRef={screenShareTrack}
              className="w-full h-full bg-black flex items-center justify-center"
            />
          </div>

          <button
            onClick={() => setIsFullScreenShare(false)}
            className="absolute top-4 left-4 z-20 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700/60 shadow-lg transition-all"
            title="Exit Full Screen Share"
          >
            <Minimize2 className="h-4 w-4" />
          </button>

          <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 items-end max-h-[80%] overflow-y-auto pr-1">
            {cameraTracks.map((track) => (
              <div
                key={`${track.participant.identity}-${track.source}`}
                className="group relative transition-all duration-300 ease-in-out w-14 h-14 rounded-full overflow-hidden border border-slate-750 bg-slate-900/90 shadow-xl hover:w-48 hover:h-32 hover:rounded-xl"
              >
                <ParticipantTile
                  trackRef={track}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white max-w-[80%] truncate pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.participant.name || track.participant.identity}
                </div>
                {user?.role === 'TEACHER' && track.participant.identity !== user.id && (
                  <button
                    onClick={() => handleMuteParticipant(track.participant)}
                    className="absolute top-1 left-1 z-30 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                    title="Remote Mute"
                  >
                    <MicOff size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex-1 w-full h-full flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="flex-1 relative bg-slate-950 rounded-2xl overflow-hidden border border-border/40 flex items-center justify-center aspect-video md:aspect-auto">
            <ParticipantTile
              trackRef={screenShareTrack}
              className="w-full h-full"
            />
            <button
              onClick={() => setIsFullScreenShare(true)}
              className="absolute top-4 left-4 z-20 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700/60 shadow-lg transition-all"
              title="Full Screen Share"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              Screen Shared
            </div>
          </div>

          <div className="w-full md:w-64 lg:w-80 shrink-0 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto max-h-[140px] md:max-h-none py-1">
            {cameraTracks.map((track) => (
              <div key={`${track.participant.identity}-${track.source}`} className="relative group shrink-0 w-40 md:w-full aspect-video">
                <ParticipantTile
                  trackRef={track}
                  className="w-full h-full bg-card/50 border border-border/40 rounded-2xl overflow-hidden flex items-center justify-center hover:border-primary/20 transition-all duration-300"
                />
                {user?.role === 'TEACHER' && track.participant.identity !== user.id && (
                  <button
                    onClick={() => handleMuteParticipant(track.participant)}
                    className="absolute top-2 right-2 z-30 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition outline-none flex items-center gap-1 text-xs shadow-md"
                    title="Mute student microphone"
                  >
                    <MicOff size={12} />
                    <span>Mute</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">
      {cameraTracks.map((track) => (
        <div key={`${track.participant.identity}-${track.source}`} className="relative group w-full aspect-video">
          <ParticipantTile
            trackRef={track}
            className="w-full h-full bg-card/50 border border-border/40 rounded-2xl overflow-hidden flex items-center justify-center hover:border-primary/20 transition-all duration-300"
          />
          {user?.role === 'TEACHER' && track.participant.identity !== user.id && (
            <button
              onClick={() => handleMuteParticipant(track.participant)}
              className="absolute top-3 right-3 z-30 p-2.5 bg-red-500/90 hover:bg-red-650 text-white rounded-xl opacity-0 group-hover:opacity-100 transition outline-none flex items-center gap-1.5 text-xs font-semibold shadow-lg"
              title="Mute student microphone"
            >
              <MicOff size={14} />
              <span>Mute Student</span>
            </button>
          )}
        </div>
      ))}
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
}: {
  role?: string;
  sessionId: string;
  canPublishMedia: boolean;
}) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [togglingMic, setTogglingMic] = useState(false);
  const [togglingCamera, setTogglingCamera] = useState(false);
  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

  const handleCameraToggle = async () => {
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

  const handleEndClass = async () => {
    if (confirm('Are you sure you want to end this class for everyone? This will save the actual class duration and trigger recording uploads.')) {
      setEnding(true);
      try {
        const res = await fetch(`${API_URL}/class-sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' }),
          credentials: 'include',
        });
        if (res.ok) {
          router.push('/');
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
          className={`p-3 rounded-xl transition-all duration-200 outline-none border disabled:opacity-50 ${
            isMicrophoneEnabled
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
          disabled={togglingCamera}
          className={`p-3 rounded-xl transition-all duration-200 outline-none border disabled:opacity-50 ${
            isCameraEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
          }`}
          title={isCameraEnabled ? 'Disable Camera' : 'Enable Camera'}
        >
          {togglingCamera ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Screen Share Toggle Button */}
        {role === 'TEACHER' && (
          <button
            onClick={() => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled)}
            className={`p-3 rounded-xl transition-all duration-200 outline-none border ${
              isScreenShareEnabled
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-emerald-500/20'
                : 'bg-slate-700/50 text-slate-400 border-slate-700/60 hover:bg-slate-700'
            }`}
            title={isScreenShareEnabled ? 'Stop Screen Share' : 'Share Screen'}
          >
            <ScreenShare className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to disconnect from this class?')) {
              router.push('/');
            }
          }}
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
