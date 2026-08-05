'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase, DollarSign, Calendar, CheckCircle2, Clock, Plus, Trash2, Loader2,
  XCircle, UserCheck, AlertTriangle, ShieldCheck, CreditCard, Send, RefreshCw,
  Globe, BookOpen, Layers, Settings, Edit, User, Filter
} from 'lucide-react';
import { apiFetch } from '@/utils/apiFetch';

export const dynamic = 'force-dynamic';

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

interface StudentFeeUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  studentId?: number;
  timezone?: string;
  monthlyFee?: number;
  monthlyFeeOverride?: number;
  currency?: string;
  feeWaiverPercent?: number;
  customFeeNotes?: string;
  studentProfile?: {
    profile?: {
      monthlyFee?: number;
      monthlyFeeOverride?: number;
      currency?: string;
      feeWaiverPercent?: number;
      customFeeNotes?: string;
    };
  };
}

function HRManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab from URL query parameter: 'payroll' | 'fees' | 'fee-structures'
  const activeTab = searchParams.get('tab') || 'payroll';

  const handleTabChange = (tabKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabKey);
    router.push(`/admin/hr?${params.toString()}`, { scroll: false });
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // --- Common States ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [loading, setLoading] = useState(true);

  // --- TAB 1: Staff Payroll State ---
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [paySalaryAmount, setPaySalaryAmount] = useState<number>(35000);
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState('CASH');
  const [salaryNotes, setSalaryNotes] = useState('');
  const [submittingSalary, setSubmittingSalary] = useState(false);

  // --- TAB 2: Student Fees Collection State ---
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [feeActionMsg, setFeeActionMsg] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [studentFeeAmount, setStudentFeeAmount] = useState<number>(0);
  const [submittingFeePay, setSubmittingFeePay] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // --- TAB 3: Student Individual Fee Profiles & Rates State ---
  const [studentFeeUsers, setStudentFeeUsers] = useState<StudentFeeUser[]>([]);
  const [editingStudentFee, setEditingStudentFee] = useState<StudentFeeUser | null>(null);
  const [showFeeProfileModal, setShowFeeProfileModal] = useState(false);
  const [studentMonthlyFee, setStudentMonthlyFee] = useState<number>(50);
  const [studentCurrency, setStudentCurrency] = useState<string>('USD');
  const [studentFeeWaiver, setStudentFeeWaiver] = useState<number>(0);
  const [studentFeeNotes, setStudentFeeNotes] = useState<string>('');
  const [submittingStudentFee, setSubmittingStudentFee] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Fetch data depending on active tab or on month change
  useEffect(() => {
    fetchData();
  }, [activeTab, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'payroll') {
        const [teachRes, payRes] = await Promise.all([
          apiFetch(`${API_URL}/users`),
          apiFetch(`${API_URL}/salary-payments?month=${selectedMonth}`),
        ]);

        if (teachRes.ok) {
          const uData = await teachRes.json();
          setTeachers(Array.isArray(uData) ? uData.filter((u: any) => u.role === 'TEACHER') : []);
        }
        if (payRes.ok) {
          const pData = await payRes.json();
          setPayments(Array.isArray(pData) ? pData : []);
        }
      } else if (activeTab === 'fees') {
        const invRes = await apiFetch(`${API_URL}/fees/invoices?billingMonth=${selectedMonth}`);
        if (invRes.ok) {
          const data = await invRes.json();
          setInvoices(Array.isArray(data) ? data : []);
        }
      } else if (activeTab === 'fee-structures') {
        const usersRes = await apiFetch(`${API_URL}/users`);
        if (usersRes.ok) {
          const uData = await usersRes.json();
          const studentsOnly = Array.isArray(uData) ? uData.filter((u: any) => u.role === 'STUDENT') : [];
          setStudentFeeUsers(studentsOnly);
        }
      }
    } catch (err) {
      console.error('Error fetching HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- TAB 1 HANDLERS ---
  const handleRecordSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    setSubmittingSalary(true);

    try {
      const res = await apiFetch(`${API_URL}/salary-payments`, {
        method: 'POST',
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          amount: Number(paySalaryAmount),
          month: selectedMonth,
          paymentMethod: salaryPaymentMethod,
          notes: salaryNotes,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setSalaryNotes('');
        fetchData();
      }
    } catch (err) {
      console.error('Error recording salary payment:', err);
    } finally {
      setSubmittingSalary(false);
    }
  };

  const handleDeleteSalaryPayment = async (id: string) => {
    if (!confirm('Are you sure you want to void this salary payment record?')) return;
    try {
      const res = await apiFetch(`${API_URL}/salary-payments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error deleting salary payment:', err);
    }
  };

  const openPayModalForTeacher = (teacher: TeacherItem) => {
    setSelectedTeacherId(teacher.id);
    setPaySalaryAmount(teacher.salary || 35000);
    setShowPayModal(true);
  };

  // --- TAB 2 HANDLERS ---
  const handleGenerateMonthlyInvoices = async () => {
    setGeneratingInvoices(true);
    setFeeActionMsg(null);
    try {
      const res = await apiFetch(`${API_URL}/fees/invoices/generate-monthly`, {
        method: 'POST',
        body: JSON.stringify({ billingMonth: selectedMonth }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeeActionMsg(data.message || 'Generated monthly student fee invoices.');
        fetchData();
      }
    } catch (err) {
      console.error('Error generating invoices:', err);
    } finally {
      setGeneratingInvoices(false);
    }
  };

  const handleRecordStudentFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmittingFeePay(true);

    try {
      const res = await apiFetch(`${API_URL}/fees/invoices/${selectedInvoice.id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: Number(studentFeeAmount),
          paymentMethod: 'CASH',
        }),
      });

      if (res.ok) {
        setSelectedInvoice(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error recording student fee payment:', err);
    } finally {
      setSubmittingFeePay(false);
    }
  };

  const handleSendFeeReminder = async (invoiceId: string) => {
    setSendingReminderId(invoiceId);
    setFeeActionMsg(null);
    try {
      const res = await apiFetch(`${API_URL}/fees/invoices/${invoiceId}/send-reminder`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setFeeActionMsg(data.message);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    } finally {
      setSendingReminderId(null);
    }
  };

  // --- TAB 3 HANDLERS ---
  const openEditStudentFeeModal = (student: StudentFeeUser) => {
    setEditingStudentFee(student);
    const profile = student.studentProfile?.profile || {};
    const baseFee = student.monthlyFee !== undefined ? student.monthlyFee : (student.monthlyFeeOverride !== undefined ? student.monthlyFeeOverride : (profile.monthlyFee !== undefined ? profile.monthlyFee : (profile.monthlyFeeOverride !== undefined ? profile.monthlyFeeOverride : 50)));
    const currency = student.currency || profile.currency || 'USD';
    const waiver = student.feeWaiverPercent !== undefined ? student.feeWaiverPercent : (profile.feeWaiverPercent !== undefined ? profile.feeWaiverPercent : 0);
    const notes = student.customFeeNotes || profile.customFeeNotes || '';

    setStudentMonthlyFee(Number(baseFee));
    setStudentCurrency(currency);
    setStudentFeeWaiver(Number(waiver));
    setStudentFeeNotes(notes);
    setShowFeeProfileModal(true);
  };

  const handleSaveStudentFeeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentFee) return;
    setSubmittingStudentFee(true);

    const studentId = editingStudentFee.id || editingStudentFee._id;

    try {
      const res = await apiFetch(`${API_URL}/users/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          monthlyFee: Number(studentMonthlyFee),
          monthlyFeeOverride: Number(studentMonthlyFee),
          currency: studentCurrency,
          feeWaiverPercent: Number(studentFeeWaiver),
          customFeeNotes: studentFeeNotes,
        }),
      });

      if (res.ok) {
        setShowFeeProfileModal(false);
        setEditingStudentFee(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error updating student fee profile:', err);
    } finally {
      setSubmittingStudentFee(false);
    }
  };

  // --- Computations ---
  const paymentMap = useMemo(() => {
    const map = new Map<string, PaymentRecord>();
    payments.forEach((p) => map.set(p.teacherId, p));
    return map;
  }, [payments]);

  const payrollStats = useMemo(() => {
    const totalTeachers = teachers.length;
    const paidCount = payments.length;
    const pendingCount = Math.max(0, totalTeachers - paidCount);
    const totalPaidAmount = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpectedAmount = teachers.reduce((s, t) => s + (t.salary || 0), 0);
    return { totalTeachers, paidCount, pendingCount, totalPaidAmount, totalExpectedAmount };
  }, [teachers, payments]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (invoiceStatusFilter === 'ALL') return true;
      return inv.status === invoiceStatusFilter;
    });
  }, [invoices, invoiceStatusFilter]);

  const feeStats = useMemo(() => {
    const total = invoices.length;
    const paidCount = invoices.filter((i) => i.status === 'PAID').length;
    const pendingCount = invoices.filter((i) => i.status === 'PENDING').length;
    const totalCollected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    return { total, paidCount, pendingCount, totalCollected };
  }, [invoices]);

  const filteredStudentFeeUsers = useMemo(() => {
    if (!studentSearchQuery.trim()) return studentFeeUsers;
    const q = studentSearchQuery.toLowerCase();
    return studentFeeUsers.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [studentFeeUsers, studentSearchQuery]);

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
    <div className="relative mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-brand" />
            <span>HR & Financial Operations Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage staff payroll, teacher cash disbursements, student fees collection, and individual student fee profiles.</p>
        </div>

        {/* Tab Specific Top Controls */}
        {activeTab !== 'fee-structures' && (
          <div className="flex items-center gap-3 self-start">
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
              <Calendar className="h-4 w-4 text-brand" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-foreground font-mono cursor-pointer"
              />
            </div>

            {activeTab === 'fees' && (
              <button
                onClick={handleGenerateMonthlyInvoices}
                disabled={generatingInvoices}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
              >
                {generatingInvoices ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span>Auto-Generate Monthly Invoices</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main HR Management Tab Navigation Bar */}
      <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-2 border border-border/60 bg-card/60 shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('payroll')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'payroll'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Staff Payroll & Salaries</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('fees')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'fees'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Student Fees Collection & Billing</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('fee-structures')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'fee-structures'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Student Individual Fee Profiles & Rates</span>
        </button>
      </div>

      {/* TAB 1: STAFF PAYROLL & SALARIES */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Payroll Stats Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{payrollStats.totalTeachers}</p>
                <p className="text-xs text-muted-foreground font-medium">Teaching Staff</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{payrollStats.paidCount} Paid</p>
                <p className="text-xs text-muted-foreground font-medium">Disbursed This Month</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{payrollStats.pendingCount} Pending</p>
                <p className="text-xs text-muted-foreground font-medium">Awaiting Payment</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{payrollStats.totalPaidAmount.toLocaleString()} Cash</p>
                <p className="text-xs text-muted-foreground font-medium">Total Paid / {payrollStats.totalExpectedAmount.toLocaleString()}</p>
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
                                  onClick={() => handleDeleteSalaryPayment(payment.id)}
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
        </div>
      )}

      {/* TAB 2: STUDENT FEES COLLECTION & BILLING */}
      {activeTab === 'fees' && (
        <div className="space-y-6 animate-fadeIn">
          {feeActionMsg && (
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{feeActionMsg}</span>
            </div>
          )}

          {/* Stats Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{feeStats.total}</p>
                <p className="text-xs text-muted-foreground font-medium">Invoices Issued</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{feeStats.paidCount} Paid</p>
                <p className="text-xs text-muted-foreground font-medium">Collected Invoices</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{feeStats.pendingCount} Pending</p>
                <p className="text-xs text-muted-foreground font-medium">Awaiting Payment</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/50">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Auto Country Currency</p>
                <p className="text-xs text-muted-foreground font-medium">PKR / USD / GBP / EUR</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border gap-2">
            {['ALL', 'PENDING', 'PAID'].map((st) => (
              <button
                key={st}
                onClick={() => setInvoiceStatusFilter(st)}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
                  invoiceStatusFilter === st ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
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
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Fee Amount (Currency)</th>
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
                            <p className="font-semibold text-foreground">{inv.course?.title || 'General Student Billing'}</p>
                            <p className="text-[10px] text-muted-foreground">{inv.course?.type || 'Individual Student Fee'}</p>
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
                                      setStudentFeeAmount(inv.amount - (inv.paidAmount || 0));
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                                  >
                                    Record Cash Fee
                                  </button>
                                  <button
                                    onClick={() => handleSendFeeReminder(inv.id)}
                                    disabled={sendingReminderId === inv.id}
                                    className="flex items-center gap-1 bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold py-1.5 px-3 rounded-lg transition-all disabled:opacity-50"
                                    title="Dispatch Resend Email & Notification"
                                  >
                                    {sendingReminderId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
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
        </div>
      )}

      {/* TAB 3: STUDENT INDIVIDUAL FEE PROFILES & RATES */}
      {activeTab === 'fee-structures' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-5 rounded-2xl border border-border/50 bg-card/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand/15 text-brand border border-brand/20">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Individual Student Fee Profiles</h3>
                <p className="text-xs text-muted-foreground font-medium">Manage monthly tuition rates, currency, and waiver percentages per student (No per-course fees)</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-xl w-full sm:w-64">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student by name..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-foreground w-full"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading student fee profiles...</p>
              </div>
            ) : filteredStudentFeeUsers.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                No active students registered matching your search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border bg-card/20">
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Student Name</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Base Tuition Fee</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Fee Waiver (%)</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Net Monthly Billing</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Billing Currency</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">Fee Notes / Remarks</th>
                      <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-muted-foreground/80 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredStudentFeeUsers.map((st) => {
                      const profile = st.studentProfile?.profile || {};
                      const baseFee = Number(st.monthlyFee !== undefined ? st.monthlyFee : (st.monthlyFeeOverride !== undefined ? st.monthlyFeeOverride : (profile.monthlyFee !== undefined ? profile.monthlyFee : (profile.monthlyFeeOverride !== undefined ? profile.monthlyFeeOverride : 50))));
                      const currency = st.currency || profile.currency || 'USD';
                      const waiverPercent = Number(st.feeWaiverPercent !== undefined ? st.feeWaiverPercent : (profile.feeWaiverPercent !== undefined ? profile.feeWaiverPercent : 0));
                      const netFee = Math.max(0, Math.round(baseFee * (1 - waiverPercent / 100)));
                      const notes = st.customFeeNotes || profile.customFeeNotes || '—';

                      return (
                        <tr key={st.id || st._id} className="hover:bg-card/20 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-foreground">{st.name}</p>
                            <p className="text-xs text-muted-foreground">{st.email}</p>
                          </td>
                          <td className="py-4 px-6 font-mono text-sm font-bold text-foreground">
                            {formatCurrency(baseFee, currency)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              waiverPercent > 0
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}>
                              {waiverPercent}% Waiver
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-sm font-bold text-brand">
                            {formatCurrency(netFee, currency)} / mo
                          </td>
                          <td className="py-4 px-6 font-mono text-xs font-bold text-muted-foreground">
                            {currency}
                          </td>
                          <td className="py-4 px-6 text-xs text-muted-foreground max-w-xs truncate" title={notes}>
                            {notes}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => openEditStudentFeeModal(st)}
                              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-1.5 px-3 rounded-lg border border-primary/20 transition-all ml-auto"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Configure Fee</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD SALARY PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display text-foreground">Record Cash Salary Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRecordSalaryPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    const t = teachers.find((x) => x.id === e.target.value);
                    if (t?.salary) setPaySalaryAmount(t.salary);
                  }}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-medium"
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
                    value={paySalaryAmount}
                    onChange={(e) => setPaySalaryAmount(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Gateway</label>
                  <select
                    value={salaryPaymentMethod}
                    onChange={(e) => setSalaryPaymentMethod(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-medium"
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
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notes / Receipt Ref</label>
                <textarea
                  rows={2}
                  placeholder="Cash voucher number or payment notes..."
                  value={salaryNotes}
                  onChange={(e) => setSalaryNotes(e.target.value)}
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
                  disabled={submittingSalary}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingSalary && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Cash Disbursement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD CASH FEE PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display text-foreground">Record Student Cash Fee</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleRecordStudentFeePayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <p className="text-xs text-muted-foreground">Student: <strong className="text-foreground">{selectedInvoice.student?.name}</strong></p>
                <p className="text-xs text-muted-foreground font-mono">Currency: <strong className="text-brand">{selectedInvoice.currency}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amount Paid ({selectedInvoice.currency})</label>
                <input
                  type="number"
                  required
                  value={studentFeeAmount}
                  onChange={(e) => setStudentFeeAmount(Number(e.target.value))}
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
                  disabled={submittingFeePay}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingFeePay && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Cash Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT INDIVIDUAL FEE PROFILE MODAL */}
      {showFeeProfileModal && editingStudentFee && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-border bg-card">
            <div className="flex justify-between items-center mb-4 border-b border-border/40 pb-3">
              <h3 className="text-xl font-bold font-display text-foreground">
                Configure Student Fee Profile
              </h3>
              <button onClick={() => setShowFeeProfileModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentFeeProfile} className="space-y-4">
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <p className="text-xs text-muted-foreground">Student: <strong className="text-foreground">{editingStudentFee.name}</strong></p>
                <p className="text-xs text-muted-foreground">Email: <strong className="text-foreground">{editingStudentFee.email}</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Base Monthly Fee *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={studentMonthlyFee}
                    onChange={(e) => setStudentMonthlyFee(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Billing Currency</label>
                  <select
                    value={studentCurrency}
                    onChange={(e) => setStudentCurrency(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PKR">PKR (Rs)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Fee Waiver (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={studentFeeWaiver}
                  onChange={(e) => setStudentFeeWaiver(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Fee Notes / Special Discount Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Scholarship, sibling discount, custom billing notes..."
                  value={studentFeeNotes}
                  onChange={(e) => setStudentFeeNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none resize-none"
                />
              </div>

              {/* Net Summary */}
              <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-semibold">Net Calculated Monthly Billing</p>
                <span className="text-sm font-mono font-bold text-brand">
                  {formatCurrency(Math.max(0, Math.round(studentMonthlyFee * (1 - studentFeeWaiver / 100))), studentCurrency)} / mo
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowFeeProfileModal(false)}
                  className="bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStudentFee}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-5 rounded-lg text-sm font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingStudentFee && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Student Fee Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HRManagementPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex justify-center items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-xs font-semibold text-muted-foreground">Loading HR & Financial Operations...</p>
      </div>
    }>
      <HRManagementContent />
    </Suspense>
  );
}
