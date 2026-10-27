import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';
import type { YearBudget, Transaction, Servant, MonthlyPayment } from '../types';
import { normalizeFiscalYear, toFirestoreFiscalYearId } from '../utils/fiscalYear';

export const firestoreService = {
  // ================= 1. Real-time Subscriptions =================

  // Subscribe to Fiscal Years
  subscribeFiscalYears(onUpdate: (years: YearBudget[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const colRef = collection(db, COLLECTIONS.FISCAL_YEARS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const years: YearBudget[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          years.push({
            year: normalizeFiscalYear(raw.year || docSnap.id),
            openingBalance: typeof raw.openingBalance === 'number' ? raw.openingBalance : 0,
            createdAt: raw.createdAt || new Date().toISOString(),
            isLocked: raw.isLocked ?? true,
          });
        });
        years.sort((a, b) => b.year.localeCompare(a.year));
        onUpdate(years);
      },
      (err) => {
        console.error('Firestore fiscal_years listener error:', err);
        onError?.(err);
      }
    );
  },

  // Subscribe to Transactions (ordered by date desc)
  subscribeTransactions(onUpdate: (txs: Transaction[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const colRef = collection(db, COLLECTIONS.TRANSACTIONS);
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          txs.push(docSnap.data() as Transaction);
        });
        onUpdate(txs);
      },
      (err) => {
        console.error('Firestore transactions listener error:', err);
        // Fallback without orderBy if index is building
        onSnapshot(colRef, (snap) => {
          const list: Transaction[] = [];
          snap.forEach((d) => list.push(d.data() as Transaction));
          list.sort((a, b) => b.date.localeCompare(a.date));
          onUpdate(list);
        });
        onError?.(err);
      }
    );
  },

  // Subscribe to Servants (ordered by name)
  subscribeServants(onUpdate: (servants: Servant[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const colRef = collection(db, COLLECTIONS.SERVANTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const servants: Servant[] = [];
        snapshot.forEach((docSnap) => {
          servants.push(docSnap.data() as Servant);
        });
        servants.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        onUpdate(servants);
      },
      (err) => {
        console.error('Firestore servants listener error:', err);
        onError?.(err);
      }
    );
  },

  // Subscribe to Monthly Payments
  subscribePayments(onUpdate: (payments: MonthlyPayment[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const colRef = collection(db, COLLECTIONS.MONTHLY_PAYMENTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const payments: MonthlyPayment[] = [];
        snapshot.forEach((docSnap) => {
          payments.push(docSnap.data() as MonthlyPayment);
        });
        onUpdate(payments);
      },
      (err) => {
        console.error('Firestore monthly_payments listener error:', err);
        onError?.(err);
      }
    );
  },

  // ================= 2. Mutation Operations =================

  // Save / Update Fiscal Year
  async setFiscalYear(yearBudget: YearBudget): Promise<void> {
    const normYear = normalizeFiscalYear(yearBudget.year);
    const docId = toFirestoreFiscalYearId(normYear);
    const docRef = doc(db, COLLECTIONS.FISCAL_YEARS, docId);
    await setDoc(docRef, {
      ...yearBudget,
      year: normYear,
    }, { merge: true });
  },

  // Save / Update Transaction
  async setTransaction(tx: Transaction): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, tx.id);
    await setDoc(docRef, tx, { merge: true });
  },

  // Delete Transaction
  async deleteTransaction(txId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, txId);
    await deleteDoc(docRef);
  },

  // Save / Update Servant
  async setServant(servant: Servant): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SERVANTS, servant.id);
    await setDoc(docRef, servant, { merge: true });
  },

  // Delete Servant
  async deleteServant(servantId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SERVANTS, servantId);
    await deleteDoc(docRef);
  },

  // Save / Update Payment
  async setPayment(payment: MonthlyPayment): Promise<void> {
    const docRef = doc(db, COLLECTIONS.MONTHLY_PAYMENTS, payment.id);
    await setDoc(docRef, payment, { merge: true });
  },

  // Delete Payment
  async deletePayment(paymentId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.MONTHLY_PAYMENTS, paymentId);
    await deleteDoc(docRef);
  },

  // ================= 3. Bulk Sync Local to Cloud =================

  async syncLocalToCloud(localData: {
    years: YearBudget[];
    transactions: Transaction[];
    servants: Servant[];
    payments: MonthlyPayment[];
  }): Promise<{ yearsCount: number; txCount: number; servantsCount: number; paymentsCount: number }> {
    const batch = writeBatch(db);

    // 1. Fiscal Years
    localData.years.forEach((yb) => {
      const normYear = normalizeFiscalYear(yb.year);
      const docId = toFirestoreFiscalYearId(normYear);
      const docRef = doc(db, COLLECTIONS.FISCAL_YEARS, docId);
      batch.set(docRef, { ...yb, year: normYear }, { merge: true });
    });

    // 2. Transactions
    localData.transactions.forEach((tx) => {
      const docRef = doc(db, COLLECTIONS.TRANSACTIONS, tx.id);
      batch.set(docRef, tx, { merge: true });
    });

    // 3. Servants
    localData.servants.forEach((s) => {
      const docRef = doc(db, COLLECTIONS.SERVANTS, s.id);
      batch.set(docRef, s, { merge: true });
    });

    // 4. Monthly Payments
    localData.payments.forEach((p) => {
      const docRef = doc(db, COLLECTIONS.MONTHLY_PAYMENTS, p.id);
      batch.set(docRef, p, { merge: true });
    });

    // Commit batch
    await batch.commit();

    return {
      yearsCount: localData.years.length,
      txCount: localData.transactions.length,
      servantsCount: localData.servants.length,
      paymentsCount: localData.payments.length,
    };
  },

  // Clear all remote collections in Firestore
  async clearAllData(): Promise<void> {
    const batch = writeBatch(db);
    const collectionsToClear = [
      COLLECTIONS.FISCAL_YEARS,
      COLLECTIONS.TRANSACTIONS,
      COLLECTIONS.SERVANTS,
      COLLECTIONS.MONTHLY_PAYMENTS
    ];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      snap.forEach((d) => batch.delete(d.ref));
    }
    await batch.commit();
  }
};
