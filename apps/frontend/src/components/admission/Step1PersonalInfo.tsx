'use client';

import React from 'react';
import { User, Sparkles, Copy, Check, Eye, EyeOff } from 'lucide-react';
import ProfilePhotoPicker from '../ProfilePhotoPicker';
import CountrySelect from '../CountrySelect';
import CountryPhoneInput from '../CountryPhoneInput';
import { PersonalInfoState } from './types';
import { CountryInfo } from '@/utils/countries';

interface Step1PersonalInfoProps {
  personalInfo: PersonalInfoState;
  setPersonalInfo: React.Dispatch<React.SetStateAction<PersonalInfoState>>;
  editingStudent?: any | null;
  timezonesList: string[];
  computedAge: { age: number | string; type: string };
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  copiedPassword: boolean;
  onGeneratePassword: () => void;
  onCopyPassword: () => void;
  onCountryChange: (country: CountryInfo) => void;
}

export default function Step1PersonalInfo({
  personalInfo,
  setPersonalInfo,
  editingStudent,
  timezonesList,
  computedAge,
  showPassword,
  setShowPassword,
  copiedPassword,
  onGeneratePassword,
  onCopyPassword,
  onCountryChange,
}: Step1PersonalInfoProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <User className="h-5 w-5 text-brand" />
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 1: Personal Information &amp; Profile Photo
          </h3>
          <p className="text-xs text-muted-foreground">
            Provide the student&apos;s basic contact information, account security, and timezone settings.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
        <ProfilePhotoPicker
          currentPhotoUrl={personalInfo.profilePicture}
          onPhotoSelected={(url) => setPersonalInfo((prev) => ({ ...prev, profilePicture: url }))}
        />

        <div className="flex-1 space-y-3 w-full">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
            <input
              type="text"
              required
              value={personalInfo.name}
              onChange={(e) => setPersonalInfo((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Ali Khan"
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Preferred Name</label>
            <input
              type="text"
              value={personalInfo.preferredName}
              onChange={(e) => setPersonalInfo((prev) => ({ ...prev, preferredName: e.target.value }))}
              placeholder="e.g. Ali"
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!editingStudent && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address *</label>
              <input
                type="email"
                required
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="ali@example.com"
                className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Account Password *
                </label>
                <button
                  type="button"
                  onClick={onGeneratePassword}
                  className="text-[11px] text-brand hover:text-brand/80 font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Auto Generate</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={personalInfo.password}
                  onChange={(e) => setPersonalInfo((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 pr-20 text-sm outline-none font-mono font-medium"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {personalInfo.password && (
                    <button
                      type="button"
                      onClick={onCopyPassword}
                      title={copiedPassword ? 'Copied to Clipboard!' : 'Copy Password'}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide Password' : 'View Password'}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
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
          </>
        )}

        {/* Country Selector */}
        <div className="space-y-1">
          <CountrySelect
            label="Student Country *"
            value={personalInfo.country}
            onChange={onCountryChange}
          />
        </div>

        {/* Phone with Country Dial Code */}
        <div className="space-y-1">
          <CountryPhoneInput
            label="Student Phone Number"
            countryCode={personalInfo.country}
            phoneCode={personalInfo.phoneCode}
            value={personalInfo.phone}
            onChange={(full, code) => {
              setPersonalInfo((prev) => ({ ...prev, phone: full, phoneCode: code }));
            }}
            placeholder="300 1234567"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Gender</label>
          <select
            value={personalInfo.gender}
            onChange={(e) => setPersonalInfo((prev) => ({ ...prev, gender: e.target.value }))}
            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Date of Birth</label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={personalInfo.dob}
              onChange={(e) => setPersonalInfo((prev) => ({ ...prev, dob: e.target.value }))}
              className="flex-1 bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
            />
            {personalInfo.dob && (
              <div className="bg-muted px-3 py-2 rounded-xl border border-border text-xs flex flex-col justify-center shrink-0">
                <span className="font-bold text-foreground">{computedAge.age} yrs</span>
                <span className="text-[10px] text-muted-foreground">{computedAge.type}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Timezone (Auto-filled from Country)</label>
          <select
            value={personalInfo.timezone}
            onChange={(e) => setPersonalInfo((prev) => ({ ...prev, timezone: e.target.value }))}
            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-mono"
          >
            {timezonesList.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
