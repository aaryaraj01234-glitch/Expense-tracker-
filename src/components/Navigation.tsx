import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Tags,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  ChevronRight,
  X,
  Wallet,
  Calendar,
  ChevronLeft,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { ActiveTab } from '../types';
import { getMonthDisplay, getCurrentMonthKey } from '../utils/formatters';
import { AppLogo } from './Logo';
import { PWAInstallButton } from './PWAInstallButton';

export const Navigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    selectedMonth,
    setSelectedMonth,
    transactions,
    settings,
    isDarkMode,
    toggleTheme,
    lockApp,
  } = useExpense();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month, 1);
    setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 h-screen sticky top-0 select-none z-30"
      >
        {/* Brand & Theme Toggle */}
        <div className="flex items-center justify-between px-1 py-1 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-100/90 dark:bg-neutral-800/90 p-1 flex items-center justify-center border border-neutral-200/80 dark:border-neutral-700/60 shadow-2xs">
              <AppLogo className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
                Universal Tracker
              </h1>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                Finance & Expense
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {Boolean(settings.isPasswordEnabled && settings.passwordHash) && (
              <button
                id="desktop-quick-lock-btn"
                type="button"
                onClick={lockApp}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title="Lock App Now (Passcode Protection)"
                aria-label="Lock App Now"
              >
                <Lock className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              </button>
            )}

            <button
              id="desktop-theme-toggle-header"
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>
          </div>
        </div>

        {/* Action Button: Add Transaction */}
        <button
          id="sidebar-add-tx-btn"
          type="button"
          onClick={() => openAddModal()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium transition-all shadow-xs cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>Add Transaction</span>
        </button>

        {/* Month Selector in Sidebar */}
        <div className="mb-6 px-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 px-1 font-medium">
            <span>Period</span>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth(getCurrentMonthKey())}
                className="text-[11px] text-neutral-900 dark:text-white font-medium hover:underline cursor-pointer"
              >
                Current
              </button>
            )}
          </div>
          <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-1.5 text-xs">
            <button
              id="sidebar-prev-month-btn"
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {getMonthDisplay(selectedMonth)}
            </span>
            <button
              id="sidebar-next-month-btn"
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-2xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}`} />
                <span>{item.label}</span>
                {item.id === 'transactions' && transactions.length > 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-normal">
                    {transactions.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Status & Theme Toggle */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
          <PWAInstallButton variant="header" className="w-full justify-center py-2" />

          <button
            id="desktop-theme-toggle-footer"
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-200/80 dark:border-neutral-700/60"
            title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-between px-2">
            <span>Currency: {settings.currency}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Offline ready" />
              <span className="text-[11px]">Ready</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE TOP BAR ================= */}
      <header
        id="mobile-top-bar"
        className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-100/90 dark:bg-neutral-800/90 p-0.5 flex items-center justify-center border border-neutral-200/80 dark:border-neutral-700/60 shadow-2xs">
            <AppLogo className="w-full h-full" />
          </div>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Universal Tracker
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {Boolean(settings.isPasswordEnabled && settings.passwordHash) && (
            <button
              id="mobile-quick-lock-btn"
              type="button"
              onClick={lockApp}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Lock App (Passcode Protection)"
              aria-label="Lock App"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          <PWAInstallButton variant="compact" />

          {/* Quick Mobile Light/Dark Mode Toggle */}
          <button
            id="mobile-theme-toggle"
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>

          {/* Month selector mini */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-2 py-1 text-xs font-medium">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-0.5"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold">
              {getMonthDisplay(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-0.5"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        {/* Overview */}
        <button
          id="mobile-nav-overview"
          type="button"
          onClick={() => {
            setActiveTab('overview');
            setMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            activeTab === 'overview' && !mobileMoreOpen
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Overview</span>
        </button>

        {/* Transactions */}
        <button
          id="mobile-nav-transactions"
          type="button"
          onClick={() => {
            setActiveTab('transactions');
            setMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            activeTab === 'transactions' && !mobileMoreOpen
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Transactions</span>
        </button>

        {/* Prominent Add Button */}
        <button
          id="mobile-nav-add"
          type="button"
          onClick={() => {
            openAddModal();
            setMobileMoreOpen(false);
          }}
          className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          aria-label="Add Transaction"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Budgets */}
        <button
          id="mobile-nav-budgets"
          type="button"
          onClick={() => {
            setActiveTab('budgets');
            setMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            activeTab === 'budgets' && !mobileMoreOpen
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span>Budgets</span>
        </button>

        {/* More (Categories, Reports, Settings) */}
        <button
          id="mobile-nav-more"
          type="button"
          onClick={() => setMobileMoreOpen((prev) => !prev)}
          className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            ['categories', 'reports', 'settings'].includes(activeTab) || mobileMoreOpen
              ? 'text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <span className="w-5 h-5 flex items-center justify-center font-bold text-xs leading-none">
            •••
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Drawer */}
      {mobileMoreOpen && (
        <div
          id="mobile-more-backdrop"
          className="md:hidden fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            id="mobile-more-sheet"
            className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-2xl p-5 mb-16 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Additional Sections
              </h3>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('categories');
                  setMobileMoreOpen(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  activeTab === 'categories'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Tags className="w-5 h-5" />
                <span className="text-xs">Categories</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('reports');
                  setMobileMoreOpen(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  activeTab === 'reports'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Reports</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMoreOpen(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                  activeTab === 'settings'
                    ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="text-xs">Settings</span>
              </button>
            </div>

            {/* Mobile Sheet Theme Toggle */}
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
                  <span>Switch to {isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <span className="text-[11px] text-neutral-400 uppercase font-medium">
                  {isDarkMode ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

