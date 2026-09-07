'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, X, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { PREDEFINED_LANGUAGES } from '@/utils/country-languages';

export interface LanguageSelectorProps {
  value?: string[];
  onChange: (languages: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function LanguageSelector({
  value = [],
  onChange,
  label = 'Languages',
  placeholder = 'Select or type language...',
  error,
  required = false,
  disabled = false,
  className = '',
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLanguages = useMemo(() => value || [], [value]);

  // Filter predefined list based on search query
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PREDEFINED_LANGUAGES;
    return PREDEFINED_LANGUAGES.filter((lang) =>
      lang.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Check if current search query can be added as custom language
  const canAddCustom = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return false;
    const exists = selectedLanguages.some(
      (l) => l.toLowerCase() === q.toLowerCase()
    );
    return !exists;
  }, [searchQuery, selectedLanguages]);

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const addLanguage = (lang: string) => {
    const trimmed = lang.trim();
    if (!trimmed) return;
    const alreadySelected = selectedLanguages.some(
      (l) => l.toLowerCase() === trimmed.toLowerCase()
    );
    if (!alreadySelected) {
      onChange([...selectedLanguages, trimmed]);
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const removeLanguage = (langToRemove: string) => {
    onChange(selectedLanguages.filter((l) => l !== langToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canAddCustom) {
        // If exact match exists in filtered, add that, else custom
        const exact = filteredLanguages.find(
          (l) => l.toLowerCase() === searchQuery.toLowerCase().trim()
        );
        addLanguage(exact || searchQuery.trim());
      } else if (filteredLanguages.length > 0) {
        addLanguage(filteredLanguages[0]);
      }
    } else if (e.key === 'Backspace' && !searchQuery && selectedLanguages.length > 0) {
      removeLanguage(selectedLanguages[selectedLanguages.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-brand" />
            <span>{label}</span>
            {required && <span className="text-destructive">*</span>}
          </span>
          {selectedLanguages.length > 0 && (
            <span className="text-[10px] text-muted-foreground lowercase">
              {selectedLanguages.length} selected
            </span>
          )}
        </label>
      )}

      {/* Main Tag Input Container */}
      <div
        className={`min-h-10 w-full rounded-xl border border-input bg-background p-1.5 text-sm shadow-sm transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary relative flex flex-wrap items-center gap-1.5 ${
          disabled ? 'cursor-not-allowed opacity-50 bg-muted' : ''
        } ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {/* Selected Language Chips */}
        {selectedLanguages.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium animate-fadeIn"
          >
            <span>{lang}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLanguage(lang);
                }}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors text-primary/70 hover:text-primary"
                title={`Remove ${lang}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {/* Inline Search / Custom Language Input */}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedLanguages.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[120px] bg-transparent px-2 py-1 text-xs outline-none placeholder:text-muted-foreground text-foreground disabled:cursor-not-allowed"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors ml-auto"
        >
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[240px] max-w-sm rounded-xl border border-border bg-popover text-popover-foreground shadow-xl outline-none animate-in fade-in-0 zoom-in-95 backdrop-blur-md overflow-hidden">
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {/* Add Custom Entry Option if typed */}
              {canAddCustom && searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => addLanguage(searchQuery.trim())}
                  className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors border border-dashed border-primary/30 mb-1"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Add custom language &quot;<strong>{searchQuery.trim()}</strong>&quot;</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">Press Enter</span>
                </button>
              )}

              {/* Predefined Filtered Languages */}
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLanguages.some(
                  (l) => l.toLowerCase() === lang.toLowerCase()
                );
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        removeLanguage(lang);
                      } else {
                        addLanguage(lang);
                      }
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                    }`}
                  >
                    <span>{lang}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-2" />}
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && !canAddCustom && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No matching languages found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}
