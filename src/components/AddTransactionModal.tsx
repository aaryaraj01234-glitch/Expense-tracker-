import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Tag, CreditCard, AlignLeft, RefreshCw, Plus, Sparkles, Check, Repeat } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { TransactionType, PaymentMethod, RecurrenceFrequency } from '../types';
import { PAYMENT_METHODS } from '../data/defaults';
import { CategoryIcon } from '../utils/icons';
import { suggestCategoryForDescription, CategorySuggestion } from '../utils/merchantClassifier';
import { computeNextDueDate } from '../utils/recurringScheduler';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddModalOpen,
    editingTransaction,
    modalInitialData,
    closeAddModal,
    addTransaction,
    updateTransaction,
    categories,
    transactions,
    settings,
    openAddModal,
  } = useExpense();

  const [type, setType] = useState<TransactionType>(settings.defaultTransactionType || 'expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasManualCategorySelection, setHasManualCategorySelection] = useState<boolean>(false);

  // Populate when editing or reset when adding
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
      setCategoryId(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNotes(editingTransaction.notes || '');
      setRecurring(editingTransaction.recurring || 'none');
      setAutoGenerate(true);
      setErrors({});
      setHasManualCategorySelection(true); // Don't auto-override when editing an existing transaction
    } else {
      const today = new Date().toISOString().split('T')[0];
      const targetType = modalInitialData?.type || settings.defaultTransactionType || 'expense';
      setType(targetType);
      setAmount('');
      setDescription(modalInitialData?.description || '');
      setDate(today);
      setPaymentMethod('UPI');
      setNotes('');
      setRecurring('none');
      setAutoGenerate(true);
      setErrors({});
      setHasManualCategorySelection(false);

      if (modalInitialData?.category) {
        setCategoryId(modalInitialData.category);
      } else {
        // Select first available category of matching type
        const firstCat = categories.find((c) => c.type === targetType);
        if (firstCat) {
          setCategoryId(firstCat.id);
        }
      }
    }
  }, [editingTransaction, modalInitialData, isAddModalOpen, settings.defaultTransactionType, categories]);

  // Compute preview for next due date
  const nextDueDatePreview = useMemo(() => {
    if (recurring === 'none' || !date) return null;
    return computeNextDueDate(date, recurring as RecurrenceFrequency);
  }, [date, recurring]);
  const categorySuggestion = useMemo<CategorySuggestion | null>(() => {
    if (!description || description.trim().length < 2) return null;
    return suggestCategoryForDescription(description, transactions, categories, type);
  }, [description, transactions, categories, type]);

  // Handle description typing with merchant auto-suggestion
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);

    // If the user hasn't explicitly locked in a manual category choice from the dropdown,
    // automatically pre-select the most frequently used category for this known merchant
    const suggestion = suggestCategoryForDescription(val, transactions, categories, type);
    if (suggestion && !hasManualCategorySelection) {
      setCategoryId(suggestion.category.id);
    }
  };

  // When type changes (Expense vs Income), automatically switch category if current category is incompatible
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setHasManualCategorySelection(false);
    const currentCat = categories.find((c) => c.id === categoryId);
    if (!currentCat || currentCat.type !== newType) {
      const matchingCat = categories.find((c) => c.type === newType);
      if (matchingCat) {
        setCategoryId(matchingCat.id);
      }
    }
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleQuickDate = (quick: 'today' | 'yesterday') => {
    const d = new Date();
    if (quick === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setDate(d.toISOString().split('T')[0]);
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount)) {
      errs.amount = 'Amount is required';
    } else if (parsedAmount <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }

    if (!categoryId) {
      errs.category = 'Please select a category';
    }

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errs.date = 'Please enter a valid date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedAmount = parseFloat(amount);

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: parsedAmount,
        category: categoryId,
        description: description.trim() || (type === 'income' ? 'Income' : 'Expense'),
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
        recurring: recurring !== 'none' ? recurring : undefined,
      });
    } else {
      addTransaction({
        type,
        amount: parsedAmount,
        category: categoryId,
        description: description.trim() || (type === 'income' ? 'Income' : 'Expense'),
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
        recurring: recurring !== 'none' ? recurring : undefined,
      });
    }

    closeAddModal();
  };

  if (!isAddModalOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div
      id="add-transaction-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/45 backdrop-blur-xs overflow-y-auto"
      onClick={closeAddModal}
    >
      <div
        id="add-transaction-modal"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-5 sm:p-6 my-6 transition-all text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {editingTransaction ? 'Update existing transaction details' : 'Quickly record an expense or income'}
            </p>
          </div>
          <button
            id="close-add-modal-btn"
            type="button"
            onClick={closeAddModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Toggle: Expense / Income */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
            <button
              id="type-expense-btn"
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
              Expense
            </button>
            <button
              id="type-income-btn"
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              Income
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label htmlFor="tx-amount-input" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Amount
            </label>
            <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 focus-within:border-neutral-900 dark:focus-within:border-neutral-300 focus-within:ring-1 focus-within:ring-neutral-900 dark:focus-within:ring-neutral-300 transition-all">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 dark:text-neutral-500 select-none">
                {settings.currencySymbol}
              </span>
              <input
                id="tx-amount-input"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 text-2xl font-semibold bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:outline-none"
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.amount}</p>}
          </div>

          {/* Category selection */}
          <div>
            <label htmlFor="tx-category-select" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Category
            </label>
            <div className="relative">
              <select
                id="tx-category-select"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setHasManualCategorySelection(true);
                }}
                className="w-full appearance-none px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            {errors.category && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.category}</p>}
          </div>

          {/* Description with intelligent merchant category suggestion */}
          <div>
            <label htmlFor="tx-desc-input" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Description <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              id="tx-desc-input"
              type="text"
              placeholder={type === 'expense' ? 'e.g. Starbucks, Uber, Amazon, Groceries' : 'e.g. Salary, Client invoice, Refund'}
              value={description}
              onChange={handleDescriptionChange}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
            />

            {/* Merchant category suggestion feedback */}
            {categorySuggestion && (
              <div
                id="merchant-category-suggestion"
                className="mt-2 flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-xs transition-all"
              >
                <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap mr-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Recognized <strong className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">{categorySuggestion.merchant}</strong>:
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {categorySuggestion.category.name}
                  </span>
                  {categorySuggestion.source === 'history' && (
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      ({categorySuggestion.frequency}x used)
                    </span>
                  )}
                </div>

                {categoryId === categorySuggestion.category.id ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Selected</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId(categorySuggestion.category.id);
                      setHasManualCategorySelection(false);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Date with quick pills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="tx-date-input" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Date
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('yesterday')}
                  className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="tx-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
              />
            </div>
            {errors.date && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.date}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    paymentMethod === pm
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Optional: Notes & Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="tx-notes-input" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Notes <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                id="tx-notes-input"
                type="text"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="tx-recurring-select" className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Recurring <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <select
                id="tx-recurring-select"
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as any)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="none">One-time transaction</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly (e.g. Rent, Subscription)</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Recurring Schedule Info Panel */}
          {recurring !== 'none' && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                  <span>Scheduled Recurrence</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-700 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                  {recurring}
                </span>
              </div>

              {nextDueDatePreview && (
                <div className="flex items-center justify-between bg-white dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 text-[11.5px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Next auto-renewal date:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{nextDueDatePreview}</span>
                </div>
              )}

              <label className="flex items-center justify-between cursor-pointer pt-0.5">
                <span className="text-neutral-600 dark:text-neutral-300 text-[11.5px]">
                  Auto-generate transaction on trigger date
                </span>
                <input
                  id="tx-auto-generate-checkbox"
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer accent-neutral-900 dark:accent-white"
                />
              </label>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-3">
            <button
              id="submit-tx-btn"
              type="submit"
              className="w-full py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
            >
              {editingTransaction ? 'Save Changes' : type === 'income' ? 'Add Income' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
