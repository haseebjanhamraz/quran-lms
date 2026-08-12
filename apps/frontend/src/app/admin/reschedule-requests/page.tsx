'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

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
    profilePicture?: string;
  };
  originalScheduledAt: string;
  requestedTime: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: { name: string };
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
}

export default function AdminRescheduleRequestsPage() {
  const [requests, setRequests] = useState<RescheduleRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequestItem | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const query = filterStatus !== 'ALL' ? `?status=${filterStatus}` : '';
      const res = await apiFetch(`${API_URL}/reschedule-requests${query}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching reschedule requests:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      setError(null);

      const res = await apiFetch(`${API_URL}/reschedule-requests/${requestId}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${action} request.`);
      }

      setSelectedRequest(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      setError(err.message || `Error executing ${action}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2.5">
            <Calendar className="text-brand h-7 w-7" />
            <span>Advance Class Reschedule Requests</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve student requests to reschedule class sessions to advance times.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequests}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === status
                ? 'bg-brand text-brand-foreground shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {status} {status === 'PENDING' && pendingCount > 0 && `(${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Main Request Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-brand mb-2" />
          <p className="text-xs">Loading reschedule requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-card/40 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-foreground">No Reschedule Requests Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            No student advance class requests match the selected status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => {
            const reqId = req.id || req._id || '';
            return (
              <div
                key={reqId}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status & Date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : req.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                      }`}
                    >
                      {req.status}
                    </span>

                    <span className="text-[11px] text-muted-foreground font-mono">
                      Requested: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                    <div className="h-9 w-9 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-sm shrink-0">
                      {req.student?.name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{req.student?.name || 'Student'}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{req.student?.email}</p>
                    </div>
                  </div>

                  {/* Course / Teacher Info */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                      <BookOpen size={14} className="text-brand shrink-0" />
                      <span>{req.session?.course?.title || 'Class Session'}</span>
                    </div>
                    {req.session?.teacher && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User size={13} className="shrink-0" />
                        <span>Teacher: {req.session.teacher.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Time Comparison */}
                  <div className="p-3 rounded-xl bg-background border border-border/60 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Original Time:</span>
                      <span className="line-through text-red-400">
                        {new Date(req.originalScheduledAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-emerald-500">
                      <span>Requested New:</span>
                      <span>
                        {new Date(req.requestedTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  {req.reason && (
                    <div className="p-2.5 rounded-xl bg-muted/30 text-[11px] text-muted-foreground italic flex items-start gap-1.5">
                      <MessageSquare size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                      <span>"{req.reason}"</span>
                    </div>
                  )}

                  {/* Admin Note if reviewed */}
                  {req.adminNote && (
                    <div className="p-2 rounded-lg bg-amber-500/10 text-[11px] text-amber-500">
                      <strong>Admin Note:</strong> {req.adminNote}
                    </div>
                  )}
                </div>

                {/* Actions for Pending */}
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-4 border-t border-border mt-3">
                    <button
                      onClick={() => handleReview(reqId, 'reject')}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleReview(reqId, 'approve')}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve & Set</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
