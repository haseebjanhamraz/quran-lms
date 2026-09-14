'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Send,
  Loader2,
  RefreshCw,
  XCircle,
  Shield,
  ChevronRight,
  Filter,
  GraduationCap,
  BookUser,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

interface TicketComment {
  id?: string;
  comment: string;
  user?: { name: string; role: string };
  isInternal?: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  _id?: string;
  ticketNumber?: string;
  title?: string;
  subject?: string;
  description: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  submitterRole?: string;
  isTeacherSupport?: boolean;
  user?: { name: string; email: string; role: string };
  assignedTo?: { name: string };
  createdAt: string;
  updatedAt: string;
  comments?: TicketComment[];
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSource, setFilterSource] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let queryParams: string[] = [];
      if (filterStatus !== 'ALL') queryParams.push(`status=${filterStatus}`);
      if (filterSource === 'TEACHER') queryParams.push(`isTeacherSupport=true`);

      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await apiFetch(`${API_URL}/support/tickets${queryStr}`);
      if (res.ok) {
        const data = await res.json();
        const list: SupportTicket[] = Array.isArray(data) ? data : data?.tickets || [];
        setTickets(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterSource]);

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    const ticketId = ticket.id || ticket._id;
    try {
      const res = await apiFetch(`${API_URL}/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    const ticketId = selectedTicket.id || selectedTicket._id;

    try {
      setSubmittingComment(true);
      const res = await apiFetch(`${API_URL}/support/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment.trim(),
          isInternal: isInternalComment,
        }),
      });

      if (res.ok) {
        setNewComment('');
        setIsInternalComment(false);
        const updatedRes = await apiFetch(`${API_URL}/support/tickets/${ticketId}`);
        if (updatedRes.ok) {
          const updated = await updatedRes.json();
          setComments(updated.comments || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    const ticketId = selectedTicket.id || selectedTicket._id;

    try {
      setStatusUpdating(true);
      const res = await apiFetch(`${API_URL}/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
        setTickets((prev) =>
          prev.map((t) => ((t.id || t._id) === ticketId ? { ...t, status: newStatus as any } : t)),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/15 text-blue-600 border-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-600 border-amber-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20';
      case 'CLOSED':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-600 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-600 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/20">
                <HelpCircle className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
                Support Tickets &amp; Help Desk
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage queries and requests submitted by teachers, parents, and students.
            </p>
          </div>

          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border self-start sm:self-auto transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
          {/* Submitter Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Source:
            </span>
            <div className="flex bg-muted p-1 rounded-xl border border-border text-xs font-semibold">
              <button
                onClick={() => setFilterSource('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterSource === 'ALL'
                    ? 'bg-card text-foreground shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Tickets
              </button>
              <button
                onClick={() => setFilterSource('TEACHER')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  filterSource === 'TEACHER'
                    ? 'bg-emerald-500/15 text-emerald-600 shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookUser size={13} />
                <span>Teachers Support</span>
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tickets Column */}
          <div className="lg:col-span-6 bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold font-display text-foreground mb-3">
              Tickets List ({tickets.length})
            </h3>

            {loading ? (
              <div className="py-16 flex justify-center text-muted-foreground">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                No tickets matching criteria.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {tickets.map((t) => {
                  const tId = t.id || t._id;
                  const isSelected = (selectedTicket?.id || selectedTicket?._id) === tId;
                  const isTeacher = t.isTeacherSupport || t.submitterRole === 'TEACHER';

                  return (
                    <div
                      key={tId}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/40 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-muted-foreground">
                            #{t.ticketNumber || tId?.slice(-6).toUpperCase()}
                          </span>
                          {isTeacher ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                              Teacher
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/20">
                              Student / Parent
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusBadge(
                              t.status,
                            )}`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-foreground truncate">{t.subject || t.title}</h4>

                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.user?.name || 'User'} &bull; {t.category}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          {new Date(t.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <ChevronRight size={14} className="text-muted-foreground ml-auto mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket Detail & Replies Column */}
          <div className="lg:col-span-6 bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
            {selectedTicket ? (
              <div className="space-y-4">
                {/* Header & Status Change */}
                <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        #{selectedTicket.ticketNumber || selectedTicket.id?.slice(-6).toUpperCase()}
                      </span>
                      {selectedTicket.isTeacherSupport || selectedTicket.submitterRole === 'TEACHER' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                          Teacher Ticket
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/20">
                          Student Ticket
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getPriorityBadge(
                          selectedTicket.priority,
                        )}`}
                      >
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{selectedTicket.subject || selectedTicket.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted by <strong className="text-foreground">{selectedTicket.user?.name || 'User'}</strong> ({selectedTicket.user?.email || 'N/A'})
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="shrink-0">
                    <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase">
                      Update Status
                    </label>
                    <select
                      value={selectedTicket.status}
                      disabled={statusUpdating}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Original Message
                  </span>
                  <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Comments / Replies */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Conversation &amp; Notes ({comments.length})
                  </h4>

                  <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No responses yet. Send a response below.
                      </p>
                    ) : (
                      comments.map((c, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-2xl border ${
                            c.isInternal
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : c.user?.role === 'TEACHER' || c.user?.role === 'STUDENT'
                              ? 'bg-muted/30 border-border'
                              : 'bg-primary/10 border-primary/20'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1 font-mono">
                            <span className="font-bold text-foreground">
                              {c.user?.name || 'Staff'} ({c.user?.role || 'ADMIN'})
                              {c.isInternal && (
                                <span className="ml-2 text-amber-600 font-bold uppercase text-[9px]">
                                  [Internal Staff Note]
                                </span>
                              )}
                            </span>
                            <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-foreground whitespace-pre-line">{c.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Reply Form */}
                <form onSubmit={handleAddComment} className="space-y-2 pt-3 border-t border-border">
                  <textarea
                    rows={3}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a response or internal staff note..."
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-border text-primary"
                      />
                      <span>Internal staff note (hidden from teacher/student)</span>
                    </label>

                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow hover:bg-primary/90 transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {submittingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>Send Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="py-24 text-center text-muted-foreground">
                <HelpCircle className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs font-semibold">Select a ticket to view conversation and reply</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
