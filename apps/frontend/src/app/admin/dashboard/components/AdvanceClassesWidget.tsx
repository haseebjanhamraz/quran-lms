'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  FastForward,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { apiFetch } from '@/utils/apiFetch';
import { formatPKTTime, formatPKTDate } from '@/utils/islamabadTime';

interface RescheduleRequestItem {
  id: string;
  _id?: string;
  session?: {
    id: string;
    course?: { title: string; type: string };
    teacher?: { name: string; email: string };
    scheduledAt: string;
    durationMinutes: number;
  };
  student?: {
    id: string;
    name: string;
    email: string;
  };
  originalScheduledAt: string;
  requestedTime: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function AdvanceClassesWidget() {
  const [requests, setRequests] = useState<RescheduleRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'PENDING' | 'ALL'>('PENDING');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/reschedule-requests`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      }
    } catch (err) {
      console.error('Failed to load advance class requests:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchRequests();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const displayedRequests = activeFilter === 'PENDING' ? pendingRequests : requests;

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoadingId(requestId);
      const res = await apiFetch(`${API_URL}/reschedule-requests/${requestId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: `Processed via Admin Dashboard` }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${action} request.`);
      }

      toast.success(`Advance class request ${action}d successfully!`);
      await fetchRequests();
    } catch (err: any) {
      toast.error(err.message || `Error executing ${action}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/80 bg-card/80 p-6 backdrop-blur-xl shadow-lg relative overflow-hidden">
      {/* Ambient background glow if pending requests exist */}
      {pendingRequests.length > 0 && (
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${pendingRequests.length > 0 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 blink-pending' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            <FastForward className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Advance Classes Management
              </h2>
              {pendingRequests.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30 blink-pending">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-blink-dot" />
                  {pendingRequests.length} Pending
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  All Clear
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve upcoming class advance requests submitted by students
            </p>
          </div>
        </div>

        {/* Filter buttons & refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/40 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('PENDING')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'PENDING'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All History
            </button>
          </div>

          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/40"
            title="Refresh requests"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          <Link
            href="/admin/reschedule-requests"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
          >
            <span>Full Portal</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading && requests.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-mono">Loading advance requests...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="py-10 text-center space-y-2 border border-dashed border-border/60 rounded-2xl bg-muted/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto" />
          <p className="text-sm font-semibold text-foreground">
            {activeFilter === 'PENDING' ? 'No pending advance requests' : 'No requests recorded'}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeFilter === 'PENDING'
              ? 'When students submit an advance class request, it will appear here with live notification effects.'
              : 'All historical advance and reschedule requests will show here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course & Teacher</th>
                <th className="py-3 px-4">Original Time</th>
                <th className="py-3 px-4">Requested Advance Time</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {displayedRequests.map((req) => {
                const reqId = req.id || req._id || '';
                const isPending = req.status === 'PENDING';
                const isActionBusy = actionLoadingId === reqId;

                return (
                  <tr
                    key={reqId}
                    className={`transition-colors hover:bg-muted/30 ${
                      isPending ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                    }`}
                  >
                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                          {req.student?.name ? req.student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-xs leading-tight">
                            {req.student?.name || 'Assigned Student'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{req.student?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Course & Teacher */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">
                        {req.session?.course?.title || 'Quranic Course'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Teacher: {req.session?.teacher?.name || 'Assigned Teacher'}
                      </p>
                    </td>

                    {/* Original Time */}
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      <div>{formatPKTDate(req.originalScheduledAt || req.session?.scheduledAt || '')}</div>
                      <div className="text-[10px]">{formatPKTTime(req.originalScheduledAt || req.session?.scheduledAt || '')} PKT</div>
                    </td>

                    {/* Requested Advance Time with Blinking effect if pending */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {isPending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-blink-dot shrink-0" />}
                        <span className={`font-bold ${isPending ? 'text-amber-500 dark:text-amber-400' : 'text-foreground'}`}>
                          {formatPKTDate(req.requestedTime)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        {formatPKTTime(req.requestedTime)} PKT
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="text-xs text-foreground/90 truncate" title={req.reason || 'No specific reason provided'}>
                        {req.reason || <span className="text-muted-foreground italic">No reason provided</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30 blink-pending">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-blink-dot" />
                          PENDING
                        </span>
                      ) : req.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={11} />
                          APPROVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <XCircle size={11} />
                          REJECTED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleAction(reqId, 'approve')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                            title="Approve Advance Class"
                          >
                            {isActionBusy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={isActionBusy}
                            onClick={() => handleAction(reqId, 'reject')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
                            title="Reject Request"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px] font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
