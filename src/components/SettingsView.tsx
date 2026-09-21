import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  DollarSign,
  Calendar,
  Download,
  Upload,
  Trash2,
  Tags,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { CURRENCIES } from '../data/defaults';
import { exportTransactionsToCSV } from '../utils/formatters';
import { ConfirmModal } from './Toast';
import { AppLogo } from './Logo';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    transactions,
    categories,
    setActiveTab,
    loadSampleData,
    clearAllData,
    importCSVData,
  } = useExpense();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = CURRENCIES.find((c) => c.code === code);
    if (item) {
      updateSettings({
        currency: item.code,
        currencySymbol: item.symbol,
      });
    }
  };

  const handleExportAll = () => {
    exportTransactionsToCSV(transactions, categories, settings.currency);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const res = importCSVData(text);
        if (res.success) {
          setImportStatus(`Successfully imported ${res.count} transactions.`);
        } else {
          setImportStatus(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  return (
    <div id="settings-page-container" className="max-w-4xl mx-auto space-y-6 pb-14">
      {/* Header */}
      <div className="pt-1 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 p-1.5 flex items-center justify-center border border-neutral-200/80 dark:border-neutral-700/60 shadow-xs shrink-0">
          <AppLogo className="w-full h-full" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Settings & Preferences
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            Customize currency, regional formats, theme, and data management
          </p>
        </div>
      </div>

      {/* Section 1: General Preferences */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-5">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          Preferences
        </h3>

        {/* Currency Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label htmlFor="currency-select" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
              Default Currency
            </label>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select your primary currency format and symbol
            </p>
          </div>
          <select
            id="currency-select"
            value={settings.currency}
            onChange={handleCurrencyChange}
            className="w-full sm:w-64 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme: Light / Dark / System */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
              Interface Theme
            </label>
            <p className="text-xs text-neutral-400 mt-0.5">
              High-contrast, eye-friendly banking aesthetic
            </p>
          </div>
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full sm:w-64">
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                settings.theme === 'light'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                settings.theme === 'dark'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'system' })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                settings.theme === 'system'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Date Format */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <label htmlFor="date-format-select" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
              Date Format
            </label>
            <p className="text-xs text-neutral-400 mt-0.5">
              Standard date representation across views and tables
            </p>
          </div>
          <select
            id="date-format-select"
            value={settings.dateFormat}
            onChange={(e) => updateSettings({ dateFormat: e.target.value as any })}
            className="w-full sm:w-64 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/09/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/18/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-18)</option>
          </select>
        </div>

        {/* Default Transaction Type */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <label htmlFor="default-type-select" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
              Default Transaction Type
            </label>
            <p className="text-xs text-neutral-400 mt-0.5">
              Initial selection when opening the Add Transaction form
            </p>
          </div>
          <select
            id="default-type-select"
            value={settings.defaultTransactionType}
            onChange={(e) => updateSettings({ defaultTransactionType: e.target.value as any })}
            className="w-full sm:w-64 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Manage Categories Shortcut */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
              Custom Categories
            </span>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure icons, custom tags, and category names
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors inline-flex items-center gap-1.5"
          >
            <Tags className="w-3.5 h-3.5" />
            <span>Manage Categories</span>
          </button>
        </div>
      </div>

      {/* Section 2: Data Management */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-5">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          Data Management
        </h3>

        {/* Export CSV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Export Transactions (CSV)
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Download your full financial ledger into an offline spreadsheet-compatible CSV file
            </p>
          </div>
          <button
            id="settings-export-csv-btn"
            type="button"
            onClick={handleExportAll}
            disabled={transactions.length === 0}
            className="self-start sm:self-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Import CSV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Import Transactions (CSV)
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Upload an existing CSV file with Date, Amount, Description, and Category columns
            </p>
          </div>
          <div>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              id="settings-import-csv-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose CSV File</span>
            </button>
          </div>
        </div>
        {importStatus && (
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-lg">
            {importStatus}
          </p>
        )}

        {/* Load Sample Demo Data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Demo Sample Data
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Populate realistic student, freelancer, and employee transactions to test reports and charts
            </p>
          </div>
          <button
            type="button"
            onClick={loadSampleData}
            className="self-start sm:self-auto px-4 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Dataset</span>
          </button>
        </div>

        {/* Clear All Data (Strict Confirmation) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <h4 className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Clear All Data
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Permanently wipe all transactions and reset budgets. Cannot be undone.
            </p>
          </div>
          <button
            id="clear-all-data-btn"
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 border border-rose-200 dark:border-rose-900/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* About & Branding Card */}
      <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/90 p-1 flex items-center justify-center border border-neutral-200/80 dark:border-neutral-700/60 shadow-xs shrink-0">
            <AppLogo className="w-full h-full" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Universal Expense Tracker
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Local-first personal finance with intelligent budgeting and full offline support.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            v1.0.0 Ready
          </span>
        </div>
      </div>

      {/* Clear All Data Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Wipe All Transaction Data?"
        description="This will permanently delete all recorded transactions and reset all custom budgets from your browser storage. This action cannot be reversed."
        requireTypingWord="CLEAR"
        confirmLabel="Erase Everything"
        cancelLabel="Keep Data"
        isDestructive={true}
        onConfirm={() => {
          clearAllData();
          setIsClearModalOpen(false);
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
