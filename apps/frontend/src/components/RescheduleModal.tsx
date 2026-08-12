'use client';

import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    course?: { title: string };
    scheduledAt: string;
    durationMinutes: number;
  } | null;
  onSuccess?: () => void;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: RescheduleModalProps) {
  const [requestedTime, setRequestedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  if (!isOpen || !session) return null;

  const now = new Date();
  const scheduledDate = new Date(session.scheduledAt);
  const tenMinutesMs = 10 * 60 * 1000;
  const isTooLateToReschedule = scheduledDate.getTime() - now.getTime() < tenMinutesMs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedTime) {
      setError('Please select a proposed new class time.');
      return;
    }

    const proposedDate = new Date(requestedTime);
    if (proposedDate.getTime() <= Date.now()) {
      setError('Proposed time must be in the future.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(`${API_URL}/reschedule-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          requestedTime: proposedDate.toISOString(),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit reschedule request.');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Error submitting request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-foreground">Request Advance Class Time</h3>
            <p className="text-xs text-muted-foreground">{session.course?.title || 'Class Session'}</p>
          </div>
        </div>

        {/* Current Class Info */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 mb-4 text-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Currently Scheduled:</span>
            <span className="font-semibold text-foreground font-mono">
              {new Date(session.scheduledAt).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Duration:</span>
            <span className="font-semibold text-foreground">{session.durationMinutes} minutes</span>
          </div>
        </div>

        {/* Cutoff Warning */}
        {isTooLateToReschedule ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs space-y-2 mb-4">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle size={16} />
              <span>Reschedule Cutoff Reached</span>
            </div>
            <p>
              Advance class requests must be submitted at least 10 minutes before the class start time. You can no longer request a change for this session.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle size={15} />
                <span>Reschedule request submitted to Admin for approval!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Proposed New Date & Time
              </label>
              <input
                type="datetime-local"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                E.g. If class is at 10:00 and you want to take it at 12:00 or 08:00 instead.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Reason for Reschedule (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g. Family emergency, travel plans..."
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
