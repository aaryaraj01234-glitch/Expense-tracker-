import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
  Receipt,
  Layers,
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';
import { getCategoryColor, getPaymentMethodColor } from './charts/chartColors';

interface DetailedFinancialReportProps {
  transactions: Transaction[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  periodLabel: string;
  currency: string;
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  onDownloadCSV: () => void;
}

export const DetailedFinancialReport: React.FC<DetailedFinancialReportProps> = ({
  transactions,
  categories,
  totalIncome,
  totalExpenses,
  netBalance,
  savingsRate,
  periodLabel,
  currency,
  currencySymbol,
  dateFormat,
  onDownloadCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Expenses only
  const expenseTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense');
  }, [transactions]);

  // Income transactions
  const incomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'income');
  }, [transactions]);

  // Category breakdown metrics
  const categoryReport = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        icon: string;
        total: number;
        count: number;
        max: number;
        min: number;
      }
    >();

    expenseTransactions.forEach((t) => {
      const cat = categoryMap.get(t.category);
      const id = t.category;
      const name = cat?.name || 'Uncategorized';
      const icon = cat?.icon || 'Tag';

      const existing = map.get(id) || {
        id,
        name,
        icon,
        total: 0,
        count: 0,
        max: 0,
        min: Infinity,
      };

      existing.total += t.amount;
      existing.count += 1;
      existing.max = Math.max(existing.max, t.amount);
      existing.min = Math.min(existing.min, t.amount);

      map.set(id, existing);
    });

    return Array.from(map.values())
      .map((c) => ({
        ...c,
        min: c.min === Infinity ? 0 : c.min,
        average: c.count > 0 ? c.total / c.count : 0,
        share: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenseTransactions, categoryMap, totalExpenses]);

  // Payment Method metrics
  const paymentMethodReport = useMemo(() => {
    const map = new Map<
      string,
      {
        method: string;
        inflow: number;
        outflow: number;
        count: number;
      }
    >();

    transactions.forEach((t) => {
      const m = t.paymentMethod || 'Other';
      const existing = map.get(m) || { method: m, inflow: 0, outflow: 0, count: 0 };
      if (t.type === 'income') {
        existing.inflow += t.amount;
      } else {
        existing.outflow += t.amount;
      }
      existing.count += 1;
      map.set(m, existing);
    });

    return Array.from(map.values())
      .map((pm) => ({
        ...pm,
        net: pm.inflow - pm.outflow,
        share: totalExpenses > 0 ? (pm.outflow / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.outflow - a.outflow);
  }, [transactions, totalExpenses]);

  // Daily statistics
  const dailyStats = useMemo(() => {
    const dayMap = new Map<string, number>();
    expenseTransactions.forEach((t) => {
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.amount);
    });

    const activeDays = dayMap.size;
    let peakDate = '';
    let peakAmount = 0;
    dayMap.forEach((amt, date) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakDate = date;
      }
    });

    const avgDailyExpense = activeDays > 0 ? totalExpenses / activeDays : 0;
    const avgExpenseTx = expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0;

    return {
      activeDays,
      peakDate,
      peakAmount,
      avgDailyExpense,
      avgExpenseTx,
    };
  }, [expenseTransactions, totalExpenses]);

  // Filtered & Sorted Transaction Ledger
  const filteredLedger = useMemo(() => {
    let list = [...transactions];

    if (selectedCategoryFilter !== 'all') {
      list = list.filter((t) => t.category === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (categoryMap.get(t.category)?.name || '').toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      } else {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    return list;
  }, [transactions, selectedCategoryFilter, searchQuery, sortField, sortOrder, categoryMap]);

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div id="detailed-financial-report" className="space-y-6">
      {/* Report Header Card */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Financial Audit & Statement Report
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Statement period: <strong className="text-neutral-700 dark:text-neutral-300">{periodLabel}</strong> • Generated on {todayStr}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={onDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Export all data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Inflow (Income)
            </span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome, currency, currencySymbol)}
            </div>
            <span className="text-[10px] text-neutral-400 block">
              {incomeTransactions.length} income credit{incomeTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Outflow (Expenses)
            </span>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenses, currency, currencySymbol)}
            </div>
            <span className="text-[10px] text-neutral-400 block">
              {expenseTransactions.length} expense debit{expenseTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Net Capital Surplus / Deficit
            </span>
            <div
              className={`text-lg font-bold ${
                netBalance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netBalance, currency, currencySymbol)}
            </div>
            <span className="text-[10px] text-neutral-400 block">
              {savingsRate.toFixed(1)}% savings retention
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Avg Daily Outflow
            </span>
            <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(dailyStats.avgDailyExpense, currency, currencySymbol)}
            </div>
            <span className="text-[10px] text-neutral-400 block">
              Across {dailyStats.activeDays} active day{dailyStats.activeDays !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Secondary Highlights Bar */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Peak Spend Day:</span>
            {dailyStats.peakDate ? (
              <span>
                {formatDate(dailyStats.peakDate, dateFormat)} ({formatCurrency(dailyStats.peakAmount, currency, currencySymbol)})
              </span>
            ) : (
              <span>None</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Avg Cost / Transaction:</span>
            <span>{formatCurrency(dailyStats.avgExpenseTx, currency, currencySymbol)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Audited Volume:</span>
            <span>{transactions.length} records</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Audit Table */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Category Expense Statement
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Itemized classification and share breakdown of all debits
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            {categoryReport.length} categories
          </span>
        </div>

        {categoryReport.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No expense categories to audit in this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Total Outflow</th>
                  <th className="py-2.5 px-3 text-right">Share (%)</th>
                  <th className="py-2.5 px-3 text-right">Avg / Debit</th>
                  <th className="py-2.5 px-3 text-right">Max Single</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {categoryReport.map((item, idx) => {
                  const color = getCategoryColor(item.id, item.name, idx);
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-400 font-mono">
                        {item.count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(item.total, currency, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                          }}
                        >
                          {item.share.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(item.average, currency, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(item.max, currency, currencySymbol)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-200 dark:border-neutral-700 font-bold text-neutral-900 dark:text-neutral-100">
                  <td className="py-3 px-3">Total Operating Outflow</td>
                  <td className="py-3 px-3 text-right font-mono">{expenseTransactions.length}</td>
                  <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                    {formatCurrency(totalExpenses, currency, currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right">100.0%</td>
                  <td className="py-3 px-3 text-right">
                    {formatCurrency(dailyStats.avgExpenseTx, currency, currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Payment Channel Analysis Table */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Payment Channel Reconciliation
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Net balance and transaction distribution across payment rails
            </p>
          </div>
        </div>

        {paymentMethodReport.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No payment methods recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Inflow</th>
                  <th className="py-2.5 px-3 text-right">Outflow</th>
                  <th className="py-2.5 px-3 text-right">Net Flow</th>
                  <th className="py-2.5 px-3 text-right">Tx Count</th>
                  <th className="py-2.5 px-3 text-right">Expense Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {paymentMethodReport.map((pm, idx) => {
                  const color = getPaymentMethodColor(pm.method, idx);
                  return (
                    <tr key={pm.method} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {pm.method}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(pm.inflow, currency, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                        {formatCurrency(pm.outflow, currency, currencySymbol)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          pm.net >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(pm.net, currency, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500 font-mono">{pm.count}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                          }}
                        >
                          {pm.share.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Itemized Audited Transaction Ledger with Filters */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Itemized Period Ledger
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              All transactions recorded during {periodLabel} ({filteredLedger.length} of {transactions.length} shown)
            </p>
          </div>

          {/* Quick Search and Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs w-36 sm:w-48 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                if (sortField === 'date') {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortField('date');
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                sortField === 'date'
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Date {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (sortField === 'amount') {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortField('amount');
                  setSortOrder('desc');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                sortField === 'amount'
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Amount {sortField === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            No transactions match the selected filter criteria.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px] z-10">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3 text-right">Type</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {filteredLedger.map((tx) => {
                  const cat = categoryMap.get(tx.category) || { name: 'Other', icon: 'Tag' };
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(tx.date, dateFormat)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px]">
                          <CategoryIcon name={cat.icon} className="w-3 h-3 text-neutral-500" />
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                            isIncome
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatCurrency(tx.amount, currency, currencySymbol)}
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
  );
};
