import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Calendar,
  X,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  Repeat,
  Receipt,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { Transaction, PaymentMethod, TransactionType } from '../types';
import { formatCurrency, formatDate, exportTransactionsToCSV } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';
import { PAYMENT_METHODS } from '../data/defaults';
import { ConfirmModal } from './Toast';
import { RecurringSchedulesView } from './RecurringSchedulesView';

type DateFilterOption = 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom';
type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    recurringSchedules,
    categories,
    settings,
    openAddModal,
    deleteTransaction,
    selectedMonth,
  } = useExpense();

  // Mode switcher: History vs Recurring Schedules
  const [viewMode, setViewMode] = useState<'history' | 'recurring'>('history');

  // Local Filter & Search states
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  // Delete modal state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }));
    return map;
  }, [categories]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const thisMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    return transactions.filter((tx) => {
      // 1. Search (description, notes, category name, payment method, amount)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const catName = categoryMap.get(tx.category)?.name.toLowerCase() || '';
        const desc = tx.description.toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const pm = tx.paymentMethod.toLowerCase();
        const amountStr = tx.amount.toString();

        const matches =
          desc.includes(q) ||
          catName.includes(q) ||
          notes.includes(q) ||
          pm.includes(q) ||
          amountStr.includes(q);

        if (!matches) return false;
      }

      // 2. Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false;
      }

      // 4. Payment method filter
      if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // 5. Date filter
      if (dateFilter === 'this_month') {
        if (!tx.date.startsWith(thisMonthPrefix)) return false;
      } else if (dateFilter === 'last_month') {
        if (!tx.date.startsWith(lastMonthPrefix)) return false;
      } else if (dateFilter === 'this_year') {
        if (!tx.date.startsWith(`${currentYear}-`)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt;
      } else if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt;
      } else if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [
    transactions,
    search,
    selectedType,
    selectedCategory,
    selectedPaymentMethod,
    dateFilter,
    customStartDate,
    customEndDate,
    sortBy,
    categoryMap,
  ]);

  // Aggregate sums of currently filtered items
  const { filteredIncome, filteredExpense, netFiltered } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return {
      filteredIncome: inc,
      filteredExpense: exp,
      netFiltered: inc - exp,
    };
  }, [filteredTransactions]);

  const hasActiveFilters =
    search.trim() !== '' ||
    dateFilter !== 'all' ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedPaymentMethod !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedPaymentMethod('all');
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, categories, settings.currency);
  };

  return (
    <div id="transactions-page-container" className="max-w-6xl mx-auto space-y-6 pb-14">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Transactions
            </h2>

            {/* Segmented Mode Selector: All Transactions vs Recurring Schedules */}
            <div className="inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
              <button
                id="tx-mode-history-btn"
                type="button"
                onClick={() => setViewMode('history')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'history'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>History</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200/60 dark:bg-neutral-700/80 font-medium">
                  {transactions.length}
                </span>
              </button>

              <button
                id="tx-mode-recurring-btn"
                type="button"
                onClick={() => setViewMode('recurring')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'recurring'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Recurring</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200/60 dark:bg-neutral-700/80 font-medium">
                  {recurringSchedules.length}
                </span>
              </button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            {viewMode === 'history'
              ? `${filteredTransactions.length} of ${transactions.length} recorded entries`
              : `${recurringSchedules.length} scheduled recurring transaction templates with automatic date triggers`}
          </p>
        </div>

        {viewMode === 'history' && (
          <div className="flex items-center gap-2.5">
            <button
              id="export-tx-csv-btn"
              type="button"
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/70 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              id="tx-page-add-btn"
              type="button"
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        )}
      </div>

      {viewMode === 'recurring' ? (
        <RecurringSchedulesView />
      ) : (
        <>
          {/* Filter & Search Bar Panel */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs space-y-3">
        {/* Row 1: Search & Sort */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="tx-search-input"
              type="text"
              placeholder='Search by merchant, note, payment method, category (e.g. "Swiggy", "UPI", "Books")...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="tx-sort-select" className="text-xs text-neutral-500 whitespace-nowrap font-medium">
              Sort:
            </label>
            <select
              id="tx-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="date_desc">Date (Newest first)</option>
              <option value="date_asc">Date (Oldest first)</option>
              <option value="amount_desc">Amount (Highest first)</option>
              <option value="amount_asc">Amount (Lowest first)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Date Range Filter */}
          <div>
            <select
              id="tx-filter-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="tx-filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses only</option>
              <option value="income">Income only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="tx-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              id="tx-filter-method"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">All Payment Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom date range inputs if selected */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 text-xs">
            <span className="text-neutral-500 font-medium">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
            />
            <span className="text-neutral-500 font-medium">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
            />
          </div>
        )}

        {/* Active Filters Summary Strip */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="flex items-center gap-2 text-neutral-500">
              <span>Filtered Summary:</span>
              <span className="text-emerald-600 font-semibold">
                +{formatCurrency(filteredIncome, settings.currency, settings.currencySymbol)}
              </span>
              <span>/</span>
              <span className="text-rose-600 font-semibold">
                -{formatCurrency(filteredExpense, settings.currency, settings.currencySymbol)}
              </span>
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Transaction List / Table */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
        {filteredTransactions.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No transactions match your criteria
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'No transactions recorded yet. Click Add Transaction to start.'
                : 'Try adjusting your search query, date range, or category filter.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredTransactions.map((tx) => {
                    const catInfo = categoryMap.get(tx.category) || { name: 'Other', icon: 'Tag' };
                    const isIncome = tx.type === 'income';

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors group"
                      >
                        {/* Date */}
                        <td className="py-3.5 px-4 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {formatDate(tx.date, settings.dateFormat)}
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {tx.description}
                            </span>
                            {Boolean(tx.isRecurring || tx.isAutoGenerated || (tx.recurring && tx.recurring !== 'none')) && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0 border border-neutral-200/60 dark:border-neutral-700/60"
                                title="Recurring scheduled transaction"
                              >
                                <Repeat className="w-2.5 h-2.5 text-neutral-500" />
                                <span className="capitalize">{tx.recurring || 'Recurring'}</span>
                              </span>
                            )}
                          </div>
                          {tx.notes && (
                            <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                              {tx.notes}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium">
                            <CategoryIcon name={catInfo.icon} className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{catInfo.name}</span>
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-neutral-600 dark:text-neutral-400">
                          {tx.paymentMethod}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                          >
                            {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
                            {isIncome ? 'Income' : 'Expense'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`text-sm font-bold tracking-tight ${
                              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, settings.currency, settings.currencySymbol)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              id={`edit-tx-${tx.id}`}
                              type="button"
                              onClick={() => openAddModal(tx)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-tx-${tx.id}`}
                              type="button"
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredTransactions.map((tx) => {
                const catInfo = categoryMap.get(tx.category) || { name: 'Other', icon: 'Tag' };
                const isIncome = tx.type === 'income';

                return (
                  <div key={tx.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {tx.description}
                            </p>
                            {Boolean(tx.isRecurring || tx.isAutoGenerated || (tx.recurring && tx.recurring !== 'none')) && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0 border border-neutral-200/60 dark:border-neutral-700/60">
                                <Repeat className="w-2.5 h-2.5" />
                                <span className="capitalize">{tx.recurring || 'Recurring'}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">
                            {formatDate(tx.date, settings.dateFormat)} • {tx.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency, settings.currencySymbol)}
                        </p>
                      </div>
                    </div>

                    {tx.notes && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-2 rounded-lg">
                        {tx.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                        {catInfo.name}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAddModal(tx)}
                          className="px-2.5 py-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxToDelete(tx)}
                          className="px-2.5 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={txToDelete !== null}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${txToDelete?.description || 'this transaction'}" for ${formatCurrency(
          txToDelete?.amount || 0,
          settings.currency,
          settings.currencySymbol
        )}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (txToDelete) {
            deleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
};
