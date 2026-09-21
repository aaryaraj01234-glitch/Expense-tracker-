import { Category, Transaction, TransactionType } from '../types';

export interface CategorySuggestion {
  category: Category;
  frequency: number;
  merchant: string;
  source: 'history' | 'catalog';
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'at', 'for', 'to', 'in', 'on', 'of', 'and', 'with', 'from',
  'by', 'payment', 'bill', 'recharge', 'fee', 'charge', 'purchase', 'order',
  'sub', 'subscription', 'store', 'shop', 'online', 'card', 'upi', 'pos'
]);

interface KnownMerchantRule {
  keywords: string[];
  categoryKeywords: string[];
  displayMerchant: string;
  type: TransactionType;
}

const KNOWN_MERCHANTS: KnownMerchantRule[] = [
  // Food & Dining (Expenses)
  {
    keywords: [
      'swiggy', 'zomato', 'starbucks', 'mcdonald', 'kfc', 'subway', 'domino',
      'pizza', 'burger', 'chipotle', 'dunkin', 'taco bell', 'wendy', 'panera',
      'doordash', 'uber eats', 'grubhub', 'cafe', 'coffee', 'bakery', 'restaurant',
      'diner', 'bistro', 'shake shack', 'barista', 'lunch', 'dinner', 'breakfast'
    ],
    categoryKeywords: ['food', 'dining', 'restaurant'],
    displayMerchant: 'Food & Dining',
    type: 'expense',
  },
  // Transport & Commute
  {
    keywords: [
      'uber', 'lyft', 'ola', 'metro', 'subway', 'transit', 'bus', 'train',
      'flight', 'airline', 'shell', 'chevron', 'bp', 'exxon', 'mobil', 'petrol',
      'fuel', 'gas station', 'parking', 'toll', 'fastag', 'cab', 'taxi', 'commute'
    ],
    categoryKeywords: ['transport', 'commute', 'travel'],
    displayMerchant: 'Transport & Commute',
    type: 'expense',
  },
  // Shopping & Groceries
  {
    keywords: [
      'amazon', 'walmart', 'target', 'costco', 'flipkart', 'ebay', 'best buy',
      'ikea', 'trader joe', 'whole foods', 'kroger', 'aldi', 'safeway', 'blinkit',
      'zepto', 'instacart', 'supermarket', 'grocery', 'groceries', 'zara', 'h&m',
      'nike', 'adidas', 'uniqlo', 'clothing', 'apparel', 'mall', 'mart'
    ],
    categoryKeywords: ['shopping', 'grocer', 'retail'],
    displayMerchant: 'Shopping & Groceries',
    type: 'expense',
  },
  // Bills & Utilities
  {
    keywords: [
      'electric', 'electricity', 'water bill', 'power', 'internet', 'broadband',
      'wifi', 'airtel', 'jio', 'verizon', 'at&t', 't-mobile', 'comcast', 'xfinity',
      'utility', 'utilities', 'rent', 'landlord', 'gas bill', 'maintenance', 'sewage'
    ],
    categoryKeywords: ['bill', 'utilit'],
    displayMerchant: 'Bills & Utilities',
    type: 'expense',
  },
  // Entertainment & Leisure
  {
    keywords: [
      'netflix', 'spotify', 'hulu', 'disney', 'cinema', 'amc', 'movie', 'theater',
      'theatre', 'steam', 'playstation', 'psn', 'xbox', 'nintendo', 'concert',
      'youtube', 'prime video', 'apple tv', 'audible', 'game pass', 'twitch'
    ],
    categoryKeywords: ['entertain', 'leisure'],
    displayMerchant: 'Entertainment & Leisure',
    type: 'expense',
  },
  // Health & Medical
  {
    keywords: [
      'pharmacy', 'cvs', 'walgreens', 'boots', 'doctor', 'hospital', 'clinic',
      'dentist', 'dental', 'gym', 'fitness', 'anytime fitness', 'planet fitness',
      'medicine', 'optometrist', 'apollo', 'labcorp', 'quest diagnostics', 'medical'
    ],
    categoryKeywords: ['health', 'medic', 'fitness'],
    displayMerchant: 'Health & Medical',
    type: 'expense',
  },
  // Education & Courses
  {
    keywords: [
      'coursera', 'udemy', 'edx', 'skillshare', 'bookstore', 'textbook',
      'barnes & noble', 'tuition', 'school', 'college', 'university', 'duolingo',
      'udacity', 'course', 'academy'
    ],
    categoryKeywords: ['edu', 'course', 'book'],
    displayMerchant: 'Education',
    type: 'expense',
  },
  // Income: Salary
  {
    keywords: ['salary', 'payroll', 'employer', 'wages', 'stipend', 'paycheck', 'direct deposit'],
    categoryKeywords: ['salary'],
    displayMerchant: 'Salary',
    type: 'income',
  },
  // Income: Freelance / Consulting
  {
    keywords: ['upwork', 'fiverr', 'client', 'freelance', 'consulting', 'invoice payment', 'retainer'],
    categoryKeywords: ['freelance', 'consult'],
    displayMerchant: 'Freelance / Consulting',
    type: 'income',
  },
  // Income: Investments / Dividends
  {
    keywords: ['dividend', 'interest', 'stocks', 'brokerage', 'vanguard', 'fidelity', 'robinhood', 'mutual fund'],
    categoryKeywords: ['invest', 'dividend'],
    displayMerchant: 'Investments',
    type: 'income',
  },
];

/**
 * Suggests the most frequently used category when the user types a known merchant name.
 * 1. Scans user's historical transactions to find the category most frequently associated with the merchant.
 * 2. If history has no record, falls back to a curated catalog of known merchants.
 */
export function suggestCategoryForDescription(
  rawDescription: string,
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType
): CategorySuggestion | null {
  const query = rawDescription.trim().toLowerCase();
  if (query.length < 2) return null;

  // Extract meaningful tokens
  const tokens = query
    .split(/[\s,.-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  if (tokens.length === 0 && query.length < 3) return null;

  // Filter categories matching current transaction type
  const availableCategories = categories.filter((c) => c.type === type);
  if (availableCategories.length === 0) return null;

  const categoryMap = new Map<string, Category>();
  availableCategories.forEach((c) => categoryMap.set(c.id, c));

  // --- STAGE 1: Scan Historical Transactions for Most Frequent Category ---
  // Tally category usage among transactions where description matches
  const categoryCounts = new Map<string, number>();
  let matchedMerchantWord = '';

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    if (!categoryMap.has(tx.category)) continue;

    const txDesc = tx.description.toLowerCase().trim();

    // Check if the query is a substring of the transaction description or vice versa
    const isDirectMatch = txDesc.includes(query) || query.includes(txDesc);

    // Check if any significant token matches
    const hasTokenMatch = tokens.some((token) => {
      if (token.length >= 3 && txDesc.includes(token)) {
        if (!matchedMerchantWord) matchedMerchantWord = token;
        return true;
      }
      return false;
    });

    if (isDirectMatch || hasTokenMatch) {
      const current = categoryCounts.get(tx.category) || 0;
      categoryCounts.set(tx.category, current + 1);
      if (!matchedMerchantWord && tokens.length > 0) {
        matchedMerchantWord = tokens[0];
      }
    }
  }

  // Find the most frequently used category from history
  if (categoryCounts.size > 0) {
    let topCategoryId = '';
    let maxCount = 0;

    for (const [catId, count] of categoryCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        topCategoryId = catId;
      }
    }

    const topCategory = categoryMap.get(topCategoryId);
    if (topCategory) {
      return {
        category: topCategory,
        frequency: maxCount,
        merchant: matchedMerchantWord || rawDescription.trim(),
        source: 'history',
      };
    }
  }

  // --- STAGE 2: Fallback to Curated Known Merchant Catalog ---
  for (const rule of KNOWN_MERCHANTS) {
    if (rule.type !== type) continue;

    // Check if any rule keyword matches the input or any of its tokens
    const matchedKeyword = rule.keywords.find((kw) => {
      return query.includes(kw) || tokens.some((token) => token === kw || token.startsWith(kw));
    });

    if (matchedKeyword) {
      // Find the best category matching the rule's category keywords
      const matchedCat = availableCategories.find((cat) => {
        const catName = cat.name.toLowerCase();
        const catId = cat.id.toLowerCase();
        return rule.categoryKeywords.some((ckw) => catName.includes(ckw) || catId.includes(ckw));
      });

      if (matchedCat) {
        // Capitalize merchant name for presentation
        const formattedMerchant =
          matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);

        return {
          category: matchedCat,
          frequency: 1,
          merchant: formattedMerchant,
          source: 'catalog',
        };
      }
    }
  }

  return null;
}
