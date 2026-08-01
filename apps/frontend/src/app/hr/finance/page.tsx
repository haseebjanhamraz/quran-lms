'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, Plus, CheckCircle2, XCircle, Clock,
  Loader2, RefreshCw, AlertCircle, Check, ShieldCheck
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function HRFinancePage() {
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'FEE_INVOICES'>('EXPENSES');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('SUPPLIES');
  const [expDesc, setExpDesc] = useState('');
  const [submittingExp, setSubmittingExp] = useState(false);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [eRes, iRes] = await Promise.all([
        fetch(`${API_URL}/finance/expenses`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/fees/invoices`, { credentials: 'include' }).catch(() => null),
      ]);

      if (eRes && eRes.ok) setExpenses(await eRes.json());
      if (iRes && iRes.ok) setInvoices(await iRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    setSubmittingExp(true);

    try {
      const res = await fetch(`${API_URL}/finance/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: expTitle,
          amount: Number(expAmount),
          category: expCategory,
          description: expDesc,
        }),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpTitle('');
        setExpAmount('');
        setExpDesc('');
        fetchFinanceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingExp(false);
    }
  };

  const handleApproveExpense = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_URL}/finance/expenses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (res.ok) fetchFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-brand" />
            <span>Finance &amp; Expense Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage operational expenses, expense approval workflow, and student fee invoices.</p>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-5 rounded-xl shadow-md transition-all self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'EXPENSES' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          ORGANIZATIONAL EXPENSES ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('FEE_INVOICES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'FEE_INVOICES' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          STUDENT FEE INVOICES ({invoices.length})
        </button>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'EXPENSES' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 shadow-xl">
          <div className="p-4 border-b border-border/40 bg-card/30 flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-foreground">Expense Vouchers &amp; Approvals</h3>
            <button onClick={fetchFinanceData} className="p-1.5 text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No expenses recorded yet. Click "Record Expense" to add one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-card/20 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="py-3.5 px-6">Title</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Created By</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {expenses.map((exp) => (
                    <tr key={exp._id || exp.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground">{exp.title}</td>
                      <td className="py-4 px-6">
                        <span className="bg-card border border-border px-2.5 py-1 rounded-md text-[10px] font-bold font-mono">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-rose-500">Rs. {exp.amount?.toLocaleString()}</td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-xs">{exp.createdBy?.name || 'Staff'}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          exp.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : exp.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {exp.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveExpense(exp._id || exp.id, 'APPROVED')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleApproveExpense(exp._id || exp.id, 'REJECTED')}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic flex justify-end items-center gap-1">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FEE INVOICES TAB */}
      {activeTab === 'FEE_INVOICES' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 shadow-xl">
          <div className="p-4 border-b border-border/40 bg-card/30 flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-foreground">Student Invoices</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/20 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-6">Course</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Month</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {invoices.map((inv) => (
                  <tr key={inv.id || inv._id} className="hover:bg-card/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground">{inv.student?.name || 'Student'}</td>
                    <td className="py-4 px-6 text-xs">{inv.course?.title || 'N/A'}</td>
                    <td className="py-4 px-6 font-mono font-bold">{inv.amount} {inv.currency}</td>
                    <td className="py-4 px-6 text-xs">{inv.billingMonth}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display">Record Organizational Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Internet Bill / Office Supplies"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (Rs) *</label>
                  <input
                    type="number"
                    required
                    placeholder="10000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  >
                    <option value="UTILITIES">Utilities</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SUPPLIES">Supplies</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="RENT">Rent</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description / Voucher Ref</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExp}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5"
                >
                  {submittingExp && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
