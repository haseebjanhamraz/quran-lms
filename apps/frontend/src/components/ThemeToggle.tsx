'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'default' | 'navbar';
}

export default function ThemeToggle({ variant = 'navbar' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { key: 'light' | 'dark' | 'system'; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl transition-all duration-200 shadow-sm outline-none ${
          variant === 'navbar'
            ? 'p-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white'
            : 'border border-border/60 bg-background p-2 text-foreground hover:bg-muted focus:ring-2 focus:ring-primary/30'
        }`}
        title={`Current theme: ${theme} (${resolvedTheme})`}
        aria-label="Toggle theme"
      >
        <CurrentIcon className={`h-4 w-4 transition-transform duration-300 hover:rotate-12 ${
          variant === 'navbar' ? 'text-white' : 'text-brand'
        }`} />
        <span className={`hidden sm:inline text-xs font-medium capitalize ${
          variant === 'navbar' ? 'text-white' : ''
        }`}>
          {theme}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
          variant === 'navbar' ? 'text-blue-100' : 'text-muted-foreground'
        }`} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card p-1 shadow-xl z-50 animate-fadeIn">
          {options.map(({ key, label, icon: Icon }) => {
            const isSelected = theme === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setTheme(key);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{label}</span>
                {isSelected && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
