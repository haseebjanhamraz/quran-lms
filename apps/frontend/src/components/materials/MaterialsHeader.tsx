'use client';

import React from 'react';
import { FileText, Plus, RefreshCw } from 'lucide-react';

interface MaterialsHeaderProps {
  title?: string;
  subtitle?: string;
  loading: boolean;
  onRefresh: () => void;
  onOpenUpload: () => void;
}

export default function MaterialsHeader({
  title = 'Course Materials & Curriculum Resources',
  subtitle = 'Browse, read, and share curriculum PDFs, tajweed manuals, and student lesson notes.',
  loading,
  onRefresh,
  onOpenUpload,
}: MaterialsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh list"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Material</span>
        </button>
      </div>
    </div>
  );
}
