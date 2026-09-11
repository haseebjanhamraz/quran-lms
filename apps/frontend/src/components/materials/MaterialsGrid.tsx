'use client';

import React from 'react';
import { Folder, Loader2, Plus } from 'lucide-react';
import { MaterialItem } from './types';
import MaterialCard from './MaterialCard';

interface MaterialsGridProps {
  loading: boolean;
  materials: MaterialItem[];
  hasFilters: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onOpenUpload: () => void;
  onPresent?: (material: MaterialItem) => void;
}

export default function MaterialsGrid({
  loading,
  materials,
  hasFilters,
  canDelete,
  onDelete,
  onOpenUpload,
  onPresent,
}: MaterialsGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono">Loading educational materials...</p>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-border bg-card/20 max-w-xl mx-auto space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Folder className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">No Materials Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasFilters
              ? 'Try broadening your search or resetting category filters.'
              : 'No curriculum PDFs have been uploaded yet. Upload the first document!'}
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {materials.map((mat) => {
        const matId = mat.id || mat._id;
        return (
          <MaterialCard
            key={matId}
            material={mat}
            canDelete={canDelete}
            onDelete={onDelete}
            onPresent={onPresent}
          />
        );
      })}
    </div>
  );
}
