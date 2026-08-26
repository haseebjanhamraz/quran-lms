'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { FeeInfoState } from './types';
import { CurrencyInfo } from '@/utils/countries';

interface Step4FeesBillingProps {
  feeInfo: FeeInfoState;
  setFeeInfo: React.Dispatch<React.SetStateAction<FeeInfoState>>;
  currenciesList: CurrencyInfo[];
  classDuration: number;
  classesPerWeek: number;
}

export default function Step4FeesBilling({
  feeInfo,
  setFeeInfo,
  currenciesList,
  classDuration,
  classesPerWeek,
}: Step4FeesBillingProps) {
  const calculatedNet = Math.max(
    0,
    Math.round(Number(feeInfo.monthlyFee || 0) * (1 - Number(feeInfo.feeWaiverPercent || 0) / 100))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <CreditCard className="h-5 w-5 text-brand" />
        <div>
          <h3 className="text-base font-bold font-display text-foreground">
            Step 4: Student Individual Fees &amp; Billing Setup
          </h3>
          <p className="text-xs text-muted-foreground">
            Tuition fee is automatically suggested based on {classDuration} mins class × {classesPerWeek} days/week.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Tuition Fee *</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 50"
              value={feeInfo.monthlyFee}
              onChange={(e) => setFeeInfo((prev) => ({ ...prev, monthlyFee: e.target.value, isFeeManuallyEdited: true }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-mono font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Billing Currency</label>
            <select
              value={feeInfo.currency}
              onChange={(e) => setFeeInfo((prev) => ({ ...prev, currency: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-mono font-bold"
            >
              {currenciesList.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Fee Waiver (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={feeInfo.feeWaiverPercent}
              onChange={(e) => setFeeInfo((prev) => ({ ...prev, feeWaiverPercent: e.target.value }))}
              className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Special Fee Notes / Remarks</label>
          <textarea
            rows={2}
            placeholder="e.g. Sibling discount applied, custom payment schedule..."
            value={feeInfo.customFeeNotes}
            onChange={(e) => setFeeInfo((prev) => ({ ...prev, customFeeNotes: e.target.value }))}
            className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-3 text-sm outline-none resize-none font-medium"
          />
        </div>

        {/* Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Net Calculated Monthly Billing</p>
            <p className="text-xs text-muted-foreground">
              {classDuration}m class × {classesPerWeek}d/wk • Base: {feeInfo.monthlyFee || 0} {feeInfo.currency} ({feeInfo.feeWaiverPercent || 0}% Waiver)
            </p>
          </div>
          <span className="text-xl font-mono font-bold text-brand self-end sm:self-auto">
            {calculatedNet} {feeInfo.currency} / mo
          </span>
        </div>
      </div>
    </div>
  );
}
