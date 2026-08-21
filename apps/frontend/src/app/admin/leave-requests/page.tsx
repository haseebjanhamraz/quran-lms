'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  PlaneTakeoff, CheckCircle2, XCircle, Clock, Search, Filter,
  RefreshCw, AlertCircle, Check, X, Sliders, User, MessageSquare, Loader2
} from 'lucide-react';
import Image from 'next/image';
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
  teacher?: {
    id: string;
    _id?: string;
    name: string;
    email: string;
    profilePicture?: string;
    timezone?: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

interface LeaveStats {
  total: number;
  pending: number;
  approvedThisMonth: number;
  rejected: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const TYPE_COLORS: Record<string, string> = {
  SICK: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  CASUAL: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  ANNUAL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  OTHER: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function AdminLeaveRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Dialog state
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequestItem | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Quota Adjust Modal State
  const [quotaModalTeacher, setQuotaModalTeacher] = useState<any | null>(null);
  const [teacherBalance, setTeacherBalance] = useState<any | null>(null);
  const [sickQuota, setSickQuota] = useState<number>(10);
  const [casualQuota, setCasualQuota] = useState<number>(12);
  const [annualQuota, setAnnualQuota] = useState<number>(15);
  const [otherQuota, setOtherQuota] = useState<number>(5);
  const [savingQuota, setSavingQuota] = useState(false);

  const fetchLeavesAndStats = useCallback(async () => {
    try {
      setLoading(true);
      const [leavesRes, statsRes] = await Promise.all([
        apiFetch(`${API_URL}/leave`),
        apiFetch(`${API_URL}/leave/stats`),
      ]);

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch admin leaves:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Real-time WebSocket sync
  useWebSocket({
    onMessage: (msg) => {
      if (msg.event === 'leave_update' || msg.event === 'new_leave_request') {
        fetchLeavesAndStats();
      }
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchLeavesAndStats();
  }, [user, authLoading, fetchLeavesAndStats, router]);

  // Handle Approve / Reject Submission
  const handleConfirmAction = async () => {
    if (!selectedLeave || !actionType) return;
    const leaveId = selectedLeave._id || selectedLeave.id;
    if (!leaveId) return;

    setActionLoading(true);
    try {
      const endpoint = actionType === 'APPROVE'
        ? `${API_URL}/leave/${leaveId}/approve`
        : `${API_URL}/leave/${leaveId}/reject`;

      const res = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ adminRemarks: adminRemarks.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to ${actionType.toLowerCase()} leave request.`);
      }

      setActionType(null);
      setSelectedLeave(null);
      setAdminRemarks('');
      await fetchLeavesAndStats();
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Quota Modal for a Teacher
  const handleOpenQuotaModal = async (teacher: any) => {
    const teacherId = teacher._id || teacher.id;
    if (!teacherId) return;
    setQuotaModalTeacher(teacher);
    try {
      const res = await apiFetch(`${API_URL}/leave/teacher/${teacherId}/balance`);
      if (res.ok) {
        const data = await res.json();
        setTeacherBalance(data);
        setSickQuota(data.allocated?.sick ?? 10);
        setCasualQuota(data.allocated?.casual ?? 12);
        setAnnualQuota(data.allocated?.annual ?? 15);
        setOtherQuota(data.allocated?.other ?? 5);
      }
    } catch (_) {}
  };

  const handleSaveQuotas = async () => {
    const teacherId = quotaModalTeacher?._id || quotaModalTeacher?.id;
    if (!teacherId) return;

    setSavingQuota(true);
    try {
      const res = await apiFetch(`${API_URL}/leave/teacher/${teacherId}/balance`, {
        method: 'PUT',
        body: JSON.stringify({
          sick: Number(sickQuota),
          casual: Number(casualQuota),
          annual: Number(annualQuota),
          other: Number(otherQuota),
        }),
      });

      if (res.ok) {
        setQuotaModalTeacher(null);
        await fetchLeavesAndStats();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update leave quotas.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save quotas.');
    } finally {
      setSavingQuota(false);
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter !== 'ALL' && leave.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const teacherName = leave.teacher?.name?.toLowerCase() || '';
      const teacherEmail = leave.teacher?.email?.toLowerCase() || '';
      const reason = leave.reason?.toLowerCase() || '';
      if (!teacherName.includes(q) && !teacherEmail.includes(q) && !reason.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
              Teacher Leave Management
            </h1>
            {stats && stats.pending > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                {stats.pending} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review, approve or reject leave requests with real-time sync and manage annual quotas.
          </p>
        </div>

        <button
          onClick={fetchLeavesAndStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted transition-all shrink-0 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Submissions</p>
          <p className="text-3xl font-black text-foreground mt-1">{stats?.total ?? leaves.length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">All-time applications</p>
        </div>

        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-400">
            <p className="text-xs font-bold uppercase tracking-wider">Pending Action</p>
            <Clock size={16} />
          </div>
          <p className="text-3xl font-black text-amber-400 mt-1">{stats?.pending ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Awaiting decision</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <p className="text-xs font-bold uppercase tracking-wider">Approved this Month</p>
            <CheckCircle2 size={16} />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-1">{stats?.approvedThisMonth ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Current billing cycle</p>
        </div>

        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-400">
            <p className="text-xs font-bold uppercase tracking-wider">Rejected</p>
            <XCircle size={16} />
          </div>
          <p className="text-3xl font-black text-rose-400 mt-1">{stats?.rejected ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Declined requests</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm space-y-6">
        
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by teacher name, email, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 bg-muted/40 border border-border rounded-xl overflow-x-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading leave requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border/80 rounded-2xl">
            <PlaneTakeoff className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-foreground">No leave requests found.</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider bg-muted/30">
                  <th className="p-3.5 font-bold">Teacher</th>
                  <th className="p-3.5 font-bold">Type</th>
                  <th className="p-3.5 font-bold">Duration & Dates</th>
                  <th className="p-3.5 font-bold">Reason</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Review Info</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeaves.map((leave) => {
                  const isPending = leave.status === 'PENDING';
                  const isApproved = leave.status === 'APPROVED';
                  const isRejected = leave.status === 'REJECTED';

                  return (
                    <tr key={leave._id || leave.id} className="hover:bg-muted/20 transition-colors">
                      {/* Teacher Profile */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative">
                            {leave.teacher?.profilePicture ? (
                              <Image src={leave.teacher.profilePicture} alt="" fill className="object-cover" />
                            ) : (
                              leave.teacher?.name ? leave.teacher.name.charAt(0).toUpperCase() : 'T'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{leave.teacher?.name || 'Unknown Teacher'}</p>
                            <p className="text-[11px] text-muted-foreground">{leave.teacher?.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${TYPE_COLORS[leave.leaveType] || 'bg-muted text-muted-foreground'}`}>
                          {leave.leaveType}
                        </span>
                      </td>

                      {/* Dates & Duration */}
                      <td className="p-3.5 font-mono">
                        <p className="font-bold text-foreground">
                          {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &rarr; {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Reason */}
                      <td className="p-3.5 text-muted-foreground max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock size={12} /> Pending
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
                        {leave.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Review Remarks */}
                      <td className="p-3.5 text-muted-foreground text-[11px] max-w-xs truncate">
                        {leave.adminRemarks ? (
                          <span className="italic">&ldquo;{leave.adminRemarks}&rdquo;</span>
                        ) : leave.reviewer ? (
                          <span>By {leave.reviewer.name}</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setActionType('APPROVE');
                                  setAdminRemarks('');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm"
                              >
                                <Check size={13} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setActionType('REJECT');
                                  setAdminRemarks('');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all shadow-sm"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenQuotaModal(leave.teacher)}
                              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                              title="View / Adjust Teacher Quotas"
                            >
                              <Sliders size={12} className="inline mr-1" />
                              Quotas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Reject Dialog */}
      {actionType && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {actionType === 'APPROVE' ? (
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={18} />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <XCircle size={18} />
                  </div>
                )}
                <h3 className="text-lg font-display font-bold text-foreground">
                  {actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
              </div>
              <button
                onClick={() => setActionType(null)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-muted/20 p-3.5 rounded-2xl border border-border/60">
              <p><strong className="text-foreground">Teacher:</strong> {selectedLeave.teacher?.name}</p>
              <p><strong className="text-foreground">Type:</strong> {selectedLeave.leaveType} ({selectedLeave.totalDays} day{selectedLeave.totalDays !== 1 ? 's' : ''})</p>
              <p><strong className="text-foreground">Dates:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()} &rarr; {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
              <p><strong className="text-foreground">Reason:</strong> &ldquo;{selectedLeave.reason}&rdquo;</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Admin Remarks (Optional)
              </label>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter remarks or instructions for the teacher..."
                className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                  actionType === 'APPROVE' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {actionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : actionType === 'APPROVE' ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
                <span>{actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Teacher Quotas Modal */}
      {quotaModalTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-primary" />
                <h3 className="text-lg font-display font-bold text-foreground">
                  Leave Quotas for {quotaModalTeacher.name}
                </h3>
              </div>
              <button
                onClick={() => setQuotaModalTeacher(null)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Adjust annual allocated leave days for the year {new Date().getFullYear()}.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase">Sick Leave</label>
                <input
                  type="number"
                  min="0"
                  value={sickQuota}
                  onChange={(e) => setSickQuota(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase">Casual Leave</label>
                <input
                  type="number"
                  min="0"
                  value={casualQuota}
                  onChange={(e) => setCasualQuota(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase">Annual Leave</label>
                <input
                  type="number"
                  min="0"
                  value={annualQuota}
                  onChange={(e) => setAnnualQuota(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1 uppercase">Other / Special</label>
                <input
                  type="number"
                  min="0"
                  value={otherQuota}
                  onChange={(e) => setOtherQuota(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setQuotaModalTeacher(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingQuota}
                onClick={handleSaveQuotas}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {savingQuota ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Quotas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
