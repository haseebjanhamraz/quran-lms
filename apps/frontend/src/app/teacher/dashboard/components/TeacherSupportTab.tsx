'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  X,
  ChevronRight,
  ShieldAlert,
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
  createdAt: string;
  updatedAt: string;
  comments?: TicketComment[];
}

export default function TeacherSupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('SCHEDULE');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/support/tickets`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.tickets || [];
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
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await apiFetch(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subject.trim(),
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });

      if (res.ok) {
        setFeedback({ type: 'success', text: 'Support ticket submitted to admin successfully!' });
        setSubject('');
        setDescription('');
        setIsModalOpen(false);
        fetchTickets();
      } else {
        const errData = await res.json();
        const errorMsg = Array.isArray(errData.message)
          ? errData.message.join(', ')
          : errData.message || 'Failed to create ticket';
        setFeedback({ type: 'error', text: errorMsg });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error creating ticket' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    const ticketId = selectedTicket.id || selectedTicket._id;

    try {
      setReplying(true);
      const res = await apiFetch(`${API_URL}/support/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: replyText.trim(),
          isInternal: false,
        }),
      });

      if (res.ok) {
        setReplyText('');
        // Refresh ticket details
        const updatedRes = await apiFetch(`${API_URL}/support/tickets/${ticketId}`);
        if (updatedRes.ok) {
          const updatedTicket = await updatedRes.json();
          setSelectedTicket(updatedTicket);
        }
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
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
    <div className="space-y-6 animate-fadeIn">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/20">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-foreground">
              Teacher Support &amp; Help Desk
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Need assistance with your classes, schedule adjustments, compensation, or students? Create a support ticket for immediate admin resolution.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFeedback(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition shrink-0"
        >
          <Plus size={15} />
          <span>New Support Ticket</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-xs font-semibold">{feedback.text}</p>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold font-display text-foreground mb-4">
          My Support Requests ({tickets.length})
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 className="animate-spin h-6 w-6" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <HelpCircle className="mx-auto h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs font-semibold">No support tickets submitted yet.</p>
            <p className="text-[11px] opacity-70">
              Click &quot;New Support Ticket&quot; above if you need assistance.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {tickets.map((ticket) => {
              const ticketId = ticket.id || ticket._id;
              return (
                <div
                  key={ticketId}
                  onClick={() => setSelectedTicket(ticket)}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 px-3 rounded-2xl transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-muted-foreground">
                        #{ticket.ticketNumber || ticketId?.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(
                          ticket.status,
                        )}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getPriorityBadge(
                          ticket.priority,
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border uppercase">
                        {ticket.category}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {ticket.subject || ticket.title}
                    </h4>

                    <p className="text-xs text-muted-foreground truncate max-w-xl">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <span className="text-[11px] text-muted-foreground font-mono block">
                        {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {ticket.comments && ticket.comments.length > 0 && (
                        <span className="text-[10px] text-primary font-medium flex items-center gap-1 justify-end">
                          <MessageSquare size={11} /> {ticket.comments.length}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Create Support Ticket</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Schedule change request for student Omar"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                  >
                    <option value="SCHEDULE">Schedule &amp; Timetable</option>
                    <option value="TECHNICAL">Technical / Classroom</option>
                    <option value="ACADEMIC">Academic &amp; Curriculum</option>
                    <option value="PAYROLL">Compensation / Payroll</option>
                    <option value="GENERAL">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the issue or request clearly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Conversation / Thread Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative border border-border bg-card max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    #{selectedTicket.ticketNumber || selectedTicket.id?.slice(-6).toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusBadge(
                      selectedTicket.status,
                    )}`}
                  >
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-border uppercase">
                    {selectedTicket.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{selectedTicket.subject || selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conversation Body */}
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              {/* Initial Issue */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span className="font-bold text-foreground">You (Original Ticket)</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Comments Thread */}
              {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Responses &amp; Conversation
                  </h4>
                  {selectedTicket.comments.map((comment, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border ${
                        comment.user?.role === 'TEACHER'
                          ? 'bg-muted/20 border-border ml-4'
                          : 'bg-primary/5 border-primary/20 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono mb-1">
                        <span className="font-bold text-foreground">
                          {comment.user?.name || 'Administrator'} ({comment.user?.role || 'Staff'})
                        </span>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  No replies yet. An administrator will respond shortly.
                </div>
              )}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply to admin..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
              />
              <button
                type="submit"
                disabled={replying || !replyText.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {replying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Reply</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
