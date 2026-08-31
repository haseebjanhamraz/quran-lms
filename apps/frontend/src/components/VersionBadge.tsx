'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

interface VersionInfo {
  version: string;
  name?: string;
  buildTimestamp?: string;
  environment?: string;
}

export default function VersionBadge({ className = '' }: { className?: string }) {
  const [backendVersion, setBackendVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const frontendVersion = '2.3.1';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchBackendVersion = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/version`);
      if (res.ok) {
        const data = await res.json();
        setBackendVersion(data);
      }
    } catch (_) {
      // Fallback
      setBackendVersion({
        version: '1.6.0',
        buildTimestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendVersion();
  }, []);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return isoString;
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-card/60 backdrop-blur-md border border-border text-[11px] text-muted-foreground ${className}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-foreground">Ain Ul Quran LMS</span>
        <span className="text-border">|</span>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono font-bold">
          FE v{frontendVersion}
        </span>
        <span className="bg-sky-500/10 text-sky-500 dark:text-sky-400 px-2 py-0.5 rounded-md font-mono font-bold">
          BE v{backendVersion?.version || '1.6.0'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px]">
        <span>Last Updated: <strong className="text-foreground">{formatDateTime(backendVersion?.buildTimestamp)}</strong></span>
        <button
          onClick={fetchBackendVersion}
          disabled={loading}
          className="p-1 hover:text-foreground rounded transition-colors"
          title="Refresh version info"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
