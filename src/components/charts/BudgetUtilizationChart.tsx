import React from 'react';
import { Target, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/icons';
import { getCategoryColor } from './chartColors';

export interface BudgetItemChartData {
  id: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  limit: number;
  spent: number;
  remaining: number;
  rawPercent: number;
  progressPercent: number;
  isApproaching: boolean;
  isExceeded: boolean;
}

interface BudgetUtilizationChartProps {
  items: BudgetItemChartData[];
  currency: string;
  currencySymbol: string;
}

export const BudgetUtilizationChart: React.FC<BudgetUtilizationChartProps> = ({
  items,
  currency,
  currencySymbol,
}) => {
  if (items.length === 0) return null;

  const totalLimit = items.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = items.reduce((sum, b) => sum + b.spent, 0);
  const overallPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const remainingTotal = Math.max(0, totalLimit - totalSpent);

  return (
    <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Overall Budget Allocation</span>
            <span className="text-[11px] font-normal text-neutral-400">
              ({items.length} active {items.length === 1 ? 'target' : 'targets'})
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Composite spending versus budgeted allocation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            {formatCurrency(totalSpent, currency, currencySymbol)}
          </span>
          <span className="text-xs text-neutral-400">
            of {formatCurrency(totalLimit, currency, currencySymbol)}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              overallPercent > 100
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : overallPercent >= 80
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {overallPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Multi-category colorful stacked distribution bar */}
      <div className="space-y-3">
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800 gap-0.5 p-0.5">
          {items.map((b, idx) => {
            const widthShare = totalLimit > 0 ? (b.limit / totalLimit) * 100 : 0;
            const color = getCategoryColor(b.categoryId, b.categoryName, idx);
            return (
              <div
                key={b.id}
                style={{ width: `${widthShare}%`, backgroundColor: color }}
                className="h-full rounded-xs transition-all duration-300 hover:opacity-80 cursor-pointer"
                title={`${b.categoryName}: ${formatCurrency(b.limit, currency, currencySymbol)} (${widthShare.toFixed(1)}% of total budget)`}
              />
            );
          })}
        </div>

        {/* Category Budget Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((b, idx) => {
            const color = getCategoryColor(b.categoryId, b.categoryName, idx);
            const isExceeded = b.spent > b.limit;
            const isApproaching = !isExceeded && b.rawPercent >= 80;

            return (
              <div
                key={b.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 text-xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {b.categoryName}
                </span>
                <span className="text-neutral-400 text-[11px]">
                  {formatCurrency(b.spent, currency, currencySymbol)} / {formatCurrency(b.limit, currency, currencySymbol)}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isExceeded
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                      : isApproaching
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}
                >
                  {b.rawPercent.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
