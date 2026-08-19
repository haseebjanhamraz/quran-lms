'use client';

import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import { ChevronsUpDown, Check, Search, X } from 'lucide-react';
import { COUNTRIES, CountryInfo, getCountryByCode, getCountryByPhoneCode, getCountryByName } from '@/utils/countries';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  phoneCode?: string;
  countryCode?: string;
  defaultCountry?: string;
  onChange?: (value: string, phoneCode: string, localNumber: string, country?: CountryInfo) => void;
  label?: string;
  error?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = '',
      phoneCode = '',
      countryCode = '',
      defaultCountry = 'PK',
      onChange,
      label,
      error,
      placeholder = 'Enter phone number',
      className = '',
      disabled = false,
      required = false,
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Identify active country
    const activeCountry = useMemo<CountryInfo>(() => {
      if (countryCode) {
        const byCode = getCountryByCode(countryCode);
        if (byCode) return byCode;
      }
      if (phoneCode) {
        const byPhone = getCountryByPhoneCode(phoneCode);
        if (byPhone) return byPhone;
      }
      if (value && typeof value === 'string' && value.startsWith('+')) {
        for (const c of COUNTRIES) {
          if (value.startsWith(c.phoneCode)) {
            return c;
          }
        }
      }
      return getCountryByCode(defaultCountry) || getCountryByCode('PK') || COUNTRIES[0];
    }, [countryCode, phoneCode, value, defaultCountry]);

    // Compute local phone number (without country dial code)
    const localNumber = useMemo(() => {
      if (!value) return '';
      const strVal = String(value);
      if (activeCountry && strVal.startsWith(activeCountry.phoneCode)) {
        return strVal.slice(activeCountry.phoneCode.length).trim();
      }
      return strVal;
    }, [value, activeCountry]);

    // Filter country list by search query
    const filteredCountries = useMemo(() => {
      if (!searchQuery.trim()) return COUNTRIES;
      const query = searchQuery.toLowerCase().trim();
      return COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.phoneCode.includes(query)
      );
    }, [searchQuery]);

    // Close on outside click
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleCountrySelect = (country: CountryInfo) => {
      setIsOpen(false);
      setSearchQuery('');
      const cleanedLocal = localNumber.replace(/^0+/, ''); // strip leading zero
      const full = cleanedLocal ? `${country.phoneCode} ${cleanedLocal}` : country.phoneCode;
      onChange?.(full, country.phoneCode, cleanedLocal, country);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9\s-]/g, '');
      const cleaned = raw.trim();
      const full = cleaned ? `${activeCountry.phoneCode} ${cleaned}` : '';
      onChange?.(full, activeCountry.phoneCode, raw, activeCountry);
    };

    return (
      <div className={`space-y-1.5 ${className}`} ref={containerRef}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between"
          >
            <span>
              {label} {required && <span className="text-destructive">*</span>}
            </span>
          </label>
        )}

        {/* Shadcn Phone Input Container */}
        <div
          className={`flex h-10 w-full rounded-md border border-input bg-background text-sm shadow-sm transition-colors overflow-visible relative focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
            disabled ? 'cursor-not-allowed opacity-50 bg-muted' : ''
          } ${error ? 'border-destructive ring-1 ring-destructive' : ''}`}
        >
          {/* Shadcn Country Selector Button */}
          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setIsOpen(!isOpen)}
              className="flex h-full items-center gap-1.5 rounded-l-md border-r border-input bg-background/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 transition-colors select-none"
              aria-expanded={isOpen}
              title={`${activeCountry?.name} (${activeCountry?.phoneCode})`}
            >
              <span className="text-base leading-none">{activeCountry?.flag}</span>
              <span className="text-xs font-mono font-medium text-muted-foreground">{activeCountry?.phoneCode}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50 ml-0.5" />
            </button>

            {/* Shadcn Popover / Command Menu */}
            {isOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-md border border-border bg-popover text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95 backdrop-blur-md overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center border-b border-border px-3 bg-muted/30">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country or code..."
                    className="flex h-9 w-full rounded-md bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Country List */}
                <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/10">
                  {filteredCountries.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">No country found</div>
                  ) : (
                    filteredCountries.map((c) => {
                      const isSelected = activeCountry?.code === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCountrySelect(c)}
                          className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2.5 py-1.5 text-xs outline-none transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none shrink-0">{c.flag}</span>
                            <span className="truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            <span
                              className={`font-mono text-[11px] ${
                                isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                              }`}
                            >
                              {c.phoneCode}
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground shrink-0" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Shadcn Input for Local Phone Digits */}
          <input
            {...props}
            ref={ref}
            id={id}
            type="tel"
            disabled={disabled}
            required={required}
            value={localNumber}
            onChange={handleNumberChange}
            placeholder={placeholder}
            className="flex h-full w-full rounded-r-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 font-mono text-foreground"
          />
        </div>

        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;
