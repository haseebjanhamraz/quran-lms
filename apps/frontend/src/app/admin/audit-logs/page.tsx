'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Search, Loader2, ArrowLeft, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';

interface AuditLogItem {
  id: string;
  action: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/audit-logs?limit=${limit}&page=${page}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      log.action.toLowerCase().includes(query) ||
      (log.user?.name || '').toLowerCase().includes(query) ||
      (log.user?.email || '').toLowerCase().includes(query) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-[#C9A84C]" />
            <span>System Audit Logs</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track user activities, platform operations, and modifications.
          </p>
        </div>
      </div>

      {/* Toolbar (Search) */}
      <div className="glass-panel rounded-xl p-4 mb-6 flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Filter audit logs by action, username, email, or data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Audit Logs Table */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-card/30">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">User</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Action</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Metadata</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-card/20 transition-colors">
                    <td className="py-4 px-6">
                      {log.user ? (
                        <>
                          <p className="font-semibold text-foreground">{log.user.name}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email} ({log.user.role})</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground italic">System / Anonymous</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold py-1 px-2.5 rounded-full font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-md">
                      {log.metadata ? (
                        <pre className="text-xs font-mono text-emerald-400 bg-black/40 p-2.5 rounded-lg overflow-x-auto max-h-32">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{total}</span> logs
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="bg-card hover:bg-card/85 text-foreground py-1.5 px-3 rounded-lg text-sm font-semibold border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="bg-card hover:bg-card/85 text-foreground py-1.5 px-3 rounded-lg text-sm font-semibold border border-border disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
