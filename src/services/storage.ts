import type { Transaction, Servant, MonthlyPayment, YearBudget } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATE } from '../utils/whatsapp';
import { normalizeFiscalYear } from '../utils/fiscalYear';

const STORAGE_KEYS = {
  TRANSACTIONS: 'budget_servants_transactions_v1',
  SERVANTS: 'budget_servants_list_v1',
  PAYMENTS: 'budget_servants_payments_v1',
  WHATSAPP_TEMPLATE: 'budget_servants_whatsapp_tpl_v1',
  YEAR_BUDGETS: 'budget_servants_year_budgets_v1',
};

const INITIAL_YEAR_BUDGETS: YearBudget[] = [];

// Seed Data (Clean Production Slate)
const INITIAL_SERVANTS: Servant[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_PAYMENTS: MonthlyPayment[] = [];

export const storageService = {
  // Transactions
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  },

  // Servants
  getServants(): Servant[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVANTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(INITIAL_SERVANTS));
        return INITIAL_SERVANTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SERVANTS;
    }
  },

  saveServants(servants: Servant[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(servants));
    } catch (e) {
      console.error('Failed to save servants to localStorage:', e);
    }
  },

  // Monthly Payments
  getPayments(): MonthlyPayment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  savePayments(payments: MonthlyPayment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error('Failed to save payments to localStorage:', e);
    }
  },

  // Year Budgets (Opening Balances per year)
  getYearBudgets(): YearBudget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.YEAR_BUDGETS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.YEAR_BUDGETS, JSON.stringify(INITIAL_YEAR_BUDGETS));
        return INITIAL_YEAR_BUDGETS;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((b) => ({
          ...b,
          year: normalizeFiscalYear(b.year),
        }));
      }
      return INITIAL_YEAR_BUDGETS;
    } catch {
      return INITIAL_YEAR_BUDGETS;
    }
  },

  saveYearBudgets(budgets: YearBudget[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.YEAR_BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed to save year budgets to localStorage:', e);
    }
  },

  // WhatsApp Template
  getWhatsAppTemplate(): string {
    try {
      const tpl = localStorage.getItem(STORAGE_KEYS.WHATSAPP_TEMPLATE);
      return tpl || DEFAULT_WHATSAPP_TEMPLATE;
    } catch {
      return DEFAULT_WHATSAPP_TEMPLATE;
    }
  },

  saveWhatsAppTemplate(tpl: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATE, tpl);
    } catch (e) {
      console.error('Failed to save whatsapp template to localStorage:', e);
    }
  },

  // Reset to seed data
  resetAll(): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(INITIAL_SERVANTS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATE, DEFAULT_WHATSAPP_TEMPLATE);
    localStorage.setItem(STORAGE_KEYS.YEAR_BUDGETS, JSON.stringify(INITIAL_YEAR_BUDGETS));
  }
};
