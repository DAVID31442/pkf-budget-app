import { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Plus, 
  Filter, 
  CalendarDays, 
  Tag, 
  Trash2, 
  Search, 
  Receipt, 
  RotateCcw,
  Calendar,
  CalendarPlus,
  Lock,
  Sparkles,
  Landmark
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { StartYearModal } from '../components/StartYearModal';
import type { TransactionType } from '../types';
import { 
  normalizeFiscalYear, 
  isDateInFiscalYear, 
  getFiscalYearMonths 
} from '../utils/fiscalYear';

export const BudgetPage: FC = () => {
  const { 
    transactions, 
    yearBudgets,
    addTransaction, 
    deleteTransaction, 
    addYearBudget,
    getYearBudget
  } = useApp();
  const { showToast } = useToast();

  // Distinct available years sorted descending
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearBudgets.forEach((b) => yearsSet.add(normalizeFiscalYear(b.year)));
    transactions.forEach((tx) => {
      if (tx.date) {
        const [y, m] = tx.date.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) {
          if (m >= 8) {
            yearsSet.add(`${y} / ${y + 1}`);
          } else {
            yearsSet.add(`${y - 1} / ${y}`);
          }
        }
      }
    });
    if (yearsSet.size === 0) {
      yearsSet.add('2026 / 2027');
    }
    return Array.from(yearsSet).sort().reverse();
  }, [yearBudgets, transactions]);

  // Selected Year (defaults to latest available year or 2026 / 2027)
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return availableYears[0] || '2026 / 2027';
  });

  // Sync selectedYear if availableYears changes and current selection is not included
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Filters State
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState<boolean>(false);
  const [isStartYearModalOpen, setIsStartYearModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active Year Budget
  const currentYearBudget = getYearBudget(selectedYear);
  const openingBalance = currentYearBudget ? currentYearBudget.openingBalance : 0;
  const isYearConfigured = !!currentYearBudget;

  // Format month for display in Arabic
  const formatMonthLabel = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(date);
    } catch {
      return monthStr;
    }
  };

  // Available months with labels in selected fiscal year cycle
  const availableMonthsInYear = useMemo(() => {
    const standardMonths = getFiscalYearMonths(selectedYear);
    const monthsMap = new Map<string, string>();
    standardMonths.forEach((sm) => monthsMap.set(sm.value, sm.label));

    // Also include any other months from transactions falling in this fiscal year
    transactions.forEach((tx) => {
      if (tx.date && isDateInFiscalYear(tx.date, selectedYear)) {
        const ym = tx.date.substring(0, 7);
        if (!monthsMap.has(ym)) {
          monthsMap.set(ym, formatMonthLabel(ym));
        }
      }
    });

    return Array.from(monthsMap.entries()).map(([value, label]) => ({ value, label }));
  }, [transactions, selectedYear]);

  // Filter transactions for current year, month, type, and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!isDateInFiscalYear(tx.date, selectedYear)) {
        return false;
      }
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) {
        return false;
      }
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [transactions, selectedYear, selectedMonth, typeFilter, searchQuery]);

  // Compute Totals & Exact Net Balance
  const stats = useMemo(() => {
    const baseTx = transactions.filter((tx) => {
      if (!isDateInFiscalYear(tx.date, selectedYear)) return false;
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
      return true;
    });

    const totalIncome = baseTx
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpense = baseTx
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netBalance = openingBalance + totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netBalance,
    };
  }, [transactions, selectedYear, selectedMonth, openingBalance]);

  // Handlers
  const handleAddTransaction = (data: Parameters<typeof addTransaction>[0]) => {
    addTransaction(data);
    showToast(
      `تمت إضافة ${data.type === 'income' ? 'إيراد' : 'مصروف'} بمبلغ ${data.amount.toLocaleString('ar-EG')} ج.م بنجاح`,
      'success'
    );
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeletingId(null);
    showToast('تم حذف الحركة المالية وتحديث الرصيد', 'info');
  };

  const handleConfirmStartYear = (year: string, balance: number) => {
    addYearBudget(year, balance);
    setSelectedYear(year);
    setSelectedMonth('all');
    showToast(`تم بدء سنة ${year} بميزانية افتتاحية ${balance.toLocaleString('ar-EG')} ج.م وقفلها نهائياً 🔒`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. Top Control Bar: Year Selector & Start New Year ================= */}
      <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        {/* Right side: Year Selector & + New Year Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector Dropdown */}
          <div className="flex items-center gap-2 bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-3.5 py-2 min-h-[44px]">
            <Calendar className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth('all');
              }}
              className="bg-transparent text-[#0E242D] dark:text-[#F2F6F8] font-bold text-xs focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">
                  سنة {y} المالية
                </option>
              ))}
            </select>
          </div>

          {/* + Start New Year Button (Secondary / Outline Button as per Design System) */}
          <button
            type="button"
            onClick={() => setIsStartYearModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#1a3442] border border-[#1F4554]/20 dark:border-[#1F4554]/40 text-xs font-bold text-[#1F4554] dark:text-cyan-200 transition-all cursor-pointer min-h-[44px]"
            title="بدء سنة مالية جديدة وتحديد الرصيد الافتتاحي"
          >
            <CalendarPlus className="w-4 h-4 text-[#1F4554] dark:text-cyan-300 stroke-[2.2]" />
            <span>+ بدء سنة جديدة</span>
          </button>
        </div>

        {/* Left side: Locked Status Indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {isYearConfigured ? (
            <div className="flex items-center gap-2 bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 px-3.5 py-2 rounded-xl min-h-[44px]">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8]">
                ميزانية سنة {selectedYear} مثبتة ومقفلة 🔒
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsStartYearModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>اضغط لتحديد الرصيد الافتتاحي لسنة {selectedYear}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if the year has no opening budget yet */}
      {!isYearConfigured && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-800 dark:text-amber-200">
                سنة {selectedYear} لم يتم تحديد رصيدها الافتتاحي بعد
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                يرجى الضغط على زر بدء السنة لتسجيل المبلغ الموجود معك في بداية الميزانية وتثبيته.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsStartYearModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[40px]"
          >
            بدء سنة {selectedYear} الآن
          </button>
        </div>
      )}

      {/* ================= 2. Bento Grid: 4 Equal KPI Cards (PKF WEB Rules) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 (Right): الميزانية الافتتاحية (Amber Highlight) */}
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xs hover:border-amber-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                الميزانية الافتتاحية
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-500 tracking-tight font-mono">
                {openingBalance.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">ج.م</span>
            </div>
          </div>

          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1F4554]/30 truncate flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>رصيد بداية سنة {selectedYear} (مثبت 🔒)</span>
          </p>
        </div>

        {/* Card 2: إجمالي الداخل (الإيرادات) (Emerald Success) */}
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xs hover:border-emerald-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                إجمالي الداخل (الإيرادات)
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#10B981] tracking-tight font-mono">
                +{stats.totalIncome.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">ج.م</span>
            </div>
          </div>

          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1F4554]/30 truncate">
            {selectedMonth === 'all'
              ? `إجمالي إيرادات سنة ${selectedYear}`
              : `إيرادات شهر ${formatMonthLabel(selectedMonth)}`}
          </p>
        </div>

        {/* Card 3: إجمالي الخارج (المصروفات) (Crimson / Danger #D12B2C) */}
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xs hover:border-rose-400">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D12B2C]"></span>
                إجمالي الخارج (المصروفات)
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#D12B2C] border border-rose-200 dark:border-rose-800/40 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#D12B2C] tracking-tight font-mono">
                -{stats.totalExpense.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">ج.م</span>
            </div>
          </div>

          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1F4554]/30 truncate">
            {selectedMonth === 'all'
              ? `إجمالي مصروفات سنة ${selectedYear}`
              : `مصروفات شهر ${formatMonthLabel(selectedMonth)}`}
          </p>
        </div>

        {/* Card 4 (Left): الرصيد الصافي الحالي (Hero Dark Card #0E242D as per Design System) */}
        <div className="bg-[#0E242D] dark:bg-gradient-to-br dark:from-[#132c37] dark:to-[#0a1820] border border-[#1F4554] dark:border-[#2a5c70] rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-[#0E242D]/20 transition-all duration-300 group flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/90 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse"></span>
                الرصيد الصافي الحالي
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#1F4554] text-white flex items-center justify-center shadow-inner shrink-0">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {stats.netBalance.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-white/80">ج.م</span>
            </div>
          </div>

          <p className="text-[11px] text-white/85 mt-3 pt-2 border-t border-white/10 truncate font-medium">
            الرصيد الفعلي المتاح حالياً بالصندوق
          </p>
        </div>
      </div>

      {/* ================= 3. Action Bar & Quick Filters ================= */}
      <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-4 shadow-xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الوصف أو التصنيف..."
              className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl pr-10 pl-4 py-2.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-[#475569] dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors min-h-[44px]"
            />
          </div>

          {/* Primary CTA: Add Transaction Button (Primary Petrol #1F4554 as per Section 3) */}
          <button
            type="button"
            onClick={() => setIsAddTxModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white font-bold text-xs shadow-md shadow-[#1F4554]/20 transition-all cursor-pointer shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>إضافة حركة جديدة</span>
          </button>
        </div>

        {/* Quick Filter Controls: Type + Month within the Year */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1F4554]/30">
          {/* Segmented Type Filter */}
          <div className="flex items-center gap-1 bg-[#F2F6F8] dark:bg-[#081318] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#1F4554]/30">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                typeFilter === 'all'
                  ? 'bg-[#1F4554] text-white shadow-xs'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white'
              }`}
            >
              الكل ({filteredTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                typeFilter === 'income'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#10B981]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#10B981]" />
              <span>الداخل فقط</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                typeFilter === 'expense'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-[#D12B2C] dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#D12B2C]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D12B2C]" />
              <span>الخارج فقط</span>
            </button>
          </div>

          {/* Month Selector Filter within Selected Year */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 text-[#0E242D] dark:text-[#F2F6F8] text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 cursor-pointer min-h-[40px]"
            >
              <option value="all" className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">جميع شهور سنة {selectedYear}</option>
              {availableMonthsInYear.map((m) => (
                <option key={m.value} value={m.value} className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= 4. Transactions List ================= */}
      <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl overflow-hidden shadow-xs transition-colors">
        {/* Table Header in Warm Beige #F7F1E8 as per Section 1 */}
        <div className="p-4 sm:p-5 bg-[#F7F1E8] dark:bg-[#132731] border-b border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
            <h3 className="text-sm sm:text-base font-bold text-[#0E242D] dark:text-white">
              سجل حركات سنة {selectedYear}
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0E242D] text-[#1F4554] dark:text-cyan-200 font-mono font-bold border border-[#E2E8F0] dark:border-[#1F4554]/30">
              {filteredTransactions.length}
            </span>
          </div>

          {(typeFilter !== 'all' || selectedMonth !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setSelectedMonth('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1 text-xs text-[#1F4554] dark:text-cyan-300 hover:text-[#0E242D] dark:hover:text-white font-bold cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-14 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-300 flex items-center justify-center mx-auto border border-[#E2E8F0] dark:border-[#1F4554]/30">
              <Receipt className="w-6 h-6 opacity-60" />
            </div>
            <h4 className="text-sm font-bold text-[#0E242D] dark:text-white">لا توجد حركات مسجلة لسنة {selectedYear}</h4>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] max-w-sm mx-auto">
              لم نجد أي حركات مالية مطابقة لسنة {selectedYear} أو الفلاتر المحددة.
            </p>
            <button
              type="button"
              onClick={() => setIsAddTxModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white text-xs font-bold transition-all cursor-pointer min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل حركة جديدة</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1F4554]/30">
            {filteredTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F2F6F8]/60 dark:hover:bg-[#132731]/60 transition-colors group"
              >
                {/* Right side: Icon + Description + Category + Date */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] border border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-[#D12B2C] border border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#0E242D] dark:text-[#F2F6F8] truncate">
                        {tx.description}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 font-semibold border border-[#E2E8F0] dark:border-[#1F4554]/30 shrink-0">
                        <Tag className="w-2.5 h-2.5 text-[#475569] dark:text-[#94A3B8]" />
                        {tx.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {tx.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left side: Amount + Delete button */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8F0] dark:border-[#1F4554]/30">
                  <div className="text-right sm:text-left">
                    <div 
                      className={`text-base font-bold font-mono ${
                        tx.type === 'income' ? 'text-[#10B981]' : 'text-[#D12B2C]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString('ar-EG')} ج.م
                    </div>
                    <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] font-medium block">
                      {tx.type === 'income' ? 'إيداع وارد' : 'صرف منصرف'}
                    </span>
                  </div>

                  {/* Delete Button with confirmation state */}
                  {deletingId === tx.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        className="px-2.5 py-1.5 bg-[#D12B2C] text-white text-[11px] font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer min-h-[36px]"
                      >
                        تأكيد
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1.5 text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white text-[11px] rounded-lg transition-colors cursor-pointer min-h-[36px]"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(tx.id)}
                      title="حذف الحركة"
                      aria-label="حذف الحركة"
                      className="w-10 h-10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[#D12B2C] hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 cursor-pointer min-h-[44px] min-w-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 5. Modals ================= */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      <StartYearModal
        isOpen={isStartYearModalOpen}
        onClose={() => setIsStartYearModalOpen(false)}
        existingYears={yearBudgets.map((b) => b.year)}
        defaultYear={selectedYear}
        onConfirm={handleConfirmStartYear}
      />
    </div>
  );
};
