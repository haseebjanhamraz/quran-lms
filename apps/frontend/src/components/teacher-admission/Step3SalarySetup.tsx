'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { CurrencyInfo } from '@/utils/countries';
import { TeacherSalaryInfo } from './types';

interface Step3SalarySetupProps {
  salaryInfo: TeacherSalaryInfo;
  setSalaryInfo: React.Dispatch<React.SetStateAction<TeacherSalaryInfo>>;
  currenciesList: CurrencyInfo[];
}

export default function Step3SalarySetup({
  salaryInfo,
  setSalaryInfo,
  currenciesList,
}: Step3SalarySetupProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand" />
            <span>Step 3: Salary &amp; Multi-Currency Compensation</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure payment structure (Monthly Fixed vs Hourly Basis) and payout currency.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-border/60 space-y-6 bg-card/60">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Payment Structure Basis</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSalaryInfo((prev) => ({ ...prev, payType: 'MONTHLY' }))}
              className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all ${
                salaryInfo.payType === 'MONTHLY'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-brand/40'
              }`}
            >
              Monthly Fixed Salary
            </button>
            <button
              type="button"
              onClick={() => setSalaryInfo((prev) => ({ ...prev, payType: 'HOURLY' }))}
              className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all ${
                salaryInfo.payType === 'HOURLY'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-purple-500/40'
              }`}
            >
              Hourly Rate Basis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Compensation Currency</label>
            <select
              value={salaryInfo.currency}
              onChange={(e) => setSalaryInfo((prev) => ({ ...prev, currency: e.target.value }))}
              className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-mono font-bold text-foreground outline-none transition-all shadow-sm cursor-pointer"
            >
              {currenciesList.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {salaryInfo.payType === 'MONTHLY' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Monthly Base Salary *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="35000"
                  value={salaryInfo.baseSalary}
                  onChange={(e) => setSalaryInfo((prev) => ({ ...prev, baseSalary: e.target.value }))}
                  className="w-full bg-background border border-border focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-mono font-bold text-foreground outline-none transition-all shadow-sm pl-4 pr-16"
                />
                <span className="absolute right-4 top-3 text-xs text-muted-foreground font-mono font-semibold">
                  {salaryInfo.currency}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Hourly Rate *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="1000"
                  value={salaryInfo.hourlyRate}
                  onChange={(e) => setSalaryInfo((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                  className="w-full bg-background border border-brand focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-xl p-3 text-xs font-mono font-bold text-foreground outline-none transition-all shadow-sm pl-4 pr-24"
                />
                <span className="absolute right-4 top-3 text-xs text-muted-foreground font-mono font-semibold">
                  {salaryInfo.currency} / hr
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
