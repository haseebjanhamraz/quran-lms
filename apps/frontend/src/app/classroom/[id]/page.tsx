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
import { Track } from 'livekit-client';
import { Loader2, AlertCircle, Mic, Video, ScreenShare, LogOut, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';
import '@livekit/components-styles';

export default function ClassroomPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ token: string; roomName: string; serverUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    const fetchToken = async () => {
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
      } catch (err: any) {
        setError(err.message || 'Error joining classroom.');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
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

  return (
    <LiveKitRoom
      token={tokenInfo.token}
      serverUrl={tokenInfo.serverUrl}
      connect={true}
      video={user?.role !== 'REVIEWER' && user?.role !== 'ADMIN'}
      audio={user?.role !== 'REVIEWER' && user?.role !== 'ADMIN'}
      onDisconnected={() => {
        router.push('/');
      }}
      className="relative flex flex-col min-h-screen bg-background text-foreground overflow-hidden animate-fadeIn"
    >
      <ClassroomHeader roomName={tokenInfo.roomName} />
      
      {/* Dynamic Video Layout */}
      <div className="flex-1 relative flex flex-col p-4 overflow-hidden h-[calc(100vh-140px)]">
        <VideoGrid />
      </div>

      <ControlBarCustom role={user?.role} sessionId={id} />
      
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function ClassroomHeader({ roomName }: { roomName: string }) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
        <span className="font-semibold tracking-wide font-display text-sm md:text-base">
          Classroom: <span className="text-primary">{roomName}</span>
        </span>
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
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, name: 'camera' },
      { source: Track.Source.ScreenShare, name: 'screen_share' },
    ],
    { onlySubscribed: false },
  );

  const [isFullScreenShare, setIsFullScreenShare] = useState(false);

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card/25 rounded-2xl border border-border/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Waiting for participants to connect video stream...</p>
      </div>
    );
  }

  // Find if there is any active screen share
  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  if (screenShareTrack) {
    if (isFullScreenShare) {
      // Full screen shared screen with floating small participants that expand on hover
      return (
        <div className="relative flex-1 w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-border/40">
          {/* Main shared screen */}
          <div className="w-full h-full">
            <ParticipantTile
              trackRef={screenShareTrack}
              className="w-full h-full bg-black flex items-center justify-center"
            />
          </div>

          {/* Toggle Full Screen Button */}
          <button
            onClick={() => setIsFullScreenShare(false)}
            className="absolute top-4 left-4 z-20 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700/60 shadow-lg transition-all"
            title="Exit Full Screen Share"
          >
            <Minimize2 className="h-4 w-4" />
          </button>

          {/* Floating participant list (small, expandable on hover) */}
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
                {/* Tiny badge with name */}
                <div className="absolute bottom-1 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white max-w-[80%] truncate pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.participant.name || track.participant.identity}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Standard shared screen with participants list on the right (responsive)
      return (
        <div className="flex-1 w-full h-full flex flex-col md:flex-row gap-4 overflow-hidden">
          {/* Left panel: Shared Screen */}
          <div className="flex-1 relative bg-slate-950 rounded-2xl overflow-hidden border border-border/40 flex items-center justify-center aspect-video md:aspect-auto">
            <ParticipantTile
              trackRef={screenShareTrack}
              className="w-full h-full"
            />
            {/* Toggle Full Screen Button */}
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

          {/* Right sidebar: Participant camera grids (responsive row on mobile, col on desktop) */}
          <div className="w-full md:w-64 lg:w-80 shrink-0 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto max-h-[140px] md:max-h-none py-1">
            {cameraTracks.map((track) => (
              <ParticipantTile
                key={`${track.participant.identity}-${track.source}`}
                trackRef={track}
                className="w-40 md:w-full aspect-video shrink-0 bg-card/50 border border-border/40 rounded-2xl overflow-hidden flex items-center justify-center hover:border-primary/20 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      );
    }
  }

  // Normal Grid when no screen share
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">
      {cameraTracks.map((track) => (
        <ParticipantTile
          key={`${track.participant.identity}-${track.source}`}
          trackRef={track}
          className="relative bg-card/50 border border-border/40 rounded-2xl overflow-hidden aspect-video flex items-center justify-center group hover:border-primary/20 transition-all duration-300"
        />
      ))}
    </div>
  );
}

function ControlBarCustom({ role, sessionId }: { role?: string; sessionId: string }) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);
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
    <footer className="h-20 border-t border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        {/* Microphone Toggle Button */}
        <button
          onClick={() => localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}
          className={`p-3 rounded-xl transition-all duration-200 outline-none border ${
            isMicrophoneEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
          }`}
          title={isMicrophoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          <Mic className="h-5 w-5" />
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={() => localParticipant?.setCameraEnabled(!isCameraEnabled)}
          className={`p-3 rounded-xl transition-all duration-200 outline-none border ${
            isCameraEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
          }`}
          title={isCameraEnabled ? 'Disable Camera' : 'Enable Camera'}
        >
          <Video className="h-5 w-5" />
        </button>

        {/* Screen Share Toggle Button */}
        <button
          onClick={() => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled)}
          className={`p-3 rounded-xl transition-all duration-200 outline-none border ${
            isScreenShareEnabled
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
              : 'bg-slate-700/50 text-slate-400 border-slate-700/60 hover:bg-slate-700'
          }`}
          title={isScreenShareEnabled ? 'Stop Screen Share' : 'Share Screen'}
        >
          <ScreenShare className="h-5 w-5" />
        </button>
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
    </footer>
  );
}
