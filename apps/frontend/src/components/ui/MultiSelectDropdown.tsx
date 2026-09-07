'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Check, ChevronsUpDown, LucideIcon } from 'lucide-react';

export interface MultiSelectDropdownProps {
  value?: string[];
  onChange: (items: string[]) => void;
  options: string[];
  label?: string;
  placeholder?: string;
  addCustomPrefix?: string;
  icon?: LucideIcon;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxItems?: number;
}

export default function MultiSelectDropdown({
  value = [],
  onChange,
  options = [],
  label,
  placeholder = 'Select or type...',
  addCustomPrefix = 'item',
  icon: Icon,
  error,
  required = false,
  disabled = false,
  className = '',
  maxItems,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItems = useMemo(() => value || [], [value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter((item) =>
      item.toLowerCase().includes(q)
    );
  }, [searchQuery, options]);

  // Check if current search query can be added as a custom entry
  const canAddCustom = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return false;
    const exists = selectedItems.some(
      (item) => item.toLowerCase() === q.toLowerCase()
    );
    return !exists;
  }, [searchQuery, selectedItems]);

  // Close dropdown on click outside
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

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (maxItems === 1) {
      onChange([trimmed]);
      setSearchQuery('');
      setIsOpen(false);
      return;
    }
    const alreadySelected = selectedItems.some(
      (i) => i.toLowerCase() === trimmed.toLowerCase()
    );
    if (!alreadySelected) {
      if (maxItems && selectedItems.length >= maxItems) {
        onChange([...selectedItems.slice(0, maxItems - 1), trimmed]);
      } else {
        onChange([...selectedItems, trimmed]);
      }
    }
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const removeItem = (itemToRemove: string) => {
    onChange(selectedItems.filter((i) => i !== itemToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canAddCustom) {
        const exact = filteredOptions.find(
          (o) => o.toLowerCase() === searchQuery.toLowerCase().trim()
        );
        addItem(exact || searchQuery.trim());
      } else if (filteredOptions.length > 0) {
        addItem(filteredOptions[0]);
      }
    } else if (e.key === 'Backspace' && !searchQuery && selectedItems.length > 0) {
      removeItem(selectedItems[selectedItems.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {Icon && <Icon className="h-3.5 w-3.5 text-brand" />}
            <span>{label}</span>
            {required && <span className="text-destructive font-bold">*</span>}
          </span>
          {selectedItems.length > 0 && maxItems !== 1 && (
            <span className="text-[10px] text-muted-foreground font-medium lowercase">
              {selectedItems.length} selected
            </span>
          )}
        </label>
      )}

      {/* Tag Input Container */}
      <div
        className={`min-h-11 w-full rounded-xl border border-input bg-background p-1.5 text-sm shadow-sm transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 relative flex flex-wrap items-center gap-1.5 ${
          disabled ? 'cursor-not-allowed opacity-50 bg-muted' : 'cursor-text'
        } ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {/* Selected Items Chips */}
        {selectedItems.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium animate-fadeIn"
          >
            <span>{item}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item);
                }}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors text-primary/70 hover:text-primary"
                title={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {/* Search & Custom Input */}
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
          placeholder={
            selectedItems.length === 0
              ? placeholder
              : maxItems === 1
              ? 'Change / search...'
              : 'Add more...'
          }
          className="flex-1 min-w-[130px] bg-transparent px-2 py-1 text-xs outline-none placeholder:text-muted-foreground text-foreground disabled:cursor-not-allowed"
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
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
        </button>

        {/* Dropdown Popover */}
        {isOpen && !disabled && (
          <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[260px] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none animate-in fade-in-0 zoom-in-95 backdrop-blur-md overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {/* Add Custom Entry Option if typed */}
              {canAddCustom && searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => addItem(searchQuery.trim())}
                  className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors border border-dashed border-primary/30 mb-1"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Add custom {addCustomPrefix} &quot;<strong>{searchQuery.trim()}</strong>&quot;
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">Press Enter</span>
                </button>
              )}

              {/* Predefined Filtered Options */}
              {filteredOptions.map((opt) => {
                const isSelected = selectedItems.some(
                  (i) => i.toLowerCase() === opt.toLowerCase()
                );
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        removeItem(opt);
                      } else {
                        addItem(opt);
                      }
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-2" />}
                  </button>
                );
              })}

              {filteredOptions.length === 0 && !canAddCustom && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No matching options found
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
