'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeMenu: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

export function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(target);
      const clickedContent = contentRef.current && contentRef.current.contains(target);

      if (!clickedTrigger && !clickedContent) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, closeMenu, triggerRef, contentRef }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className = '',
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenu();

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }}
      aria-expanded={isOpen}
      className={`inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}

export function DropdownMenuContent({
  align = 'end',
  side = 'bottom',
  className = '',
  children,
  ...props
}: DropdownMenuContentProps) {
  const { isOpen, triggerRef, contentRef } = useDropdownMenu();
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});
  const [computedSide, setComputedSide] = useState<'top' | 'bottom'>(side);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 360; // Estimated dropdown height

    // If preferred bottom but not enough space below, flip to top
    const shouldOpenTop = side === 'top' || (spaceBelow < estimatedHeight && spaceAbove > spaceBelow);
    setComputedSide(shouldOpenTop ? 'top' : 'bottom');

    const newCoords: { top?: number; bottom?: number; left?: number; right?: number } = {};

    if (shouldOpenTop) {
      newCoords.bottom = Math.max(8, window.innerHeight - rect.top + 6);
    } else {
      newCoords.top = Math.max(8, rect.bottom + 6);
    }

    if (align === 'end') {
      newCoords.right = Math.max(8, window.innerWidth - rect.right);
    } else if (align === 'center') {
      newCoords.left = rect.left + rect.width / 2;
    } else {
      newCoords.left = Math.max(8, rect.left);
    }

    setCoords(newCoords);
  }, [align, side, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      style={{
        position: 'fixed',
        top: coords.top !== undefined ? `${coords.top}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
        left: coords.left !== undefined ? `${coords.left}px` : undefined,
        right: coords.right !== undefined ? `${coords.right}px` : undefined,
        zIndex: 99999,
      }}
      className={`min-w-[13rem] max-h-[min(480px,85vh)] overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ${
        align === 'center' ? '-translate-x-1/2' : ''
      } ${computedSide === 'top' ? 'origin-bottom' : 'origin-top'} ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );

  return createPortal(content, document.body);
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  variant = 'default',
  className = '',
  disabled,
  ...props
}: DropdownMenuItemProps) {
  const { closeMenu } = useDropdownMenu();

  const variantClasses = {
    default: 'text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    destructive: 'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive',
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
        closeMenu();
      }}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-xl px-2.5 py-2 text-xs font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider ${className}`}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '' }: { className?: string }) {
  return <div className={`-mx-1 my-1 h-px bg-border/60 ${className}`} />;
}
