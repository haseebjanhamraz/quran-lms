'use client';

import React, { useState } from 'react';
import {
  FileText,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  BookOpen,
  X,
  StretchHorizontal,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { MaterialItem } from '../materials/types';

interface WhiteboardToolbarProps {
  mode: 'pdf' | 'web';
  onModeChange: (mode: 'pdf' | 'web') => void;
  selectedMaterial: MaterialItem | null;
  onOpenMaterialsPicker: () => void;
  onClearMaterial: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearCanvas: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  fitMode: 'width' | 'page' | 'custom';
  onFitWidth: () => void;
  onFitScreen: () => void;
  rotation: number;
  onRotate: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onGoBack: () => void;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
  isPdfLoading?: boolean;
}

export default function WhiteboardToolbar({
  mode,
  onModeChange,
  selectedMaterial,
  onOpenMaterialsPicker,
  onClearMaterial,
  currentPage,
  totalPages,
  onPageChange,
  onClearCanvas,
  scale,
  onZoomIn,
  onZoomOut,
  onSetScale,
  fitMode,
  onFitWidth,
  onFitScreen,
  rotation: _rotation,
  onRotate,
  isFullscreen,
  onToggleFullscreen,
  onGoBack,
  onScrollUp,
  onScrollDown,
  isPdfLoading = false,
}: WhiteboardToolbarProps) {
  const [pageInputValue, setPageInputValue] = useState<string>(currentPage.toString());
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);

  // Sync input value when page changes externally
  React.useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInputValue, 10);
      const max = totalPages || 1;
      if (!isNaN(page) && page >= 1 && page <= max) {
        onPageChange(page);
      } else {
        setPageInputValue(currentPage.toString());
      }
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInputValue, 10);
    const max = totalPages || 1;
    if (!isNaN(page) && page >= 1 && page <= max) {
      onPageChange(page);
    } else {
      setPageInputValue(currentPage.toString());
    }
  };

  return (
    <header className="h-14 bg-zinc-900/95 border-b border-zinc-800/90 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 backdrop-blur-md z-30 select-none">
      {/* Left: Back/Close, Mode Switcher & Materials Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors border border-zinc-700/60 cursor-pointer"
          title="Exit Whiteboard (Close tab or go back)"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Exit</span>
        </button>

        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => onModeChange('pdf')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'pdf'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PDF Whiteboard</span>
          </button>
          <button
            onClick={() => onModeChange('web')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'web'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Web Browser</span>
          </button>
        </div>

        {mode === 'pdf' && (
          <button
            onClick={onOpenMaterialsPicker}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition-all cursor-pointer shadow-sm"
            title="Open curriculum materials drawer"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Curriculum Materials</span>
          </button>
        )}

        {mode === 'pdf' && selectedMaterial && (
          <div className="hidden lg:flex items-center gap-2 max-w-[200px] truncate bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 rounded-xl text-xs">
            <span className="font-bold text-zinc-100 truncate">{selectedMaterial.title}</span>
            <button
              onClick={onClearMaterial}
              className="text-zinc-500 hover:text-zinc-300 p-0.5"
              title="Unload material"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Center: Scroll Up / Down and Multi-page navigation */}
      <div className="flex items-center gap-2">
        {/* Universal Scroll Up / Down Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 shadow-inner">
          <button
            onClick={onScrollUp}
            disabled={isPdfLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-600 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-900 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Scroll Up (or Previous Page)"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Up</span>
          </button>
          <button
            onClick={onScrollDown}
            disabled={isPdfLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-600 text-zinc-300 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-900 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Scroll Down (or Next Page)"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Down</span>
          </button>
        </div>

        {/* Loading Indicator in Toolbar */}
        {mode === 'pdf' && isPdfLoading && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono shadow-sm animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            <span className="hidden sm:inline">Loading PDF...</span>
          </div>
        )}

        {mode === 'pdf' && !isPdfLoading && (selectedMaterial || totalPages > 0) && (
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 shadow-inner">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-200 px-1">
              <input
                type="number"
                min={1}
                max={totalPages || 1}
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onKeyDown={handlePageInputKeyDown}
                onBlur={handlePageInputBlur}
                className="w-10 text-center bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                title="Enter page number and press Enter"
              />
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{totalPages || 1}</span>
            </div>
            <button
              onClick={() => onPageChange(Math.min(totalPages || 1, currentPage + 1))}
              disabled={currentPage >= (totalPages || 1)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right: Same PDF Controls as PDF Viewer (Fit Width, Fit Screen, Zoom In/Out/%, Rotate, Fullscreen, Clear) */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {mode === 'pdf' && selectedMaterial && (
          <>
            {/* Fit Width */}
            <button
              onClick={onFitWidth}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                fitMode === 'width'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50'
              }`}
              title="Fit to Width (Stretches document to full width)"
            >
              <StretchHorizontal className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Fit Width</span>
            </button>

            {/* Fit Screen */}
            <button
              onClick={onFitScreen}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                fitMode === 'page'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50'
              }`}
              title="Fit to Screen (Entire page fits on screen)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Fit Screen</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-0.5">
              <button
                onClick={onZoomOut}
                disabled={scale <= 0.3}
                className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsZoomMenuOpen((prev) => !prev)}
                  className="px-2 py-1 rounded-lg hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono font-bold transition-colors min-w-[50px] text-center cursor-pointer"
                  title="Zoom Level Menu"
                >
                  {Math.round(scale * 100)}%
                </button>

                {isZoomMenuOpen && (
                  <div className="absolute top-full mt-2 right-0 w-38 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          onSetScale(preset);
                          setIsZoomMenuOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between hover:bg-zinc-800 transition-colors cursor-pointer ${
                          Math.abs(scale - preset) < 0.05
                            ? 'text-emerald-400 font-bold bg-zinc-800/60'
                            : 'text-zinc-300'
                        }`}
                      >
                        <span>{Math.round(preset * 100)}%</span>
                        {Math.abs(scale - preset) < 0.05 && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                      </button>
                    ))}
                    <div className="border-t border-zinc-800 my-1" />
                    <button
                      onClick={() => {
                        onFitWidth();
                        setIsZoomMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <StretchHorizontal className="h-3 w-3 text-emerald-400" />
                      <span>Fit to Width</span>
                    </button>
                    <button
                      onClick={() => {
                        onFitScreen();
                        setIsZoomMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Maximize2 className="h-3 w-3 text-emerald-400" />
                      <span>Fit to Screen</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onZoomIn}
                disabled={scale >= 3.5}
                className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Rotate */}
            <button
              onClick={onRotate}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition-colors cursor-pointer"
              title="Rotate Page 90°"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>

        {/* Clear Board */}
        {mode === 'pdf' && (
          <button
            onClick={() => {
                onClearCanvas();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 text-zinc-300 border border-zinc-700/60 text-xs font-semibold transition-all cursor-pointer"
            title="Erase whiteboard drawings"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </header>
  );
}
