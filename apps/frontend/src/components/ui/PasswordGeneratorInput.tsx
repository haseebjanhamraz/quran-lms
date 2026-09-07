'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, Check, Eye, EyeOff, Lock } from 'lucide-react';

export interface PasswordGeneratorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  showGenerate?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function PasswordGeneratorInput({
  value,
  onChange,
  label = 'Account Password',
  required = true,
  placeholder = '••••••••',
  showGenerate = true,
  className = '',
  inputClassName = '',
}: PasswordGeneratorInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onChange(pass);
    setShowPassword(true);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPassword = () => {
    if (value && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-brand" />
          <span>
            {label} {required && '*'}
          </span>
        </label>
        {showGenerate && (
          <button
            type="button"
            onClick={generateSecurePassword}
            className="text-[11px] text-brand hover:text-brand/80 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            <span>Auto Generate</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type={showPassword ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 pr-20 text-xs font-mono font-medium text-foreground outline-none transition-all shadow-sm ${inputClassName}`}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={handleCopyPassword}
              title={copied ? 'Copied to Clipboard!' : 'Copy Password'}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            title={showPassword ? 'Hide Password' : 'View Password'}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
