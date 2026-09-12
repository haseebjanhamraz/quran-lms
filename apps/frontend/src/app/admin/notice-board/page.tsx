'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  Trash2,
  Plus,
  FileText,
  Image as ImageIcon,
  Radio,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

interface Attachment {
  name: string;
  url: string;
  fileType: 'IMAGE' | 'PDF' | 'OTHER';
}

interface Notice {
  id: string;
  _id?: string;
  title: string;
  content: string;
  targetRole: string;
  attachments: Attachment[];
  isPinned: boolean;
  postedByName?: string;
  createdAt: string;
}

export default function AdminNoticeBoardPage() {
  const [activeTab, setActiveTab] = useState<'notices' | 'broadcast'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notice Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attName, setAttName] = useState('');
  const [attUrl, setAttUrl] = useState('');
  const [attType, setAttType] = useState<'IMAGE' | 'PDF' | 'OTHER'>('IMAGE');

  // Broadcast Form State
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcAudience, setBcAudience] = useState<'ALL' | 'TEACHER' | 'STUDENT'>('ALL');
  const [bcPriority, setBcPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/notices`);
      if (res.ok) {
        const data = await res.json();
        setNotices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleAddAttachment = () => {
    if (!attUrl.trim()) return;
    setAttachments([
      ...attachments,
      {
        name: attName.trim() || (attType === 'IMAGE' ? 'Image Attachment' : 'Document.pdf'),
        url: attUrl.trim(),
        fileType: attType,
      },
    ]);
    setAttName('');
    setAttUrl('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await apiFetch(`${API_URL}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetRole,
          isPinned,
          attachments,
        }),
      });

      if (res.ok) {
        setFeedback({ type: 'success', text: 'Notice published and dispatched to users successfully!' });
        setTitle('');
        setContent('');
        setAttachments([]);
        setIsPinned(false);
        fetchNotices();
      } else {
        const errData = await res.json();
        setFeedback({ type: 'error', text: errData.message || 'Failed to post notice' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await apiFetch(`${API_URL}/notices/${id}/pin`, { method: 'PATCH' });
      if (res.ok) {
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await apiFetch(`${API_URL}/notices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await apiFetch(`${API_URL}/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bcTitle.trim(),
          message: bcMessage.trim(),
          targetAudience: bcAudience,
          priority: bcPriority,
        }),
      });

      if (res.ok) {
        setFeedback({
          type: 'success',
          text: `Broadcast sent in real-time to ${bcAudience.toLowerCase()}s with audio notification!`,
        });
        setBcTitle('');
        setBcMessage('');
      } else {
        const errData = await res.json();
        setFeedback({ type: 'error', text: errData.message || 'Failed to dispatch broadcast' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to dispatch broadcast' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                <Megaphone className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
                Notice Board &amp; Real-Time Broadcast
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Publish official announcements with attachments (PDF, Images) and dispatch live audio broadcast alerts.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl border border-border">
            <button
              onClick={() => {
                setActiveTab('notices');
                setFeedback(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'notices'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Megaphone size={14} />
              <span>Notices</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('broadcast');
                setFeedback(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'broadcast'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Radio size={14} className="text-rose-500" />
              <span>Live Broadcast</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* TAB 1: NOTICES */}
        {activeTab === 'notices' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-bold font-display text-foreground mb-1">
                Post New Notice
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Notices will appear in the Notice Board drawer with attachments.
              </p>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Eid Ul Fitr Holidays Notice"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Target Audience
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                  >
                    <option value="ALL">Everyone (Teachers &amp; Students)</option>
                    <option value="TEACHER">Teachers Only</option>
                    <option value="STUDENT">Students Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Notice Content</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write announcement details here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none resize-none"
                  />
                </div>

                {/* Attachments (PDF / Image) */}
                <div className="border border-border/80 rounded-2xl p-3.5 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Attachments</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Image or PDF</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Attachment Name (e.g. Schedule PDF)"
                      value={attName}
                      onChange={(e) => setAttName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={attType}
                        onChange={(e) => setAttType(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs outline-none font-medium"
                      >
                        <option value="IMAGE">Image</option>
                        <option value="PDF">PDF</option>
                      </select>
                      <input
                        type="url"
                        placeholder="File / Image URL (https://...)"
                        value={attUrl}
                        onChange={(e) => setAttUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddAttachment}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs"
                        >
                          <span className="truncate font-medium flex items-center gap-1.5">
                            {att.fileType === 'IMAGE' ? (
                              <ImageIcon size={13} className="text-blue-500" />
                            ) : (
                              <FileText size={13} className="text-rose-500" />
                            )}
                            {att.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(i)}
                            className="text-destructive hover:opacity-80 p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="isPinned" className="text-xs font-semibold text-foreground cursor-pointer">
                    Pin notice to top of Notice Board
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Publish Notice</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-base font-bold font-display text-foreground">
                  Published Notices ({notices.length})
                </h2>
                <button
                  onClick={fetchNotices}
                  className="text-xs text-brand hover:underline font-semibold"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center text-muted-foreground">
                  <Loader2 className="animate-spin h-6 w-6" />
                </div>
              ) : notices.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No notices published yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {notices.map((n) => {
                    const noticeId = n.id || n._id || '';
                    return (
                      <div
                        key={noticeId}
                        className={`p-4 rounded-2xl border transition ${
                          n.isPinned
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : 'bg-background border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {n.isPinned && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">
                                  <Pin size={10} className="fill-amber-500" /> Pinned
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-border uppercase">
                                {n.targetRole}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTogglePin(noticeId)}
                              title={n.isPinned ? 'Unpin' : 'Pin to top'}
                              className={`p-1.5 rounded-lg border text-xs transition ${
                                n.isPinned
                                  ? 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                                  : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                              }`}
                            >
                              <Pin size={13} className={n.isPinned ? 'fill-amber-500' : ''} />
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(noticeId)}
                              title="Delete notice"
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                          {n.content}
                        </p>

                        {n.attachments && n.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            {n.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-foreground hover:bg-muted/80 border border-border transition"
                              >
                                {att.fileType === 'IMAGE' ? (
                                  <ImageIcon size={12} className="text-blue-500" />
                                ) : (
                                  <FileText size={12} className="text-rose-500" />
                                )}
                                <span>{att.name}</span>
                                <ExternalLink size={10} className="text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/20">
                <Radio className="h-5 w-5 animate-pulse" />
              </span>
              <h2 className="text-lg font-bold font-display text-foreground">
                Dispatch Real-Time Broadcast
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Broadcasts are pushed in real-time over WebSocket with an immediate audio chime to online users and saved to notifications.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Broadcast Title
                </label>
                <input
                  type="text"
                  required
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  placeholder="e.g., Emergency Class Schedule Update"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Target Audience
                  </label>
                  <select
                    value={bcAudience}
                    onChange={(e) => setBcAudience(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                  >
                    <option value="ALL">Everyone</option>
                    <option value="TEACHER">Teachers Only</option>
                    <option value="STUDENT">Students Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Priority</label>
                  <select
                    value={bcPriority}
                    onChange={(e) => setBcPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent (High Priority)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Broadcast Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={bcMessage}
                  onChange={(e) => setBcMessage(e.target.value)}
                  placeholder="Enter broadcast announcement message..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary text-xs outline-none resize-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border text-[11px] text-muted-foreground leading-relaxed">
                📢 When dispatched, connected users will hear an alert sound (<code className="font-mono text-foreground">pop.mp3</code>) and receive a high-priority notification item.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Dispatching Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Dispatch Real-Time Broadcast</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
