import React, { useState } from 'react';
import { Calendar, Loader2, PlayCircle, X } from 'lucide-react';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
  recording?: { filePath: string | null; status: string } | null;
}

interface RecordingsTabProps {
  sessions: SessionItem[];
  sessionsLoading: boolean;
  handleRetryUpload: (id: string) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecordingsTab({
  sessions,
  sessionsLoading,
  handleRetryUpload,
}: RecordingsTabProps) {
  const completedRecordings = sessions.filter((s) => s.status === 'COMPLETED');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  return (
    <section className="space-y-5">
      <h2 className="font-display text-xl font-bold text-brand">
        Past Class Recordings Archive
      </h2>

      {sessionsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : completedRecordings.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">No past class recordings cataloged.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {completedRecordings.map((session) => {
            const status = session.recording?.status || 'PROCESSING';
            const isProcessing = status === 'PROCESSING' || status === 'UPLOADING';
            const isFailed = status === 'FAILED';
            const isReady = status === 'READY';

            return (
              <div
                key={session.id}
                className="rounded-2xl border border-border bg-card/80 p-5 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold text-foreground">{session.course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDateTime(session.scheduledAt)}</span>
                    <span>•</span>
                    <span>{session.durationMinutes} mins</span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold text-xs rounded-full px-2 py-0.5 ${isReady
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isFailed
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                    >
                      {isProcessing && <Loader2 size={10} className="animate-spin" />}
                      {status}
                    </span>
                  </div>
                  {isReady ? (
                    <button
                      onClick={() => {
                        const previewUrl = `${API_URL}/recordings/${session.id}/stream`;
                        setActiveVideoUrl(previewUrl);
                      }}
                      className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold py-1.5 px-4 rounded-xl transition-all border-none cursor-pointer outline-none shadow-sm"
                    >
                      <PlayCircle size={14} /> Play Video
                    </button>
                  ) : isFailed ? (
                    <button
                      onClick={() => handleRetryUpload(session.id)}
                      className="text-xs text-destructive hover:underline font-semibold bg-transparent border-none cursor-pointer"
                    >
                      Retry Upload
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Processing...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Video Modal */}
      {activeVideoUrl && (
        <VideoPlayerModal
          videoUrl={activeVideoUrl}
          onClose={() => setActiveVideoUrl(null)}
        />
      )}
    </section>
  );
}
