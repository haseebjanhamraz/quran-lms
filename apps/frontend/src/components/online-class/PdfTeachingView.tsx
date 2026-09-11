'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, FileText, AlertTriangle, RefreshCw, BookOpen, Sparkles } from 'lucide-react';

interface LoadingProgress {
  phase: 'engine' | 'downloading' | 'parsing' | 'rendering';
  message: string;
  percentage: number;
  loadedBytes?: number;
  totalBytes?: number;
}

interface PdfTeachingViewProps {
  fileUrl: string | null;
  materialTitle?: string;
  currentPage: number;
  scale: number;
  rotation: number;
  fitMode: 'width' | 'page' | 'custom';
  onNumPagesChange?: (numPages: number) => void;
  onSelectMaterialClick?: () => void;
  onScaleCalculated?: (scale: number) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  isLoading?: boolean;
}

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function PdfTeachingView({
  fileUrl,
  materialTitle,
  currentPage,
  scale,
  rotation,
  fitMode,
  onNumPagesChange,
  onSelectMaterialClick,
  onScaleCalculated,
  onLoadingChange,
  isLoading = false,
}: PdfTeachingViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    phase: 'engine',
    message: 'Preparing document loader...',
    percentage: 0,
  });
  const [renderingPage, setRenderingPage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loadingDoc || renderingPage);
  }, [loadingDoc, renderingPage, onLoadingChange]);

  // 1. Load PDF document when fileUrl changes
  useEffect(() => {
    if (!fileUrl) {
      setPdfDoc(null);
      onNumPagesChange?.(0);
      return;
    }

    let isCancelled = false;
    const fullPdfUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `${API_URL.replace('/api/v1', '')}${fileUrl}`;

    const loadPdf = async () => {
      setLoadingDoc(true);
      setLoadError(null);
      setLoadingProgress({
        phase: 'engine',
        message: 'Initializing PDF rendering engine...',
        percentage: 10,
      });

      try {
        let pdfjs = (window as any).pdfjsLib;

        if (!pdfjs) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/pdfjs/pdf.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
              const cdnScript = document.createElement('script');
              cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
              cdnScript.async = true;
              cdnScript.onload = () => resolve();
              cdnScript.onerror = () => reject(new Error('Failed to load PDF engine'));
              document.head.appendChild(cdnScript);
            };
            document.head.appendChild(script);
          });
          pdfjs = (window as any).pdfjsLib;
        }

        if (!pdfjs) throw new Error('PDF.js engine could not be initialized');

        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

        if (isCancelled) return;

        setLoadingProgress({
          phase: 'downloading',
          message: 'Downloading curriculum document...',
          percentage: 20,
        });

        const response = await fetch(fullPdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to download curriculum PDF (Status ${response.status})`);
        }

        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        let loadedBytes = 0;
        let arrayBuffer: ArrayBuffer;

        if (response.body && totalBytes > 0) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (isCancelled) return;
            if (value) {
              chunks.push(value);
              loadedBytes += value.length;
              const pct = Math.min(95, Math.round(20 + (loadedBytes / totalBytes) * 70));
              setLoadingProgress({
                phase: 'downloading',
                message: `Downloading document (${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)})...`,
                percentage: pct,
                loadedBytes,
                totalBytes,
              });
            }
          }
          const allBytes = new Uint8Array(loadedBytes);
          let position = 0;
          for (const chunk of chunks) {
            allBytes.set(chunk, position);
            position += chunk.length;
          }
          arrayBuffer = allBytes.buffer;
        } else {
          arrayBuffer = await response.arrayBuffer();
        }

        if (isCancelled) return;

        setLoadingProgress({
          phase: 'parsing',
          message: 'Parsing curriculum pages & layout...',
          percentage: 95,
        });

        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setLoadingProgress({
          phase: 'rendering',
          message: `Ready! Rendering page 1 of ${doc.numPages}...`,
          percentage: 100,
        });

        setPdfDoc(doc);
        onNumPagesChange?.(doc.numPages);
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) {
          setLoadError(err?.message || 'Failed to load PDF');
        }
      } finally {
        if (!isCancelled) {
          setLoadingDoc(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, API_URL, onNumPagesChange, reloadTrigger]);

  // 2. Render the specific page onto the background canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
        await renderTaskRef.current.promise;
      } catch (_) {
        // Expected cancellation
      }
      renderTaskRef.current = null;
    }

    try {
      setRenderingPage(true);
      const pageNumber = Math.min(Math.max(1, currentPage), pdfDoc.numPages);
      const page = await pdfDoc.getPage(pageNumber);

      const unscaledViewport = page.getViewport({ scale: 1.0, rotation });
      const container = containerRef.current;
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;

      if (cWidth === 0 || cHeight === 0) return;

      const isRotated = rotation === 90 || rotation === 270;
      const effectiveWidth = isRotated ? unscaledViewport.height : unscaledViewport.width;
      const effectiveHeight = isRotated ? unscaledViewport.width : unscaledViewport.height;

      let effectiveScale = scale;
      if (fitMode === 'width') {
        const paddingX = window.innerWidth < 640 ? 16 : 48;
        const availableW = cWidth - paddingX;
        if (availableW > 100 && effectiveWidth > 0) {
          effectiveScale = Math.max(0.4, Number((availableW / effectiveWidth).toFixed(2)));
        }
      } else if (fitMode === 'page') {
        const paddingX = window.innerWidth < 640 ? 16 : 48;
        const paddingY = 48;
        const availableW = cWidth - paddingX;
        const availableH = cHeight - paddingY;
        if (availableW > 100 && availableH > 100 && effectiveWidth > 0 && effectiveHeight > 0) {
          const sW = availableW / effectiveWidth;
          const sH = availableH / effectiveHeight;
          effectiveScale = Math.max(0.3, Number(Math.min(sW, sH).toFixed(2)));
        }
      }

      const viewport = page.getViewport({ scale: effectiveScale, rotation });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      setPageSize({
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
      });

      // Clear previous page bitmap completely before rendering new page
      context.clearRect(0, 0, canvas.width, canvas.height);

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: context,
        transform,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Page ${currentPage} rendering error:`, err);
      }
    } finally {
      setRenderingPage(false);
    }
  }, [pdfDoc, currentPage, scale, rotation, fitMode]);

  useEffect(() => {
    renderCurrentPage();

    const handleResize = () => {
      renderCurrentPage();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [renderCurrentPage]);

  const isDocumentLoading = Boolean(
    isLoading || loadingDoc || (fileUrl && !pdfDoc && !loadError)
  );

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isDocumentLoading || renderingPage);
  }, [isDocumentLoading, renderingPage, onLoadingChange]);

  // 1. Loading Document state (Checked FIRST so empty state never flashes)
  if (isDocumentLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 select-none animate-fadeIn">
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl max-w-md w-full flex flex-col items-center backdrop-blur-xl">
          {/* Animated Glowing Icon */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="h-8 w-8 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            </div>
          </div>

          {/* Title & Phase */}
          <h3 className="text-base font-bold text-zinc-100 mb-1 text-center truncate max-w-full">
            {materialTitle || 'Loading Curriculum Material'}
          </h3>
          <p className="text-xs text-zinc-400 font-mono mb-4 text-center min-h-[18px]">
            {loadingProgress.message || 'Retrieving curriculum document...'}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-2.5 p-0.5 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${Math.max(10, loadingProgress.percentage)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Stats / Percentage */}
          <div className="w-full flex items-center justify-between text-[11px] text-zinc-500 font-mono mb-5">
            <span>
              {loadingProgress.loadedBytes && loadingProgress.totalBytes
                ? `${formatBytes(loadingProgress.loadedBytes)} / ${formatBytes(loadingProgress.totalBytes)}`
                : 'Connecting to material repository...'}
            </span>
            <span className="font-bold text-emerald-400">
              {loadingProgress.percentage > 0 ? `${loadingProgress.percentage}%` : 'Loading...'}
            </span>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-zinc-800/80 w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Optimizing high-res vector text for interactive whiteboard</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error loading document
  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-rose-400 p-6 text-center select-none animate-fadeIn">
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-rose-900/40 shadow-2xl max-w-md w-full flex flex-col items-center backdrop-blur-xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-zinc-100 mb-1">Failed to Load Curriculum Material</h4>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed max-w-sm">
            {loadError}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReloadTrigger((prev) => prev + 1)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Loading</span>
            </button>
            {onSelectMaterialClick && (
              <button
                onClick={onSelectMaterialClick}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700/60 cursor-pointer"
              >
                Browse Materials
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty state: Truly No material selected and not loading
  if (!fileUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8 text-center select-none">
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl mb-4 max-w-md flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">No Curriculum PDF Loaded</h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Click &quot;Curriculum Materials&quot; above to select a Quran Parah, Noorani/Madani Qaida, or Tajweed guide. It will be displayed here as an interactive blackboard background.
          </p>
          {onSelectMaterialClick && (
            <button
              onClick={onSelectMaterialClick}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Browse Curriculum Materials</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="pdf-teaching-scroll-container"
      className="relative w-full h-full overflow-y-auto overflow-x-auto custom-scrollbar bg-zinc-950 p-4 sm:p-6 select-none"
    >
      {/* Top thin loading progress bar while rendering new page */}
      {renderingPage && (
        <div className="fixed top-14 left-0 right-0 h-1 bg-emerald-500/20 z-40 overflow-hidden">
          <div className="h-full bg-emerald-400 animate-pulse w-full" />
        </div>
      )}

      {/* Page rendering indicator */}
      {renderingPage && (
        <div className="fixed top-18 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/95 border border-emerald-500/40 text-zinc-200 text-xs shadow-2xl backdrop-blur-md animate-fadeIn">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
          <span className="font-mono font-medium">Rendering Page {currentPage}...</span>
        </div>
      )}

      {/* Centering wrapper that allows full scroll top-to-bottom */}
      <div className="min-w-full min-h-full flex items-center justify-center py-4">
        {/* PDF Page Canvas */}
        <div
          className="relative bg-white shadow-2xl rounded-xl overflow-hidden border border-zinc-800 transition-all duration-150"
          style={{
            width: pageSize?.width ? `${pageSize.width}px` : 'auto',
            height: pageSize?.height ? `${pageSize.height}px` : 'auto',
          }}
        >
          <canvas ref={canvasRef} className="block select-none pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
