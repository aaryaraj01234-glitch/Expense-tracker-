import { Category, Transaction, UserSettings, PaymentMethod, Budget } from '../types';

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'USD - US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD - Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD - Australian Dollar (A$)' },
  { code: 'JPY', symbol: '¥', label: 'JPY - Japanese Yen (¥)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD - Singapore Dollar (S$)' },
  { code: 'AED', symbol: 'AED', label: 'AED - UAE Dirham' },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Other',
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat-food', name: 'Food', type: 'expense', icon: 'Utensils' },
  { id: 'cat-transport', name: 'Transport', type: 'expense', icon: 'Car' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag' },
  { id: 'cat-education', name: 'Education', type: 'expense', icon: 'GraduationCap' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'Film' },
  { id: 'cat-bills', name: 'Bills', type: 'expense', icon: 'Receipt' },
  { id: 'cat-health', name: 'Health', type: 'expense', icon: 'HeartPulse' },
  { id: 'cat-travel', name: 'Travel', type: 'expense', icon: 'Plane' },
  { id: 'cat-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Tv' },
  { id: 'cat-other-expense', name: 'Other', type: 'expense', icon: 'MoreHorizontal' },

  // Income Categories
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'Laptop' },
  { id: 'cat-investment', name: 'Investments', type: 'income', icon: 'TrendingUp' },
  { id: 'cat-allowance', name: 'Allowance / Pocket Money', type: 'income', icon: 'Wallet' },
  { id: 'cat-other-income', name: 'Other Income', type: 'income', icon: 'PlusCircle' },
];

export const DEFAULT_BUDGETS: Budget[] = [];

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'INR',
  currencySymbol: '₹',
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  defaultTransactionType: 'expense',
  firstDayOfWeek: 'monday',
  isPasswordEnabled: false,
  passwordHash: '',
  passwordHint: '',
  autoLockMinutes: 5,
};

// Generates sample transactions across the current month for demo / testing
export function generateSampleTransactions(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const fmtDate = (day: number) => `${year}-${month}-${String(day).padStart(2, '0')}`;

  return [
    {
      id: 'tx-1',
      type: 'income',
      amount: 45000,
      category: 'cat-salary',
      description: 'Monthly Salary Credit',
      date: fmtDate(1),
      paymentMethod: 'Bank Transfer',
      notes: 'Direct deposit for the month',
      createdAt: Date.now() - 86400000 * 15,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 420,
      category: 'cat-food',
      description: 'Swiggy Dinner Delivery',
      date: fmtDate(2),
      paymentMethod: 'UPI',
      notes: 'Paneer butter masala & rotis',
      createdAt: Date.now() - 86400000 * 14,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 1450,
      category: 'cat-transport',
      description: 'Monthly Metro SmartCard Recharge',
      date: fmtDate(3),
      paymentMethod: 'Debit Card',
      createdAt: Date.now() - 86400000 * 13,
    },
    {
      id: 'tx-4',
      type: 'income',
      amount: 12000,
      category: 'cat-freelance',
      description: 'UI Design Client Milestone',
      date: fmtDate(5),
      paymentMethod: 'Bank Transfer',
      notes: 'Invoice #402 paid',
      createdAt: Date.now() - 86400000 * 12,
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 2199,
      category: 'cat-shopping',
      description: 'Running Shoes Sale',
      date: fmtDate(7),
      paymentMethod: 'Credit Card',
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 1850,
      category: 'cat-education',
      description: 'Semester Reference Textbooks',
      date: fmtDate(9),
      paymentMethod: 'UPI',
      notes: 'Bookstore receipt saved',
      createdAt: Date.now() - 86400000 * 8,
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 890,
      category: 'cat-bills',
      description: 'High-speed Fiber Broadband Bill',
      date: fmtDate(10),
      paymentMethod: 'UPI',
      createdAt: Date.now() - 86400000 * 7,
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 499,
      category: 'cat-subscriptions',
      description: 'Cloud Music & Streaming Pack',
      date: fmtDate(12),
      paymentMethod: 'Credit Card',
      recurring: 'monthly',
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'tx-9',
      type: 'expense',
      amount: 650,
      category: 'cat-food',
      description: 'Grocery & Dairy Weekly Restock',
      date: fmtDate(14),
      paymentMethod: 'UPI',
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'tx-10',
      type: 'expense',
      amount: 380,
      category: 'cat-entertainment',
      description: 'Weekend Cinema Ticket',
      date: fmtDate(15),
      paymentMethod: 'Debit Card',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'tx-11',
      type: 'expense',
      amount: 1200,
      category: 'cat-health',
      description: 'Pharmacy & Vitamin Supplements',
      date: fmtDate(16),
      paymentMethod: 'Cash',
      createdAt: Date.now() - 86400000 * 1,
    },
  ];
}
