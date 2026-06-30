'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ParticipantTile,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Loader2, AlertCircle, Mic, Video, ScreenShare, LogOut, ShieldAlert } from 'lucide-react';
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
      <div className="flex-1 relative flex flex-col md:flex-row p-4 gap-4 overflow-hidden h-[calc(100vh-140px)]">
        <VideoGrid />
      </div>

      <ControlBarCustom role={user?.role} />
      
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

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card/25 rounded-2xl border border-border/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Waiting for participants to connect video stream...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">
      {tracks.map((track) => (
        <ParticipantTile
          key={`${track.participant.identity}-${track.source}`}
          trackRef={track}
          className="relative bg-card/50 border border-border/40 rounded-2xl overflow-hidden aspect-video flex items-center justify-center group hover:border-primary/20 transition-all duration-300"
        />
      ))}
    </div>
  );
}

function ControlBarCustom({ role }: { role?: string }) {
  const router = useRouter();

  if (role === 'REVIEWER' || role === 'ADMIN') {
    return (
      <footer className="h-20 border-t border-border bg-card/60 backdrop-blur-md flex items-center justify-center gap-4 px-6 z-10">
        <p className="text-xs text-muted-foreground italic">
          Auditing active streams. Audio publishing disabled in compliance review config.
        </p>
      </footer>
    );
  }

  return (
    <footer className="h-20 border-t border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-2">
        <button className="p-3 bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-all duration-200 outline-none">
          <Mic className="h-5 w-5" />
        </button>
        <button className="p-3 bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-all duration-200 outline-none">
          <Video className="h-5 w-5" />
        </button>
        <button className="p-3 bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-all duration-200 outline-none">
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
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors outline-none shadow-md hover:shadow-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </footer>
  );
}
