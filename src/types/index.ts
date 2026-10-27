export type TransactionType = 'income' | 'expense';

export interface YearBudget {
  year: string; // e.g. "2026 / 2027" or "2026"
  openingBalance: number; // المبلغ الموجود معي في بداية الميزانية (الرصيد الافتتاحي)
  createdAt: string;
  isLocked: boolean; // Permanently locked once confirmed
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date format YYYY-MM-DD
  servantId?: string; // Optional reference if linked to a servant subscription
}

export interface Servant {
  id: string;
  name: string;
  phone: string;
  monthlyAmount: number;
  joinedDate: string; // ISO date format YYYY-MM-DD
  isActive: boolean;
}

export interface MonthlyPayment {
  id: string;
  servantId: string;
  monthYear: string; // Format: 'YYYY-MM' (e.g. '2026-10')
  amountPaid: number;
  paidAt?: string; // ISO date timestamp when payment was recorded
  isPaid: boolean;
  transactionId?: string; // Linked transaction id when paid
}

export type ActiveTab = 'budget' | 'servants';
