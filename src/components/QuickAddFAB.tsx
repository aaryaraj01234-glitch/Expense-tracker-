import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Zap,
  Utensils,
  Car,
  Coffee,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

interface CommonPreset {
  id: string;
  name: string;
  categoryKeyword: string;
  defaultDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const COMMON_EXPENSE_PRESETS: CommonPreset[] = [
  {
    id: 'preset-food',
    name: 'Food & Dining',
    categoryKeyword: 'food',
    defaultDescription: 'Food & Dining',
    icon: Utensils,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60',
  },
  {
    id: 'preset-coffee',
    name: 'Coffee & Snacks',
    categoryKeyword: 'food',
    defaultDescription: 'Coffee & Snacks',
    icon: Coffee,
    accentColor: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200/80 dark:border-orange-800/60',
  },
  {
    id: 'preset-transport',
    name: 'Transport & Fuel',
    categoryKeyword: 'transport',
    defaultDescription: 'Transport / Ride',
    icon: Car,
    accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/60',
  },
  {
    id: 'preset-shopping',
    name: 'Shopping & Groceries',
    categoryKeyword: 'shopping',
    defaultDescription: 'Shopping',
    icon: ShoppingBag,
    accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-800/60',
  },
  {
    id: 'preset-bills',
    name: 'Bills & Utilities',
    categoryKeyword: 'bills',
    defaultDescription: 'Bill Payment',
    icon: Receipt,
    accentColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/60',
  },
];

export const QuickAddFAB: React.FC = () => {
  const { openAddModal, categories } = useExpense();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find best matching category by keyword
  const getMatchingCategoryId = (keyword: string): string => {
    const cat = categories.find(
      (c) => c.type === 'expense' && (c.id.toLowerCase().includes(keyword) || c.name.toLowerCase().includes(keyword))
    );
    if (cat) return cat.id;
    // fallback to first expense category
    const firstExpense = categories.find((c) => c.type === 'expense');
    return firstExpense ? firstExpense.id : '';
  };

  const handleSelectPreset = (preset: CommonPreset) => {
    const categoryId = getMatchingCategoryId(preset.categoryKeyword);
    openAddModal(undefined, {
      category: categoryId,
      description: preset.defaultDescription,
      type: 'expense',
    });
    setIsOpen(false);
  };

  const handleOpenStandardModal = () => {
    openAddModal();
    setIsOpen(false);
  };

  return (
    <>
      {/* Dim backdrop on mobile when speed dial is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/20 dark:bg-black/40 backdrop-blur-[1px] z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div
        ref={containerRef}
        id="overview-quick-add-container"
        className="fixed bottom-20 right-4 sm:right-6 md:bottom-8 md:right-8 z-40 flex flex-col items-end"
      >
        {/* Speed Dial Menu for Common Expenses */}
        {isOpen && (
          <div
            id="quick-add-speed-dial"
            className="mb-3 flex flex-col items-end gap-2 transition-all duration-200 ease-out origin-bottom-right"
          >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-2 shadow-xl flex flex-col gap-1.5 min-w-[210px] text-xs font-medium">
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold border-b border-neutral-100 dark:border-neutral-800">
                Quick Common Expenses
              </div>

              {COMMON_EXPENSE_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${preset.accentColor}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:translate-x-0.5 transition-transform">
                        {preset.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                      1-tap
                    </span>
                  </button>
                );
              })}

              <div className="pt-1 mt-1 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleOpenStandardModal}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom / Other Expense</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary FAB Controls Group */}
        <div className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full shadow-lg hover:shadow-xl dark:shadow-neutral-950/60 p-1 transition-all">
          {/* Preset Speed Dial Trigger Button */}
          <button
            id="quick-add-presets-trigger"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer ${
              isOpen
                ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                : 'hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-300 dark:text-neutral-600'
            }`}
            title="Common expense shortcuts"
            aria-label="Common expense shortcuts"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-4 h-4 stroke-[2.5]" /> : <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />}
          </button>

          {/* Vertical Divider */}
          <div className="w-[1px] h-5 bg-neutral-700 dark:bg-neutral-300" />

          {/* Main Quick Add Action Button */}
          <button
            id="overview-quick-add-fab"
            type="button"
            onClick={handleOpenStandardModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer select-none"
            aria-label="Quick Add Transaction"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="tracking-tight whitespace-nowrap">Quick Add</span>
          </button>
        </div>
      </div>
    </>
  );
};
