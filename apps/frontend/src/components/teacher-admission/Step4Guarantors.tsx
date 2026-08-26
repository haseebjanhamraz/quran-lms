'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { PhoneInput } from '../CountryPhoneInput';
import { TeacherGuarantorInfo } from './types';

interface Step4GuarantorsProps {
  guarantorInfo: TeacherGuarantorInfo;
  setGuarantorInfo: React.Dispatch<React.SetStateAction<TeacherGuarantorInfo>>;
  countryCode: string;
  phoneCode: string;
}

export default function Step4Guarantors({
  guarantorInfo,
  setGuarantorInfo,
  countryCode,
  phoneCode,
}: Step4GuarantorsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            <span>Step 4: Guarantor &amp; Emergency Contacts</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add verified emergency and guarantor contact references.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRIMARY GUARANTOR (#1) */}
        <div className="glass-panel p-6 rounded-3xl border border-border/60 space-y-4 bg-card/60">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Primary Guarantor (#1)</span>
            </h4>
            <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-full">
              Primary
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Guarantor Name</label>
              <input
                type="text"
                placeholder="e.g. Tariq Khan"
                value={guarantorInfo.g1Name}
                onChange={(e) => setGuarantorInfo((prev) => ({ ...prev, g1Name: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Relationship</label>
              <input
                type="text"
                placeholder="e.g. Father / Brother"
                value={guarantorInfo.g1Relationship}
                onChange={(e) => setGuarantorInfo((prev) => ({ ...prev, g1Relationship: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <PhoneInput
                label="Phone Number"
                placeholder="300 1234567"
                countryCode={countryCode}
                phoneCode={phoneCode}
                value={guarantorInfo.g1Phone}
                onChange={(full) => setGuarantorInfo((prev) => ({ ...prev, g1Phone: full }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">CNIC / ID Number</label>
              <input
                type="text"
                maxLength={15}
                placeholder="35202-1234567-1"
                value={guarantorInfo.g1Cnic}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 13);
                  if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13, 15);
                  setGuarantorInfo((prev) => ({ ...prev, g1Cnic: value }));
                }}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="usman@example.com"
                value={guarantorInfo.g1Email}
                onChange={(e) => setGuarantorInfo((prev) => ({ ...prev, g1Email: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECONDARY GUARANTOR (#2) */}
        <div className="glass-panel p-6 rounded-3xl border border-border/60 space-y-4 bg-card/60">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secondary Guarantor (#2)</span>
            </h4>
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              Optional
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Guarantor Name</label>
              <input
                type="text"
                placeholder="e.g. Hamza Ali"
                value={guarantorInfo.g2Name}
                onChange={(e) => setGuarantorInfo((prev) => ({ ...prev, g2Name: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Relationship</label>
              <input
                type="text"
                placeholder="e.g. Brother / Uncle"
                value={guarantorInfo.g2Relationship}
                onChange={(e) => setGuarantorInfo((prev) => ({ ...prev, g2Relationship: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <PhoneInput
                label="Phone Number"
                placeholder="300 7654321"
                countryCode={countryCode}
                phoneCode={phoneCode}
                value={guarantorInfo.g2Phone}
                onChange={(full) => setGuarantorInfo((prev) => ({ ...prev, g2Phone: full }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">CNIC / ID Number</label>
              <input
                type="text"
                maxLength={15}
                placeholder="35202-7654321-1"
                value={guarantorInfo.g2Cnic}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 13);
                  if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13, 15);
                  setGuarantorInfo((prev) => ({ ...prev, g2Cnic: value }));
                }}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="hamza@example.com"
                value={guarantorInfo.g2Email}
                onChange={(e) => setGuarantorInfo((prev) => ({ ...prev, g2Email: e.target.value }))}
                className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
