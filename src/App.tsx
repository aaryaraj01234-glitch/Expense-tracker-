import React, { useEffect } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Navigation } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { CategoriesView } from './components/CategoriesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Toast } from './components/Toast';

const MainLayout: React.FC = () => {
  const { activeTab, openAddModal, isAddModalOpen } = useExpense();

  // Quick keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.key === 'n' || e.key === 'N') && !isAddModalOpen && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openAddModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openAddModal, isAddModalOpen]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafc] dark:bg-[#0f1115] text-neutral-900 dark:text-neutral-100 transition-colors duration-200 font-sans antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Sidebar & Mobile Navigation */}
      <Navigation />

      {/* Primary Content Stage */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto mb-16 md:mb-0">
        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'categories' && <CategoriesView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Add / Edit Modal */}
      <AddTransactionModal />

      {/* Subtle floating notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <MainLayout />
    </ExpenseProvider>
  );
}
