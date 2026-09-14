'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  X,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Loader2,
  LifeBuoy,
  Send,
  ArrowLeft,
  ChevronRight,
  User,
  RotateCcw,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export interface TicketComment {
  id?: string;
  _id?: string;
  comment: string;
  commentByName?: string;
  user?: { name: string; role: string };
  createdAt: string;
  isInternal?: boolean;
}

export interface SupportTicket {
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
  raisedByName?: string;
  createdAt: string;
  updatedAt?: string;
  comments?: TicketComment[];
}

interface SupportInboxProps {
  variant?: 'default' | 'navbar';
}

export default function SupportInbox({ variant = 'navbar' }: SupportInboxProps) {
  const { user } = useAuth() as any;
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Comments & Reply State for Targeted Ticket
  const [ticketComments, setTicketComments] = useState<TicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Quick Ticket creation form inside drawer
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('SCHEDULE');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleOpen = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setSelectedTicket(null);
      setShowCreateForm(false);
    }, 260);
  };

  // Lock background scrolling while drawer is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateForm) {
          setShowCreateForm(false);
        } else if (selectedTicket) {
          setSelectedTicket(null);
        } else if (isOpen) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCreateForm, selectedTicket]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/support/tickets`);
      if (res.ok) {
        const data = await res.json();
        const list: SupportTicket[] = Array.isArray(data) ? data : data?.tickets || [];
        setTickets(list);
        const openOrActive = list.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
        setActiveCount(openOrActive);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Target a specific ticket by clicking or external trigger
  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowCreateForm(false);
    setReplyText('');
    const ticketId = ticket.id || ticket._id;
    if (!ticketId) return;

    try {
      setLoadingComments(true);
      const res = await apiFetch(`${API_URL}/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setSelectedTicket(data.ticket);
        }
        setTicketComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load ticket comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const targetTicketById = async (ticketId: string) => {
    if (!ticketId) return;
    setIsClosing(false);
    setIsOpen(true);
    setShowCreateForm(false);
    setLoadingComments(true);
    setReplyText('');

    try {
      const res = await apiFetch(`${API_URL}/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        const ticket = data.ticket || data;
        setSelectedTicket(ticket);
        setTicketComments(data.comments || []);
      } else {
        const found = tickets.find((t) => (t.id || t._id) === ticketId);
        if (found) {
          setSelectedTicket(found);
        }
      }
    } catch (err) {
      console.error('Failed to target ticket:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Listen for global custom event to target specific ticket from anywhere (e.g. notifications area)
  useEffect(() => {
    const handleOpenTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ ticketId?: string }>;
      if (customEvent.detail?.ticketId) {
        targetTicketById(customEvent.detail.ticketId);
      } else {
        handleOpen();
      }
    };

    window.addEventListener('open-support-ticket', handleOpenTicketEvent);
    return () => window.removeEventListener('open-support-ticket', handleOpenTicketEvent);
  }, [tickets]);

  // Check URL query param on mount for ?ticketId=... or ?supportTicket=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ticketIdParam = urlParams.get('ticketId') || urlParams.get('supportTicket');
      if (ticketIdParam) {
        targetTicketById(ticketIdParam);
      }
    }
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      setFormError(null);
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
        const createdTicket = await res.json();
        setFormSuccess(true);
        setSubject('');
        setDescription('');
        await fetchTickets();
        setTimeout(() => {
          setFormSuccess(false);
          setShowCreateForm(false);
          if (createdTicket && (createdTicket.id || createdTicket._id)) {
            handleSelectTicket(createdTicket);
          }
        }, 1200);
      } else {
        const errData = await res.json();
        const msg = Array.isArray(errData.message)
          ? errData.message.join(', ')
          : errData.message || 'Failed to create ticket';
        setFormError(msg);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    const ticketId = selectedTicket.id || selectedTicket._id;
    if (!ticketId) return;

    try {
      setSubmittingReply(true);
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
        const updatedRes = await apiFetch(`${API_URL}/support/tickets/${ticketId}`);
        if (updatedRes.ok) {
          const updatedData = await updatedRes.json();
          if (updatedData.ticket) setSelectedTicket(updatedData.ticket);
          setTicketComments(updatedData.comments || []);
        }
        fetchTickets();
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const navigateToFullSupport = () => {
    handleClose();
    const targetTicketId = selectedTicket ? (selectedTicket.id || selectedTicket._id) : '';
    const query = targetTicketId ? `&id=${targetTicketId}` : '';
    if (user?.role === 'TEACHER') {
      router.push(`/teacher/dashboard?tab=Support${query}`);
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      router.push(`/admin/support${targetTicketId ? `?id=${targetTicketId}` : ''}`);
    } else {
      router.push(`/student/dashboard?tab=support${query}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
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
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <>
      {/* Support Inbox Icon Button in Header / Notification Area */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          className={`relative p-2 rounded-xl transition shadow-sm cursor-pointer ${
            variant === 'navbar'
              ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
              : 'bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground'
          }`}
          title="Support Inbox"
          aria-label="Support Inbox"
        >
          <LifeBuoy size={16} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-blue-700">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity ${
              isClosing ? 'animate-drawer-backdrop-out' : 'animate-drawer-backdrop-in'
            }`}
            onClick={handleClose}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <div
              ref={panelRef}
              className={`w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col z-10 pointer-events-auto ${
                isClosing ? 'animate-drawer-slide-out' : 'animate-drawer-slide-in'
              }`}
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
                {selectedTicket ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="Back to Tickets"
                    >
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </button>
                    <div className="min-w-0 pl-1">
                      <span className="text-[11px] font-mono font-bold text-primary">
                        {selectedTicket.ticketNumber || `#${(selectedTicket.id || selectedTicket._id)?.slice(-6).toUpperCase()}`}
                      </span>
                      <h4 className="text-xs font-bold text-foreground truncate leading-tight">
                        {selectedTicket.subject || selectedTicket.title}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm font-display text-foreground flex items-center gap-2">
                        <span>Support Inbox</span>
                        {activeCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                            {activeCount} Active
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {user?.role === 'TEACHER'
                          ? 'Teacher Support & Assistance'
                          : user?.role === 'STUDENT'
                          ? 'Student Support Helpdesk'
                          : 'Helpdesk & Ticket Communications'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {!selectedTicket && (
                    <button
                      onClick={() => setShowCreateForm(!showCreateForm)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{showCreateForm ? 'View Tickets' : 'New Ticket'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                    aria-label="Close Support Inbox"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket ? (
                  /* =========================================================
                     TARGETED TICKET DETAIL & CONVERSATION VIEW
                     ========================================================= */
                  <div className="space-y-4 animate-fadeIn">
                    {/* Ticket Header Pill Info */}
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusBadge(
                            selectedTicket.status
                          )}`}
                        >
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getPriorityBadge(
                            selectedTicket.priority
                          )}`}
                        >
                          {selectedTicket.priority} Priority
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-muted text-muted-foreground border border-border">
                          {selectedTicket.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {new Date(selectedTicket.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {selectedTicket.subject || selectedTicket.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Submitted by{' '}
                          <strong className="text-foreground">
                            {selectedTicket.raisedByName || 'You'}
                          </strong>
                        </p>
                      </div>

                      {/* Original Issue Content */}
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-foreground whitespace-pre-line leading-relaxed bg-background/60 p-2.5 rounded-xl border border-border/60">
                          {selectedTicket.description}
                        </p>
                      </div>
                    </div>

                    {/* Comments & Conversation Thread */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-primary" />
                          <span>Conversation &amp; Replies ({ticketComments.length})</span>
                        </h4>
                        <button
                          onClick={() => handleSelectTicket(selectedTicket)}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          title="Refresh conversation"
                        >
                          <RotateCcw size={10} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {loadingComments ? (
                        <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin text-primary mb-1" />
                          <span className="text-xs">Loading replies...</span>
                        </div>
                      ) : ticketComments.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/70 p-4">
                          <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                          <p className="text-xs font-semibold">No responses yet</p>
                          <p className="text-[11px] opacity-70 mt-0.5">
                            Our support staff has received your ticket and will reply shortly.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {ticketComments.map((c, idx) => {
                            const isStaff =
                              c.user?.role === 'ADMIN' ||
                              c.user?.role === 'SUPER_ADMIN' ||
                              c.user?.role === 'HR';
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                                  isStaff
                                    ? 'bg-primary/5 border-primary/20 mr-2'
                                    : 'bg-muted/30 border-border ml-2'
                                }`}
                              >
                                <div className="flex items-center justify-between font-semibold mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-foreground">
                                      {c.commentByName || c.user?.name || (isStaff ? 'Support Staff' : 'User')}
                                    </span>
                                    {isStaff && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-primary/20 text-primary uppercase">
                                        Staff
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    {new Date(c.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-foreground whitespace-pre-line">{c.comment}</p>
                              </div>
                            );
                          })}
                          <div ref={commentsEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : showCreateForm ? (
                  /* =========================================================
                     CREATE NEW TICKET FORM
                     ========================================================= */
                  <form onSubmit={handleCreateTicket} className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Open New Support Ticket
                      </h4>
                    </div>

                    {formSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 size={15} />
                        <span>Ticket created! Loading your ticket thread...</span>
                      </div>
                    )}

                    {formError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                        <AlertCircle size={15} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of your query..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background outline-none focus:border-primary"
                        >
                          <option value="SCHEDULE">Schedule &amp; Timetable</option>
                          <option value="TECHNICAL">Technical Issue</option>
                          <option value="ACADEMIC">Academic &amp; Curriculum</option>
                          <option value="FINANCIAL">Fee / Compensation</option>
                          <option value="ADMINISTRATIVE">Administrative</option>
                          <option value="GENERAL">General Inquiry</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Priority</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background outline-none focus:border-primary"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Description</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detailed explanation of the problem or request..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>Submit Ticket</span>
                      </button>
                    </div>
                  </form>
                ) : loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                    <span className="text-xs">Loading support tickets...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground space-y-3">
                    <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-xs">No support tickets found.</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition cursor-pointer"
                    >
                      Open your first ticket
                    </button>
                  </div>
                ) : (
                  /* =========================================================
                     CLICKABLE TICKETS LIST
                     ========================================================= */
                  <div className="space-y-2.5">
                    {tickets.map((t) => {
                      const ticketId = t.id || t._id;
                      return (
                        <div
                          key={ticketId}
                          onClick={() => handleSelectTicket(t)}
                          className="p-3.5 rounded-2xl border border-border/80 bg-card/70 hover:border-primary/50 hover:bg-muted/40 transition-all cursor-pointer text-left group shadow-xs hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground group-hover:text-primary transition-colors">
                              {t.ticketNumber || `#${ticketId?.slice(-6)}`}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusBadge(
                                t.status
                              )}`}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                            {t.subject || t.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                            {t.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-muted font-semibold">
                                {t.category}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-md font-bold uppercase ${getPriorityBadge(
                                  t.priority
                                )}`}
                              >
                                {t.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-primary font-semibold group-hover:underline">
                              <span>View ticket</span>
                              <ChevronRight size={12} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer / Reply Box */}
              {selectedTicket ? (
                <div className="p-3 border-t border-border bg-card">
                  <form onSubmit={handleSendReply} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply to ticket..."
                      className="flex-1 px-3 py-2 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {submittingReply ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>Reply</span>
                    </button>
                  </form>
                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                    >
                      &larr; Return to list
                    </button>
                    <button
                      type="button"
                      onClick={navigateToFullSupport}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>Open in Full Support Hub</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={navigateToFullSupport}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition cursor-pointer"
                  >
                    <span>Open Full Support Hub</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
