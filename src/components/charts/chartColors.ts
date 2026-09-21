// Vibrant Harmonic Color Palette for Financial Visualizations

export const VIBRANT_PALETTE = [
  '#6366F1', // Indigo / Iris
  '#EC4899', // Pink / Rose
  '#F59E0B', // Amber / Gold
  '#10B981', // Emerald / Mint
  '#3B82F6', // Blue / Azure
  '#8B5CF6', // Purple / Violet
  '#14B8A6', // Teal / Turquoise
  '#F97316', // Orange / Coral
  '#06B6D4', // Cyan / Sky
  '#EF4444', // Red / Crimson
  '#84CC16', // Lime / Chartreuse
  '#D946EF', // Fuchsia / Magenta
];

// Consistent semantic colors mapped to category names/ids
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  // Expenses
  'cat-food': '#F97316', // Warm Coral / Orange
  'cat-transport': '#06B6D4', // Cyan / Electric Blue
  'cat-shopping': '#EC4899', // Hot Pink
  'cat-education': '#3B82F6', // Royal Blue
  'cat-entertainment': '#8B5CF6', // Purple / Violet
  'cat-bills': '#EF4444', // Crimson Red
  'cat-health': '#14B8A6', // Teal
  'cat-travel': '#F59E0B', // Amber / Gold
  'cat-subscriptions': '#6366F1', // Indigo
  'cat-other-expense': '#64748B', // Slate

  // Incomes
  'cat-salary': '#10B981', // Emerald
  'cat-freelance': '#8B5CF6', // Violet
  'cat-investment': '#06B6D4', // Cyan
  'cat-allowance': '#F59E0B', // Amber
  'cat-other-income': '#14B8A6', // Teal
};

// Payment Method Colors
export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  UPI: '#10B981', // Emerald Green (popular fast UPI)
  'Credit Card': '#6366F1', // Indigo
  'Debit Card': '#3B82F6', // Blue
  Cash: '#F59E0B', // Gold / Amber
  'Bank Transfer': '#8B5CF6', // Violet
  Other: '#64748B', // Slate
};

/**
 * Returns a consistent vibrant color for any category
 */
export function getCategoryColor(id: string, name?: string, index = 0): string {
  if (CATEGORY_COLOR_MAP[id]) {
    return CATEGORY_COLOR_MAP[id];
  }

  // Check lowercase name
  if (name) {
    const lower = name.toLowerCase();
    if (lower.includes('food') || lower.includes('eat') || lower.includes('dining')) return '#F97316';
    if (lower.includes('transport') || lower.includes('cab') || lower.includes('fuel')) return '#06B6D4';
    if (lower.includes('shopping') || lower.includes('cloth')) return '#EC4899';
    if (lower.includes('bill') || lower.includes('rent') || lower.includes('utility')) return '#EF4444';
    if (lower.includes('health') || lower.includes('med')) return '#14B8A6';
    if (lower.includes('entertain') || lower.includes('movie') || lower.includes('game')) return '#8B5CF6';
    if (lower.includes('travel') || lower.includes('flight') || lower.includes('hotel')) return '#F59E0B';
    if (lower.includes('salary') || lower.includes('income')) return '#10B981';
  }

  // Fallback to palette cycle
  return VIBRANT_PALETTE[index % VIBRANT_PALETTE.length];
}

/**
 * Returns a color for payment methods
 */
export function getPaymentMethodColor(method: string, index = 0): string {
  return PAYMENT_METHOD_COLORS[method] || VIBRANT_PALETTE[index % VIBRANT_PALETTE.length];
}
