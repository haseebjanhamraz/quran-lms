import React, { useState } from 'react';
import { Calendar, Loader2, ExternalLink } from 'lucide-react';
import PipelineMonitorModal from '../../../../components/PipelineMonitorModal';

interface SessionItem {
  id: string;
  course: { title: string; type: string };
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  livekitRoomId?: string;
  recording?: { driveUrl: string | null; status: string } | null;
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
  const [selectedSession, setSelectedSession] = useState<{ id: string; title: string } | null>(null);

  return (
    <section className="space-y-5">
      <h2 className="font-display text-xl font-bold" style={{ color: '#C9A84C' }}>
        Past Class Recordings Archive
      </h2>

      {sessionsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      ) : completedRecordings.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">No past class recordings cataloged.</div>
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
                className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-100">{session.course.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDateTime(session.scheduledAt)}</span>
                    <span>•</span>
                    <span>{session.durationMinutes} mins</span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <button
                      onClick={() => setSelectedSession({ id: session.id, title: session.course.title })}
                      className={`inline-flex items-center gap-1.5 font-semibold text-xs rounded-full px-2 py-0.5 hover:scale-105 transition cursor-pointer ${
                        isReady
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isFailed
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                      title="Click to view realtime execution logs"
                    >
                      {isProcessing && <Loader2 size={10} className="animate-spin" />}
                      {status}
                    </button>
                  </div>
                  {isReady && session.recording?.driveUrl ? (
                    <a
                      href={session.recording.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-1.5 px-4 rounded-xl transition-all"
                    >
                      <ExternalLink size={12} />
                      <span>Watch recording</span>
                    </a>
                  ) : isFailed ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSession({ id: session.id, title: session.course.title })}
                        className="text-[10px] text-slate-400 hover:text-slate-200 hover:underline px-2"
                      >
                        Inspect Error
                      </button>
                      <button
                        onClick={() => handleRetryUpload(session.id)}
                        className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/35 hover:bg-red-500/30 text-red-300 text-xs font-semibold py-1.5 px-4 rounded-xl transition-all"
                      >
                        <span>Retry Upload</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedSession({ id: session.id, title: session.course.title })}
                      className="text-xs text-[#C9A84C] hover:underline"
                    >
                      Track process...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSession && (
        <PipelineMonitorModal
          sessionId={selectedSession.id}
          courseTitle={selectedSession.title}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </section>
  );
}
