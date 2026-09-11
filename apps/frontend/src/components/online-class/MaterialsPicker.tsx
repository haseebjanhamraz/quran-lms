'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { Search, X, BookOpen, FileText, Check, Loader2, Presentation } from 'lucide-react';
import { MaterialItem, MaterialCategory } from '../materials/types';
import { CATEGORIES, CATEGORY_COLORS } from '../materials/constants';
import { formatBytes } from '../materials/utils';

interface MaterialsPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (material: MaterialItem) => void;
  selectedMaterialId?: string;
}

export default function MaterialsPicker({
  isOpen,
  onClose,
  onSelectMaterial,
  selectedMaterialId,
}: MaterialsPickerProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [presentingId, setPresentingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | MaterialCategory>('ALL');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/materials`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching materials for picker:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen, fetchMaterials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tMatch = item.title?.toLowerCase().includes(q);
        const dMatch = item.description?.toLowerCase().includes(q);
        const fMatch = item.fileName?.toLowerCase().includes(q);
        if (!tMatch && !dMatch && !fMatch) return false;
      }
      return true;
    });
  }, [materials, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-96 bg-zinc-950/95 border-r border-zinc-800 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 animate-fadeIn">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Select Curriculum Material</h2>
            <p className="text-[11px] text-zinc-400">Load PDF onto whiteboard background</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="p-4 border-b border-zinc-800/80 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Quran, Qaida, Tajweed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/70 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Material List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-xs">Loading curriculum materials...</span>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 space-y-1">
            <FileText className="h-8 w-8 mx-auto opacity-40 mb-2" />
            <p className="text-xs font-semibold text-zinc-400">No matching materials found</p>
            <p className="text-[11px]">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          filteredMaterials.map((mat) => {
            const matId = mat.id || mat._id || '';
            const isSelected = selectedMaterialId === matId;
            const badgeClass = CATEGORY_COLORS[mat.category] || CATEGORY_COLORS.GENERAL;

            return (
              <div
                key={matId}
                onClick={() => {
                  setPresentingId(matId);
                  setTimeout(() => {
                    onSelectMaterial(mat);
                    onClose();
                    setPresentingId(null);
                  }, 120);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/70 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      className={`h-4 w-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`}
                    />
                    <h3 className="text-xs font-bold text-zinc-100 truncate">{mat.title}</h3>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                {mat.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{mat.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded font-semibold border ${badgeClass}`}>
                      {mat.category}
                    </span>
                    <span>{formatBytes(mat.fileSize)}</span>
                  </div>
                  <button
                    type="button"
                    disabled={presentingId === matId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPresentingId(matId);
                      setTimeout(() => {
                        onSelectMaterial(mat);
                        onClose();
                        setPresentingId(null);
                      }, 120);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-75"
                    title="Present on Whiteboard"
                  >
                    {presentingId === matId ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        <Presentation className="h-3 w-3" />
                        <span>Present</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-center text-[10px] text-zinc-500">
        Click any PDF to project it directly onto the blackboard canvas.
      </div>
    </div>
  );
}
