'use client';

import React, { useMemo } from 'react';
import { BookOpen, HardDrive, Sparkles, ExternalLink } from 'lucide-react';
import { MaterialItem } from './types';
import { formatBytes } from './utils';

interface MaterialsStatsProps {
  materials: MaterialItem[];
}

export default function MaterialsStats({ materials }: MaterialsStatsProps) {
  const totalDownloads = useMemo(
    () => materials.reduce((acc, m) => acc + (m.downloadsCount || 0), 0),
    [materials]
  );

  const totalSize = useMemo(
    () => materials.reduce((acc, m) => acc + (m.fileSize || 0), 0),
    [materials]
  );

  const syllabiAndGuidesCount = useMemo(
    () => materials.filter((m) => m.category === 'QAIDA' || m.category === 'TAJWEED').length,
    [materials]
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Materials
          </p>
          <p className="text-xl font-black text-foreground font-mono mt-0.5">{materials.length}</p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <HardDrive className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Storage
          </p>
          <p className="text-xl font-black text-foreground font-mono mt-0.5">
            {formatBytes(totalSize)}
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Syllabi & Guides
          </p>
          <p className="text-xl font-black text-foreground font-mono mt-0.5">
            {syllabiAndGuidesCount}
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-border bg-card/40 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <ExternalLink className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Accesses
          </p>
          <p className="text-xl font-black text-foreground font-mono mt-0.5">{totalDownloads}</p>
        </div>
      </div>
    </div>
  );
}
