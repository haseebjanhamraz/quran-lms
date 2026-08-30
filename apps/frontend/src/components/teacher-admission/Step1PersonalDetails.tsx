'use client';

import React from 'react';
import { User } from 'lucide-react';
import ProfilePhotoPicker from '../ProfilePhotoPicker';
import CountrySelect from '../CountrySelect';
import CountryPhoneInput from '../CountryPhoneInput';
import { CountryInfo } from '@/utils/countries';
import { TeacherPersonalInfo } from './types';

interface Step1PersonalDetailsProps {
  personalInfo: TeacherPersonalInfo;
  setPersonalInfo: React.Dispatch<React.SetStateAction<TeacherPersonalInfo>>;
  editingTeacher?: any | null;
  timezonesList: string[];
  onCountryChange: (country: CountryInfo) => void;
}

export default function Step1PersonalDetails({
  personalInfo,
  setPersonalInfo,
  editingTeacher,
  timezonesList,
  onCountryChange,
}: Step1PersonalDetailsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-brand" />
            <span>Step 1: Personal Details &amp; Profile Picture</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Basic identification, country of residence, contact details, and account credentials.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-border/60 space-y-6 bg-card/60">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/40">
          <ProfilePhotoPicker
            currentPhotoUrl={personalInfo.profilePicture}
            onPhotoSelected={(url) => setPersonalInfo((prev) => ({ ...prev, profilePicture: url }))}
          />

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Qari Muneeb"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Preferred / Title Name</label>
              <input
                type="text"
                placeholder="e.g. Ustadh Muneeb"
                value={personalInfo.preferredName}
                onChange={(e) => setPersonalInfo((prev) => ({ ...prev, preferredName: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {!editingTeacher && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="muneeb@lms.com"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Account Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={personalInfo.password || ''}
                  onChange={(e) => setPersonalInfo((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm"
                />
              </div>
            </>
          )}

          {/* Country Selector */}
          <div className="space-y-1.5">
            <CountrySelect
              label="Country / Region *"
              value={personalInfo.country}
              onChange={onCountryChange}
            />
          </div>

          {/* Phone with dial code */}
          <div className="space-y-1.5">
            <CountryPhoneInput
              label="Phone Number"
              countryCode={personalInfo.country}
              phoneCode={personalInfo.phoneCode}
              value={personalInfo.phone}
              onChange={(full, code) => {
                setPersonalInfo((prev) => ({ ...prev, phone: full, phoneCode: code }));
              }}
              placeholder="300 1234567"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">CNIC / Passport / National ID</label>
            <input
              type="text"
              maxLength={15}
              placeholder="35202-1234567-1"
              value={personalInfo.cnicOrId}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 13);
                if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13, 15);
                setPersonalInfo((prev) => ({ ...prev, cnicOrId: value }));
              }}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-mono font-medium text-foreground outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Gender</label>
            <select
              value={personalInfo.gender}
              onChange={(e) => setPersonalInfo((prev) => ({ ...prev, gender: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Timezone (Auto-filled from Country)</label>
            <select
              value={personalInfo.timezone}
              onChange={(e) => setPersonalInfo((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-mono font-medium text-foreground outline-none transition-all shadow-sm cursor-pointer"
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
    </div>
  );
}
