import React, { useState, useMemo } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Check,
  Tag,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { Category, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon, ICON_OPTIONS } from '../utils/icons';

export const CategoriesView: React.FC = () => {
  const {
    categories,
    transactions,
    settings,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useExpense();

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType>('expense');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catBudgetLimit, setCatBudgetLimit] = useState('');
  const [formError, setFormError] = useState('');

  // Delete category with reassignment state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Calculate usage count of each category
  const categoryUsageCount = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + 1);
    });
    return map;
  }, [transactions]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const openAddModal = (type: TransactionType = 'expense') => {
    setEditingCategory(null);
    setCatName('');
    setCatType(type);
    setCatIcon('Tag');
    setCatBudgetLimit('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setCatBudgetLimit(cat.budgetLimit ? cat.budgetLimit.toString() : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setFormError('Category name is required');
      return;
    }

    const budgetNum = catBudgetLimit ? parseFloat(catBudgetLimit) : undefined;
    if (budgetNum !== undefined && (isNaN(budgetNum) || budgetNum <= 0)) {
      setFormError('Budget limit must be a positive number');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        budgetLimit: budgetNum,
      });
    } else {
      addCategory({
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        budgetLimit: budgetNum,
      });
    }

    setIsModalOpen(false);
  };

  const handlePromptDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    // Find default fallback reassign target
    const fallback = categories.find((c) => c.id !== cat.id && c.type === cat.type);
    setReassignTargetId(fallback?.id || '');
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    const dependentCount = categoryUsageCount.get(categoryToDelete.id) || 0;

    if (dependentCount > 0 && !reassignTargetId) {
      setFormError('Please select a replacement category to reassign existing transactions');
      return;
    }

    deleteCategory(categoryToDelete.id, dependentCount > 0 ? reassignTargetId : undefined);
    setCategoryToDelete(null);
  };

  return (
    <div id="categories-page-container" className="max-w-6xl mx-auto space-y-6 pb-14">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Categories
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            Manage and customize expense and income classifications
          </p>
        </div>

        <button
          id="add-category-btn"
          type="button"
          onClick={() => openAddModal('expense')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Section 1: Expense Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Expense Categories ({expenseCategories.length})
          </h3>
          <button
            type="button"
            onClick={() => openAddModal('expense')}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Expense Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenseCategories.map((cat) => {
            const usage = categoryUsageCount.get(cat.id) || 0;
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-3 group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {cat.name}
                      </h4>
                      {cat.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span>{usage} {usage === 1 ? 'transaction' : 'transactions'}</span>
                      {cat.budgetLimit && (
                        <>
                          <span>•</span>
                          <span>Budget: {formatCurrency(cat.budgetLimit, settings.currency, settings.currencySymbol)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Rename / Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePromptDelete(cat)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Income Categories */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Income Categories ({incomeCategories.length})
          </h3>
          <button
            type="button"
            onClick={() => openAddModal('income')}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Income Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {incomeCategories.map((cat) => {
            const usage = categoryUsageCount.get(cat.id) || 0;
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-3 group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {cat.name}
                      </h4>
                      {cat.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {usage} {usage === 1 ? 'transaction' : 'transactions'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Rename / Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePromptDelete(cat)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div
          id="category-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="category-modal-content"
            className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 my-6 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Type Switch */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Category Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCatType('expense')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      catType === 'expense'
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType('income')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      catType === 'income'
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pet Care, College Fees, Software"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
                />
              </div>

              {/* Icon Picker Grid */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Select Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.component;
                    const isSelected = catIcon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setCatIcon(opt.name)}
                        title={opt.label}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs ring-2 ring-neutral-400'
                            : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Monthly Budget Limit (if expense type) */}
              {catType === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Monthly Budget Limit <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 focus-within:border-neutral-900 dark:focus-within:border-neutral-300">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-sm">
                      {settings.currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="e.g. 4000"
                      value={catBudgetLimit}
                      onChange={(e) => setCatBudgetLimit(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 text-sm font-semibold bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}

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
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal (With Reassignment Guard) */}
      {categoryToDelete && (
        <div
          id="delete-category-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-xs"
          onClick={() => setCategoryToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Delete Category "{categoryToDelete.name}"
              </h3>
            </div>

            {/* Check if transactions depend on this category */}
            {(categoryUsageCount.get(categoryToDelete.id) || 0) > 0 ? (
              <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
                <p className="leading-relaxed">
                  There are{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    {categoryUsageCount.get(categoryToDelete.id)} transaction(s)
                  </strong>{' '}
                  currently assigned to "{categoryToDelete.name}".
                </p>
                <p>
                  To prevent orphaned records, please choose another category to reassign them to:
                </p>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Reassign transactions to:
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  >
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id && c.type === categoryToDelete.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                Are you sure you want to delete this category? No existing transactions are using it.
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                {(categoryUsageCount.get(categoryToDelete.id) || 0) > 0
                  ? 'Reassign & Delete'
                  : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
