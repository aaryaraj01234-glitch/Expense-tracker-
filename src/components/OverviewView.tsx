import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Sparkles,
  Sun,
  Moon,
  BarChart3,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, formatHumanDate, getGreeting, getMonthDisplay } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';
import { Transaction } from '../types';
import { QuickAddFAB } from './QuickAddFAB';
import { ColorfulDonutChart } from './charts/ColorfulDonutChart';
import { ColorfulTrendChart } from './charts/ColorfulTrendChart';
import { getCategoryColor } from './charts/chartColors';

export const OverviewView: React.FC = () => {
  const {
    transactions,
    categories,
    budgets,
    settings,
    selectedMonth,
    openAddModal,
    setActiveTab,
    isDarkMode,
    toggleTheme,
  } = useExpense();

  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [analyticsMode, setAnalyticsMode] = useState<'graph' | 'report'>('graph');

  // Filter transactions for the active selected month (YYYY-MM)
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Overall Financial Calculations for the active month
  const { totalIncome, totalExpense, netRemaining, totalBalanceAllTime } = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });

    let allTimeInc = 0;
    let allTimeExp = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') allTimeInc += t.amount;
      else if (t.type === 'expense') allTimeExp += t.amount;
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netRemaining: income - expense,
      totalBalanceAllTime: allTimeInc - allTimeExp,
    };
  }, [monthTransactions, transactions]);

  // Category breakdown for expenses in this month
  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions.forEach((t) => {
      if (t.type === 'expense') {
        const current = map.get(t.category) || 0;
        map.set(t.category, current + t.amount);
      }
    });

    const result = Array.from(map.entries()).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'Other',
        icon: cat?.icon || 'Tag',
        amount,
        percentage,
      };
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, categories, totalExpense]);

  // Daily Spending Chart Data for the month
  const dailyChartData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyExpenses: { day: number; dateStr: string; amount: number }[] = [];
    const expenseByDay = new Map<number, number>();

    monthTransactions.forEach((t) => {
      if (t.type === 'expense') {
        const d = parseInt(t.date.split('-')[2], 10);
        expenseByDay.set(d, (expenseByDay.get(d) || 0) + t.amount);
      }
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      dailyExpenses.push({
        day,
        dateStr,
        amount: expenseByDay.get(day) || 0,
      });
    }

    const maxAmount = Math.max(...dailyExpenses.map((d) => d.amount), 1);
    return { days: dailyExpenses, maxAmount, daysInMonth };
  }, [selectedMonth, monthTransactions]);

  // Budget progress items for this month
  const budgetProgress = useMemo(() => {
    return budgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = monthTransactions
        .filter((t) => t.type === 'expense' && t.category === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const percent = b.monthlyLimit > 0 ? Math.min((spent / b.monthlyLimit) * 100, 100) : 0;
      const rawPercent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      const remaining = Math.max(0, b.monthlyLimit - spent);
      const isOver = spent > b.monthlyLimit;

      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: cat?.name || 'Category',
        icon: cat?.icon || 'Tag',
        spent,
        limit: b.monthlyLimit,
        percent,
        rawPercent,
        remaining,
        isOver,
        overAmount: spent - b.monthlyLimit,
      };
    });
  }, [budgets, categories, monthTransactions]);

  // Latest 6 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
      .slice(0, 6);
  }, [transactions]);

  // Category name lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }));
    return map;
  }, [categories]);

  // Monthly Report summary metrics for the Report view toggle
  const monthlyReportStats = useMemo(() => {
    const expenseTxs = monthTransactions.filter((t) => t.type === 'expense');
    const incomeTxs = monthTransactions.filter((t) => t.type === 'income');

    const dayMap = new Map<string, number>();
    expenseTxs.forEach((t) => {
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.amount);
    });

    let peakDay = '';
    let peakDayAmount = 0;
    dayMap.forEach((amt, date) => {
      if (amt > peakDayAmount) {
        peakDayAmount = amt;
        peakDay = date;
      }
    });

    const activeDays = dayMap.size;
    const avgDailyExpense = activeDays > 0 ? totalExpense / activeDays : 0;
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;
    const topExpenses = [...expenseTxs].sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      expenseCount: expenseTxs.length,
      incomeCount: incomeTxs.length,
      activeDays,
      peakDay,
      peakDayAmount,
      avgDailyExpense,
      savingsRate,
      topExpenses,
    };
  }, [monthTransactions, totalExpense, totalIncome]);

  // ZERO DATA EMPTY STATE
  if (transactions.length === 0) {
    return (
      <div id="overview-empty-state" className="max-w-4xl mx-auto py-12 sm:py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 flex items-center justify-center mb-5">
          <Wallet className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
          No transactions yet
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
          Start tracking your spending by adding your first transaction.
        </p>

        <div className="mt-6 flex items-center justify-center">
          <button
            id="empty-state-add-btn"
            type="button"
            onClick={() => openAddModal()}
            className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add transaction</span>
          </button>
        </div>

        {/* Quick Add Floating Action Button */}
        <QuickAddFAB />
      </div>
    );
  }

  return (
    <div id="overview-container" className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {getGreeting()}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            Financial summary for {getMonthDisplay(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="overview-theme-toggle"
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-600" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          <button
            id="overview-quick-add-btn"
            type="button"
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Primary Summary Cards (Prioritized: Balance, Income, Expenses, Remaining) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Balance */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Balance</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {formatCurrency(totalBalanceAllTime, settings.currency, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 block">
            Net overall savings
          </span>
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Income</span>
            <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(totalIncome, settings.currency, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 block">
            This month
          </span>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Expenses</span>
            <div className="w-5 h-5 rounded-md bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCurrency(totalExpense, settings.currency, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 block">
            This month
          </span>
        </div>

        {/* Visual 'Monthly Net' Indicator Card */}
        <div
          id="monthly-net-indicator-card"
          className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Monthly Net</span>
              <div
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  netRemaining > 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : netRemaining < 0
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {netRemaining > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Surplus</span>
                  </>
                ) : netRemaining < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>Deficit</span>
                  </>
                ) : (
                  <span>Balanced</span>
                )}
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                netRemaining > 0
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : netRemaining < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {netRemaining > 0 ? '+' : ''}
              {formatCurrency(netRemaining, settings.currency, settings.currencySymbol)}
            </div>
          </div>

          {/* Subtle green or red text accent highlighting difference and financial health */}
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] leading-tight">
            {netRemaining > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                + Income exceeds expenses by {formatCurrency(netRemaining, settings.currency, settings.currencySymbol)}
              </span>
            ) : netRemaining < 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                − Expenses exceed income by {formatCurrency(Math.abs(netRemaining), settings.currency, settings.currencySymbol)}
              </span>
            ) : (
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Income and expenses are evenly balanced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Section Header with Graph vs Report Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Monthly Spending Analytics</span>
            <span className="text-xs font-normal text-neutral-400">({getMonthDisplay(selectedMonth)})</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Switch between interactive colorful graphs and a structured monthly report
          </p>
        </div>

        {/* Toggle for Report or Graph */}
        <div
          id="overview-report-graph-toggle"
          className="flex items-center bg-neutral-100 dark:bg-neutral-800/90 p-1 rounded-xl text-xs border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs self-start sm:self-auto"
        >
          <button
            id="overview-toggle-graph-btn"
            type="button"
            onClick={() => setAnalyticsMode('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              analyticsMode === 'graph'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Show colorful trend and donut graphs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
            <span>Graph</span>
          </button>
          <button
            id="overview-toggle-report-btn"
            type="button"
            onClick={() => setAnalyticsMode('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              analyticsMode === 'report'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Show structured monthly financial report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {analyticsMode === 'report' ? (
        /* Monthly Summary Report Card */
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-6">
          {/* Executive Overview Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
            <div>
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                Avg Daily Spend
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(monthlyReportStats.avgDailyExpense, settings.currency, settings.currencySymbol)}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Over {monthlyReportStats.activeDays} active spend days
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                Peak Day Spend
              </span>
              <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                {monthlyReportStats.peakDayAmount > 0
                  ? formatCurrency(monthlyReportStats.peakDayAmount, settings.currency, settings.currencySymbol)
                  : 'N/A'}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                {monthlyReportStats.peakDay || 'No spend recorded'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                Savings Rate
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {totalIncome > 0 ? `${monthlyReportStats.savingsRate.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                {netRemaining >= 0 ? 'Surplus retained' : 'Deficit position'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
                Total Activity
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {monthTransactions.length}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                {monthlyReportStats.expenseCount} debits • {monthlyReportStats.incomeCount} credits
              </span>
            </div>
          </div>

          {/* Two Columns: Category Breakdown & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Left: Category Table (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Category Ledger Breakdown
                </h3>
                <span className="text-xs font-semibold text-neutral-400">
                  Total: {formatCurrency(totalExpense, settings.currency, settings.currencySymbol)}
                </span>
              </div>

              {categorySpending.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">No category spending recorded</p>
              ) : (
                <div className="border border-neutral-200/70 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                  {categorySpending.map((cat, idx) => {
                    const color = getCategoryColor(cat.id, cat.name, idx);
                    return (
                      <div
                        key={cat.id}
                        className="px-4 py-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: color }}
                          >
                            <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                              {cat.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="w-20 sm:w-28 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(cat.percentage, 100)}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-neutral-400 font-medium">
                                {cat.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                            {formatCurrency(cat.amount, settings.currency, settings.currencySymbol)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Largest Expenses & Navigation to Full Report */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Largest Debits
              </h3>

              {monthlyReportStats.topExpenses.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">No debits recorded</p>
              ) : (
                <div className="space-y-2">
                  {monthlyReportStats.topExpenses.map((tx, idx) => {
                    const cat = categoryMap.get(tx.category) || { name: 'Other', icon: 'Tag' };
                    return (
                      <div
                        key={tx.id}
                        className="p-2.5 bg-neutral-50/60 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 rounded-lg flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-neutral-400">
                            #{idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                              {tx.description}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {tx.date} • {cat.name}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                          {formatCurrency(tx.amount, settings.currency, settings.currencySymbol)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation link to comprehensive ReportsView */}
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <span>View Full Audited Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main Content: Monthly Spending Chart & Category Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Spending Chart (2 cols on large screens) */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
            <ColorfulTrendChart
              days={dailyChartData.days}
              maxAmount={dailyChartData.maxAmount}
              totalExpense={totalExpense}
              currency={settings.currency}
              currencySymbol={settings.currencySymbol}
              title="Monthly Spending Trend"
              subtitle={`Daily expense distribution over ${getMonthDisplay(selectedMonth)}`}
            />
          </div>

          {/* Category Breakdown with Colorful Donut (1 col) */}
          <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Spending by Category
              </h3>
              <span className="text-xs text-neutral-400">
                {categorySpending.length} {categorySpending.length === 1 ? 'category' : 'categories'}
              </span>
            </div>

            {categorySpending.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-neutral-400 dark:text-neutral-500 py-8">
                No category spending yet
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Colorful Donut */}
                <div className="py-2">
                  <ColorfulDonutChart
                    data={categorySpending}
                    totalAmount={totalExpense}
                    currency={settings.currency}
                    currencySymbol={settings.currencySymbol}
                    size={180}
                    donutThickness={28}
                    showLegend={false}
                  />
                </div>

                {/* Ranked Category List with Vibrant Colors */}
                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  {categorySpending.slice(0, 5).map((cat) => {
                    const color = getCategoryColor(cat.id, cat.name);
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
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{cat.name}</span>
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
                              {cat.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {/* Vibrant colorful progress bar */}
                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(cat.percentage, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {categorySpending.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('categories')}
                      className="w-full text-center text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 pt-1 transition-colors block cursor-pointer"
                    >
                      View all {categorySpending.length} categories →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Recent Transactions & Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Recent Transactions
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Latest recorded activity
              </p>
            </div>
            <button
              id="view-all-transactions-btn"
              type="button"
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-neutral-900 dark:text-white hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all transactions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentTransactions.map((tx) => {
              const catInfo = categoryMap.get(tx.category) || { name: 'Other', icon: 'Tag' };
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      <CategoryIcon name={catInfo.icon} className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {tx.description || catInfo.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        <span>{formatHumanDate(tx.date)}</span>
                        <span>•</span>
                        <span>{catInfo.name}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-semibold tracking-tight ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compact Budget Progress Section (1 col) */}
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Monthly Budgets
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Target vs actual spending
              </p>
            </div>
            <button
              id="manage-budgets-btn"
              type="button"
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Manage
            </button>
          </div>

          {budgetProgress.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-neutral-400 mb-3">No category budgets created yet.</p>
              <button
                type="button"
                onClick={() => setActiveTab('budgets')}
                className="text-xs font-semibold px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg transition-colors"
              >
                Set up budgets
              </button>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {budgetProgress.slice(0, 4).map((b) => (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                        <CategoryIcon name={b.icon} className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{b.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(b.spent, settings.currency, settings.currencySymbol)}
                      </span>
                      <span className="text-neutral-400 font-normal text-[11px]">
                        {' '}/ {formatCurrency(b.limit, settings.currency, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>

                  {/* Clean progress bar with subtle status warning */}
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.isOver
                          ? 'bg-rose-500'
                          : b.rawPercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-neutral-800 dark:bg-neutral-200'
                      }`}
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{b.rawPercent.toFixed(0)}% used</span>
                    {b.isOver ? (
                      <span className="text-rose-500 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Exceeded by {formatCurrency(b.overAmount, settings.currency, settings.currencySymbol)}
                      </span>
                    ) : (
                      <span>
                        {formatCurrency(b.remaining, settings.currency, settings.currencySymbol)} left
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile / Quick Recording */}
      <QuickAddFAB />
    </div>
  );
};
