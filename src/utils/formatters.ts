import { Transaction, Category } from '../types';

export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  currencySymbol = '₹',
  hideDecimalsIfZero = true
): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber = '';
  try {
    if (currencyCode === 'INR') {
      // Indian numbering system: 1,00,000
      formattedNumber = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: hideDecimalsIfZero && Number.isInteger(absAmount) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(absAmount);
    } else {
      formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: hideDecimalsIfZero && Number.isInteger(absAmount) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(absAmount);
    }
  } catch {
    formattedNumber = absAmount.toFixed(2);
  }

  const prefix = isNegative ? '-' : '';
  return `${prefix}${currencySymbol}${formattedNumber}`;
}

export function formatDate(dateString: string, format = 'DD/MM/YYYY'): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  } else {
    // Default DD/MM/YYYY
    return `${day}/${month}/${year}`;
  }
}

export function formatHumanDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateString === todayStr) return 'Today';
    if (dateString === yesterdayStr) return 'Yesterday';

    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthDisplay(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  currencyCode = 'INR'
): void {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes', 'Recurring'];

  const rows = transactions.map((t) => {
    const catName = categoryMap.get(t.category) || t.category || 'Uncategorized';
    return [
      `"${t.date}"`,
      `"${t.type}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${catName.replace(/"/g, '""')}"`,
      t.amount,
      `"${currencyCode}"`,
      `"${t.paymentMethod}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${t.recurring || 'none'}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `expense_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads transactions as CSV with columns for Date, Description, Category, Amount, and Type
 */
export function downloadTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  filename = `all_transactions_${new Date().toISOString().slice(0, 10)}.csv`
): void {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];

  const rows = transactions.map((t) => {
    const catName = categoryMap.get(t.category) || t.category || 'Uncategorized';
    return [
      `"${t.date}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${catName.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.type}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

