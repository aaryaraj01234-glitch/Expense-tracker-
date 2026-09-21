import { RecurringSchedule, RecurrenceFrequency, Transaction, Category } from '../types';

/**
 * Computes the next due date based on the current due date and recurrence frequency.
 * Handles month-end overflows safely (e.g., Jan 31 -> Feb 28/29).
 */
export function computeNextDueDate(currentDueDateStr: string, frequency: RecurrenceFrequency): string {
  const [y, m, d] = currentDueDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  switch (frequency) {
    case 'daily': {
      date.setDate(date.getDate() + 1);
      break;
    }
    case 'weekly': {
      date.setDate(date.getDate() + 7);
      break;
    }
    case 'monthly': {
      const targetMonth = date.getMonth() + 1;
      const originalDay = d;
      date.setDate(1);
      date.setMonth(targetMonth);
      // Determine max days in the target month
      const maxDaysInTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(originalDay, maxDaysInTargetMonth));
      break;
    }
    case 'yearly': {
      const targetYear = date.getFullYear() + 1;
      const isLeapFeb29 = date.getMonth() === 1 && d === 29;
      if (isLeapFeb29) {
        // If next year is not a leap year, snap to Feb 28
        const isNextLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
        date.setFullYear(targetYear, 1, isNextLeap ? 29 : 28);
      } else {
        date.setFullYear(targetYear);
      }
      break;
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Evaluates the due status of a scheduled date relative to a reference date (usually today).
 */
export function getDueStatus(nextDueDateStr: string, referenceDateStr?: string): {
  isDue: boolean;
  isToday: boolean;
  isPast: boolean;
  daysRemaining: number;
  label: string;
} {
  const refStr = referenceDateStr || new Date().toISOString().split('T')[0];
  const [refY, refM, refD] = refStr.split('-').map(Number);
  const [dueY, dueM, dueD] = nextDueDateStr.split('-').map(Number);

  const refDate = new Date(refY, refM - 1, refD);
  const dueDate = new Date(dueY, dueM - 1, dueD);

  const diffMs = dueDate.getTime() - refDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      isDue: true,
      isToday: true,
      isPast: false,
      daysRemaining: 0,
      label: 'Due Today',
    };
  } else if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isDue: true,
      isToday: false,
      isPast: true,
      daysRemaining: diffDays,
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
    };
  } else if (diffDays === 1) {
    return {
      isDue: false,
      isToday: false,
      isPast: false,
      daysRemaining: 1,
      label: 'Due Tomorrow',
    };
  } else {
    return {
      isDue: false,
      isToday: false,
      isPast: false,
      daysRemaining: diffDays,
      label: `Due in ${diffDays} days`,
    };
  }
}

/**
 * Core processing logic: checks all recurring schedules against the current date.
 * If a schedule is active and autoGenerate is true, and its nextDueDate <= today:
 * It generates the appropriate transaction(s) up to today and advances the nextDueDate.
 */
export function processRecurringSchedules(
  schedules: RecurringSchedule[],
  existingTransactions: Transaction[],
  todayStr?: string
): {
  updatedSchedules: RecurringSchedule[];
  newTransactions: Transaction[];
  generatedCount: number;
} {
  const today = todayStr || new Date().toISOString().split('T')[0];
  const newTransactions: Transaction[] = [];
  const updatedSchedules: RecurringSchedule[] = [];
  let generatedCount = 0;

  // Build a lookup set for existing transaction dates by scheduleId to avoid any duplication
  const existingTxKeys = new Set<string>();
  existingTransactions.forEach((tx) => {
    if (tx.recurringScheduleId) {
      existingTxKeys.add(`${tx.recurringScheduleId}::${tx.date}`);
    }
  });

  for (const origSchedule of schedules) {
    const schedule: RecurringSchedule = { ...origSchedule };

    if (schedule.status !== 'active' || !schedule.autoGenerate) {
      updatedSchedules.push(schedule);
      continue;
    }

    let currentDue = schedule.nextDueDate;
    let scheduleUpdated = false;
    let iterations = 0;
    const MAX_ITERATIONS = 36; // Safety clamp (e.g. up to 3 years of monthly occurrences)

    while (currentDue <= today && iterations < MAX_ITERATIONS) {
      iterations++;

      // Check if past optional end date
      if (schedule.endDate && currentDue > schedule.endDate) {
        schedule.status = 'completed';
        scheduleUpdated = true;
        break;
      }

      const txKey = `${schedule.id}::${currentDue}`;
      if (!existingTxKeys.has(txKey)) {
        // Generate new transaction
        const newTx: Transaction = {
          id: `tx-rec-${schedule.id}-${currentDue}-${Math.random().toString(36).substr(2, 4)}`,
          type: schedule.type,
          amount: schedule.amount,
          category: schedule.category,
          description: schedule.description,
          date: currentDue,
          paymentMethod: schedule.paymentMethod,
          notes: schedule.notes
            ? `${schedule.notes} [Auto-renewed: ${schedule.frequency}]`
            : `[Auto-renewed ${schedule.frequency} renewal]`,
          recurring: schedule.frequency,
          isRecurring: true,
          recurringScheduleId: schedule.id,
          isAutoGenerated: true,
          generationDate: today,
          createdAt: Date.now(),
        };

        newTransactions.push(newTx);
        existingTxKeys.add(txKey);
        generatedCount++;
        schedule.lastGeneratedDate = currentDue;
        scheduleUpdated = true;
      }

      // Advance next due date
      const nextDue = computeNextDueDate(currentDue, schedule.frequency);
      currentDue = nextDue;
      schedule.nextDueDate = nextDue;
      scheduleUpdated = true;

      // If next due exceeds end date, mark completed
      if (schedule.endDate && schedule.nextDueDate > schedule.endDate) {
        schedule.status = 'completed';
        break;
      }
    }

    updatedSchedules.push(scheduleUpdated ? schedule : origSchedule);
  }

  return {
    updatedSchedules,
    newTransactions,
    generatedCount,
  };
}

/**
 * Manually trigger the next occurrence for a single schedule ahead of time.
 */
export function forceGenerateSingleOccurrence(
  schedule: RecurringSchedule,
  existingTransactions: Transaction[]
): {
  updatedSchedule: RecurringSchedule;
  generatedTransaction: Transaction | null;
} {
  const dueDate = schedule.nextDueDate;
  const existingKey = `${schedule.id}::${dueDate}`;
  const alreadyExists = existingTransactions.some(
    (tx) => tx.recurringScheduleId === schedule.id && tx.date === dueDate
  );

  if (alreadyExists) {
    // Already generated for this due date, just advance
    const nextDue = computeNextDueDate(dueDate, schedule.frequency);
    return {
      updatedSchedule: {
        ...schedule,
        nextDueDate: nextDue,
      },
      generatedTransaction: null,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const newTx: Transaction = {
    id: `tx-rec-${schedule.id}-${dueDate}-${Math.random().toString(36).substr(2, 4)}`,
    type: schedule.type,
    amount: schedule.amount,
    category: schedule.category,
    description: schedule.description,
    date: dueDate,
    paymentMethod: schedule.paymentMethod,
    notes: schedule.notes
      ? `${schedule.notes} [Recurring: ${schedule.frequency}]`
      : `[Recurring: ${schedule.frequency}]`,
    recurring: schedule.frequency,
    isRecurring: true,
    recurringScheduleId: schedule.id,
    isAutoGenerated: true,
    generationDate: today,
    createdAt: Date.now(),
  };

  const nextDue = computeNextDueDate(dueDate, schedule.frequency);
  const updatedSchedule: RecurringSchedule = {
    ...schedule,
    lastGeneratedDate: dueDate,
    nextDueDate: nextDue,
    status: schedule.endDate && nextDue > schedule.endDate ? 'completed' : schedule.status,
  };

  return {
    updatedSchedule,
    generatedTransaction: newTx,
  };
}

/**
 * Generates initial demo recurring schedules (e.g. Monthly rent, subscription renewals)
 */
export function generateSampleRecurringSchedules(categories: Category[]): RecurringSchedule[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Format helper
  const fmt = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Find suitable categories
  const rentCat = categories.find((c) => c.name.toLowerCase().includes('bill') || c.id === 'cat-bills') || categories[0];
  const subCat = categories.find((c) => c.name.toLowerCase().includes('sub') || c.id === 'cat-subscriptions') || categories[0];
  const salCat = categories.find((c) => c.name.toLowerCase().includes('salary') || c.id === 'cat-salary') || categories[0];

  return [
    {
      id: 'rec-rent-1',
      type: 'expense',
      amount: 15000,
      category: rentCat.id,
      description: 'Apartment Monthly Rent',
      paymentMethod: 'Bank Transfer',
      notes: 'Due on the 1st of every month',
      frequency: 'monthly',
      startDate: fmt(year, month, 1),
      nextDueDate: fmt(year, month + 1, 1),
      lastGeneratedDate: fmt(year, month, 1),
      autoGenerate: true,
      status: 'active',
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'rec-sub-netflix',
      type: 'expense',
      amount: 649,
      category: subCat.id,
      description: 'Netflix 4K Premium Plan',
      paymentMethod: 'Credit Card',
      notes: 'Auto-debit monthly subscription',
      frequency: 'monthly',
      startDate: fmt(year, month, 15),
      nextDueDate: fmt(year, month + 1, 15),
      lastGeneratedDate: fmt(year, month, 15),
      autoGenerate: true,
      status: 'active',
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'rec-sub-spotify',
      type: 'expense',
      amount: 199,
      category: subCat.id,
      description: 'Spotify Family Subscription',
      paymentMethod: 'UPI',
      notes: 'Monthly renewal',
      frequency: 'monthly',
      startDate: fmt(year, month, 5),
      nextDueDate: fmt(year, month + 1, 5),
      lastGeneratedDate: fmt(year, month, 5),
      autoGenerate: true,
      status: 'active',
      createdAt: Date.now() - 86400000 * 45,
    },
    {
      id: 'rec-income-salary',
      type: 'income',
      amount: 52000,
      category: salCat.id,
      description: 'Monthly Employment Salary',
      paymentMethod: 'Bank Transfer',
      notes: 'Direct corporate payroll transfer',
      frequency: 'monthly',
      startDate: fmt(year, month, 25),
      nextDueDate: fmt(year, month, 25),
      autoGenerate: true,
      status: 'active',
      createdAt: Date.now() - 86400000 * 60,
    },
  ];
}
