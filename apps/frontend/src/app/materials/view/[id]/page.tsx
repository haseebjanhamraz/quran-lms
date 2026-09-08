'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/utils/apiFetch';
import {
  Shield,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  BookOpen,
  StretchHorizontal,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface MaterialItem {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category: string;
  targetLevel: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  courseId?: any;
}

interface PageItemProps {
  pdfDoc: any;
  pageNum: number;
  numPages: number;
  scale: number;
  rotation: number;
  baseWidth: number;
  baseHeight: number;
  watermarkText: string;
  onVisible: (pageNum: number) => void;
  showSecurityAlert: (msg: string) => void;
}

function PdfPageItem({
  pdfDoc,
  pageNum,
  numPages,
  scale,
  rotation,
  baseWidth,
  baseHeight,
  watermarkText,
  onVisible,
  showSecurityAlert,
}: PageItemProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [shouldRender, setShouldRender] = useState(pageNum === 1);
  const [rendered, setRendered] = useState(false);
  const [rendering, setRendering] = useState(false);

  const isRotated = rotation === 90 || rotation === 270;
  const effectiveWidth = isRotated ? baseHeight : baseWidth;
  const effectiveHeight = isRotated ? baseWidth : baseHeight;

  const displayWidth = Math.floor(effectiveWidth * scale);
  const displayHeight = Math.floor(effectiveHeight * scale);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setShouldRender(true);
        }
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          onVisible(pageNum);
        }
      },
      {
        root: null,
        rootMargin: '600px 0px 600px 0px',
        threshold: [0, 0.3, 0.6, 0.9],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, onVisible]);

  useEffect(() => {
    if (!shouldRender || !pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const render = async () => {
      try {
        setRendering(true);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        if (!isCancelled) {
          setRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      } finally {
        if (!isCancelled) {
          setRendering(false);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [shouldRender, pdfDoc, pageNum, scale, rotation]);

  return (
    <div
      id={`pdf-page-${pageNum}`}
      ref={containerRef}
      className="relative flex flex-col items-center select-none"
      style={{
        width: `${displayWidth}px`,
        minHeight: `${displayHeight + 32}px`,
      }}
    >
      <div
        className="relative bg-white shadow-2xl rounded-xl overflow-hidden border border-zinc-800 select-none"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      >
        {(!rendered || rendering) && (
          <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[2px] flex items-center justify-center z-15">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 text-zinc-300 text-xs shadow-xl border border-zinc-700/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Loading Page {pageNum}...</span>
            </div>
          </div>
        )}

        <div
          className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-around items-center overflow-hidden opacity-[0.06] select-none"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="whitespace-nowrap font-black text-xs sm:text-sm tracking-[0.25em] uppercase transform -rotate-12 text-zinc-400"
            >
              {watermarkText}
            </div>
          ))}
        </div>

        <div
          className="absolute inset-0 z-10 bg-transparent cursor-default select-none"
          onContextMenu={(e) => {
            e.preventDefault();
            showSecurityAlert('Right-click is disabled to protect materials.');
          }}
          onDragStart={(e) => e.preventDefault()}
        />

        <canvas ref={canvasRef} className="block select-none" />
      </div>

      <div className="mt-2 text-center text-[11px] font-mono font-medium text-zinc-400 select-none">
        Page {pageNum} of {numPages}
      </div>
    </div>
  );
}

export default function GlobalProtectedMaterialViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const materialId = (params?.id as string) || '';

  const [material, setMaterial] = useState<MaterialItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'custom'>('width');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);

  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({
    width: 612,
    height: 792,
  });

  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const showSecurityAlert = useCallback((msg: string) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setSecurityAlert(msg);
    alertTimeoutRef.current = setTimeout(() => {
      setSecurityAlert(null);
    }, 2800);
  }, []);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    } else if (user?.role === 'TEACHER') {
      router.push('/teacher/dashboard?tab=Course+Materials');
    } else {
      router.push('/admin/materials');
    }
  };

  // Auth protection guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // 1. Fetch material metadata
  useEffect(() => {
    if (!materialId) return;

    let isMounted = true;
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch(`${API_URL}/materials/${materialId}`);
        if (!res.ok) {
          throw new Error(`Failed to load document (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          setMaterial(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load document metadata.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMaterial();
    return () => {
      isMounted = false;
    };
  }, [materialId]);

  // 2. Load PDF.js library locally and initialize document
  useEffect(() => {
    if (!material?.fileUrl) return;

    let isCancelled = false;
    const fullPdfUrl = material.fileUrl.startsWith('http')
      ? material.fileUrl
      : `${API_URL.replace('/api/v1', '')}${material.fileUrl}`;

    const loadPdfJs = async () => {
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

        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

          const response = await fetch(fullPdfUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} loading PDF bytes`);
          }
          const arrayBuffer = await response.arrayBuffer();

          if (isCancelled) return;

          const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
          });

          const doc = await loadingTask.promise;
          if (isCancelled) return;

          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setPageInputValue('1');

          const firstPage = await doc.getPage(1);
          const unscaledViewport = firstPage.getViewport({ scale: 1.0, rotation: 0 });
          const dims = {
            width: unscaledViewport.width,
            height: unscaledViewport.height,
          };
          setBaseDimensions(dims);

          // Default to Fit to Width (Full Width)
          if (scrollContainerRef.current) {
            const padding = window.innerWidth < 640 ? 12 : 32;
            const containerWidth = scrollContainerRef.current.clientWidth - padding;
            if (containerWidth > 100) {
              const targetScale = Math.max(0.4, Number((containerWidth / dims.width).toFixed(2)));
              setScale(targetScale);
              setFitMode('width');
            }
          }
        } else {
          throw new Error('PDF.js not available');
        }
      } catch (err: any) {
        console.warn('PDF.js render failed, falling back to secure preview:', err);
        if (!isCancelled) {
          setUseIframeFallback(true);
        }
      }
    };

    loadPdfJs();

    return () => {
      isCancelled = true;
    };
  }, [material]);

  // 3. Fit to Width handler
  const handleFitWidth = useCallback(() => {
    if (!scrollContainerRef.current || !baseDimensions) return;
    const isRotated = rotation === 90 || rotation === 270;
    const effectiveWidth = isRotated ? baseDimensions.height : baseDimensions.width;
    const padding = window.innerWidth < 640 ? 12 : 32;
    const containerWidth = scrollContainerRef.current.clientWidth - padding;
    if (containerWidth > 100) {
      const targetScale = Math.max(0.4, Number((containerWidth / effectiveWidth).toFixed(2)));
      setScale(targetScale);
      setFitMode('width');
    }
  }, [baseDimensions, rotation]);

  // 4. Fit to Screen handler
  const handleFitScreen = useCallback(() => {
    if (!scrollContainerRef.current || !baseDimensions) return;
    const isRotated = rotation === 90 || rotation === 270;
    const effectiveWidth = isRotated ? baseDimensions.height : baseDimensions.width;
    const effectiveHeight = isRotated ? baseDimensions.width : baseDimensions.height;
    const paddingX = window.innerWidth < 640 ? 12 : 32;
    const paddingY = 64;

    const containerWidth = scrollContainerRef.current.clientWidth - paddingX;
    const containerHeight = scrollContainerRef.current.clientHeight - paddingY;

    if (containerWidth > 100 && containerHeight > 100) {
      const scaleW = containerWidth / effectiveWidth;
      const scaleH = containerHeight / effectiveHeight;
      const targetScale = Math.max(0.3, Number(Math.min(scaleW, scaleH).toFixed(2)));
      setScale(targetScale);
      setFitMode('page');
    }
  }, [baseDimensions, rotation]);

  // 5. Window Resize listener for automatic width refitting
  useEffect(() => {
    if (fitMode !== 'width') return;

    const handleResize = () => {
      handleFitWidth();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitMode, handleFitWidth]);

  // 6. Ctrl + Mouse Wheel for smooth zooming
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setFitMode('custom');
        if (e.deltaY < 0) {
          setScale((prev) => Math.min(Number((prev + 0.1).toFixed(2)), 3.5));
        } else {
          setScale((prev) => Math.max(Number((prev - 0.1).toFixed(2)), 0.3));
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // 7. Security Listeners
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Right-click is disabled to protect copyrighted Quran & Tajweed materials.');
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isCtrlOrCmd && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityAlert('Downloading and local saving is disabled in Protected Mode.');
        return;
      }

      if (isCtrlOrCmd && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityAlert('Printing is disabled for protected materials.');
        return;
      }

      if (isCtrlOrCmd && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (isCtrlOrCmd && (key === 'a' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityAlert('Text copying is restricted.');
        return;
      }

      if (
        e.key === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (numPages > 1) {
        if (key === 'arrowright' || key === 'pagedown') {
          scrollToPage(Math.min(numPages, currentPage + 1));
        } else if (key === 'arrowleft' || key === 'pageup') {
          scrollToPage(Math.max(1, currentPage - 1));
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.clearData();
      showSecurityAlert('Copying content is disabled.');
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('copy', handleCopy, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('copy', handleCopy, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, [numPages, currentPage, showSecurityAlert]);

  const scrollToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
      setPageInputValue(pageNum.toString());
    }
  };

  const handlePageVisible = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
    setPageInputValue(pageNum.toString());
  }, []);

  const handleZoomIn = () => {
    setFitMode('custom');
    setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 3.5));
  };
  const handleZoomOut = () => {
    setFitMode('custom');
    setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.3));
  };
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const fullPdfUrl = material?.fileUrl
    ? material.fileUrl.startsWith('http')
      ? material.fileUrl
      : `${API_URL.replace('/api/v1', '')}${material.fileUrl}`
    : '';

  return (
    <div
      className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 select-none overflow-hidden"
      onContextMenu={(e) => {
        e.preventDefault();
        showSecurityAlert('Right-click is disabled to protect materials.');
      }}
      onClick={() => {
        if (isZoomMenuOpen) setIsZoomMenuOpen(false);
      }}
    >
      <style jsx global>{`
        @media print {
          html, body, div, canvas, iframe {
            display: none !important;
            visibility: hidden !important;
          }
        }
        * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
      `}</style>

      {securityAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-950/95 border border-rose-500/50 text-rose-200 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{securityAlert}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-14 shrink-0 bg-zinc-900/90 border-b border-zinc-800/80 px-3 sm:px-4 flex items-center justify-between z-30 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700/50 shrink-0"
            title="Return to Materials"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-zinc-100 truncate max-w-[130px] sm:max-w-[200px] md:max-w-xs lg:max-w-md">
                {material?.title || 'Loading Document...'}
              </h1>
              {material && (
                <p className="text-[10px] text-zinc-400 hidden sm:block truncate">
                  {material.category} &bull; {material.targetLevel} Level
                </p>
              )}
            </div>
          </div>

          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Shield className="h-3 w-3" />
            <span>PROTECTED READ-ONLY</span>
          </div>
        </div>

        {/* Center: Multi-page navigation */}
        {numPages > 1 && (
          <div className="flex items-center gap-1 bg-zinc-800/80 border border-zinc-700/60 rounded-xl px-2 py-1">
            <button
              onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 text-xs font-mono font-semibold text-zinc-200 px-1">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = parseInt(pageInputValue, 10);
                    if (!isNaN(target) && target >= 1 && target <= numPages) {
                      scrollToPage(target);
                    }
                  }
                }}
                onBlur={() => {
                  const target = parseInt(pageInputValue, 10);
                  if (!isNaN(target) && target >= 1 && target <= numPages) {
                    scrollToPage(target);
                  } else {
                    setPageInputValue(currentPage.toString());
                  }
                }}
                className="w-10 text-center bg-zinc-900/90 border border-zinc-700 rounded px-1 py-0.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                title="Enter page number and press Enter"
              />
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{numPages}</span>
            </div>

            <button
              onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Right Section Controls */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleFitWidth}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              fitMode === 'width'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50'
            }`}
            title="Fit to Width (Stretches document to full width)"
          >
            <StretchHorizontal className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Fit Width</span>
          </button>

          <button
            onClick={handleFitScreen}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              fitMode === 'page'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50'
            }`}
            title="Fit to Screen (Entire page fits on screen)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Fit to Screen</span>
          </button>

          <div className="flex items-center gap-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.3}
              className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsZoomMenuOpen((prev) => !prev)}
                className="px-2 py-1 rounded-lg hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono font-bold transition-colors min-w-[50px] text-center"
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
                        setScale(preset);
                        setFitMode('custom');
                        setIsZoomMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between hover:bg-zinc-800 transition-colors ${
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
                      handleFitWidth();
                      setIsZoomMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <StretchHorizontal className="h-3 w-3 text-emerald-400" />
                    <span>Fit to Width</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFitScreen();
                      setIsZoomMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <Maximize2 className="h-3 w-3 text-emerald-400" />
                    <span>Fit to Screen</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleRotate}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50 hidden lg:block"
            title="Rotate Clockwise"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* Viewport */}
      <main
        ref={scrollContainerRef}
        className="flex-1 w-full h-full overflow-y-auto overflow-x-auto bg-zinc-950 px-1 sm:px-3 py-4"
        tabIndex={0}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs font-medium">Fetching secure material...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 text-center max-w-sm p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">Unable to Load Material</h3>
              <p className="text-xs text-zinc-400">{error}</p>
              <button
                onClick={handleGoBack}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition-all"
              >
                Back to Materials
              </button>
            </div>
          </div>
        )}

        {!loading && !error && pdfDoc && !useIframeFallback && (
          <div className="flex flex-col items-center gap-6 min-w-full w-max mx-auto">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <PdfPageItem
                key={`${pageNum}-${rotation}`}
                pdfDoc={pdfDoc}
                pageNum={pageNum}
                numPages={numPages}
                scale={scale}
                rotation={rotation}
                baseWidth={baseDimensions.width}
                baseHeight={baseDimensions.height}
                watermarkText={`AIN UL QURAN ACADEMY • PROTECTED READ-ONLY • ${user?.email || 'AUTHORIZED USER'}`}
                onVisible={handlePageVisible}
                showSecurityAlert={showSecurityAlert}
              />
            ))}
          </div>
        )}

        {!loading && !error && useIframeFallback && (
          <div className="flex flex-col items-center justify-start w-full min-h-full py-2">
            <div
              className="w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl relative transition-all duration-200"
              style={{
                width: fitMode === 'width' ? '100%' : `${Math.floor(scale * 100)}%`,
                maxWidth: fitMode === 'width' ? '100%' : '1400px',
                height: 'calc(100vh - 86px)',
              }}
            >
              <div
                className="absolute inset-0 z-10 bg-transparent cursor-default select-none"
                onContextMenu={(e) => {
                  e.preventDefault();
                  showSecurityAlert('Right-click is disabled on protected documents.');
                }}
              />
              <iframe
                src={`${fullPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-none pointer-events-auto"
                title={material?.title || 'Material Document'}
              />
            </div>
          </div>
        )}
      </main>

      {/* Status Footer */}
      <footer className="h-8 shrink-0 bg-zinc-900/80 border-t border-zinc-800/80 px-4 flex items-center justify-between text-[11px] text-zinc-400 z-30">
        <div className="flex items-center gap-2">
          <Lock className="h-3 w-3 text-emerald-400" />
          <span className="font-medium text-zinc-300">Protected Mode:</span>
          <span>Download &amp; context menu disabled</span>
        </div>

        <div className="flex items-center gap-3">
          {numPages > 0 && <span>Page {currentPage} of {numPages}</span>}
          <span className="font-mono text-zinc-300">{Math.round(scale * 100)}%</span>
          <span>Ain Ul Quran LMS</span>
        </div>
      </footer>
    </div>
  );
}
