'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, Loader2, Calendar, X, ExternalLink, Sparkles, BookOpen, PlaneTakeoff, Info, Trash2 } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface NotificationItem {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType?: 'SESSION' | 'LEAVE' | 'STUDENT' | 'TEACHER' | 'MATERIAL' | 'REPORT' | 'FEEDBACK' | 'TICKET' | 'GENERAL';
  entityId?: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationsDropdownProps {
  variant?: 'default' | 'navbar';
}

export default function NotificationsDropdown({ variant = 'navbar' }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playNotificationSound } = useNotificationSound();

  useWebSocket({
    eventFilter: ['new_notification', 'new_notice', 'new_broadcast'],
    onMessage: () => {
      playNotificationSound();
      fetchNotifications();
    },
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`${API_URL}/notifications`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setNotifications(list);
        setUnreadCount(list.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await apiFetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications(prev => (Array.isArray(prev) ? prev : []).map(n => (n.id === id || n._id === id) ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking individual notification read:', err);
    }
  };

  const handleSelectNotification = (n: NotificationItem) => {
    const notifId = n.id || n._id;
    if (!n.isRead && notifId) {
      handleMarkAsRead(notifId);
    }

    const ticketId = n.metadata?.ticketId || (n.entityType === 'TICKET' ? n.entityId : null);
    if (ticketId || n.type === 'SUPPORT_TICKET_CREATED' || n.type === 'SUPPORT_TICKET_REPLIED') {
      setSelectedNotification(null);
      setIsOpen(false);
      window.dispatchEvent(
        new CustomEvent('open-support-ticket', {
          detail: { ticketId: ticketId || n.entityId },
        })
      );
      return;
    }

    setSelectedNotification(n);
    setIsOpen(false);
  };

  const getEntityRoute = (n: NotificationItem): string | null => {
    if (n.linkUrl) return n.linkUrl;
    if (!n.entityType) return null;

    switch (n.entityType) {
      case 'SESSION':
        return n.entityId ? `/classroom/${n.entityId}` : '/admin/schedule';
      case 'LEAVE':
        return '/admin/leave-requests';
      case 'MATERIAL':
        return '/admin/materials';
      case 'STUDENT':
        return '/admin/students';
      case 'TEACHER':
        return '/admin/teachers';
      case 'REPORT':
        return n.entityId ? `/admin/reports/${n.entityId}` : '/admin/reports';
      case 'FEEDBACK':
        return '/admin/feedback';
      default:
        return null;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition shadow-sm ${
          variant === 'navbar'
            ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            : 'bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground'
        }`}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-blue-700">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-display">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand/15 text-brand">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] text-brand hover:underline font-semibold flex items-center gap-1"
              >
                {loading ? <Loader2 size={10} className="animate-spin" /> : <Check size={11} />}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8">No notifications yet.</p>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const notifId = n.id || n._id;
                return (
                  <div
                    key={notifId}
                    onClick={() => handleSelectNotification(n)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-left group ${
                      n.isRead
                        ? 'bg-background/60 border-border/60 hover:bg-muted/40'
                        : 'bg-brand/10 border-brand/20 hover:bg-brand/15'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs font-semibold ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-muted-foreground/70 font-mono whitespace-nowrap">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal font-sans line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Expanded Notification Popup Modal rendered directly via React Portal for true screen centering */}
      {selectedNotification && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedNotification(null);
          }}
        >
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative border border-border bg-card">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedNotification.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {new Date(selectedNotification.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notification Body */}
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed">
                {selectedNotification.message}
              </div>

              {selectedNotification.type && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Type:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {selectedNotification.type}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>

              {(selectedNotification.metadata?.ticketId ||
              selectedNotification.entityType === 'TICKET' ||
              selectedNotification.type?.startsWith('SUPPORT_TICKET')) ? (
                <button
                  type="button"
                  onClick={() => {
                    const tId =
                      selectedNotification.metadata?.ticketId || selectedNotification.entityId;
                    setSelectedNotification(null);
                    window.dispatchEvent(
                      new CustomEvent('open-support-ticket', {
                        detail: { ticketId: tId },
                      })
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <span>Open in Support Inbox</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : getEntityRoute(selectedNotification) && (
                <button
                  type="button"
                  onClick={() => {
                    const route = getEntityRoute(selectedNotification);
                    setSelectedNotification(null);
                    if (route) router.push(route);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <span>Open Related Record</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
