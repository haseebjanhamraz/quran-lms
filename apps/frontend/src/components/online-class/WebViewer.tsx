'use client';

import React, { useState, useRef } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface WebViewerProps {
  initialUrl?: string;
  onUrlChange?: (url: string) => void;
}

const QUICK_LINKS = [
  { label: 'Quran.com', url: 'https://quran.com' },
  { label: 'Sunnah.com', url: 'https://sunnah.com' },
  { label: 'Quranwbw.com', url: 'https://quranwbw.com' },
  { label: 'Tanzil Quran', url: 'https://tanzil.net' },
  { label: 'Wikipedia', url: 'https://www.wikipedia.org' },
];

export default function WebViewer({ initialUrl = 'https://quran.com', onUrlChange }: WebViewerProps) {
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const normalizeUrl = (url: string) => {
    let trimmed = url.trim();
    if (!trimmed) return 'https://quran.com';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleNavigate = (targetUrl?: string) => {
    const urlToLoad = normalizeUrl(targetUrl || inputUrl);
    setInputUrl(urlToLoad);
    setCurrentUrl(urlToLoad);
    setIsLoading(true);
    setHasLoadError(false);
    onUrlChange?.(urlToLoad);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasLoadError(false);
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col w-full h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Web Browser Controls Top Bar */}
      <div className="h-13 bg-zinc-900/90 border-b border-zinc-800 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 backdrop-blur-md">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 shrink-0 text-zinc-400">
          <button
            onClick={() => iframeRef.current?.contentWindow?.history?.back?.()}
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => iframeRef.current?.contentWindow?.history?.forward?.()}
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-colors ${
              isLoading ? 'animate-spin text-emerald-400' : ''
            }`}
            title="Reload website"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* Address Input Bar */}
        <div className="flex-1 max-w-2xl relative flex items-center">
          <div className="absolute left-3 text-zinc-500 pointer-events-none flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <ShieldCheck className="h-3 w-3 text-zinc-500 hidden sm:inline" />
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter web link (e.g. quran.com or https://...)"
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 sm:pl-16 pr-20 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              onClick={() => handleNavigate()}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
              title="Navigate to URL"
            >
              <Search className="h-3 w-3" />
              <span>Go</span>
            </button>
          </div>
        </div>

        {/* External open button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700/60"
            title="Open website in new browser tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open in Tab</span>
          </button>
        </div>
      </div>

      {/* Educational Quick Access Links */}
      <div className="bg-zinc-950 border-b border-zinc-800/60 px-3 py-1.5 flex items-center gap-2 overflow-x-auto custom-scrollbar text-[11px] shrink-0">
        <span className="text-zinc-500 font-semibold flex items-center gap-1 text-[10px] uppercase tracking-wider shrink-0">
          <Sparkles className="h-3 w-3 text-amber-400" /> Quick Resources:
        </span>
        {QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            onClick={() => handleNavigate(link.url)}
            className={`px-2.5 py-0.5 rounded-md shrink-0 transition-colors font-medium ${
              currentUrl.includes(link.url)
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Browser Viewport Area */}
      <div id="web-teaching-scroll-container" className="flex-1 relative w-full h-full bg-zinc-900">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-200 font-medium font-mono">
                Loading {new URL(currentUrl).hostname}...
              </span>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={currentUrl}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasLoadError(true);
          }}
          className="w-full h-full border-0 bg-white"
          allow="camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          title="Online Class Web Teaching View"
        />

        {/* Frame embedding limitation warning / hint */}
        <div className="absolute bottom-2 right-2 z-10 opacity-70 hover:opacity-100 transition-opacity pointer-events-auto">
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-2.5 py-1 text-[10px] text-zinc-400 shadow-lg flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />
            <span>If a website prevents embedded display (CSP/X-Frame-Options), click</span>
            <button
              onClick={handleOpenExternal}
              className="text-emerald-400 hover:underline font-semibold"
            >
              Open in Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
