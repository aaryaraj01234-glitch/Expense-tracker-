import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CashFlowComparisonProps {
  income: number;
  expenses: number;
  currency: string;
  currencySymbol: string;
  periodLabel?: string;
}

export const CashFlowComparisonChart: React.FC<CashFlowComparisonProps> = ({
  income,
  expenses,
  currency,
  currencySymbol,
  periodLabel = 'Selected Period',
}) => {
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.max(0, (net / income) * 100) : 0;
  const expenseRate = income > 0 ? Math.min(100, (expenses / income) * 100) : 100;
  const maxVal = Math.max(income, expenses, 1);

  const incomeHeight = (income / maxVal) * 100;
  const expenseHeight = (expenses / maxVal) * 100;

  return (
    <div className="bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>Cash Flow Comparison</span>
            <span className="text-[11px] font-normal text-neutral-400">({periodLabel})</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time balance of incoming vs outgoing capital
          </p>
        </div>

        {income > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Savings Rate: {savingsRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Visual Dual Bars */}
        <div className="md:col-span-2 space-y-4">
          {/* Income Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Total Inflow (Income)
              </span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(income, currency, currencySymbol)}
              </span>
            </div>
            <div className="w-full h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${Math.max(incomeHeight, income > 0 ? 4 : 0)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-xs"
              />
            </div>
          </div>

          {/* Expense Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Total Outflow (Expenses)
              </span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(expenses, currency, currencySymbol)}
              </span>
            </div>
            <div className="w-full h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${Math.max(expenseHeight, expenses > 0 ? 4 : 0)}%` }}
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500 shadow-xs"
              />
            </div>
          </div>

          {/* Proportional Segment Bar */}
          {income > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                <span>Income Utilization Breakdown</span>
                <span>
                  {expenseRate.toFixed(1)}% spent · {(100 - expenseRate).toFixed(1)}% retained
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800">
                <div
                  style={{ width: `${Math.min(expenseRate, 100)}%` }}
                  className="bg-rose-500 transition-all duration-300"
                  title={`Spent: ${expenseRate.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${Math.max(0, 100 - expenseRate)}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                  title={`Retained: ${(100 - expenseRate).toFixed(1)}%`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Net Health Card */}
        <div className={`p-4 rounded-xl border flex flex-col justify-center text-center ${
          net >= 0
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/60'
        }`}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
            Net Surplus / Deficit
          </span>
          <div className={`text-2xl font-bold tracking-tight ${
            net >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(net, currency, currencySymbol)}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {net >= 0
              ? 'Healthy cashflow — income exceeded expenditures.'
              : 'Deficit incurred — spending exceeded inflow.'}
          </p>
        </div>
      </div>
    </div>
  );
};
