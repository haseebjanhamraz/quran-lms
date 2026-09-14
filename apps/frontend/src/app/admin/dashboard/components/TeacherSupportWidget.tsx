'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  ArrowRight,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/utils/apiFetch';

interface SupportTicketItem {
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
  user?: {
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
  comments?: Array<{
    comment: string;
    user?: { name: string; role: string };
    createdAt: string;
  }>;
}

export default function TeacherSupportWidget() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'OPEN' | 'ALL'>('OPEN');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/support/tickets?isTeacherSupport=true`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.tickets || [];
        setTickets(list);
      }
    } catch (err) {
      console.error('Failed to load teacher support tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const displayedTickets = tickets.filter((t) => {
    if (activeFilter === 'OPEN') return t.status === 'OPEN' || t.status === 'IN_PROGRESS';
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-600/20 shadow-sm">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display text-foreground tracking-tight">
                Teacher Support & Academic Helpdesk
              </h2>
              {openCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 border border-amber-500/30 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {openCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Urgent teacher requests regarding schedules, syllabus, curriculum, and live sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex rounded-xl bg-muted/60 p-0.5 border border-border/60 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('OPEN')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'OPEN'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({tickets.length})
            </button>
          </div>

          <button
            onClick={fetchTickets}
            disabled={loading}
            title="Refresh tickets"
            className="p-1.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          <Link
            href="/admin/support?filterSource=TEACHER"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition"
          >
            <span>Support Hub</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Tickets List */}
      {loading && tickets.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <span className="text-xs">Checking teacher support tickets...</span>
        </div>
      ) : displayedTickets.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-muted/20 border border-dashed border-border flex flex-col items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mb-2" />
          <p className="text-xs font-bold text-foreground">No Pending Teacher Tickets</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            All teacher inquiries and technical assistance requests have been answered!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedTickets.slice(0, 6).map((ticket) => {
            const ticketId = ticket.id || ticket._id;
            const submitterName = ticket.user?.name || 'Teacher';

            return (
              <div
                key={ticketId}
                className="p-4 rounded-2xl border border-border/80 bg-background/50 hover:bg-background/80 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {ticket.ticketNumber || `#${ticketId?.slice(-6)}`}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ticket.priority === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : ticket.priority === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {ticket.priority} Priority
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {ticket.subject || ticket.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                    {ticket.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User size={12} className="text-primary" />
                    <span className="font-semibold text-foreground truncate max-w-[100px]">{submitterName}</span>
                  </div>

                  <Link
                    href={`/admin/support?id=${ticketId}`}
                    className="flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <span>Respond</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
