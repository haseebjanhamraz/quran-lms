'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Editor } from 'tldraw';
import { apiFetch } from '@/utils/apiFetch';
import { X, ChevronUp, ChevronDown, Globe } from 'lucide-react';
import { MaterialItem } from '../materials/types';
import MaterialsManager from '../materials/MaterialsManager';
import WhiteboardToolbar from './WhiteboardToolbar';
import PdfTeachingView from './PdfTeachingView';
import MaterialsPicker from './MaterialsPicker';
import WebViewer from './WebViewer';

// Dynamically import WhiteboardCanvas to prevent SSR window/canvas issues with tldraw
const WhiteboardCanvas = dynamic(() => import('./WhiteboardCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
      <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs shadow-lg animate-pulse">
        Initializing Whiteboard Canvas...
      </div>
    </div>
  ),
});

export default function OnlineClassMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMaterialId = searchParams?.get('materialId');

  const [teachingMode, setTeachingMode] = useState<'pdf' | 'web'>('pdf');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isMaterialsPickerOpen, setIsMaterialsPickerOpen] = useState<boolean>(false);
  const [isFullMaterialsModalOpen, setIsFullMaterialsModalOpen] = useState<boolean>(false);

  // PDF Viewer Controls State
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'custom'>('width');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [isFetchingMaterial, setIsFetchingMaterial] = useState<boolean>(Boolean(queryMaterialId));

  const editorRef = useRef<Editor | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // Clear whiteboard canvas
  const handleClearCanvas = useCallback(() => {
    if (editorRef.current) {
      try {
        const shapeIds = editorRef.current.getCurrentPageShapeIds();
        if (shapeIds.size > 0) {
          editorRef.current.deleteShapes(Array.from(shapeIds));
        }
      } catch (err) {
        console.error('Error clearing shapes:', err);
      }
    }
  }, []);

  // When changing PDF page, update page and clear page annotations
  const handlePageChange = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setCurrentPage(validPage);
    handleClearCanvas();
    if (editorRef.current) {
      try {
        editorRef.current.setCamera({ x: 0, y: 0, z: 1 });
      } catch (_) {}
    }
    const container = document.getElementById('pdf-teaching-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, [totalPages, handleClearCanvas]);

  // When presenting a material (from picker or MaterialsManager)
  const handleSelectMaterial = (material: MaterialItem) => {
    setSelectedMaterial(material);
    setCurrentPage(1);
    setFitMode('width');
    setTeachingMode('pdf');
    handleClearCanvas();
  };

  // When unloading material
  const handleClearMaterial = () => {
    setSelectedMaterial(null);
    setCurrentPage(1);
    setTotalPages(0);
    handleClearCanvas();
  };

  // PDF Zoom & Scale Handlers
  const handleZoomIn = () => {
    setFitMode('custom');
    setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.3));
  };

  const handleSetScale = (newScale: number) => {
    setScale(newScale);
    setFitMode('custom');
  };

  const handleFitWidth = () => {
    setFitMode('width');
  };

  const handleFitScreen = () => {
    setFitMode('page');
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleFullscreen = () => {
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

  const handleGoBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    } else {
      router.back();
    }
  }, [router]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Scroll Up / Down Handlers for PDF and Web Browser
  const handleScrollDown = useCallback(() => {
    if (teachingMode === 'pdf') {
      const pdfContainer = document.getElementById('pdf-teaching-scroll-container');
      if (pdfContainer) {
        const maxScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight;
        if (maxScroll > 20 && pdfContainer.scrollTop < maxScroll - 15) {
          pdfContainer.scrollBy({ top: 320, behavior: 'smooth' });
          return;
        }
      }
      // If at bottom of page or page fits screen, advance to next page
      if (totalPages > 1 && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
        setTimeout(() => {
          const container = document.getElementById('pdf-teaching-scroll-container');
          if (container) container.scrollTop = 0;
        }, 60);
      }
    } else if (teachingMode === 'web') {
      const webIframe = document.querySelector('iframe[title="Online Class Web Teaching View"]') as HTMLIFrameElement | null;
      try {
        if (webIframe?.contentWindow) {
          webIframe.contentWindow.scrollBy({ top: 320, behavior: 'smooth' });
        }
      } catch (_) {
        webIframe?.focus();
      }
      const webContainer = document.getElementById('web-teaching-scroll-container');
      if (webContainer) {
        webContainer.scrollBy({ top: 320, behavior: 'smooth' });
      }
    }
  }, [teachingMode, currentPage, totalPages, handlePageChange]);

  const handleScrollUp = useCallback(() => {
    if (teachingMode === 'pdf') {
      const pdfContainer = document.getElementById('pdf-teaching-scroll-container');
      if (pdfContainer) {
        if (pdfContainer.scrollTop > 15) {
          pdfContainer.scrollBy({ top: -320, behavior: 'smooth' });
          return;
        }
      }
      // If at top of page or page fits screen, go to previous page
      if (totalPages > 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
    } else if (teachingMode === 'web') {
      const webIframe = document.querySelector('iframe[title="Online Class Web Teaching View"]') as HTMLIFrameElement | null;
      try {
        if (webIframe?.contentWindow) {
          webIframe.contentWindow.scrollBy({ top: -320, behavior: 'smooth' });
        }
      } catch (_) {
        webIframe?.focus();
      }
      const webContainer = document.getElementById('web-teaching-scroll-container');
      if (webContainer) {
        webContainer.scrollBy({ top: -320, behavior: 'smooth' });
      }
    }
  }, [teachingMode, currentPage, totalPages, handlePageChange]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown') {
        handleScrollDown();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') {
        handleScrollUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScrollDown, handleScrollUp]);

  // Automatically load material if materialId is passed in URL query param
  useEffect(() => {
    if (!queryMaterialId) {
      setIsFetchingMaterial(false);
      return;
    }

    let isMounted = true;
    setIsFetchingMaterial(true);
    const fetchMaterialById = async () => {
      try {
        const res = await apiFetch(`${API_URL}/materials/${queryMaterialId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setSelectedMaterial(data);
            setCurrentPage(1);
            setFitMode('width');
            setTeachingMode('pdf');
            handleClearCanvas();
          }
        }
      } catch (err) {
        console.error('Failed to load material from query parameter:', err);
      } finally {
        if (isMounted) {
          setIsFetchingMaterial(false);
        }
      }
    };

    fetchMaterialById();
    return () => {
      isMounted = false;
    };
  }, [queryMaterialId, API_URL]);

  return (
    <div className="relative flex flex-col w-screen h-screen bg-zinc-950 text-foreground overflow-hidden select-none">
      {/* Top Universal Whiteboard & PDF Controls Toolbar */}
      <WhiteboardToolbar
        mode={teachingMode}
        onModeChange={setTeachingMode}
        selectedMaterial={selectedMaterial}
        onOpenMaterialsPicker={() => setIsMaterialsPickerOpen(true)}
        onClearMaterial={handleClearMaterial}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onClearCanvas={handleClearCanvas}
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSetScale={handleSetScale}
        fitMode={fitMode}
        onFitWidth={handleFitWidth}
        onFitScreen={handleFitScreen}
        rotation={rotation}
        onRotate={handleRotate}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onGoBack={handleGoBack}
        onScrollUp={handleScrollUp}
        onScrollDown={handleScrollDown}
        isPdfLoading={isPdfLoading}
      />

      {/* Main Interactive Stage (Takes 100% of remaining height) */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden bg-zinc-950">
        {/* Layer 0A: PDF Teaching View (Preserves scroll & zoom state) */}
        <div
          className={`absolute inset-0 w-full h-full ${
            teachingMode === 'pdf' ? 'z-0 visible' : 'invisible -z-10 pointer-events-none'
          }`}
        >
          <PdfTeachingView
            fileUrl={selectedMaterial?.fileUrl || null}
            materialTitle={selectedMaterial?.title}
            currentPage={currentPage}
            scale={scale}
            rotation={rotation}
            fitMode={fitMode}
            onNumPagesChange={setTotalPages}
            onSelectMaterialClick={() => setIsMaterialsPickerOpen(true)}
            onScaleCalculated={(calcScale) => {
              if (fitMode === 'width' || fitMode === 'page') {
                setScale(calcScale);
              }
            }}
            onLoadingChange={setIsPdfLoading}
            isLoading={isFetchingMaterial}
          />
        </div>

        {/* Layer 0B: Web Browser View (Preserves iframe navigation & session state) */}
        <div
          className={`absolute inset-0 w-full h-full ${
            teachingMode === 'web' ? 'z-0 visible' : 'invisible -z-10 pointer-events-none'
          }`}
        >
          <WebViewer initialUrl="https://quran.com" />
        </div>

        {/* Layer 1: Foreground Transparent Whiteboard Canvas (PERSISTENT in BOTH PDF and Web modes) */}
        <WhiteboardCanvas
          onEditorReady={(editor) => {
            editorRef.current = editor;
          }}
          isWebMode={teachingMode === 'web'}
          onPageNext={handleScrollDown}
          onPagePrev={handleScrollUp}
        />

        {/* Floating Vertical Up / Down Scroll Navigation Widget on Right Side */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl select-none">
          <button
            type="button"
            onClick={handleScrollUp}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white transition-all shadow cursor-pointer active:scale-95 group"
            title="Scroll Up (or Previous Page)"
          >
            <ChevronUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Mode & Page Indicator */}
          <div className="py-1 px-2 flex flex-col items-center text-center">
            {teachingMode === 'pdf' ? (
              <>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Page</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {currentPage}<span className="text-zinc-500 font-normal">/{totalPages || 1}</span>
                </span>
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5 text-emerald-400 mb-0.5" />
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Web</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleScrollDown}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white transition-all shadow cursor-pointer active:scale-95 group"
            title="Scroll Down (or Next Page)"
          >
            <ChevronDown className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Slide-out Materials Picker Drawer */}
      <MaterialsPicker
        isOpen={isMaterialsPickerOpen}
        onClose={() => setIsMaterialsPickerOpen(false)}
        onSelectMaterial={handleSelectMaterial}
        selectedMaterialId={selectedMaterial?.id || selectedMaterial?._id}
      />

      {/* Full MaterialsManager Modal */}
      {isFullMaterialsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl custom-scrollbar">
            <button
              onClick={() => setIsFullMaterialsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10 cursor-pointer"
              title="Close Materials Library"
            >
              <X className="h-5 w-5" />
            </button>
            <MaterialsManager
              userRole="TEACHER"
              title="Curriculum Materials Library"
              subtitle="Click 'Present' on any PDF below to project it onto the interactive whiteboard."
              onPresent={(mat) => {
                handleSelectMaterial(mat);
                setIsFullMaterialsModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}