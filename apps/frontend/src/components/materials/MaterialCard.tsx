'use client';

import React from 'react';
import { BookOpen, Eye, Trash2 } from 'lucide-react';
import { MaterialItem } from './types';
import { CATEGORIES, CATEGORY_COLORS } from './constants';
import { formatBytes } from './utils';

interface MaterialCardProps {
  material: MaterialItem;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export default function MaterialCard({ material, canDelete, onDelete }: MaterialCardProps) {
  const matId = material.id || material._id;
  const categoryBadge = CATEGORY_COLORS[material.category] || CATEGORY_COLORS.GENERAL;
  const categoryLabel =
    CATEGORIES.find((c) => c.id === material.category)?.label || material.category;

  return (
    <div className="glass-panel group rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 p-5 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
      <div className="space-y-3">
        {/* Top Tags */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${categoryBadge}`}
          >
            {categoryLabel}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {material.targetLevel}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {material.title}
          </h3>
          {material.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {material.description}
            </p>
          )}
        </div>

        {/* Associated Course Tag */}
        {material.course && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/40">
            <BookOpen className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{material.course.title}</span>
          </div>
        )}

        {/* Metadata info */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70 block">
              File Size
            </span>
            <span className="font-mono font-semibold text-foreground">
              {formatBytes(material.fileSize)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70 block">
              Uploaded By
            </span>
            <span className="font-medium text-foreground truncate block">
              {material.uploader?.name || 'Administrator'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <a
          href={`/materials/view/${matId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all"
          title="View & Read PDF in Protected Mode"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View &amp; Read PDF</span>
        </a>

        {canDelete && matId && (
          <button
            onClick={() => onDelete(matId)}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Delete PDF"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
