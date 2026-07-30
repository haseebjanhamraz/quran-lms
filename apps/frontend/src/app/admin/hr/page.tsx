'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, DollarSign, Calendar, CheckCircle2, Clock, Plus, Trash2, Loader2,
  XCircle, UserCheck, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  salary?: number;
  isActive: boolean;
}

interface PaymentRecord {
  id: string;
  teacherId: string;
  teacher?: { name: string; email: string };
  amount: number;
  month: string;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export default function HRManagementPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [loading, setLoading] = useState(true);

  // Record Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [amount, setAmount] = useState<number>(35000);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachRes, payRes] = await Promise.all([
        fetch(`${API_URL}/users`, { credentials: 'include' }),
        fetch(`${API_URL}/salary-payments?month=${selectedMonth}`, { credentials: 'include' }),
      ]);

      if (teachRes.ok) {
        const uData = await teachRes.json();
        setTeachers(Array.isArray(uData) ? uData.filter((u: any) => u.role === 'TEACHER') : []);
      }
      if (payRes.ok) {
        const pData = await payRes.json();
        setPayments(Array.isArray(pData) ? pData : []);
      }
    } catch (err) {
      console.error('Error loading HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/salary-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          amount: Number(amount),
          month: selectedMonth,
          paymentMethod,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNotes('');
        fetchData();
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to void this payment record?')) return;
    try {
      const res = await fetch(`${API_URL}/salary-payments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error deleting payment record:', err);
    }
  };

  const openPayModalForTeacher = (teacher: TeacherItem) => {
    setSelectedTeacherId(teacher.id);
    setAmount(teacher.salary || 35000);
    setShowModal(true);
  };

  // Map payments by teacherId
  const paymentMap = useMemo(() => {
    const map = new Map<string, PaymentRecord>();
    payments.forEach((p) => map.set(p.teacherId, p));
    return map;
  }, [payments]);

  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const paidCount = payments.length;
    const pendingCount = Math.max(0, totalTeachers - paidCount);
    const totalPaidAmount = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpectedAmount = teachers.reduce((s, t) => s + (t.salary || 0), 0);
    return { totalTeachers, paidCount, pendingCount, totalPaidAmount, totalExpectedAmount };
  }, [teachers, payments]);

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-brand" />
            <span>HR & Staff Payroll Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">Track monthly cash salary disbursements, payroll overview, and teacher compensation history.</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl self-start">
          <Calendar className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Billing Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold text-foreground font-mono"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.totalTeachers}</p>
            <p className="text-xs text-muted-foreground font-medium">Teaching Staff</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{stats.paidCount} Paid</p>
            <p className="text-xs text-muted-foreground font-medium">Disbursed This Month</p>
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
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.totalPaidAmount.toLocaleString()} Cash</p>
            <p className="text-xs text-muted-foreground font-medium">Total Paid / {stats.totalExpectedAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Roster & Payroll Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
        <div className="p-4 border-b border-border/40 bg-card/30 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-foreground">Monthly Salary Disbursement Roster — {selectedMonth}</h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading payroll records...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">No active teachers registered in the system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/20">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Employee ID</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Teacher Name</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Base Salary</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Paid Date / Method</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {teachers.map((teacher) => {
                  const payment = paymentMap.get(teacher.id);
                  const isPaid = !!payment;
                  return (
                    <tr key={teacher.id} className="hover:bg-card/20 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-brand">
                        {teacher.employeeId || 'EMP-001'}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{teacher.email}</p>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-foreground">
                        {teacher.salary ? `${teacher.salary.toLocaleString()} Cash` : '—'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        {isPaid ? (
                          <div>
                            <p className="font-semibold text-foreground">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                            <p className="text-[10px] font-mono">{payment.paymentMethod}</p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isPaid ? (
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs text-emerald-500 font-semibold">Disbursed</span>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                              title="Void Payment Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPayModalForTeacher(teacher)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                          >
                            Record Cash Payment
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

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display">Record Cash Salary Payment</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    const t = teachers.find((x) => x.id === e.target.value);
                    if (t?.salary) setAmount(t.salary);
                  }}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (Cash)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Gateway</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                  >
                    <option value="CASH">Cash Gateway</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Billing Month</label>
                <input
                  type="month"
                  required
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notes / Receipt Ref</label>
                <textarea
                  rows={2}
                  placeholder="Cash voucher number or payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Cash Disbursement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
