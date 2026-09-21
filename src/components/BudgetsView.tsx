import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, getMonthDisplay } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';
import { Budget } from '../types';
import { ConfirmModal } from './Toast';
import { BudgetUtilizationChart } from './charts/BudgetUtilizationChart';
import { getCategoryColor } from './charts/chartColors';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    selectedMonth,
    settings,
    upsertBudget,
    deleteBudget,
    setActiveTab,
  } = useExpense();

  // Create / Edit Budget modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Delete budget confirmation
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string; categoryName: string } | null>(null);

  // Month transactions for spending calculations
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth) && t.type === 'expense');
  }, [transactions, selectedMonth]);

  // Categories map
  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }));
    return map;
  }, [categories]);

  // Calculate detailed budget metrics
  const budgetItems = useMemo(() => {
    return budgets.map((b) => {
      const cat = categoryMap.get(b.categoryId) || { name: 'Category', icon: 'Tag' };
      const spent = monthTransactions
        .filter((t) => t.category === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      const rawPercent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      const progressPercent = Math.min(rawPercent, 100);
      const remaining = Math.max(0, b.monthlyLimit - spent);
      const isApproaching = rawPercent >= 80 && rawPercent <= 100;
      const isExceeded = spent > b.monthlyLimit;
      const overAmount = spent - b.monthlyLimit;

      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: cat.name,
        icon: cat.icon,
        limit: b.monthlyLimit,
        spent,
        remaining,
        rawPercent,
        progressPercent,
        isApproaching,
        isExceeded,
        overAmount,
      };
    }).sort((a, b) => b.rawPercent - a.rawPercent);
  }, [budgets, monthTransactions, categoryMap]);

  // Aggregate stats
  const { totalBudgeted, totalSpentBudgeted, overallRemaining, overallPercent } = useMemo(() => {
    const totalB = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const totalS = budgetItems.reduce((sum, b) => sum + b.spent, 0);
    const remaining = Math.max(0, totalB - totalS);
    const percent = totalB > 0 ? (totalS / totalB) * 100 : 0;
    return {
      totalBudgeted: totalB,
      totalSpentBudgeted: totalS,
      overallRemaining: remaining,
      overallPercent: percent,
    };
  }, [budgets, budgetItems]);

  // Filter categories available for adding new budget (only expense categories)
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const openCreateModal = () => {
    setEditingBudgetId(null);
    // Pick first expense category that doesn't have a budget yet, or first expense category
    const unusedCat = expenseCategories.find((c) => !budgets.some((b) => b.categoryId === c.id));
    setSelectedCategoryId(unusedCat ? unusedCat.id : expenseCategories[0]?.id || '');
    setMonthlyLimit('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (budget: { id: string; categoryId: string; limit: number }) => {
    setEditingBudgetId(budget.id);
    setSelectedCategoryId(budget.categoryId);
    setMonthlyLimit(budget.limit.toString());
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(monthlyLimit);

    if (!monthlyLimit || isNaN(limitNum) || limitNum <= 0) {
      setError('Please enter a valid monthly limit amount');
      return;
    }

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    upsertBudget(selectedCategoryId, limitNum);
    setIsModalOpen(false);
  };

  return (
    <div id="budgets-page-container" className="max-w-6xl mx-auto space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Monthly Budgets
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            Track category spending limits for {getMonthDisplay(selectedMonth)}
          </p>
        </div>

        <button
          id="create-budget-btn"
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      {budgets.length > 0 && (
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider block mb-1">
                Total Monthly Budget
              </span>
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(totalBudgeted, settings.currency, settings.currencySymbol)}
              </span>
            </div>

            <div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider block mb-1">
                Spent in Budgeted Categories
              </span>
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(totalSpentBudgeted, settings.currency, settings.currencySymbol)}
              </span>
            </div>

            <div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider block mb-1">
                Remaining Safe Allowance
              </span>
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  overallRemaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(overallRemaining, settings.currency, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="pt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Overall Budget Health
              </span>
              <span className="text-neutral-500 font-medium">
                {overallPercent.toFixed(0)}% utilized
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overallPercent > 100
                    ? 'bg-rose-500'
                    : overallPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-neutral-900 dark:bg-neutral-100'
                }`}
                style={{ width: `${Math.min(overallPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Colorful Budget Allocation Multi-segment Chart */}
      {budgetItems.length > 0 && (
        <BudgetUtilizationChart
          items={budgetItems}
          currency={settings.currency}
          currencySymbol={settings.currencySymbol}
        />
      )}

      {/* Budget Cards Grid */}
      {budgetItems.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            No category budgets created
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Set monthly limits for key categories like Food, Transport, or Education to keep your spending controlled.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetItems.map((b, idx) => {
            const color = getCategoryColor(b.categoryId, b.categoryName, idx);
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-3.5 group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                      style={{ backgroundColor: color }}
                    >
                      <CategoryIcon name={b.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {b.categoryName}
                      </h3>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Limit: {formatCurrency(b.limit, settings.currency, settings.currencySymbol)} / month
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Edit budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetToDelete({ id: b.id, categoryName: b.categoryName })}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Numerical Ratio */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(b.spent, settings.currency, settings.currencySymbol)}
                      <span className="text-neutral-400 font-normal">
                        {' '}spent of {formatCurrency(b.limit, settings.currency, settings.currencySymbol)}
                      </span>
                    </span>
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.2 rounded-md"
                      style={{
                        backgroundColor: `${color}18`,
                        color: b.isExceeded ? '#E11D48' : color,
                      }}
                    >
                      {b.rawPercent.toFixed(0)}%
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${b.progressPercent}%`,
                        backgroundColor: b.isExceeded
                          ? '#F43F5E'
                          : b.isApproaching
                          ? '#F59E0B'
                          : color,
                      }}
                    />
                  </div>
                </div>

              {/* Status Message Footer */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {b.isExceeded ? (
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exceeded by {formatCurrency(b.overAmount, settings.currency, settings.currencySymbol)}
                  </span>
                ) : b.isApproaching ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Approaching limit ({formatCurrency(b.remaining, settings.currency, settings.currencySymbol)} left)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {formatCurrency(b.remaining, settings.currency, settings.currencySymbol)} remaining
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('transactions')}
                  className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1"
                >
                  <span>History</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Create / Edit Budget Modal */}
      {isModalOpen && (
        <div
          id="budget-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="budget-modal-content"
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {editingBudgetId ? 'Edit Category Budget' : 'Set Category Budget'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  disabled={editingBudgetId !== null}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none disabled:opacity-60"
                >
                  {expenseCategories.map((c) => {
                    const hasBudget = budgets.some((b) => b.categoryId === c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {hasBudget && c.id !== selectedCategoryId ? '(Already budgeted)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Monthly Limit */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Monthly Limit
                </label>
                <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 focus-within:border-neutral-900 dark:focus-within:border-neutral-300">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-base">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 5000"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-semibold bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Budget Confirmation */}
      <ConfirmModal
        isOpen={budgetToDelete !== null}
        title="Remove Budget"
        description={`Are you sure you want to remove the monthly budget for "${budgetToDelete?.categoryName}"? Your existing transactions will not be deleted.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (budgetToDelete) {
            deleteBudget(budgetToDelete.id);
            setBudgetToDelete(null);
          }
        }}
        onCancel={() => setBudgetToDelete(null)}
      />
    </div>
  );
};
