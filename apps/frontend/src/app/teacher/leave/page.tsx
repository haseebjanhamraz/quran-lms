'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  PlaneTakeoff, Plus, Calendar, Clock, AlertCircle, CheckCircle2,
  XCircle, Ban, ArrowLeft, Loader2, RefreshCw, MessageSquare, Info
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import { apiFetch } from '@/utils/apiFetch';
import { useWebSocket } from '@/hooks/useWebSocket';

interface LeaveRequestItem {
  id?: string;
  _id?: string;
  teacherId: string;
  leaveType: 'SICK' | 'CASUAL' | 'ANNUAL' | 'OTHER';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: any;
  reviewedAt?: string;
  adminRemarks?: string;
  createdAt: string;
  reviewer?: { name: string; email?: string };
}

interface LeaveBalanceInfo {
  year: number;
  allocated: { sick: number; casual: number; annual: number; other: number };
  used: { sick: number; casual: number; annual: number; other: number };
  remaining: { sick: number; casual: number; annual: number; other: number };
  summary: { totalAllocated: number; totalUsed: number; totalRemaining: number };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const TYPE_COLORS: Record<string, string> = {
  SICK: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  CASUAL: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  ANNUAL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  OTHER: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function TeacherLeavePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<'SICK' | 'CASUAL' | 'ANNUAL' | 'OTHER'>('CASUAL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const [leavesRes, balanceRes] = await Promise.all([
        apiFetch(`${API_URL}/leave/my`),
        apiFetch(`${API_URL}/leave/my/balance`),
      ]);

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData);
      }
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }
    } catch (err) {
      console.error('Failed to fetch teacher leaves:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Real-time WebSocket updates
  useWebSocket({
    onMessage: (msg) => {
      if (msg.event === 'leave_status_changed' || msg.event === 'leave_update') {
        const action = msg.action || msg.payload?.action;
        if (action === 'LEAVE_APPROVED') {
          setRealtimeNotice('Your leave request was APPROVED by the administration.');
        } else if (action === 'LEAVE_REJECTED') {
          setRealtimeNotice('Your leave request was REJECTED by the administration.');
        }
        fetchLeaves();
      }
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchLeaves();
  }, [user, authLoading, fetchLeaves, router]);

  // Calculated Days
  const calculatedDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setFormError('Please provide a reason with at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_URL}/leave`, {
        method: 'POST',
        body: JSON.stringify({
          leaveType,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit leave request.');
      }

      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('CASUAL');
      await fetchLeaves();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending leave request?')) return;
    setCancellingId(id);
    try {
      const res = await apiFetch(`${API_URL}/leave/${id}/cancel`, {
        method: 'PUT',
      });
      if (res.ok) {
        await fetchLeaves();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to cancel leave request.');
      }
    } catch (err) {
      console.error('Error cancelling leave:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (filterStatus === 'ALL') return true;
    return l.status === filterStatus;
  });

  const remainingForSelectedType = balance?.remaining?.[leaveType.toLowerCase() as keyof typeof balance.remaining] ?? 0;

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-header/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <PlaneTakeoff size={20} className="text-primary" />
              <span className="font-display text-base font-bold text-foreground">Teacher Leave Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationsDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 animate-fadeIn">
        
        {/* Real-time Notice Banner */}
        {realtimeNotice && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/15 border border-primary/30 text-xs font-bold text-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" />
              <span>{realtimeNotice}</span>
            </div>
            <button
              onClick={() => setRealtimeNotice(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              &times; Dismiss
            </button>
          </div>
        )}

        {/* Header CTA & Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              My Leave Requests & Balances
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Apply for leaves, track remaining annual balance, and receive realtime approval updates.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 shrink-0 self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Leave Balance Quotas Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Sick Leave</span>
              <span className="text-[11px] font-mono font-bold">
                {balance?.used?.sick ?? 0}/{balance?.allocated?.sick ?? 10} used
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">{balance?.remaining?.sick ?? 10}</p>
            <p className="text-xs text-muted-foreground mt-1">Days Remaining</p>
          </div>

          <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Casual Leave</span>
              <span className="text-[11px] font-mono font-bold">
                {balance?.used?.casual ?? 0}/{balance?.allocated?.casual ?? 12} used
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">{balance?.remaining?.casual ?? 12}</p>
            <p className="text-xs text-muted-foreground mt-1">Days Remaining</p>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Annual Leave</span>
              <span className="text-[11px] font-mono font-bold">
                {balance?.used?.annual ?? 0}/{balance?.allocated?.annual ?? 15} used
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">{balance?.remaining?.annual ?? 15}</p>
            <p className="text-xs text-muted-foreground mt-1">Days Remaining</p>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Other / Special</span>
              <span className="text-[11px] font-mono font-bold">
                {balance?.used?.other ?? 0}/{balance?.allocated?.other ?? 5} used
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">{balance?.remaining?.other ?? 5}</p>
            <p className="text-xs text-muted-foreground mt-1">Days Remaining</p>
          </div>

          <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/15 p-5 backdrop-blur-sm shadow-md col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Total Quota</span>
              <span className="text-[11px] font-mono font-bold">{balance?.year ?? new Date().getFullYear()}</span>
            </div>
            <p className="text-3xl font-black text-foreground">{balance?.summary?.totalRemaining ?? 42}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Days Available</p>
          </div>
        </div>

        {/* Requests Filter & Table Section */}
        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-bold text-foreground">
                Leave Applications History
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                {leaves.length} Total
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-muted/40 border border-border rounded-xl overflow-x-auto">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    filterStatus === st
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading your leave records...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border/80 rounded-2xl">
              <PlaneTakeoff className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-foreground">No leave applications found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filterStatus === 'ALL' ? 'You have not submitted any leave requests yet.' : `No ${filterStatus.toLowerCase()} requests.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider bg-muted/30">
                    <th className="p-3.5 font-bold">Leave Type</th>
                    <th className="p-3.5 font-bold">Date Range</th>
                    <th className="p-3.5 font-bold">Days</th>
                    <th className="p-3.5 font-bold">Reason</th>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold">Admin Remarks</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLeaves.map((leave) => {
                    const isPending = leave.status === 'PENDING';
                    const isApproved = leave.status === 'APPROVED';
                    const isRejected = leave.status === 'REJECTED';
                    const isCancelled = leave.status === 'CANCELLED';

                    return (
                      <tr key={leave._id || leave.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${TYPE_COLORS[leave.leaveType] || 'bg-muted text-muted-foreground'}`}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-foreground font-semibold whitespace-nowrap">
                          {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &rarr; {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-3.5 font-bold text-foreground">
                          {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                        </td>
                        <td className="p-3.5 text-muted-foreground max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                              <Clock size={12} /> Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={12} /> Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">
                              <Ban size={12} /> Cancelled
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground text-[11px] italic max-w-xs truncate">
                          {leave.adminRemarks || (isApproved ? 'Approved by Admin' : isRejected ? 'Declined by Admin' : '—')}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {isPending && (
                            <button
                              onClick={() => handleCancelLeave(leave._id || leave.id || '')}
                              disabled={cancellingId === (leave._id || leave.id)}
                              className="px-3 py-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-all disabled:opacity-50"
                            >
                              {cancellingId === (leave._id || leave.id) ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Leave Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <PlaneTakeoff size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">Apply for Leave</h3>
                  <p className="text-xs text-muted-foreground">Submit a leave request for administration approval</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Leave Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['CASUAL', 'SICK', 'ANNUAL', 'OTHER'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLeaveType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        leaveType === type
                          ? 'border-primary bg-primary/15 text-primary shadow-sm'
                          : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <span>Remaining in {leaveType}:</span>
                  <span className="font-bold font-mono text-primary">{remainingForSelectedType} day(s)</span>
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Calculated duration helper */}
              {calculatedDays > 0 && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs flex items-center justify-between text-foreground">
                  <span className="text-muted-foreground">Total Duration:</span>
                  <span className="font-extrabold text-primary font-mono">{calculatedDays} day(s)</span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting leave..."
                  className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <PlaneTakeoff size={14} />}
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
