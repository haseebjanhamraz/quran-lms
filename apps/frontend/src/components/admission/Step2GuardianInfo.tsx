'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import CountryPhoneInput from '../CountryPhoneInput';
import { GuardianInfoState } from './types';

interface Step2GuardianInfoProps {
  guardianInfo: GuardianInfoState;
  setGuardianInfo: React.Dispatch<React.SetStateAction<GuardianInfoState>>;
  countryCode: string;
}

export default function Step2GuardianInfo({
  guardianInfo,
  setGuardianInfo,
  countryCode,
}: Step2GuardianInfoProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <Shield className="h-5 w-5 text-brand" />
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 2: Guardian / Parent Information
          </h3>
          <p className="text-xs text-muted-foreground">
            Guardian contact details are required for emergency communications and billing.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Guardian Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Relationship / Type *</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {['Father', 'Mother', 'Brother', 'Sister', 'Other'].map((type) => {
              const isSelected = guardianInfo.guardianType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGuardianInfo((prev) => ({ ...prev, guardianType: type }))}
                  className={`p-3 rounded-xl text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {guardianInfo.guardianType === 'Other' && (
          <div className="space-y-1 animate-fadeIn">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Specify Guardian Relationship *</label>
            <input
              type="text"
              required
              placeholder="e.g. Uncle, Grandparent, Legal Guardian"
              value={guardianInfo.guardianTypeOther}
              onChange={(e) => setGuardianInfo((prev) => ({ ...prev, guardianTypeOther: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Khan"
              value={guardianInfo.guardianName}
              onChange={(e) => setGuardianInfo((prev) => ({ ...prev, guardianName: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Guardian Email Address</label>
            <input
              type="email"
              placeholder="guardian@example.com"
              value={guardianInfo.guardianEmail}
              onChange={(e) => setGuardianInfo((prev) => ({ ...prev, guardianEmail: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-medium"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <CountryPhoneInput
              label="Guardian Phone Number *"
              countryCode={countryCode}
              phoneCode={guardianInfo.guardianPhoneCode}
              value={guardianInfo.guardianPhone}
              onChange={(full, code) => {
                setGuardianInfo((prev) => ({ ...prev, guardianPhone: full, guardianPhoneCode: code }));
              }}
              placeholder="300 1234567"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
