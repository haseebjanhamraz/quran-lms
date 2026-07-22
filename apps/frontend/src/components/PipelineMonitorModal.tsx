'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle, Play, Loader2, FileText, Cpu } from 'lucide-react';

interface LogItem {
  id: string;
  step: string; // "UPLOAD", "TRANSCRIPTION", "AI_AUDIT"
  status: string; // "STARTED", "IN_PROGRESS", "SUCCESS", "FAILED"
  message: string;
  createdAt: string;
}

interface PipelineMonitorModalProps {
  sessionId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PipelineMonitorModal({
  sessionId,
  courseTitle,
  isOpen,
  onClose,
}: PipelineMonitorModalProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/class-sessions/${sessionId}/pipeline-logs`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching pipeline logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Poll every 3 seconds for realtime updates
    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`${API_URL}/recordings/${sessionId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        fetchLogs();
      } else {
        alert('Retry trigger failed.');
      }
    } catch (err) {
      console.error('Error retrying upload:', err);
    } finally {
      setRetrying(false);
    }
  };

  if (!isOpen) return null;

  // Step Status Determinations
  const getStepStatus = (stepName: string) => {
    const stepLogs = logs.filter((l) => l.step === stepName);
    if (stepLogs.length === 0) return 'PENDING';
    if (stepLogs.some((l) => l.status === 'FAILED')) return 'FAILED';
    if (stepLogs.some((l) => l.status === 'SUCCESS')) return 'SUCCESS';
    return 'PROCESSING';
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const uploadStatus = getStepStatus('UPLOAD');
  const transStatus = getStepStatus('TRANSCRIPTION');
  const auditStatus = getStepStatus('AI_AUDIT');

  const hasFailed = uploadStatus === 'FAILED' || transStatus === 'FAILED' || auditStatus === 'FAILED';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-display">Processing Pipeline Tracker</h3>
            <p className="text-xs text-slate-400 mt-0.5">Realtime monitoring for: <span className="text-[#C9A84C] font-semibold">{courseTitle}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Visual Step Timeline */}
          <div className="grid grid-cols-3 gap-3">
            {/* Step 1: Upload */}
            <div className={`p-3 rounded-2xl border text-center ${uploadStatus === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                uploadStatus === 'FAILED' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                  uploadStatus === 'PROCESSING' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 animate-pulse' :
                    'bg-slate-950/40 border-slate-800 text-slate-550'
              }`}>
              <Play className="mx-auto mb-2" size={18} />
              <p className="text-xs font-bold font-display">1. Drive Upload</p>
              <p className="text-[10px] mt-1 font-mono">{uploadStatus}</p>
            </div>

            {/* Step 2: Transcription */}
            <div className={`p-3 rounded-2xl border text-center ${transStatus === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                transStatus === 'FAILED' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                  transStatus === 'PROCESSING' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 animate-pulse' :
                    'bg-slate-950/40 border-slate-800 text-slate-550'
              }`}>
              <FileText className="mx-auto mb-2" size={18} />
              <p className="text-xs font-bold font-display">2. Transcription</p>
              <p className="text-[10px] mt-1 font-mono">{transStatus}</p>
            </div>

            {/* Step 3: AI Compliance Audit */}
            <div className={`p-3 rounded-2xl border text-center ${auditStatus === 'SUCCESS' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                auditStatus === 'FAILED' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                  auditStatus === 'PROCESSING' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 animate-pulse' :
                    'bg-slate-950/40 border-slate-800 text-slate-550'
              }`}>
              <Cpu className="mx-auto mb-2" size={18} />
              <p className="text-xs font-bold font-display">3. AI Compliance</p>
              <p className="text-[10px] mt-1 font-mono">{auditStatus}</p>
            </div>
          </div>

          {/* Logs Console */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Execution Logs Console</h4>
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 font-mono text-[11px] text-slate-300 min-h-[180px] max-h-[250px] overflow-y-auto space-y-2.5">
              {loading && logs.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-slate-650 italic text-center py-10">No pipeline activities initialized for this session yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3 items-start hover:bg-white/[0.02] p-1 rounded transition">
                    <span className="text-slate-600 select-none">[{formatTime(log.createdAt)}]</span>
                    <span className={`font-bold shrink-0 w-24 ${log.status === 'SUCCESS' ? 'text-emerald-400' :
                        log.status === 'FAILED' ? 'text-red-400' :
                          'text-amber-400'
                      }`}>
                      {log.step} {'->'} {log.status}
                    </span>
                    <span className="text-slate-200 break-words flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Footer Context Info */}
          {hasFailed && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-300">
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Pipeline Execution Halted</p>
                <p className="mt-0.5 text-[10px] text-red-400/80">The system encountered an error. Check the console log details above for the breakpoint explanation.</p>
              </div>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-xl transition text-[11px] disabled:opacity-50"
              >
                {retrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                <span>Retry Pipeline</span>
              </button>
            </div>
          )}

          {!hasFailed && logs.length > 0 && logs[logs.length - 1]?.status === 'SUCCESS' && logs[logs.length - 1]?.step === 'AI_AUDIT' && (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-300">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold">Pipeline Executed Successfully</p>
                <p className="mt-0.5 text-[10px] text-emerald-400/80">Google Drive backup copy saved, transcription indexed, and AI auditing scorecard published.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
