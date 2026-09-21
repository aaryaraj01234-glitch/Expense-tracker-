import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileText,
  Calendar,
  Download,
  TrendingDown,
  TrendingUp,
  Percent,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, formatDate, downloadTransactionsCSV, getMonthDisplay } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';
import { ColorfulDonutChart } from './charts/ColorfulDonutChart';
import { ColorfulTrendChart, TrendDayData } from './charts/ColorfulTrendChart';
import { CashFlowComparisonChart } from './charts/CashFlowComparisonChart';
import { getCategoryColor, getPaymentMethodColor } from './charts/chartColors';
import { DetailedFinancialReport } from './DetailedFinancialReport';

type ReportViewType = 'monthly' | 'weekly' | 'custom';

export const ReportsView: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    selectedMonth,
    setSelectedMonth,
    showToast,
  } = useExpense();

  const [viewType, setViewType] = useState<ReportViewType>('monthly');
  const [displayMode, setDisplayMode] = useState<'graph' | 'report'>('graph');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Current scope human-readable label
  const periodLabel = useMemo(() => {
    if (viewType === 'monthly') return getMonthDisplay(selectedMonth);
    if (viewType === 'weekly') return 'Last 7 Days';
    if (customStart && customEnd) return `${customStart} to ${customEnd}`;
    return 'Custom Period';
  }, [viewType, selectedMonth, customStart, customEnd]);

  // Category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }));
    return map;
  }, [categories]);

  // Filter transactions according to selected report scope
  const filteredTransactions = useMemo(() => {
    if (viewType === 'monthly') {
      return transactions.filter((t) => t.date.startsWith(selectedMonth));
    } else if (viewType === 'weekly') {
      // Last 7 days from today
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const startStr = sevenDaysAgo.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];
      return transactions.filter((t) => t.date >= startStr && t.date <= endStr);
    } else {
      // Custom date range
      return transactions.filter((t) => {
        if (customStart && t.date < customStart) return false;
        if (customEnd && t.date > customEnd) return false;
        return true;
      });
    }
  }, [transactions, viewType, selectedMonth, customStart, customEnd]);

  // Aggregate Metrics
  const { totalIncome, totalExpenses, netBalance, savingsRate } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    });

    const net = income - expenses;
    const rate = income > 0 ? Math.max(0, (net / income) * 100) : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: net,
      savingsRate: rate,
    };
  }, [filteredTransactions]);

  // Spending by Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      }
    });

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId) || { name: 'Other', icon: 'Tag' };
        const share = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return {
          id: catId,
          name: cat.name,
          icon: cat.icon,
          amount,
          share,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categoryMap, totalExpenses]);

  // Payment Method Breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        map.set(t.paymentMethod, (map.get(t.paymentMethod) || 0) + t.amount);
      }
    });

    return Array.from(map.entries())
      .map(([method, amount]) => ({
        method,
        amount,
        share: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpenses]);

  // Largest Expenses (Top 6)
  const largestExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [filteredTransactions]);

  // Trend Data: Group expenses by date
  const trendData = useMemo(() => {
    const expenseMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.type === 'expense') {
        expenseMap.set(t.date, (expenseMap.get(t.date) || 0) + t.amount);
      }
    });

    const dates = Array.from(expenseMap.keys()).sort();
    const data = dates.map((dateStr) => ({
      date: dateStr,
      amount: expenseMap.get(dateStr) || 0,
    }));

    const max = Math.max(...data.map((d) => d.amount), 1);
    return { items: data, max };
  }, [filteredTransactions]);

  const formattedTrendDays: TrendDayData[] = useMemo(() => {
    return trendData.items.map((item, idx) => ({
      day: parseInt(item.date.split('-')[2], 10) || idx + 1,
      dateStr: item.date,
      amount: item.amount,
      label: formatDate(item.date, settings.dateFormat),
    }));
  }, [trendData.items, settings.dateFormat]);

  // Download all transactions as CSV with columns Date, Description, Category, Amount, Type
  const handleDownloadAllCSV = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export', 'error');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    downloadTransactionsCSV(transactions, categories, `all_transactions_${todayStr}.csv`);
    showToast(`Downloaded ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} as CSV`, 'success');
  };

  return (
    <div id="reports-page-container" className="max-w-6xl mx-auto space-y-6 pb-14">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Financial Reports
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            Clear, honest financial trends and category analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle for Report or Graph */}
          <div
            id="report-graph-toggle-container"
            className="flex items-center bg-neutral-100 dark:bg-neutral-800/90 p-1 rounded-xl text-xs border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs"
          >
            <button
              id="report-graph-toggle-graph"
              type="button"
              onClick={() => setDisplayMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                displayMode === 'graph'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Switch to visual graphs and charts view"
            >
              <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
              <span>Graph</span>
            </button>
            <button
              id="report-graph-toggle-report"
              type="button"
              onClick={() => setDisplayMode('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                displayMode === 'report'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Switch to detailed audited statement and tabular report view"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Report</span>
            </button>
          </div>

          <button
            id="download-as-csv-btn"
            type="button"
            onClick={handleDownloadAllCSV}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download all transactions as CSV (Date, Description, Category, Amount, Type)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download as CSV</span>
          </button>
        </div>
      </div>

      {/* Scope Switcher: Monthly / Weekly / Custom */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewType('monthly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewType === 'monthly'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
            }`}
          >
            Monthly View
          </button>
          <button
            type="button"
            onClick={() => setViewType('weekly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewType === 'weekly'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setViewType('custom')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewType === 'custom'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Dynamic Context Controls */}
        {viewType === 'monthly' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <span>Period: {getMonthDisplay(selectedMonth)}</span>
          </div>
        )}

        {viewType === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {/* Detailed Report View vs Visual Graph View */}
      {displayMode === 'report' ? (
        <DetailedFinancialReport
          transactions={filteredTransactions}
          categories={categories}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          netBalance={netBalance}
          savingsRate={savingsRate}
          periodLabel={periodLabel}
          currency={settings.currency}
          currencySymbol={settings.currencySymbol}
          dateFormat={settings.dateFormat}
          onDownloadCSV={handleDownloadAllCSV}
        />
      ) : (
        <>
          {/* Primary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Total Income
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalIncome, settings.currency, settings.currencySymbol)}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Total Expenses
          </span>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpenses, settings.currency, settings.currencySymbol)}
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Net Balance
          </span>
          <div
            className={`text-xl sm:text-2xl font-bold ${
              netBalance >= 0 ? 'text-neutral-900 dark:text-neutral-100' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(netBalance, settings.currency, settings.currencySymbol)}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-1">
            Savings Rate
          </span>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Cash Flow Comparison Chart */}
      <CashFlowComparisonChart
        income={totalIncome}
        expenses={totalExpenses}
        currency={settings.currency}
        currencySymbol={settings.currencySymbol}
        periodLabel={
          viewType === 'monthly'
            ? getMonthDisplay(selectedMonth)
            : viewType === 'weekly'
            ? 'Last 7 Days'
            : 'Custom Range'
        }
      />

      {/* Spending Trend (Dynamic Colorful Area & Bars Chart) */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
        <ColorfulTrendChart
          days={formattedTrendDays}
          maxAmount={trendData.max}
          totalExpense={totalExpenses}
          currency={settings.currency}
          currencySymbol={settings.currencySymbol}
          title="Spending Trend"
          subtitle="Daily recorded expense volume over the selected timeframe"
        />
      </div>

      {/* Grid: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Spending by Category
            </h3>
            <span className="text-xs text-neutral-400">
              {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">No category spending recorded</div>
          ) : (
            <div className="flex flex-col space-y-4">
              {/* Colorful Donut Chart */}
              <div className="py-2">
                <ColorfulDonutChart
                  data={categoryBreakdown.map((c) => ({
                    id: c.id,
                    name: c.name,
                    amount: c.amount,
                    percentage: c.share,
                    icon: c.icon,
                  }))}
                  totalAmount={totalExpenses}
                  currency={settings.currency}
                  currencySymbol={settings.currencySymbol}
                  size={190}
                  donutThickness={28}
                  showLegend={false}
                />
              </div>

              {/* Ranked Category List with Vibrant Colors */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {categoryBreakdown.map((cat, idx) => {
                  const color = getCategoryColor(cat.id, cat.name, idx);
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white shadow-2xs"
                            style={{ backgroundColor: color }}
                          >
                            <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatCurrency(cat.amount, settings.currency, settings.currencySymbol)}
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1.5"
                            style={{
                              backgroundColor: `${color}18`,
                              color: color,
                            }}
                          >
                            {cat.share.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Colorful Progress bar */}
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(cat.share, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Payment Methods
            </h3>
            <span className="text-xs text-neutral-400">Channel distribution</span>
          </div>

          {paymentMethodBreakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 py-8">
              No transactions recorded
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {/* Colorful Multi-Segment Top Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800 gap-0.5 p-0.5">
                {paymentMethodBreakdown.map((pm, idx) => {
                  const color = getPaymentMethodColor(pm.method, idx);
                  return (
                    <div
                      key={pm.method}
                      style={{
                        width: `${Math.min(pm.share, 100)}%`,
                        backgroundColor: color,
                      }}
                      className="h-full rounded-xs transition-all duration-300"
                      title={`${pm.method}: ${pm.share.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Individual Payment Method Rows with matching colors */}
              <div className="space-y-3.5 pt-1">
                {paymentMethodBreakdown.map((pm, idx) => {
                  const color = getPaymentMethodColor(pm.method, idx);
                  return (
                    <div key={pm.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {pm.method}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatCurrency(pm.amount, settings.currency, settings.currencySymbol)}
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1.5"
                            style={{
                              backgroundColor: `${color}18`,
                              color: color,
                            }}
                          >
                            {pm.share.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(pm.share, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Largest Expenses in Period */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Largest Expenses
        </h3>

        {largestExpenses.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No expenses in this period</p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {largestExpenses.map((tx, idx) => {
              const cat = categoryMap.get(tx.category) || { name: 'Other', icon: 'Tag' };
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono text-neutral-400 text-[11px] font-semibold">
                      #{idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {tx.description}
                      </p>
                      <p className="text-neutral-400 text-[11px]">
                        {formatDate(tx.date, settings.dateFormat)} • {cat.name} • {tx.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(tx.amount, settings.currency, settings.currencySymbol)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
