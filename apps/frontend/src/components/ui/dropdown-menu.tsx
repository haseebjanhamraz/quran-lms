'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeMenu: () => void;
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

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, closeMenu }}>
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
  const { isOpen, setIsOpen } = useDropdownMenu();

  return (
    <button
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
  const { isOpen } = useDropdownMenu();

  if (!isOpen) return null;

  const alignClasses = {
    start: 'left-0 origin-top-left',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    end: 'right-0 origin-top-right',
  };

  const sideClasses = {
    top: 'bottom-full mb-1.5 origin-bottom',
    bottom: 'top-full mt-1.5 origin-top',
  };

  return (
    <div
      role="menu"
      aria-orientation="vertical"
      className={`absolute z-50 min-w-[10rem] overflow-hidden rounded-2xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ${alignClasses[align]} ${sideClasses[side]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
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
