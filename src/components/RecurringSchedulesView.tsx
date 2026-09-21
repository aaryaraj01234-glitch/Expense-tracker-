import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { RecurringSchedule } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from '../utils/icons';
import { getDueStatus } from '../utils/recurringScheduler';
import { ConfirmModal } from './Toast';

export const RecurringSchedulesView: React.FC = () => {
  const {
    recurringSchedules,
    categories,
    settings,
    openAddModal,
    deleteRecurringSchedule,
    toggleRecurringScheduleStatus,
    triggerRecurringNow,
    checkAndProcessRecurring,
    loadSampleData,
  } = useExpense();

  const [scheduleToDelete, setScheduleToDelete] = useState<RecurringSchedule | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }));
    return map;
  }, [categories]);

  // Aggregate monthly totals for recurring
  const { monthlyRecurringExpense, monthlyRecurringIncome } = React.useMemo(() => {
    let exp = 0;
    let inc = 0;

    recurringSchedules.forEach((s) => {
      if (s.status !== 'active') return;
      // Convert frequencies to approximate monthly basis
      let multiplier = 1;
      if (s.frequency === 'daily') multiplier = 30;
      else if (s.frequency === 'weekly') multiplier = 4.33;
      else if (s.frequency === 'monthly') multiplier = 1;
      else if (s.frequency === 'yearly') multiplier = 1 / 12;

      const monthlyVal = s.amount * multiplier;
      if (s.type === 'income') {
        inc += monthlyVal;
      } else {
        exp += monthlyVal;
      }
    });

    return {
      monthlyRecurringExpense: Math.round(exp),
      monthlyRecurringIncome: Math.round(inc),
    };
  }, [recurringSchedules]);

  const filteredSchedules = React.useMemo(() => {
    return recurringSchedules.filter((s) => {
      if (filterStatus === 'all') return true;
      return s.status === filterStatus;
    });
  }, [recurringSchedules, filterStatus]);

  const handleManualCheck = () => {
    setIsProcessing(true);
    checkAndProcessRecurring(true);
    setTimeout(() => setIsProcessing(false), 500);
  };

  return (
    <div id="recurring-schedules-container" className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Monthly Committed Expenses */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Committed Monthly Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-rose-500">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {formatCurrency(monthlyRecurringExpense, settings.currency, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">/ month</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Subscriptions, bills, and fixed expenses
          </p>
        </div>

        {/* Monthly Recurring Income */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Expected Recurring Income
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(monthlyRecurringIncome, settings.currency, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">/ month</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Salary, stipends, and retainers
          </p>
        </div>

        {/* Scheduler Status */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Auto-Generator Engine
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-neutral-600 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{recurringSchedules.length}</span> schedule{recurringSchedules.length === 1 ? '' : 's'} enrolled
            </div>
            <button
              id="check-recurring-now-btn"
              type="button"
              onClick={handleManualCheck}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : 'text-amber-500'}`} />
              <span>Check Due Dates</span>
            </button>
          </div>
          <p className="text-[10.5px] text-neutral-400 mt-1">
            Auto-runs on trigger date and at startup
          </p>
        </div>
      </div>

      {/* Action Header & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            All Schedules ({recurringSchedules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            Active ({recurringSchedules.filter((s) => s.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paused')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'paused'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            Paused ({recurringSchedules.filter((s) => s.status === 'paused').length})
          </button>
        </div>

        <button
          id="add-new-recurring-btn"
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Recurring Schedule</span>
        </button>
      </div>

      {/* Recurring Schedules List */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
            <Repeat className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {filterStatus === 'all'
                ? 'No Recurring Transactions Scheduled'
                : `No ${filterStatus} recurring transactions found`}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Schedule recurring bills, rent, software subscriptions, or salary credits. When the date triggers, they are automatically generated for you.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => openAddModal()}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add First Recurring Item
            </button>
            <button
              type="button"
              onClick={loadSampleData}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Load Sample Rent & Subscriptions
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => {
            const catInfo = categoryMap.get(schedule.category) || { name: 'Other', icon: 'Tag' };
            const isIncome = schedule.type === 'income';
            const dueStatus = getDueStatus(schedule.nextDueDate);

            return (
              <div
                key={schedule.id}
                id={`recurring-card-${schedule.id}`}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
              >
                {/* Header: Category & Type */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      <CategoryIcon name={catInfo.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {schedule.description}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                        <span>{catInfo.name}</span>
                        <span>•</span>
                        <span className="capitalize">{schedule.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <span
                      className={`text-base font-bold tracking-tight ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(schedule.amount, settings.currency, settings.currencySymbol)}
                    </span>
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      Per {schedule.frequency.replace('ly', '')}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Due Date Bar */}
                <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-500 dark:text-neutral-400">Next Due:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {formatDate(schedule.nextDueDate, settings.dateFormat)}
                    </span>
                  </div>

                  {/* Due Status Pill */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      dueStatus.isToday
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 animate-pulse'
                        : dueStatus.isPast
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{dueStatus.label}</span>
                  </span>
                </div>

                {/* Configuration Specs */}
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-0.5 border-t border-neutral-100 dark:border-neutral-800/70">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" />
                    <span>{schedule.paymentMethod}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11.5px] font-medium text-neutral-700 dark:text-neutral-300">
                      {schedule.autoGenerate ? 'Auto-generates on date' : 'Manual confirmation'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    id={`trigger-now-${schedule.id}`}
                    type="button"
                    onClick={() => triggerRecurringNow(schedule.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
                    title="Generate this occurrence right now without waiting for the trigger date"
                  >
                    <Zap className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                    <span>Generate Early</span>
                  </button>

                  <button
                    id={`toggle-status-${schedule.id}`}
                    type="button"
                    onClick={() => toggleRecurringScheduleStatus(schedule.id)}
                    className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      schedule.status === 'active'
                        ? 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                    }`}
                  >
                    {schedule.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  <button
                    id={`delete-recurring-${schedule.id}`}
                    type="button"
                    onClick={() => setScheduleToDelete(schedule)}
                    className="p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete recurring schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {scheduleToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Recurring Schedule"
          description={`Are you sure you want to stop and delete the recurring schedule for "${scheduleToDelete.description}"? Past generated transactions will remain intact.`}
          confirmLabel="Delete Schedule"
          isDestructive={true}
          onConfirm={() => {
            deleteRecurringSchedule(scheduleToDelete.id);
            setScheduleToDelete(null);
          }}
          onCancel={() => setScheduleToDelete(null)}
        />
      )}
    </div>
  );
};
