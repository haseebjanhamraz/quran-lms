'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Tldraw,
  Editor,
  DefaultColorStyle,
  DefaultSizeStyle,
  GeoShapeGeoStyle,
  react,
} from 'tldraw';
import {
  MousePointer,
  Hand,
  Pencil,
  Highlighter,
  Eraser,
  ArrowUpRight,
  Minus,
  Type,
  Square,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Check,
  X,
  Globe,
} from 'lucide-react';
import 'tldraw/tldraw.css';
import './whiteboard.css';

interface WhiteboardCanvasProps {
  onEditorReady?: (editor: Editor) => void;
  isWebMode?: boolean;
  onPageNext?: () => void;
  onPagePrev?: () => void;
}

// 12 official colors from tldraw.com
const TL_COLORS = [
  { id: 'black', label: 'Black', hex: '#1d1d1d' },
  { id: 'grey', label: 'Grey', hex: '#9fa8b2' },
  { id: 'light-violet', label: 'Light Violet', hex: '#e085f4' },
  { id: 'violet', label: 'Violet', hex: '#ae3ec9' },
  { id: 'blue', label: 'Blue', hex: '#4465e9' },
  { id: 'light-blue', label: 'Light Blue', hex: '#4ba1f1' },
  { id: 'yellow', label: 'Yellow', hex: '#f1ac4b' },
  { id: 'orange', label: 'Orange', hex: '#e16919' },
  { id: 'green', label: 'Green', hex: '#099268' },
  { id: 'light-green', label: 'Light Green', hex: '#4cb05e' },
  { id: 'light-red', label: 'Light Red', hex: '#f87777' },
  { id: 'red', label: 'Red', hex: '#e03131' },
];

// Stroke sizes supported by tldraw
const TL_SIZES: { id: 's' | 'm' | 'l' | 'xl'; label: string; dotClass: string }[] = [
  { id: 's', label: 'Small', dotClass: 'w-1.5 h-1.5' },
  { id: 'm', label: 'Medium', dotClass: 'w-2.5 h-2.5' },
  { id: 'l', label: 'Large', dotClass: 'w-3.5 h-3.5' },
  { id: 'xl', label: 'Extra Large', dotClass: 'w-4.5 h-4.5' },
];

export default function WhiteboardCanvas({
  onEditorReady,
  isWebMode = false,
  onPageNext,
  onPagePrev,
}: WhiteboardCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeTool, setActiveTool] = useState<string>('draw');
  const [activeColor, setActiveColor] = useState<string>('red');
  const [activeSize, setActiveSize] = useState<'s' | 'm' | 'l' | 'xl'>('m');
  const [webInteraction, setWebInteraction] = useState<'browse' | 'draw'>('browse');
  const [isWheelingWeb, setIsWheelingWeb] = useState<boolean>(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false); // Closed by default
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [autoHide, setAutoHide] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('online_class_whiteboard_autohide') === 'true';
    }
    return false;
  });
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringToolbarRef = useRef<boolean>(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const colorTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Persist autoHide in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('online_class_whiteboard_autohide', autoHide ? 'true' : 'false');
    }
  }, [autoHide]);

  // Switch to browse by default when entering Web mode
  useEffect(() => {
    if (isWebMode) {
      setWebInteraction('browse');
    }
  }, [isWebMode]);

  const handleMount = useCallback(
    (editorInstance: Editor) => {
      setEditor(editorInstance);
      onEditorReady?.(editorInstance);

      // Ensure instance is writable
      try {
        editorInstance.updateInstanceState({ isReadonly: false });
      } catch (_) {}

      // Lock camera completely so whiteboard canvas itself never scrolls or drifts
      try {
        editorInstance.setCameraOptions({
          isLocked: true,
          wheelBehavior: 'none',
          panSpeed: 0,
          zoomSpeed: 0,
        });
        editorInstance.setCamera({ x: 0, y: 0, z: 1 });
      } catch (_) {}

      // Default to pen/draw tool so teacher can start drawing immediately
      try {
        editorInstance.setCurrentTool('draw');
        setActiveTool('draw');
      } catch (_) {}

      // Default to red color (high contrast for Quran / teaching materials)
      try {
        editorInstance.setStyleForNextShapes(DefaultColorStyle, 'red');
        setActiveColor('red');
      } catch (_) {}

      // Default to medium stroke size
      try {
        editorInstance.setStyleForNextShapes(DefaultSizeStyle, 'm');
        setActiveSize('m');
      } catch (_) {}

      // Synchronize UI state reactively with tldraw's state
      const unreact = react('sync-whiteboard-state', () => {
        try {
          const toolId = editorInstance.getCurrentToolId();
          if (toolId) {
            setActiveTool(toolId);
          }
          const color = editorInstance.getSharedStyles().getAsKnownValue(DefaultColorStyle);
          if (color) {
            setActiveColor(color);
          }
          const size = editorInstance.getSharedStyles().getAsKnownValue(DefaultSizeStyle) as
            | 's'
            | 'm'
            | 'l'
            | 'xl';
          if (size) {
            setActiveSize(size);
          }
        } catch (_) {}
      });

      return () => {
        unreact();
      };
    },
    [onEditorReady]
  );

  // Intercept wheel events on the whiteboard: do not scroll the whiteboard, instead scroll PDF or Browser content
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    let accumulatedDeltaY = 0;
    let pageTurnTimeout: NodeJS.Timeout | null = null;

    const handleWheelCapture = (e: WheelEvent) => {
      // 1. In Web Mode:
      if (isWebMode) {
        // If in draw mode, temporarily allow pass-through during wheel gesture
        if (webInteraction === 'draw') {
          setIsWheelingWeb(true);
          if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
          wheelTimeoutRef.current = setTimeout(() => {
            setIsWheelingWeb(false);
          }, 400);
        }
        return;
      }

      // 2. In PDF Mode:
      e.stopPropagation();

      const pdfContainer = document.getElementById('pdf-teaching-scroll-container');
      if (!pdfContainer) return;

      const maxScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight;
      const isScrollable = maxScroll > 20;

      if (isScrollable) {
        const atBottom = pdfContainer.scrollTop >= maxScroll - 5 && e.deltaY > 0;
        const atTop = pdfContainer.scrollTop <= 5 && e.deltaY < 0;

        if (!atBottom && !atTop) {
          // Normal within-page scroll
          pdfContainer.scrollBy({
            top: e.deltaY,
            left: e.deltaX,
            behavior: 'auto',
          });
          accumulatedDeltaY = 0;
          return;
        }
      }

      // If at boundary or page fits screen (not scrollable), accumulate delta for page flip
      accumulatedDeltaY += e.deltaY;
      if (pageTurnTimeout) clearTimeout(pageTurnTimeout);
      pageTurnTimeout = setTimeout(() => {
        accumulatedDeltaY = 0;
      }, 350);

      const THRESHOLD = 90;
      if (accumulatedDeltaY > THRESHOLD) {
        accumulatedDeltaY = 0;
        onPageNext?.();
      } else if (accumulatedDeltaY < -THRESHOLD) {
        accumulatedDeltaY = 0;
        onPagePrev?.();
      }
    };

    container.addEventListener('wheel', handleWheelCapture, { capture: true, passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelCapture, { capture: true });
      if (pageTurnTimeout) clearTimeout(pageTurnTimeout);
    };
  }, [isWebMode, webInteraction, onPageNext, onPagePrev]);

  // Keep whiteboard annotations synchronized with PDF scroll position
  useEffect(() => {
    if (isWebMode || !editor) return;

    const pdfContainer = document.getElementById('pdf-teaching-scroll-container');
    if (!pdfContainer) return;

    const handlePdfScroll = () => {
      try {
        const scrollTop = pdfContainer.scrollTop;
        const scrollLeft = pdfContainer.scrollLeft;
        // Shift camera 1-to-1 with the PDF content scroll
        editor.setCamera({ x: -scrollLeft, y: -scrollTop, z: 1 });
      } catch (_) {}
    };

    pdfContainer.addEventListener('scroll', handlePdfScroll, { passive: true });
    return () => {
      pdfContainer.removeEventListener('scroll', handlePdfScroll);
    };
  }, [isWebMode, editor]);

  const selectTool = useCallback(
    (toolId: string) => {
      if (!editor) return;
      if (isWebMode && webInteraction === 'browse') {
        setWebInteraction('draw');
      }
      try {
        if (toolId === 'geo') {
          editor.run(() => {
            editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle');
            editor.setCurrentTool('geo');
          });
        } else {
          editor.setCurrentTool(toolId);
        }
        setActiveTool(toolId);
      } catch (err) {
        console.warn('Error setting tool:', err);
      }
    },
    [editor, isWebMode, webInteraction]
  );

  const selectColor = useCallback(
    (colorId: string) => {
      if (!editor) return;
      try {
        editor.run(() => {
          editor.setStyleForNextShapes(DefaultColorStyle, colorId as any);
          editor.setStyleForSelectedShapes(DefaultColorStyle, colorId as any);
        });
        setActiveColor(colorId);
      } catch (err) {
        console.warn('Error setting color:', err);
      }
    },
    [editor]
  );

  const selectSize = useCallback(
    (sizeId: 's' | 'm' | 'l' | 'xl') => {
      if (!editor) return;
      try {
        editor.run(() => {
          editor.setStyleForNextShapes(DefaultSizeStyle, sizeId);
          editor.setStyleForSelectedShapes(DefaultSizeStyle, sizeId);
        });
        setActiveSize(sizeId);
      } catch (err) {
        console.warn('Error setting size:', err);
      }
    },
    [editor]
  );

  // Close color picker on click outside or Escape key
  useEffect(() => {
    if (!isColorPickerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(target) &&
        colorTriggerRef.current &&
        !colorTriggerRef.current.contains(target)
      ) {
        setIsColorPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsColorPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isColorPickerOpen]);

  // Cancel countdown and restore toolbar visibility
  const cancelCountdownAndShow = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsIdle(false);
    setCountdown(5);
  }, []);

  // Start 5-second countdown (counting down 5, 4, 3, 2, 1 -> hides)
  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (!autoHide || isColorPickerOpen) return;

    setCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsIdle(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [autoHide, isColorPickerOpen]);

  // Handle changes in autoHide or isColorPickerOpen
  useEffect(() => {
    if (!autoHide) {
      cancelCountdownAndShow();
      return;
    }

    if (isColorPickerOpen) {
      cancelCountdownAndShow();
      return;
    }

    // If autoHide is enabled and not hovering toolbar, start countdown
    if (!isHoveringToolbarRef.current) {
      startCountdown();
    } else {
      cancelCountdownAndShow();
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [autoHide, isColorPickerOpen, startCountdown, cancelCountdownAndShow]);

  // Mouse event handlers for toolbar dock
  const handleToolbarMouseEnter = () => {
    isHoveringToolbarRef.current = true;
    cancelCountdownAndShow();
  };

  const handleToolbarMouseLeave = () => {
    isHoveringToolbarRef.current = false;
    if (autoHide && !isColorPickerOpen) {
      startCountdown();
    }
  };

  const handleBottomHoverZoneEnter = () => {
    isHoveringToolbarRef.current = true;
    cancelCountdownAndShow();
  };

  const tools = [
    { id: 'select', label: 'Select (V)', icon: MousePointer },
    { id: 'draw', label: 'Pen / Draw (D)', icon: Pencil },
    { id: 'highlight', label: 'Highlighter (Shift+D)', icon: Highlighter },
    { id: 'eraser', label: 'Eraser (E)', icon: Eraser },
    { id: 'arrow', label: 'Arrow (A)', icon: ArrowUpRight },
    { id: 'line', label: 'Line (L)', icon: Minus },
    { id: 'text', label: 'Text (T)', icon: Type },
    { id: 'geo', label: 'Rectangle (R)', icon: Square },
    { id: 'laser', label: 'Laser Pointer (K)', icon: Sparkles },
  ];

  const isAutoHidden = autoHide && isIdle;
  const isHidden = isCollapsed;
  const activeColorObj = TL_COLORS.find((c) => c.id === activeColor) || TL_COLORS[11];

  return (
    <div
      ref={canvasContainerRef}
      className={`online-class-whiteboard absolute inset-0 z-10 ${
        isWebMode && (webInteraction === 'browse' || isWheelingWeb)
          ? 'pointer-events-none pass-through'
          : 'pointer-events-auto'
      }`}
    >
      {/* Underlying tldraw Canvas with transparent background */}
      <Tldraw
        onMount={handleMount}
        hideUi={true}
        autoFocus={true}
        components={{
          Background: null,
        }}
      />

      {/* Bottom Hover Zone to wake up toolbar when hidden */}
      {autoHide && isAutoHidden && (
        <div
          onMouseEnter={handleBottomHoverZoneEnter}
          onMouseMove={handleBottomHoverZoneEnter}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-16 z-50 pointer-events-auto cursor-pointer flex justify-center items-end pb-1.5 group animate-in fade-in-0 duration-200"
          title="Hover here to show drawing tools"
        >
          {/* Subtle Sleek Peek Indicator */}
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-t-xl bg-zinc-900/95 border-t border-x border-zinc-700/80 text-[11px] text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-all backdrop-blur-md shadow-2xl">
            <ChevronUp className="h-3.5 w-3.5 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-semibold text-zinc-300 group-hover:text-emerald-300">Drawing Tools</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">(Hover to reveal)</span>
          </div>
        </div>
      )}

      {/* Floating Bottom Dock Container */}
      <div
        onMouseEnter={handleToolbarMouseEnter}
        onMouseLeave={handleToolbarMouseLeave}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none pointer-events-auto transition-all duration-300 ease-in-out origin-bottom ${
          isAutoHidden
            ? 'translate-y-[calc(100%+24px)] opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 pointer-events-auto'
        }`}
      >
        {/* Shadcn-Style Color Picker Popover (Pops above the toolbar) */}
        {isColorPickerOpen && !isHidden && (
          <div
            ref={colorPickerRef}
            className="mb-2.5 w-72 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl p-3.5 backdrop-blur-2xl transition-all duration-200 animate-in fade-in-0 zoom-in-95"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200">Colors & Style</span>
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-300 border border-zinc-700/80"
                  style={{ backgroundColor: `${activeColorObj.hex}25` }}
                >
                  {activeColorObj.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close Color Picker"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 12 Color Swatches Grid (6 cols x 2 rows) */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {TL_COLORS.map((color) => {
                const isSelected = activeColor === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => selectColor(color.id)}
                    className={`relative w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'scale-110 ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-900 shadow-md'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  >
                    {isSelected && (
                      <Check
                        className={`h-3.5 w-3.5 ${
                          color.id === 'white' || color.id === 'yellow' || color.id === 'light-violet'
                            ? 'text-zinc-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stroke Thickness Section (Shadcn Tabs style) */}
            <div>
              <div className="text-[11px] font-medium text-zinc-400 mb-1.5">Stroke Thickness</div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                {TL_SIZES.map((size) => {
                  const isSelected = activeSize === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => selectSize(size.id)}
                      className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                      title={`Thickness: ${size.label}`}
                    >
                      <span
                        className={`rounded-full mb-1 ${size.dotClass} ${
                          isSelected ? 'bg-emerald-400' : 'bg-zinc-400'
                        }`}
                      />
                      <span className="text-[10px] font-medium">{size.id.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Tools Dock with Slide Up / Down Animation */}
        <div
          className={`transition-all duration-300 ease-in-out origin-bottom ${
            isHidden
              ? 'translate-y-6 opacity-0 pointer-events-none max-h-0 scale-95 overflow-hidden'
              : 'translate-y-0 opacity-100 pointer-events-auto max-h-20 scale-100 mb-2'
          }`}
        >
          <div className="flex items-center gap-1 bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl">
            {/* When in Web Mode: Quick Toggle between Browsing Web and Drawing */}
            {isWebMode && (
              <>
                <div className="flex items-center bg-zinc-950/80 border border-zinc-700/60 rounded-xl p-0.5 mr-1 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setWebInteraction('browse')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      webInteraction === 'browse'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Click, search, and scroll inside website"
                  >
                    <Globe className="h-3 w-3" />
                    <span>Browse</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebInteraction('draw')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      webInteraction === 'draw'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Draw annotations on top of website"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Annotate</span>
                  </button>
                </div>
                <div className="h-6 w-px bg-zinc-700/80 mr-1" />
              </>
            )}

            {tools.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTool === t.id && (!isWebMode || webInteraction === 'draw');
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTool(t.id)}
                  className={`flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                  }`}
                  title={t.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}

            <div className="h-6 w-px bg-zinc-700/80 mx-1" />

            {/* Shadcn Color Picker Trigger Button */}
            <button
              ref={colorTriggerRef}
              type="button"
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                isColorPickerOpen
                  ? 'bg-zinc-800 text-white border border-emerald-500/60 shadow-sm shadow-emerald-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
              title="Color & Style Picker (click to open)"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
                style={{ backgroundColor: activeColorObj.hex }}
              />
              <span className="text-xs font-medium">Color</span>
              <ChevronUp
                className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${
                  isColorPickerOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            <div className="h-6 w-px bg-zinc-700/80 mx-1" />

            {/* Undo */}
            <button
              type="button"
              onClick={() => editor?.undo()}
              className="p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={() => editor?.redo()}
              className="p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            {/* Clear Page Drawings */}
            <button
              type="button"
              onClick={() => {
                if (!editor) return;
                try {
                  const shapes = Array.from(editor.getCurrentPageShapeIds());
                  if (shapes.length > 0) {
                    editor.deleteShapes(shapes);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="p-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-all cursor-pointer"
              title="Erase all drawings on page"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Control Pill: Hide/Show Toggle & Auto-Hide Option */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/95 border border-zinc-700/90 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300">
          <button
            type="button"
            onClick={() => {
              setIsCollapsed((prev) => !prev);
              if (!isCollapsed) {
                setIsColorPickerOpen(false); // Close colors if collapsing
              }
            }}
            className="flex items-center gap-1.5 font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Slide up drawing tools' : 'Slide down drawing tools'}
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                <span className="text-emerald-400 font-semibold">Show Tools</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                <span>Hide Tools</span>
              </>
            )}
          </button>

          <span className="text-zinc-700">|</span>

          <button
            type="button"
            onClick={() => {
              setAutoHide((prev) => {
                const next = !prev;
                setIsIdle(false);
                setCountdown(5);
                return next;
              });
            }}
            className={`flex items-center gap-1.5 font-medium transition-all px-2 py-0.5 rounded-full cursor-pointer ${
              autoHide
                ? 'bg-emerald-950/70 text-emerald-400 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={
              autoHide
                ? 'Auto-hide active (slides down after 5s countdown, hover at bottom to reveal)'
                : 'Enable auto-hide (slides down after 5s countdown, hover at bottom to reveal)'
            }
          >
            {autoHide ? <EyeOff className="h-3 w-3 text-emerald-400 animate-pulse" /> : <Eye className="h-3 w-3" />}
            <span className="font-mono text-[11px]">
              {autoHide
                ? countdown < 5
                  ? `Auto-Hide (${countdown}s)`
                  : 'Auto-Hide (5s)'
                : 'Auto-Hide'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
