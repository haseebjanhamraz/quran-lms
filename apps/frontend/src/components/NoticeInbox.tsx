'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Pin,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  X,
  CheckCircle2,
  Calendar,
  Eye,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export interface NoticeAttachment {
  name: string;
  url: string;
  fileType?: 'IMAGE' | 'PDF' | 'OTHER' | string;
  size?: number;
}

export interface NoticeItem {
  id: string;
  _id?: string;
  title: string;
  content: string;
  targetRole: string;
  attachments?: NoticeAttachment[];
  isPinned: boolean;
  postedByName?: string;
  createdAt: string;
  isRead?: boolean;
}

interface NoticeInboxProps {
  variant?: 'default' | 'navbar';
}

export default function NoticeInbox({ variant = 'navbar' }: NoticeInboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const { playNotificationSound } = useNotificationSound();
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
        if (previewImage) {
          setPreviewImage(null);
        } else if (selectedNotice) {
          setSelectedNotice(null);
        } else if (isOpen) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedNotice, previewImage]);

  const fetchNotices = async () => {
    try {
      const res = await apiFetch(`${API_URL}/notices`);
      if (res.ok) {
        const data = await res.json();
        const list: NoticeItem[] = Array.isArray(data) ? data : [];
        setNotices(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    }
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 30000);
    return () => clearInterval(interval);
  }, []);

  useWebSocket({
    eventFilter: 'new_notice',
    onMessage: () => {
      playNotificationSound();
      fetchNotices();
    },
  });

  const handleMarkAsRead = async (notice: NoticeItem) => {
    const noticeId = notice.id || notice._id;
    if (!noticeId || notice.isRead) return;

    try {
      await apiFetch(`${API_URL}/notices/${noticeId}/read`, { method: 'PATCH' });
      setNotices((prev) =>
        prev.map((n) => ((n.id || n._id) === noticeId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (selectedNotice && (selectedNotice.id || selectedNotice._id) === noticeId) {
        setSelectedNotice({ ...selectedNotice, isRead: true });
      }
    } catch (err) {
      console.error('Failed to mark notice as read:', err);
    }
  };

  const handleSelectNotice = (notice: NoticeItem) => {
    setSelectedNotice(notice);
    handleMarkAsRead(notice);
  };

  const isImageAttachment = (att: NoticeAttachment) => {
    if (att.fileType === 'IMAGE') return true;
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.url || att.name || '');
  };

  const isPdfAttachment = (att: NoticeAttachment) => {
    if (att.fileType === 'PDF') return true;
    return /\.pdf$/i.test(att.url || att.name || '');
  };

  return (
    <>
      {/* Notice Board Icon Button in Header */}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          className={`relative p-2 rounded-xl transition shadow-sm ${
            variant === 'navbar'
              ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
              : 'bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground'
          }`}
          title="Notice Board"
          aria-label="Notice Board"
        >
          <Megaphone size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-blue-700 animate-pulse">
              {unreadCount}
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
              className={`w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col pointer-events-auto ${
                isClosing ? 'animate-drawer-slide-out' : 'animate-drawer-slide-in'
              }`}
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-foreground">
                      Notice Board
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Official announcements &amp; updates
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  aria-label="Close Notice Board"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notices.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Megaphone className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    <p className="text-xs font-semibold">No notices at this time</p>
                    <p className="text-[11px] opacity-70">Check back later for updates</p>
                  </div>
                ) : (
                  notices.map((n) => {
                    const noticeId = n.id || n._id;
                    return (
                      <div
                        key={noticeId}
                        onClick={() => handleSelectNotice(n)}
                        className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                          n.isPinned
                            ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                            : !n.isRead
                            ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                            : 'bg-background/80 border-border/70 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {n.isPinned && (
                              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                                <Pin size={10} className="fill-amber-500" /> Pinned
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-border uppercase">
                              {n.targetRole}
                            </span>
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-bold mb-1 leading-snug ${
                            !n.isRead ? 'text-foreground' : 'text-foreground/80'
                          }`}
                        >
                          {n.title}
                        </h4>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>

                        {/* Attachments preview pill count */}
                        {n.attachments && n.attachments.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-primary font-medium">
                            <FileText size={12} />
                            <span>
                              {n.attachments.length}{' '}
                              {n.attachments.length === 1 ? 'Attachment' : 'Attachments'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-border bg-card max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {selectedNotice.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                      <Pin size={10} className="fill-amber-500" /> Pinned
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-border uppercase">
                    For {selectedNotice.targetRole}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {selectedNotice.title}
                </h3>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Posted by {selectedNotice.postedByName || 'Admin'} on{' '}
                  {new Date(selectedNotice.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              <div className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/50">
                {selectedNotice.content}
              </div>

              {/* Attachments Section */}
              {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Attachments ({selectedNotice.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNotice.attachments.map((att, idx) => {
                      const isImg = isImageAttachment(att);
                      const isPdf = isPdfAttachment(att);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border hover:border-primary/40 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                              {isImg ? (
                                <ImageIcon size={16} className="text-blue-500" />
                              ) : isPdf ? (
                                <FileText size={16} className="text-rose-500" />
                              ) : (
                                <FileText size={16} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {att.name || `Attachment ${idx + 1}`}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                                {isImg ? 'Image' : isPdf ? 'PDF Document' : 'File'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isImg && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(att.url)}
                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 text-xs flex items-center gap-1 font-medium"
                              >
                                <Eye size={13} />
                                <span>Preview</span>
                              </button>
                            )}
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs flex items-center gap-1 font-medium transition"
                            >
                              <ExternalLink size={13} />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border/60 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-card text-foreground border border-border shadow-lg"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Attachment preview"
              className="rounded-2xl max-h-[85vh] max-w-full object-contain shadow-2xl border border-border"
            />
          </div>
        </div>
      )}
    </>
  );
}
