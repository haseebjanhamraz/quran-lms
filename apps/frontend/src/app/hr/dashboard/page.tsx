'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard, DollarSign, Briefcase, HelpCircle, ArrowUpRight, CheckCircle2,
  Clock, AlertTriangle, TrendingUp, Users, RefreshCw, Loader2, Plus, ArrowRight
} from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';
import IslamabadClock from '@/components/IslamabadClock';

export default function HRDashboardPage() {
  const { user } = useAuth();
  const [finStats, setFinStats] = useState<any>(null);
  const [salaryStats, setSalaryStats] = useState<any>(null);
  const [supportStats, setSupportStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [fRes, sRes, supRes] = await Promise.all([
        fetch(`${API_URL}/finance/dashboard`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/salary-payments/summary?month=${currentMonth}`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_URL}/support/dashboard`, { credentials: 'include' }).catch(() => null),
      ]);

      if (fRes && fRes.ok) setFinStats(await fRes.json());
      if (sRes && sRes.ok) setSalaryStats(await sRes.json());
      if (supRes && supRes.ok) setSupportStats(await supRes.json());
    } catch (err) {
      console.error('Error loading HR dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 mx-auto max-w-7xl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden glass-card rounded-3xl p-6 md:p-8 border border-border shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
              <Briefcase className="h-3.5 w-3.5" />
              <span>HR Operations &amp; Financial Management</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Welcome back, <span className="text-primary">{user?.name || 'HR Manager'}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
              Custom HR dashboard customized according to your system role and assigned permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IslamabadClock variant="badge" />
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 bg-card hover:bg-muted border border-border text-foreground text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <PermissionGate permissions={['fees.read', 'finance.read']}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand" />
              <span>Financial &amp; Fee Metrics</span>
            </h2>
            <Link href="/hr/finance" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Manage Finance</span> <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-border/60">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit mb-3">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Fee Collected</p>
              <p className="text-2xl font-bold text-emerald-500 font-mono mt-1">
                {finStats?.totalFeeCollected ? `Rs. ${finStats.totalFeeCollected.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">From student invoices</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border/60">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 w-fit mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Pending Student Fees</p>
              <p className="text-2xl font-bold text-amber-500 font-mono mt-1">
                {finStats?.totalPendingFees ? `Rs. ${finStats.totalPendingFees.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting collection</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border/60">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 w-fit mb-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Approved Expenses</p>
              <p className="text-2xl font-bold text-rose-500 font-mono mt-1">
                {finStats?.totalApprovedExpenses ? `Rs. ${finStats.totalApprovedExpenses.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Operational &amp; salary payouts</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border/60">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 w-fit mb-3">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Net Operating Profit</p>
              <p className="text-2xl font-bold text-foreground font-mono mt-1">
                {finStats?.netProfitBalance ? `Rs. ${finStats.netProfitBalance.toLocaleString()}` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Balance after expenses</p>
            </div>
          </div>
        </div>
      </PermissionGate>

      {/* Salary & Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll & Salary Column */}
        <PermissionGate permissions={['salary-payments.read']}>
          <div className="glass-panel p-6 rounded-2xl border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-brand" />
                <span>Teacher Salary &amp; Payroll Summary</span>
              </h3>
              <Link href="/hr/salary" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>View Payroll</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground font-semibold">Total Paid Staff</p>
                <p className="text-xl font-bold text-emerald-500 mt-1 font-mono">
                  {salaryStats?.paidCount || 0} / {salaryStats?.totalTeachers || 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Disbursed this month</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground font-semibold">Pending Salaries</p>
                <p className="text-xl font-bold text-amber-500 mt-1 font-mono">
                  {salaryStats?.pendingCount || 0} Staff
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting payout</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Disbursed Amount vs Expected Payroll</p>
                <p className="text-lg font-bold text-foreground font-mono mt-0.5">
                  Rs. {salaryStats?.totalPaid?.toLocaleString() || 0} / Rs. {salaryStats?.totalExpected?.toLocaleString() || 0}
                </p>
              </div>
              <Link
                href="/hr/salary"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all"
              >
                Process Payroll
              </Link>
            </div>
          </div>
        </PermissionGate>

        {/* Parent Support Tickets Column */}
        <PermissionGate permissions={['support.read']}>
          <div className="glass-panel p-6 rounded-2xl border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-brand" />
                <span>Parent Support Tickets</span>
              </h3>
              <Link href="/hr/support" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>View All Tickets</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground font-semibold">Open Support Tickets</p>
                <p className="text-xl font-bold text-amber-500 mt-1 font-mono">
                  {supportStats?.openCount || 0} Open
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Needs staff response</p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground font-semibold">Urgent Complaints</p>
                <p className="text-xl font-bold text-rose-500 mt-1 font-mono">
                  {supportStats?.urgentCount || 0} Urgent
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">High priority</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card/40 border border-border">
              <p className="text-xs font-bold text-foreground mb-2">Recent Parent Support Tickets</p>
              {supportStats?.recentTickets?.length ? (
                <div className="space-y-2">
                  {supportStats.recentTickets.map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-card/60">
                      <div>
                        <p className="font-semibold text-foreground">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground">{t.ticketNumber} • {t.raisedByName || 'Parent'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No open support tickets.</p>
              )}
            </div>
          </div>
        </PermissionGate>
      </div>

      {/* Recent Income & Expense Stream */}
      <PermissionGate permissions={['finance.read', 'fees.read']}>
        <div className="glass-panel p-6 rounded-2xl border border-border/60">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">Recent Financial Transactions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Recent Approved Expenses</p>
              {finStats?.recentExpenses?.length ? (
                <div className="space-y-2">
                  {finStats.recentExpenses.map((exp: any) => (
                    <div key={exp._id} className="p-3 rounded-xl bg-card border border-border/50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{exp.title}</p>
                        <p className="text-[10px] text-muted-foreground">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-500">-Rs. {exp.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No expense records.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Recent Recorded Income</p>
              {finStats?.recentIncome?.length ? (
                <div className="space-y-2">
                  {finStats.recentIncome.map((inc: any) => (
                    <div key={inc._id} className="p-3 rounded-xl bg-card border border-border/50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{inc.title}</p>
                        <p className="text-[10px] text-muted-foreground">{inc.source} • {new Date(inc.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-500">+Rs. {inc.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No income records.</p>
              )}
            </div>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
