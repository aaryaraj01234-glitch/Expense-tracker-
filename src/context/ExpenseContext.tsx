import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Transaction,
  Category,
  Budget,
  UserSettings,
  ActiveTab,
  TransactionType,
  RecurringSchedule,
  RecurrenceFrequency,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_BUDGETS,
  DEFAULT_SETTINGS,
  generateSampleTransactions,
} from '../data/defaults';
import { getCurrentMonthKey } from '../utils/formatters';
import {
  processRecurringSchedules,
  computeNextDueDate,
  forceGenerateSingleOccurrence,
  generateSampleRecurringSchedules,
} from '../utils/recurringScheduler';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: UserSettings;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // Add / Edit Modal state
  isAddModalOpen: boolean;
  editingTransaction: Transaction | null;
  modalInitialData: { category?: string; type?: TransactionType; description?: string } | null;
  openAddModal: (
    tx?: Transaction,
    initialData?: { category?: string; type?: TransactionType; description?: string }
  ) => void;
  closeAddModal: () => void;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string, reassignToId?: string) => { success: boolean; error?: string };

  upsertBudget: (categoryId: string, monthlyLimit: number) => void;
  deleteBudget: (id: string) => void;

  updateSettings: (updates: Partial<UserSettings>) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  importCSVData: (csvText: string) => { success: boolean; count: number; error?: string };

  // Recurring schedules & auto-generation
  recurringSchedules: RecurringSchedule[];
  addRecurringSchedule: (schedule: Omit<RecurringSchedule, 'id' | 'createdAt'>) => string;
  updateRecurringSchedule: (id: string, updates: Partial<RecurringSchedule>) => void;
  deleteRecurringSchedule: (id: string) => void;
  toggleRecurringScheduleStatus: (id: string) => void;
  triggerRecurringNow: (id: string) => void;
  checkAndProcessRecurring: (showNoopToast?: boolean) => number;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'uet_transactions_v2',
  CATEGORIES: 'uet_categories_v2',
  BUDGETS: 'uet_budgets_v2',
  SETTINGS: 'uet_settings_v2',
  RECURRING_SCHEDULES: 'uet_recurring_schedules_v1',
};

// Remove any legacy storage containing default pre-filled data
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('uet_budgets_v1');
    localStorage.removeItem('uet_transactions_v1');
  }
} catch (_) {}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Transactions State - completely clean at startup, persisted in localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse transactions', e);
    }
    return []; // Zero initial transactions
  });

  // 2. Categories State - default standard categories without any pre-set budgets
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse categories', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // 3. Budgets State - 0 pre-added budgets at startup, user creates when needed
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse budgets', e);
    }
    return []; // Completely clean: no false or pre-added budgets
  });

  // 4. Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // 5. Recurring Schedules State
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse recurring schedules', e);
    }
    return [];
  });

  // 5. App UI States
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialData, setModalInitialData] = useState<{
    category?: string;
    type?: TransactionType;
    description?: string;
  } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed to save budgets', e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECURRING_SCHEDULES, JSON.stringify(recurringSchedules));
    } catch (e) {
      console.error('Failed to save recurring schedules', e);
    }
  }, [recurringSchedules]);

  // Handle dark mode theme class on <html>
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (settings.theme === 'dark') return true;
      if (settings.theme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      setIsDarkMode(isDark);
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
    } else if (settings.theme === 'light') {
      applyTheme(false);
    } else {
      // system
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3000);
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      const nextTheme: 'light' | 'dark' = isDarkMode ? 'light' : 'dark';
      const updated = { ...prev, theme: nextTheme };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings', e);
      }
      return updated;
    });
    showToast(`Switched to ${isDarkMode ? 'Light' : 'Dark'} mode`, 'info');
  }, [isDarkMode, showToast]);

  // Modal open / close
  const openAddModal = useCallback((
    tx?: Transaction,
    initialData?: { category?: string; type?: TransactionType; description?: string }
  ) => {
    setEditingTransaction(tx || null);
    setModalInitialData(initialData || null);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
    setModalInitialData(null);
  }, []);

  // Transaction CRUD
  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    let linkedScheduleId = txData.recurringScheduleId;

    // If recurring was specified but no schedule ID yet, auto-create a recurring schedule
    if (txData.recurring && txData.recurring !== 'none' && !linkedScheduleId) {
      const recFreq = txData.recurring as RecurrenceFrequency;
      const nextDue = computeNextDueDate(txData.date, recFreq);
      linkedScheduleId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const newSchedule: RecurringSchedule = {
        id: linkedScheduleId,
        type: txData.type,
        amount: txData.amount,
        category: txData.category,
        description: txData.description,
        paymentMethod: txData.paymentMethod,
        notes: txData.notes,
        frequency: recFreq,
        startDate: txData.date,
        nextDueDate: nextDue,
        lastGeneratedDate: txData.date,
        autoGenerate: true,
        status: 'active',
        createdAt: Date.now(),
      };

      setRecurringSchedules((prev) => [newSchedule, ...prev]);
    }

    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      recurringScheduleId: linkedScheduleId,
      isRecurring: Boolean(linkedScheduleId || (txData.recurring && txData.recurring !== 'none')),
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    showToast(`${txData.type === 'income' ? 'Income' : 'Expense'} of ${settings.currencySymbol}${txData.amount} recorded`, 'success');
  }, [settings.currencySymbol, showToast]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    // If linked to a recurring schedule, also keep the schedule template up to date
    if (updates.amount !== undefined || updates.description !== undefined || updates.category !== undefined || updates.paymentMethod !== undefined) {
      setTransactions((prev) => {
        const target = prev.find((t) => t.id === id);
        if (target?.recurringScheduleId) {
          setRecurringSchedules((scheds) =>
            scheds.map((s) => {
              if (s.id !== target.recurringScheduleId) return s;
              return {
                ...s,
                amount: updates.amount !== undefined ? updates.amount : s.amount,
                description: updates.description !== undefined ? updates.description : s.description,
                category: updates.category !== undefined ? updates.category : s.category,
                paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : s.paymentMethod,
                notes: updates.notes !== undefined ? updates.notes : s.notes,
              };
            })
          );
        }
        return prev;
      });
    }

    showToast('Transaction updated successfully', 'success');
  }, [showToast]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction deleted', 'info');
  }, [showToast]);

  // Recurring Schedule Operations
  const addRecurringSchedule = useCallback((scheduleData: Omit<RecurringSchedule, 'id' | 'createdAt'>) => {
    const newId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newSchedule: RecurringSchedule = {
      ...scheduleData,
      id: newId,
      createdAt: Date.now(),
    };

    setRecurringSchedules((prev) => [newSchedule, ...prev]);
    showToast(`Scheduled recurring ${scheduleData.frequency} transaction "${scheduleData.description}"`, 'success');
    return newId;
  }, [showToast]);

  const updateRecurringSchedule = useCallback((id: string, updates: Partial<RecurringSchedule>) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast('Recurring schedule updated', 'success');
  }, [showToast]);

  const deleteRecurringSchedule = useCallback((id: string) => {
    setRecurringSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Recurring schedule removed', 'info');
  }, [showToast]);

  const toggleRecurringScheduleStatus = useCallback((id: string) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus = s.status === 'active' ? 'paused' : 'active';
        showToast(
          nextStatus === 'active' ? `Resumed "${s.description}"` : `Paused "${s.description}"`,
          'info'
        );
        return { ...s, status: nextStatus };
      })
    );
  }, [showToast]);

  // Force generate the next occurrence immediately ahead of time
  const triggerRecurringNow = useCallback((id: string) => {
    const target = recurringSchedules.find((s) => s.id === id);
    if (!target) return;

    const { updatedSchedule, generatedTransaction } = forceGenerateSingleOccurrence(target, transactions);
    setRecurringSchedules((prev) => prev.map((s) => (s.id === id ? updatedSchedule : s)));
    
    if (generatedTransaction) {
      setTransactions((prev) => [generatedTransaction, ...prev]);
      showToast(
        `Generated ${target.type === 'income' ? 'income' : 'expense'} for "${target.description}" (${settings.currencySymbol}${target.amount})`,
        'success'
      );
    } else {
      showToast(`Occurrence for date ${target.nextDueDate} was already recorded! Advanced next due date.`, 'info');
    }
  }, [recurringSchedules, transactions, settings.currencySymbol, showToast]);

  // Check and auto-generate any recurring transactions whose date triggers
  const checkAndProcessRecurring = useCallback((showNoopToast = false): number => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (recurringSchedules.length === 0) {
      if (showNoopToast) showToast('No recurring schedules configured yet', 'info');
      return 0;
    }

    const { updatedSchedules, newTransactions, generatedCount } = processRecurringSchedules(
      recurringSchedules,
      transactions,
      todayStr
    );

    if (generatedCount > 0) {
      setTransactions((prev) => [...newTransactions, ...prev]);
      setRecurringSchedules(updatedSchedules);
      showToast(
        `Auto-generated ${generatedCount} scheduled transaction${generatedCount > 1 ? 's' : ''} (due on/before ${todayStr})`,
        'success'
      );
      return generatedCount;
    } else {
      if (showNoopToast) {
        showToast('All recurring schedules are up to date! None due today.', 'info');
      }
      return 0;
    }
  }, [recurringSchedules, transactions, showToast]);

  // Background auto-trigger check: runs on mount and every 60 seconds
  const initialTriggerCheckRef = useRef(false);
  useEffect(() => {
    if (!initialTriggerCheckRef.current && recurringSchedules.length > 0) {
      initialTriggerCheckRef.current = true;
      const todayStr = new Date().toISOString().split('T')[0];
      const { updatedSchedules, newTransactions, generatedCount } = processRecurringSchedules(
        recurringSchedules,
        transactions,
        todayStr
      );
      if (generatedCount > 0) {
        setTransactions((prev) => [...newTransactions, ...prev]);
        setRecurringSchedules(updatedSchedules);
        showToast(
          `Auto-generated ${generatedCount} recurring transaction${generatedCount > 1 ? 's' : ''} (e.g. rent / subscriptions)`,
          'success'
        );
      }
    }

    const interval = setInterval(() => {
      if (recurringSchedules.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const { updatedSchedules, newTransactions, generatedCount } = processRecurringSchedules(
          recurringSchedules,
          transactions,
          todayStr
        );
        if (generatedCount > 0) {
          setTransactions((prev) => [...newTransactions, ...prev]);
          setRecurringSchedules(updatedSchedules);
          showToast(`Auto-generated ${generatedCount} scheduled transaction${generatedCount > 1 ? 's' : ''}`, 'success');
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [recurringSchedules, transactions, showToast]);

  // Category CRUD
  const addCategory = useCallback((catData: Omit<Category, 'id'>) => {
    const newId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newCat: Category = {
      ...catData,
      id: newId,
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
    if (catData.budgetLimit && catData.budgetLimit > 0) {
      setBudgets((prev) => [...prev, { id: `b-${newId}`, categoryId: newId, monthlyLimit: catData.budgetLimit! }]);
    }
    showToast(`Category "${catData.name}" created`, 'success');
    return newId;
  }, [showToast]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    if (updates.budgetLimit !== undefined) {
      setBudgets((prev) => {
        const exists = prev.find((b) => b.categoryId === id);
        if (updates.budgetLimit && updates.budgetLimit > 0) {
          if (exists) {
            return prev.map((b) => (b.categoryId === id ? { ...b, monthlyLimit: updates.budgetLimit! } : b));
          } else {
            return [...prev, { id: `b-${id}`, categoryId: id, monthlyLimit: updates.budgetLimit! }];
          }
        } else {
          return prev.filter((b) => b.categoryId !== id);
        }
      });
    }
    showToast('Category updated', 'success');
  }, [showToast]);

  const deleteCategory = useCallback((id: string, reassignToId?: string) => {
    const dependentCount = transactions.filter((t) => t.category === id).length;
    if (dependentCount > 0 && !reassignToId) {
      return {
        success: false,
        error: `Cannot delete category: ${dependentCount} transaction${dependentCount === 1 ? '' : 's'} depend on it. Please reassign them first.`,
      };
    }

    if (reassignToId) {
      setTransactions((prev) =>
        prev.map((t) => (t.category === id ? { ...t, category: reassignToId } : t))
      );
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
    showToast('Category removed', 'info');
    return { success: true };
  }, [transactions, showToast]);

  // Budget CRUD
  const upsertBudget = useCallback((categoryId: string, monthlyLimit: number) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.categoryId === categoryId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], monthlyLimit };
        return copy;
      }
      return [...prev, { id: `b-${Date.now()}`, categoryId, monthlyLimit }];
    });
    // also update category budgetLimit
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgetLimit: monthlyLimit } : c))
    );
    showToast('Budget saved', 'success');
  }, [showToast]);

  const deleteBudget = useCallback((id: string) => {
    const target = budgets.find((b) => b.id === id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    if (target) {
      setCategories((prev) =>
        prev.map((c) => (c.id === target.categoryId ? { ...c, budgetLimit: undefined } : c))
      );
    }
    showToast('Budget deleted', 'info');
  }, [budgets, showToast]);

  // Settings
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    showToast('Preferences updated', 'success');
  }, [showToast]);

  // Load sample demo data
  const loadSampleData = useCallback(() => {
    const sample = generateSampleTransactions();
    setTransactions(sample);
    setCategories(DEFAULT_CATEGORIES);
    setBudgets([]); // Keep budgets empty unless user deliberately creates them
    const sampleRecurring = generateSampleRecurringSchedules(DEFAULT_CATEGORIES);
    setRecurringSchedules(sampleRecurring);
    showToast('Sample transactions & recurring schedules loaded successfully', 'success');
  }, [showToast]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setTransactions([]);
    setBudgets([]);
    setRecurringSchedules([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.BUDGETS);
      localStorage.removeItem(STORAGE_KEYS.RECURRING_SCHEDULES);
    } catch (e) {
      console.error('Failed to clear storage keys', e);
    }
    showToast('All transaction, budget, and recurring schedule data cleared', 'info');
  }, [showToast]);

  // CSV import
  const importCSVData = useCallback((csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        return { success: false, count: 0, error: 'CSV file is empty or missing data rows.' };
      }

      // Simple CSV parser supporting quotes
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let curr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              curr += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        result.push(curr.trim());
        return result;
      };

      const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, ''));
      const dateIdx = header.findIndex((h) => h.includes('date'));
      const typeIdx = header.findIndex((h) => h.includes('type'));
      const descIdx = header.findIndex((h) => h.includes('desc'));
      const catIdx = header.findIndex((h) => h.includes('cat'));
      const amountIdx = header.findIndex((h) => h.includes('amount'));
      const methodIdx = header.findIndex((h) => h.includes('method') || h.includes('payment'));
      const notesIdx = header.findIndex((h) => h.includes('note'));

      if (amountIdx === -1) {
        return { success: false, count: 0, error: 'Missing "Amount" column in CSV.' };
      }

      const newTxs: Transaction[] = [];
      const catMap = new Map<string, string>();
      categories.forEach((c) => {
        catMap.set(c.name.toLowerCase(), c.id);
        catMap.set(c.id.toLowerCase(), c.id);
      });

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 2) continue;

        const rawAmount = parseFloat(cols[amountIdx]?.replace(/[^0-9.-]+/g, '')) || 0;
        if (rawAmount <= 0) continue;

        const rawType = (typeIdx !== -1 ? cols[typeIdx] : 'expense').toLowerCase();
        const type: TransactionType = rawType.includes('inc') ? 'income' : 'expense';

        const rawDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString().split('T')[0];
        const dateMatch = rawDate.match(/\d{4}-\d{2}-\d{2}/) ? rawDate : new Date().toISOString().split('T')[0];

        const rawCat = catIdx !== -1 ? cols[catIdx] : 'Other';
        const matchedCatId = catMap.get(rawCat.toLowerCase()) || (type === 'income' ? 'cat-other-income' : 'cat-other-expense');

        const rawMethod = methodIdx !== -1 ? cols[methodIdx] : 'Cash';
        const method = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'].includes(rawMethod)
          ? (rawMethod as any)
          : 'Other';

        const desc = descIdx !== -1 ? cols[descIdx] : 'Imported Transaction';
        const notes = notesIdx !== -1 ? cols[notesIdx] : '';

        newTxs.push({
          id: `tx-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          type,
          amount: rawAmount,
          category: matchedCatId,
          description: desc,
          date: dateMatch,
          paymentMethod: method,
          notes: notes || undefined,
          createdAt: Date.now(),
        });
      }

      if (newTxs.length === 0) {
        return { success: false, count: 0, error: 'No valid transaction records could be parsed from the CSV.' };
      }

      setTransactions((prev) => [...newTxs, ...prev]);
      showToast(`Imported ${newTxs.length} transaction${newTxs.length === 1 ? '' : 's'} successfully`, 'success');
      return { success: true, count: newTxs.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Error processing CSV' };
    }
  }, [categories, showToast]);

  const value = useMemo(
    () => ({
      transactions,
      categories,
      budgets,
      settings,
      selectedMonth,
      setSelectedMonth,
      activeTab,
      setActiveTab,
      searchTerm,
      setSearchTerm,
      toast,
      showToast,
      isAddModalOpen,
      editingTransaction,
      modalInitialData,
      openAddModal,
      closeAddModal,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      upsertBudget,
      deleteBudget,
      updateSettings,
      isDarkMode,
      toggleTheme,
      loadSampleData,
      clearAllData,
      importCSVData,
      recurringSchedules,
      addRecurringSchedule,
      updateRecurringSchedule,
      deleteRecurringSchedule,
      toggleRecurringScheduleStatus,
      triggerRecurringNow,
      checkAndProcessRecurring,
    }),
    [
      transactions,
      categories,
      budgets,
      settings,
      selectedMonth,
      activeTab,
      searchTerm,
      toast,
      showToast,
      isAddModalOpen,
      editingTransaction,
      modalInitialData,
      openAddModal,
      closeAddModal,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      upsertBudget,
      deleteBudget,
      updateSettings,
      isDarkMode,
      toggleTheme,
      loadSampleData,
      clearAllData,
      importCSVData,
      recurringSchedules,
      addRecurringSchedule,
      updateRecurringSchedule,
      deleteRecurringSchedule,
      toggleRecurringScheduleStatus,
      triggerRecurringNow,
      checkAndProcessRecurring,
    ]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export function useExpense(): ExpenseContextType {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
