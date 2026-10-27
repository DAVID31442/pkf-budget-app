import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import type { Transaction, Servant, MonthlyPayment, YearBudget } from '../types';
import { storageService } from '../services/storage';
import { firestoreService } from '../services/firestore';
import { normalizeFiscalYear } from '../utils/fiscalYear';

interface AppContextType {
  transactions: Transaction[];
  servants: Servant[];
  payments: MonthlyPayment[];
  yearBudgets: YearBudget[];
  whatsappTemplate: string;
  isLoading: boolean;
  isCloudConnected: boolean;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  addServant: (srv: Omit<Servant, 'id'>) => Promise<Servant>;
  updateServant: (srv: Servant) => Promise<void>;
  deleteServant: (id: string) => Promise<void>;
  togglePayment: (servantId: string, monthYear: string, monthLabel?: string) => Promise<void>;
  addYearBudget: (year: string, openingBalance: number) => Promise<YearBudget>;
  getYearBudget: (year: string) => YearBudget | undefined;
  setWhatsAppTemplate: (tpl: string) => void;
  syncLocalToCloud: () => Promise<{ yearsCount: number; txCount: number; servantsCount: number; paymentsCount: number }>;
  restoreAllData: (data: {
    transactions: Transaction[];
    servants: Servant[];
    payments: MonthlyPayment[];
    yearBudgets?: YearBudget[];
    whatsappTemplate?: string;
  }) => Promise<void>;
  resetAllData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with local cache for immediate render
  const [transactions, setTransactions] = useState<Transaction[]>(() => storageService.getTransactions());
  const [servants, setServants] = useState<Servant[]>(() => storageService.getServants());
  const [payments, setPayments] = useState<MonthlyPayment[]>(() => storageService.getPayments());
  const [yearBudgets, setYearBudgets] = useState<YearBudget[]>(() => storageService.getYearBudgets());
  const [whatsappTemplate, setWhatsAppTemplateState] = useState<string>(() => storageService.getWhatsAppTemplate());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Flags to track when initial snapshot is received
  const loadedCollections = useRef<Set<string>>(new Set());

  const checkAllLoaded = (name: string) => {
    loadedCollections.current.add(name);
    if (loadedCollections.current.size >= 4) {
      setIsLoading(false);
      setIsCloudConnected(true);
    }
  };

  // Set up real-time onSnapshot listeners with Cloud Firestore
  useEffect(() => {
    // Timeout fallback: don't block the UI forever if network is slow/offline
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    // 1. Fiscal Years Listener
    const unsubYears = firestoreService.subscribeFiscalYears((remoteYears) => {
      setYearBudgets(remoteYears);
      storageService.saveYearBudgets(remoteYears);
      checkAllLoaded('years');
    });

    // 2. Transactions Listener
    const unsubTx = firestoreService.subscribeTransactions((remoteTxs) => {
      setTransactions(remoteTxs);
      storageService.saveTransactions(remoteTxs);
      checkAllLoaded('tx');
    });

    // 3. Servants Listener
    const unsubServants = firestoreService.subscribeServants((remoteServants) => {
      setServants(remoteServants);
      storageService.saveServants(remoteServants);
      checkAllLoaded('servants');
    });

    // 4. Monthly Payments Listener
    const unsubPayments = firestoreService.subscribePayments((remotePayments) => {
      setPayments(remotePayments);
      storageService.savePayments(remotePayments);
      checkAllLoaded('payments');
    });

    return () => {
      clearTimeout(timer);
      unsubYears();
      unsubTx();
      unsubServants();
      unsubPayments();
    };
  }, []);

  // Save changes to localStorage cache as backup
  useEffect(() => {
    storageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storageService.saveServants(servants);
  }, [servants]);

  useEffect(() => {
    storageService.savePayments(payments);
  }, [payments]);

  useEffect(() => {
    storageService.saveYearBudgets(yearBudgets);
  }, [yearBudgets]);

  // Actions
  const addYearBudget = async (year: string, openingBalance: number): Promise<YearBudget> => {
    const normYear = normalizeFiscalYear(year);
    const newBudget: YearBudget = {
      year: normYear,
      openingBalance,
      createdAt: new Date().toISOString(),
      isLocked: true,
    };

    // Optimistic local update
    setYearBudgets((prev) => {
      const filtered = prev.filter((b) => normalizeFiscalYear(b.year) !== normYear);
      const updated = [...filtered, newBudget].sort((a, b) => b.year.localeCompare(a.year));
      storageService.saveYearBudgets(updated);
      return updated;
    });

    // Push to Firestore
    try {
      await firestoreService.setFiscalYear(newBudget);
    } catch (e) {
      console.error('Failed to sync fiscal year to Firestore:', e);
    }

    return newBudget;
  };

  const getYearBudget = (year: string) => {
    const norm = normalizeFiscalYear(year);
    return yearBudgets.find((b) => normalizeFiscalYear(b.year) === norm);
  };

  const addTransaction = async (txData: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    // Optimistic local update
    setTransactions((prev) => [newTx, ...prev]);

    // Push to Firestore
    try {
      await firestoreService.setTransaction(newTx);
    } catch (e) {
      console.error('Failed to sync transaction to Firestore:', e);
    }

    return newTx;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    // Optimistic local update
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    // Also update linked payment if any
    const linkedPayment = payments.find((p) => p.transactionId === id);
    if (linkedPayment) {
      const updatedPay = {
        ...linkedPayment,
        isPaid: false,
        amountPaid: 0,
        paidAt: undefined,
        transactionId: undefined,
      };
      setPayments((prev) => prev.map((p) => (p.id === linkedPayment.id ? updatedPay : p)));
      try {
        await firestoreService.setPayment(updatedPay);
      } catch (e) {
        console.error('Failed to sync payment update to Firestore:', e);
      }
    }

    // Delete from Firestore
    try {
      await firestoreService.deleteTransaction(id);
    } catch (e) {
      console.error('Failed to delete transaction from Firestore:', e);
    }
  };

  const addServant = async (srvData: Omit<Servant, 'id'>): Promise<Servant> => {
    const newServant: Servant = {
      ...srvData,
      id: `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    // Optimistic local update
    setServants((prev) => [...prev, newServant]);

    // Push to Firestore
    try {
      await firestoreService.setServant(newServant);
    } catch (e) {
      console.error('Failed to sync servant to Firestore:', e);
    }

    return newServant;
  };

  const updateServant = async (updated: Servant): Promise<void> => {
    setServants((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await firestoreService.setServant(updated);
    } catch (e) {
      console.error('Failed to update servant in Firestore:', e);
    }
  };

  const deleteServant = async (id: string): Promise<void> => {
    setServants((prev) => prev.filter((s) => s.id !== id));
    
    // Also remove payment records
    const servantPayments = payments.filter((p) => p.servantId === id);
    setPayments((prev) => prev.filter((p) => p.servantId !== id));

    try {
      await firestoreService.deleteServant(id);
      for (const p of servantPayments) {
        await firestoreService.deletePayment(p.id);
      }
    } catch (e) {
      console.error('Failed to delete servant from Firestore:', e);
    }
  };

  const togglePayment = async (servantId: string, monthYear: string, monthLabel?: string): Promise<void> => {
    const servant = servants.find((s) => s.id === servantId);
    if (!servant) return;

    const existingPayment = payments.find(
      (p) => p.servantId === servantId && p.monthYear === monthYear
    );

    if (existingPayment && existingPayment.isPaid) {
      // Toggle to unpaid
      if (existingPayment.transactionId) {
        await deleteTransaction(existingPayment.transactionId);
      }

      const updatedPayment: MonthlyPayment = {
        ...existingPayment,
        isPaid: false,
        amountPaid: 0,
        paidAt: undefined,
        transactionId: undefined,
      };

      setPayments((prev) =>
        prev.map((p) => (p.id === existingPayment.id ? updatedPayment : p))
      );

      try {
        await firestoreService.setPayment(updatedPayment);
      } catch (e) {
        console.error('Failed to update payment in Firestore:', e);
      }
    } else {
      // Toggle to paid: create corresponding income transaction
      const dateToday = new Date().toISOString().split('T')[0];
      const displayMonth = monthLabel || monthYear;

      const newTx = await addTransaction({
        type: 'income',
        amount: servant.monthlyAmount,
        category: 'اشتراكات الخدام',
        description: `اشتراك شهري - ${servant.name} (${displayMonth})`,
        date: dateToday,
        servantId: servant.id,
      });

      const updatedPayment: MonthlyPayment = existingPayment
        ? {
            ...existingPayment,
            isPaid: true,
            amountPaid: servant.monthlyAmount,
            paidAt: new Date().toISOString(),
            transactionId: newTx.id,
          }
        : {
            id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            servantId,
            monthYear,
            amountPaid: servant.monthlyAmount,
            paidAt: new Date().toISOString(),
            isPaid: true,
            transactionId: newTx.id,
          };

      setPayments((prev) => {
        if (existingPayment) {
          return prev.map((p) => (p.id === existingPayment.id ? updatedPayment : p));
        } else {
          return [...prev, updatedPayment];
        }
      });

      try {
        await firestoreService.setPayment(updatedPayment);
      } catch (e) {
        console.error('Failed to create payment in Firestore:', e);
      }
    }
  };

  const setWhatsAppTemplate = (tpl: string) => {
    setWhatsAppTemplateState(tpl);
    storageService.saveWhatsAppTemplate(tpl);
  };

  // Sync Local data to Cloud Firestore in bulk
  const syncLocalToCloud = async () => {
    const localYears = storageService.getYearBudgets();
    const localTxs = storageService.getTransactions();
    const localServants = storageService.getServants();
    const localPayments = storageService.getPayments();

    const result = await firestoreService.syncLocalToCloud({
      years: localYears,
      transactions: localTxs,
      servants: localServants,
      payments: localPayments,
    });

    setIsCloudConnected(true);
    return result;
  };

  const restoreAllData = async (data: {
    transactions: Transaction[];
    servants: Servant[];
    payments: MonthlyPayment[];
    yearBudgets?: YearBudget[];
    whatsappTemplate?: string;
  }) => {
    if (Array.isArray(data.transactions)) {
      setTransactions(data.transactions);
      storageService.saveTransactions(data.transactions);
    }
    if (Array.isArray(data.servants)) {
      setServants(data.servants);
      storageService.saveServants(data.servants);
    }
    if (Array.isArray(data.payments)) {
      setPayments(data.payments);
      storageService.savePayments(data.payments);
    }
    if (Array.isArray(data.yearBudgets)) {
      setYearBudgets(data.yearBudgets);
      storageService.saveYearBudgets(data.yearBudgets);
    }
    if (data.whatsappTemplate) {
      setWhatsAppTemplateState(data.whatsappTemplate);
      storageService.saveWhatsAppTemplate(data.whatsappTemplate);
    }

    // Sync restored data to Firestore
    try {
      await firestoreService.syncLocalToCloud({
        years: data.yearBudgets || yearBudgets,
        transactions: data.transactions,
        servants: data.servants,
        payments: data.payments || [],
      });
    } catch (e) {
      console.error('Failed to sync restored data to Firestore:', e);
    }
  };

  const resetAllData = async () => {
    storageService.resetAll();
    const initTxs = storageService.getTransactions();
    const initServants = storageService.getServants();
    const initPayments = storageService.getPayments();
    const initYears = storageService.getYearBudgets();
    const initTpl = storageService.getWhatsAppTemplate();

    setTransactions(initTxs);
    setServants(initServants);
    setPayments(initPayments);
    setYearBudgets(initYears);
    setWhatsAppTemplateState(initTpl);

    try {
      await firestoreService.clearAllData();
    } catch (e) {
      console.error('Failed to clear data in Firestore:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        transactions,
        servants,
        payments,
        yearBudgets,
        whatsappTemplate,
        isLoading,
        isCloudConnected,
        addTransaction,
        deleteTransaction,
        addServant,
        updateServant,
        deleteServant,
        togglePayment,
        addYearBudget,
        getYearBudget,
        setWhatsAppTemplate,
        syncLocalToCloud,
        restoreAllData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
