import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { 
  X, 
  CalendarPlus, 
  Coins, 
  Lock, 
  AlertCircle,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { normalizeFiscalYear, getSuggestedFiscalYears } from '../utils/fiscalYear';

interface StartYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingYears: string[];
  defaultYear?: string;
  onConfirm: (year: string, openingBalance: number) => void;
}

export const StartYearModal: FC<StartYearModalProps> = ({
  isOpen,
  onClose,
  existingYears,
  defaultYear,
  onConfirm,
}) => {
  const suggestedList = getSuggestedFiscalYears();
  const getInitialYear = () => {
    if (defaultYear) return normalizeFiscalYear(defaultYear);
    // Prefer "2026 / 2027" if not existing, or first uncreated suggested year
    const found = suggestedList.find((sy) => !existingYears.map(normalizeFiscalYear).includes(sy));
    return found || '2026 / 2027';
  };

  const [year, setYear] = useState<string>(getInitialYear);
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setYear(getInitialYear());
      setOpeningBalance('');
      setError('');
    }
  }, [isOpen, defaultYear, existingYears]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedCurrentYear = normalizeFiscalYear(year);
  const isAlreadyCreated = existingYears.map(normalizeFiscalYear).includes(normalizedCurrentYear);
  const presets = [5000, 10000, 15000, 20000, 30000, 50000];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isAlreadyCreated) {
      setError(`سنة ${normalizedCurrentYear} تم بدؤها وميزانيتها مقفلة مسبقاً. اختر سنة أخرى.`);
      return;
    }

    const val = parseFloat(openingBalance);
    if (isNaN(val) || val < 0) {
      setError('يرجى إدخال مبلغ صحيح للرصيد الافتتاحي (0 أو أكثر)');
      return;
    }

    onConfirm(normalizedCurrentYear, val);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-3xl shadow-2xl p-5 sm:p-7 z-10 space-y-6 overflow-hidden transition-colors"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F4554]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 border border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-center shadow-xs">
              <CalendarPlus className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0E242D] dark:text-white">
                بدء سنة مالية جديدة
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] font-medium">
                تحديد المبلغ الأساسي بالصندوق وبدء دورة الميزانية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#1a3442] text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-3.5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-800 dark:text-amber-200">تنبيه هام ومحكم</h4>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
              المبلغ الذي ستدخله هنا هو <strong>الرصيد الافتتاحي الوحيد</strong> للسنة. بمجرد التأكيد، سيتم قفله نهائياً ولا يمكن تعديله لاحقاً لحماية دقة الحسابات.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Year Selection */}
          <div className="bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
              <span>تحديد السنة المالية:</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={year}
                placeholder="مثال: 2026 / 2027"
                onChange={(e) => {
                  setYear(e.target.value);
                  setError('');
                }}
                className="w-full bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0E242D] dark:text-[#F2F6F8] font-mono focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400"
              />
            </div>

            {/* Quick Year Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] ml-1">سنوات مقترحة:</span>
              {suggestedList.map((y) => {
                const isExists = existingYears.map(normalizeFiscalYear).includes(y);
                const isSelected = normalizedCurrentYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setYear(y);
                      setError('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1F4554] text-white border-[#1F4554]'
                        : isExists
                        ? 'bg-[#F2F6F8] dark:bg-[#132731] text-slate-400 dark:text-slate-500 border-[#E2E8F0] dark:border-[#1F4554]/30 line-through opacity-70'
                        : 'bg-white dark:bg-[#0E242D] hover:bg-[#F7F1E8] dark:hover:bg-[#132731] text-[#0E242D] dark:text-[#F2F6F8] border-[#E2E8F0] dark:border-[#1F4554]/30'
                    }`}
                    title={isExists ? `سنة ${y} مسجلة مسبقاً` : `اختيار سنة ${y}`}
                  >
                    {y} {isExists && '🔒'}
                  </button>
                );
              })}
            </div>

            {isAlreadyCreated && (
              <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/50 p-2 rounded-xl border border-amber-300 dark:border-amber-800/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>سنة {normalizedCurrentYear} تم بدؤها بالفعل وميزانيتها مقفلة. يرجى اختيار سنة جديدة.</span>
              </p>
            )}
          </div>

          {/* 2. Opening Balance */}
          <div className="bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8] flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>المبلغ الموجود معي في بداية الميزانية (إجباري):</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold">
                رصيد افتتاحي
              </span>
            </div>

            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
              المبلغ النقدي الأساسي المتوفر في صندوق الخدمة في بداية سنة {normalizedCurrentYear}.
            </p>

            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step="any"
                value={openingBalance}
                onChange={(e) => {
                  setOpeningBalance(e.target.value);
                  setError('');
                }}
                placeholder="أدخل المبلغ الأساسي (مثلاً 30000)"
                className="w-full bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-3 text-lg font-mono font-bold text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-slate-400 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#475569] dark:text-[#94A3B8]">
                ج.م
              </span>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] ml-1">مبالغ سريعة:</span>
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setOpeningBalance(val.toString());
                    setError('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0E242D] hover:bg-[#F7F1E8] dark:hover:bg-[#132731] text-[#0E242D] dark:text-[#F2F6F8] border border-[#E2E8F0] dark:border-[#1F4554]/30 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  {val.toLocaleString('ar-EG')} ج.م
                </button>
              ))}
            </div>

            {error && (
              <p className="text-xs text-[#D12B2C] dark:text-rose-300 flex items-center gap-1.5 mt-2 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-800/40 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1F4554]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#1a3442] text-xs font-bold text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white transition-all cursor-pointer min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isAlreadyCreated || !openingBalance}
              className="px-6 py-2.5 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-[#1F4554]/20 cursor-pointer min-h-[44px] flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تأكيد وبدء السنة 🔒</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
