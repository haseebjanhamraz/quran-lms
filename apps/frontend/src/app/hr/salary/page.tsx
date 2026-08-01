'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase, DollarSign, Calendar, CheckCircle2, Clock, Plus, Loader2,
  XCircle, UserCheck, Settings, FileText, Download, RefreshCw, Globe
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'UK', name: 'United Kingdom', currency: 'GBP' },
  { code: 'EU', name: 'European Union', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
];

export default function HRSalaryPage() {
  const [activeTab, setActiveTab] = useState<'PAYROLL' | 'CONFIGS'>('PAYROLL');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [payType, setPayType] = useState<'MONTHLY' | 'HOURLY'>('MONTHLY');
  const [hourlyRate, setHourlyRate] = useState<number>(1000);
  const [hoursWorked, setHoursWorked] = useState<number>(40);
  const [payAmount, setPayAmount] = useState<number>(35000);
  const [currency, setCurrency] = useState('PKR');
  const [country, setCountry] = useState('Pakistan');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Salary Slip Modal
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [loadingSlip, setLoadingSlip] = useState(false);

  // Salary Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTeacherId, setConfigTeacherId] = useState('');
  const [cfgPayType, setCfgPayType] = useState<'MONTHLY' | 'HOURLY'>('MONTHLY');
  const [cfgHourlyRate, setCfgHourlyRate] = useState<number>(1000);
  const [baseSalary, setBaseSalary] = useState<number>(35000);
  const [cfgCountry, setCfgCountry] = useState('Pakistan');
  const [cfgCurrency, setCfgCurrency] = useState('PKR');
  const [housingAllow, setHousingAllow] = useState<number>(0);
  const [transportAllow, setTransportAllow] = useState<number>(0);
  const [medicalAllow, setMedicalAllow] = useState<number>(0);
  const [taxDed, setTaxDed] = useState<number>(0);
  const [submittingConfig, setSubmittingConfig] = useState(false);

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/users`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/salary-payments?month=${selectedMonth}`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/salary-payments/configs`, { credentials: 'include' }).catch(() => null),
      ]);

      if (tRes && tRes.ok) {
        const uData = await tRes.json();
        setTeachers(Array.isArray(uData) ? uData.filter((u: any) => u.role === 'TEACHER') : []);
      }
      if (pRes && pRes.ok) setPayments(Array.isArray(pRes) ? pRes : []);
      if (cRes && cRes.ok) setConfigs(Array.isArray(cRes) ? cRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [selectedMonth]);

  // Recalculate hourly amount dynamically
  useEffect(() => {
    if (payType === 'HOURLY') {
      setPayAmount(hourlyRate * hoursWorked);
    }
  }, [payType, hourlyRate, hoursWorked]);

  const handleOpenPayModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    const existingCfg = configs.find((c: any) => c.teacher?.id === (teacher.id || teacher._id))?.config;
    const tPayType = existingCfg?.payType || teacher.payType || 'MONTHLY';
    const tRate = existingCfg?.hourlyRate || teacher.hourlyRate || 1000;
    const tCurr = existingCfg?.currency || teacher.currency || 'PKR';
    const tCountry = existingCfg?.country || teacher.country || 'Pakistan';
    const tBase = existingCfg?.baseSalary || teacher.salary || 35000;

    setPayType(tPayType as any);
    setHourlyRate(tRate);
    setHoursWorked(40);
    setCurrency(tCurr);
    setCountry(tCountry);
    setPayAmount(tPayType === 'HOURLY' ? tRate * 40 : tBase);
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setSubmittingPay(true);

    try {
      const res = await fetch(`${API_URL}/salary-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: selectedTeacher.id || selectedTeacher._id,
          amount: Number(payAmount),
          payType,
          hourlyRate: payType === 'HOURLY' ? Number(hourlyRate) : undefined,
          hoursWorked: payType === 'HOURLY' ? Number(hoursWorked) : undefined,
          currency,
          month: selectedMonth,
          paymentMethod: payMethod,
          notes: payNotes,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setPayNotes('');
        fetchSalaryData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configTeacherId) return;
    setSubmittingConfig(true);

    try {
      const res = await fetch(`${API_URL}/salary-payments/configs/${configTeacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          baseSalary: Number(baseSalary),
          payType: cfgPayType,
          hourlyRate: Number(cfgHourlyRate),
          country: cfgCountry,
          currency: cfgCurrency,
          housingAllowance: Number(housingAllow),
          transportAllowance: Number(transportAllow),
          medicalAllowance: Number(medicalAllow),
          taxDeduction: Number(taxDed),
        }),
      });

      if (res.ok) {
        setShowConfigModal(false);
        fetchSalaryData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingConfig(false);
    }
  };

  const handleGenerateSlip = async (paymentId: string) => {
    setLoadingSlip(true);
    try {
      const res = await fetch(`${API_URL}/salary-payments/${paymentId}/slip`, { credentials: 'include' });
      if (res.ok) {
        setSelectedSlip(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlip(false);
    }
  };

  const paymentMap = new Map(payments.map((p) => [p.teacherId?.toString(), p]));

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-brand" />
            <span>Teacher Salary &amp; Payroll Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">Disburse monthly or hourly teacher salaries with multi-currency &amp; country configurations.</p>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl self-start">
          <Calendar className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold text-foreground font-mono"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('PAYROLL')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'PAYROLL' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          MONTHLY / HOURLY PAYROLL DISBURSEMENT
        </button>
        <button
          onClick={() => setActiveTab('CONFIGS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'CONFIGS' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          SALARY STRUCTURE CONFIGURATIONS ({configs.length})
        </button>
      </div>

      {/* PAYROLL TAB */}
      {activeTab === 'PAYROLL' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 shadow-xl">
          <div className="p-4 border-b border-border/40 bg-card/30 flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-foreground">Teacher Payroll Roster — {selectedMonth}</h3>
            <button onClick={fetchSalaryData} className="p-1.5 text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No active teaching staff found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-card/20 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="py-3.5 px-6">Teacher Name</th>
                    <th className="py-3.5 px-6">Pay Type</th>
                    <th className="py-3.5 px-6">Country / Currency</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Payment Date</th>
                    <th className="py-3.5 px-6 font-right">Amount</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {teachers.map((teacher) => {
                    const payment = paymentMap.get(teacher.id || teacher._id);
                    const isPaid = !!payment;
                    const cfg = configs.find((c: any) => c.teacher?.id === (teacher.id || teacher._id))?.config;
                    const pType = payment?.payType || cfg?.payType || teacher.payType || 'MONTHLY';
                    const pCurr = payment?.currency || cfg?.currency || teacher.currency || 'PKR';
                    const pCountry = cfg?.country || teacher.country || 'Pakistan';

                    return (
                      <tr key={teacher.id || teacher._id} className="hover:bg-card/20 transition-colors">
                        <td className="py-4 px-6 font-semibold text-foreground">
                          <div>
                            <p>{teacher.name}</p>
                            <p className="text-[10px] text-muted-foreground">{teacher.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            pType === 'HOURLY' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {pType}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs">
                          <span className="font-semibold text-foreground">{pCountry}</span>
                          <span className="text-muted-foreground ml-1 font-mono">({pCurr})</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            isPaid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-muted-foreground">
                          {isPaid ? new Date(payment.paymentDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-foreground">
                          {isPaid ? `${payment.amount?.toLocaleString()} ${payment.currency || 'PKR'}` : '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isPaid ? (
                            <button
                              onClick={() => handleGenerateSlip(payment.id || payment._id)}
                              className="bg-card hover:bg-muted border border-border text-foreground text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 inline-flex"
                            >
                              <FileText className="h-3.5 w-3.5 text-brand" /> Salary Slip
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPayModal(teacher)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm"
                            >
                              Disburse Salary
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIGS TAB */}
      {activeTab === 'CONFIGS' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-foreground">Teacher Salary Structures &amp; Multi-Currency Configurations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map((item: any) => (
              <div key={item.teacher.id} className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-foreground">{item.teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{item.teacher.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {item.config.payType || 'MONTHLY'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {item.config.country || 'Pakistan'} ({item.config.currency || 'PKR'})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setConfigTeacherId(item.teacher.id);
                      setCfgPayType(item.config.payType || 'MONTHLY');
                      setCfgHourlyRate(item.config.hourlyRate || 1000);
                      setBaseSalary(item.config.baseSalary || 35000);
                      setCfgCountry(item.config.country || 'Pakistan');
                      setCfgCurrency(item.config.currency || 'PKR');
                      setHousingAllow(item.config.housingAllowance || 0);
                      setTransportAllow(item.config.transportAllowance || 0);
                      setMedicalAllow(item.config.medicalAllowance || 0);
                      setTaxDed(item.config.taxDeduction || 0);
                      setShowConfigModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-border/40 font-mono">
                  {item.config.payType === 'HOURLY' ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate:</span>
                      <span className="font-bold text-purple-500">{item.config.currency || 'PKR'} {item.config.hourlyRate?.toLocaleString()}/hr</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Salary:</span>
                      <span className="font-bold text-foreground">{item.config.currency || 'PKR'} {item.config.baseSalary?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Housing / Transport:</span>
                    <span>{item.config.currency || 'PKR'} {(item.config.housingAllowance + item.config.transportAllowance)?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Deduction:</span>
                    <span className="text-rose-500">-{item.config.currency || 'PKR'} {item.config.taxDeduction?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISBURSE SALARY MODAL */}
      {showPayModal && selectedTeacher && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display">Disburse Teacher Salary</h3>
              <button onClick={() => setShowPayModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <p className="text-xs text-muted-foreground">Teacher: <strong className="text-foreground">{selectedTeacher.name}</strong></p>
                <p className="text-xs text-muted-foreground">Month: <strong className="text-brand font-mono">{selectedMonth}</strong></p>
                <p className="text-xs text-muted-foreground">Country: <strong className="text-foreground">{country}</strong> ({currency})</p>
              </div>

              {/* Pay Type Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Basis</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayType('MONTHLY')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      payType === 'MONTHLY' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Monthly Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType('HOURLY')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      payType === 'HOURLY' ? 'bg-purple-600 text-white border-purple-600' : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Hourly Basis
                  </button>
                </div>
              </div>

              {payType === 'HOURLY' ? (
                <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Hourly Rate ({currency})</label>
                    <input
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Hours Worked</label>
                    <input
                      type="number"
                      required
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold text-purple-500"
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Total Amount ({currency}) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold text-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Gateway</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  >
                    <option value="CASH">Cash Voucher</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Voucher Notes</label>
                <textarea
                  rows={2}
                  placeholder="Receipt or transaction notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5"
                >
                  {submittingPay && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Salary Payout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALARY SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <div>
                <h3 className="text-xl font-bold font-display">Official Salary Slip</h3>
                <p className="text-xs text-brand font-mono font-semibold">{selectedSlip.slipNumber}</p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pay Basis:</span>
                <span className="font-bold">{selectedSlip.breakdown?.payType || 'MONTHLY'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country / Currency:</span>
                <span className="font-bold">{selectedSlip.breakdown?.country} ({selectedSlip.breakdown?.currency})</span>
              </div>

              {selectedSlip.breakdown?.payType === 'HOURLY' && (
                <div className="flex justify-between text-purple-500">
                  <span>Hours Worked &amp; Rate:</span>
                  <span>{selectedSlip.breakdown?.hoursWorked} hrs @ {selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.hourlyRate}/hr</span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Base Salary / Payout:</span>
                <span className="font-bold">{selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.baseSalary?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Housing Allowance:</span>
                <span>{selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.housingAllowance?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transport Allowance:</span>
                <span>{selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.transportAllowance?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Gross Salary:</span>
                <span className="font-bold">{selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.grossSalary?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Tax Deductions:</span>
                <span>-{selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.taxDeduction?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-emerald-500">
                <span>Net Salary Paid:</span>
                <span>{selectedSlip.breakdown?.currency} {selectedSlip.breakdown?.netSalary?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSlip(null)}
                className="bg-primary text-primary-foreground text-xs font-bold py-2 px-5 rounded-lg shadow-md"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALARY CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display">Configure Teacher Salary Structure</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Pay Type Toggle */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCfgPayType('MONTHLY')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      cfgPayType === 'MONTHLY' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Monthly Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfgPayType('HOURLY')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      cfgPayType === 'HOURLY' ? 'bg-purple-600 text-white border-purple-600' : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Hourly Salary
                  </button>
                </div>
              </div>

              {/* Country & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Teacher Country</label>
                  <select
                    value={cfgCountry}
                    onChange={(e) => {
                      const cName = e.target.value;
                      const found = COUNTRIES.find((c) => c.name === cName);
                      setCfgCountry(cName);
                      if (found) setCfgCurrency(found.currency);
                    }}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Payout Currency</label>
                  <select
                    value={cfgCurrency}
                    onChange={(e) => setCfgCurrency(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                  >
                    <option value="PKR">PKR (Rs)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="SAR">SAR (SR)</option>
                    <option value="AED">AED (Dh)</option>
                  </select>
                </div>
              </div>

              {cfgPayType === 'HOURLY' ? (
                <div className="space-y-1 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Hourly Rate ({cfgCurrency}) *</label>
                  <input
                    type="number"
                    required
                    value={cfgHourlyRate}
                    onChange={(e) => setCfgHourlyRate(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold text-purple-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Base Monthly Salary ({cfgCurrency}) *</label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Housing Allowance</label>
                  <input
                    type="number"
                    value={housingAllow}
                    onChange={(e) => setHousingAllow(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Transport Allowance</label>
                  <input
                    type="number"
                    value={transportAllow}
                    onChange={(e) => setTransportAllow(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Medical Allowance</label>
                  <input
                    type="number"
                    value={medicalAllow}
                    onChange={(e) => setMedicalAllow(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tax Deduction</label>
                  <input
                    type="number"
                    value={taxDed}
                    onChange={(e) => setTaxDed(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono text-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConfig}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5"
                >
                  {submittingConfig && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
