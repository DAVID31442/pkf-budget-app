import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt 
} from 'lucide-react';
import type { TransactionType } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => void;
}

const COMMON_INCOME_CATEGORIES = [
  'اشتراكات الخدام',
  'تبرعات عامة',
  'إيراد معرض/نشاط',
  'مساهمات خاصة',
  'أخرى',
];

const COMMON_EXPENSE_CATEGORIES = [
  'مطبوعات ووسائل',
  'ضيافة واستقبال',
  'مساعدات وافتقاد',
  'أنشطة ورحلات',
  'صيانة وتجهيزات',
  'أخرى',
];

export const AddTransactionModal: FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('اشتراكات الخدام');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (type === 'income') {
      setCategory('اشتراكات الخدام');
    } else {
      setCategory('مطبوعات ووسائل');
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (!description.trim()) {
      setError('يرجى كتابة وصف أو بيان للحركة');
      return;
    }

    onAdd({
      type,
      amount: numAmount,
      category,
      description: description.trim(),
      date,
    });

    setAmount('');
    setDescription('');
    setError('');
    onClose();
  };

  const activeCategories = type === 'income' ? COMMON_INCOME_CATEGORIES : COMMON_EXPENSE_CATEGORIES;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Glow Header Accent: Emerald for income, Crimson for expense */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1.5 transition-colors ${
            type === 'income' ? 'bg-[#10B981]' : 'bg-[#D12B2C]'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                type === 'income' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] border border-emerald-200 dark:border-emerald-800/40' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-[#D12B2C] border border-rose-200 dark:border-rose-800/40'
              }`}
            >
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base sm:text-lg font-bold text-[#0E242D] dark:text-white">
                إضافة حركة مالية جديدة
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">سجل الإيرادات والمصروفات بدقة في الميزانية</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#1a3442] text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8]">نوع الحركة</label>
            <div className="grid grid-cols-2 gap-2 bg-[#F2F6F8] dark:bg-[#081318] p-1.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1F4554]/30">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>داخل (إيراد)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#D12B2C] text-white shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#D12B2C]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>خارج (مصروف)</span>
              </button>
            </div>
          </div>

          {/* 2. Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor="tx-amount" className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8] flex items-center justify-between">
              <span>المبلغ</span>
              <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] font-normal">بالجنيه المصري (ج.م)</span>
            </label>
            <div className="relative">
              <input
                id="tx-amount"
                type="number"
                step="any"
                min="0.1"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                placeholder="0.00"
                className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-3 pl-12 text-lg font-bold text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-slate-400 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors font-mono"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#475569] dark:text-[#94A3B8] pointer-events-none">
                ج.م
              </span>
            </div>
          </div>

          {/* 3. Description Input */}
          <div className="space-y-1.5">
            <label htmlFor="tx-desc" className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8]">
              الوصف أو البيان
            </label>
            <div className="relative">
              <input
                id="tx-desc"
                type="text"
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError('');
                }}
                placeholder="مثال: تبرع أنشطة، طباعة ملازم، ضيافة..."
                className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-2.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-slate-400 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* 4. Category with quick tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8]">التصنيف</label>
            <div className="flex flex-wrap gap-1.5">
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                    category === cat
                      ? type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-[#D12B2C] dark:text-rose-300 border-rose-300 dark:border-rose-700'
                      : 'bg-[#F2F6F8] dark:bg-[#081318] text-[#475569] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#1F4554]/30 hover:bg-[#F7F1E8] dark:hover:bg-[#132731] hover:text-[#0E242D] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Date Input */}
          <div className="space-y-1.5">
            <label htmlFor="tx-date" className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8]">التاريخ</label>
            <div className="relative">
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-2.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[#D12B2C] dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1F4554]/30">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#1a3442] text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white shadow-[#1F4554]/20'
              }`}
            >
              حفظ الحركة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
