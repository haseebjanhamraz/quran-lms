'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, DollarSign, Calendar, CheckCircle2, Clock, Send, Plus, Loader2,
  XCircle, AlertCircle, RefreshCw, Mail, Globe
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    email: string;
    timezone?: string;
    studentId?: number;
  };
  course?: {
    id: string;
    title: string;
    type: string;
  };
  amount: number;
  currency: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
  paidAmount: number;
  paidDate?: string;
  billingMonth: string;
}

export default function FeesCollectionPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Pay Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [submittingPay, setSubmittingPay] = useState(false);

  // Sending Reminder State
  const [sendingId, setSendingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/fees/invoices?billingMonth=${selectedMonth}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth]);

  const handleGenerateMonthly = async () => {
    setGenerating(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_URL}/fees/invoices/generate-monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ billingMonth: selectedMonth }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message || 'Generated monthly invoices.');
        fetchInvoices();
      }
    } catch (err) {
      console.error('Error generating invoices:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmittingPay(true);

    try {
      const res = await fetch(`${API_URL}/fees/invoices/${selectedInvoice.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod: 'CASH',
        }),
      });

      if (res.ok) {
        setSelectedInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    setSendingId(invoiceId);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_URL}/fees/invoices/${invoiceId}/send-reminder`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    } finally {
      setSendingId(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter === 'ALL') return true;
      return inv.status === statusFilter;
    });
  }, [invoices, statusFilter]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paidCount = invoices.filter((i) => i.status === 'PAID').length;
    const pendingCount = invoices.filter((i) => i.status === 'PENDING').length;
    const totalCollected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    return { total, paidCount, pendingCount, totalCollected, totalInvoiced };
  }, [invoices]);

  // Format currency dynamically based on student country / currency code
  const formatCurrency = (amount: number, currency = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (_) {
      return `${amount} ${currency}`;
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-brand" />
            <span>Fees Collection & Student Billing</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage course fee structures, auto-generate invoices, collect cash payments, and dispatch reminders.</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl">
            <Calendar className="h-4 w-4 text-brand" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-foreground font-mono"
            />
          </div>

          <button
            onClick={handleGenerateMonthly}
            disabled={generating}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Auto-Generate Monthly Invoices</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Invoices Issued</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{stats.paidCount} Paid</p>
            <p className="text-xs text-muted-foreground font-medium">Collected Invoices</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{stats.pendingCount} Pending</p>
            <p className="text-xs text-muted-foreground font-medium">Awaiting Payment</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">Auto Country Currency</p>
            <p className="text-xs text-muted-foreground font-medium">PKR / USD / GBP</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border mb-6 gap-2">
        {['ALL', 'PENDING', 'PAID'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
              statusFilter === st ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {st} INVOICES
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading fee invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No invoices found for month {selectedMonth}. Click "Auto-Generate Monthly Invoices" to create billing records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/20">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Student</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Course Title</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Fee Amount (Country Currency)</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Due Date</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <tr key={inv.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">{inv.student?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{inv.student?.email || ''}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">{inv.course?.title || 'N/A'}</p>
                        <p className="text-[10px] text-muted-foreground">{inv.course?.type}</p>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm font-bold text-foreground">
                        {formatCurrency(inv.amount, inv.currency)}
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isPaid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {!isPaid ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setPayAmount(inv.amount - (inv.paidAmount || 0));
                                }}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                              >
                                Record Cash Fee
                              </button>
                              <button
                                onClick={() => handleSendReminder(inv.id)}
                                disabled={sendingId === inv.id}
                                className="flex items-center gap-1 bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold py-1.5 px-3 rounded-lg transition-all disabled:opacity-50"
                                title="Dispatch Resend Email & Notification"
                              >
                                {sendingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                <span>Remind</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD CASH FEE PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display">Record Student Cash Fee</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <p className="text-xs text-muted-foreground">Student: <strong className="text-foreground">{selectedInvoice.student?.name}</strong></p>
                <p className="text-xs text-muted-foreground">Course: <strong className="text-foreground">{selectedInvoice.course?.title}</strong></p>
                <p className="text-xs text-muted-foreground">Country Currency: <strong className="text-brand font-mono">{selectedInvoice.currency}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amount Paid ({selectedInvoice.currency})</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
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
                  <span>Confirm Cash Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
