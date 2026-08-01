'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle, MessageSquare, Clock, CheckCircle2, AlertTriangle,
  User, Send, Loader2, RefreshCw, XCircle, Shield, ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function HRSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Comment input
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'ALL'
        ? `${API_URL}/support/tickets?status=${filterStatus}`
        : `${API_URL}/support/tickets`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) setTickets(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticket._id || ticket.id}`, { credentials: 'include' });
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
    setSubmittingComment(true);

    try {
      const targetId = selectedTicket._id || selectedTicket.id;
      const res = await fetch(`${API_URL}/support/tickets/${targetId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          comment: newComment,
          isInternal: isInternalComment,
        }),
      });

      if (res.ok) {
        setNewComment('');
        handleSelectTicket(selectedTicket);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const targetId = selectedTicket._id || selectedTicket.id;
      const res = await fetch(`${API_URL}/support/tickets/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-brand" />
            <span>Parent Support Tickets &amp; Complaints</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage parent inquiry tickets, track resolution SLAs, and assign staff.</p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl self-start">
          <span className="text-xs text-muted-foreground font-semibold">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket Roster (Left) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="glass-panel p-4 rounded-2xl border border-border/50 shadow-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-xs font-bold text-muted-foreground uppercase">Tickets ({tickets.length})</span>
              <button onClick={fetchTickets} className="p-1 text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">No support tickets found.</div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {tickets.map((t) => {
                  const isSelected = (selectedTicket?._id || selectedTicket?.id) === (t._id || t.id);
                  return (
                    <div
                      key={t._id || t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : 'bg-card/40 border-border/60 hover:bg-card/80'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono font-bold text-brand">{t.ticketNumber}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          t.status === 'OPEN'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : t.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-foreground line-clamp-1">{t.title}</p>
                      <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                        <span>Parent: {t.raisedByName || t.raisedBy?.guardianName || 'Guardian'}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details & Thread (Right) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="glass-panel p-6 rounded-2xl border border-border/50 shadow-xl space-y-6">
              {/* Header */}
              <div className="border-b border-border/40 pb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand">{selectedTicket.ticketNumber}</span>
                    <h2 className="text-xl font-bold font-display text-foreground">{selectedTicket.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('CLOSED')}
                      className="bg-card hover:bg-muted text-foreground border border-border text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Close Ticket
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  <span>Parent: <strong className="text-foreground">{selectedTicket.raisedByName || selectedTicket.raisedBy?.guardianName || 'Parent'}</strong></span>
                  <span>Contact: <strong className="text-foreground">{selectedTicket.raisedBy?.guardianPhone || selectedTicket.raisedBy?.email || 'N/A'}</strong></span>
                  <span>Priority: <strong className="text-rose-500">{selectedTicket.priority}</strong></span>
                </div>
              </div>

              {/* Description Body */}
              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Ticket Issue Description</p>
                <p className="text-sm text-foreground whitespace-pre-line">{selectedTicket.description}</p>
              </div>

              {/* Thread Comments */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-brand" /> Resolution Thread ({comments.length})
                </h4>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div
                      key={c._id || c.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        c.isInternal ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card/60 border-border/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          {c.commentByName || 'Staff'} {c.isInternal && <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-mono">INTERNAL NOTE</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-foreground">{c.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleAddComment} className="pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internalCheck"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <label htmlFor="internalCheck" className="text-xs text-muted-foreground">Internal note (Hidden from parent)</label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a response or internal note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                    >
                      {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-2xl border border-border/50 text-center text-muted-foreground space-y-2">
              <HelpCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="font-semibold text-sm">Select a ticket from the left roster to view details and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
