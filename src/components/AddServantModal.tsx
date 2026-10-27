import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { X, UserPlus, Phone, Coins, User } from 'lucide-react';

interface AddServantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    phone: string;
    monthlyAmount: number;
    joinedDate: string;
    isActive: boolean;
  }) => void;
}

export const AddServantModal: FC<AddServantModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [monthlyAmount, setMonthlyAmount] = useState<string>('200');
  const [error, setError] = useState<string>('');

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('يرجى إدخال اسم الخادم');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('يرجى إدخال رقم هاتف مصري صحيح (مثال: 01xxxxxxxxx)');
      return;
    }

    const amount = parseFloat(monthlyAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('يرجى إدخال قيمة شهرية صحيحة أكبر من الصفر');
      return;
    }

    onAdd({
      name: name.trim(),
      phone: phone.trim(),
      monthlyAmount: amount,
      joinedDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });

    setName('');
    setPhone('');
    setMonthlyAmount('200');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="servant-modal-title"
        className="relative w-full max-w-md bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-3xl shadow-2xl p-6 sm:p-7 z-10 space-y-6 overflow-hidden transition-colors"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F4554]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 border border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="servant-modal-title" className="text-base sm:text-lg font-bold text-[#0E242D] dark:text-white">
                إضافة خادم جديد
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">سجل بيانات الخادم ومبلغ الاشتراك الشهري</p>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="srv-name" className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1F4554] dark:text-cyan-300" />
              <span>اسم الخادم بالكامل</span>
            </label>
            <input
              id="srv-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: بيشوي مرقس حبيب"
              className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-2.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-slate-400 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Egyptian Phone Number */}
          <div className="space-y-1.5">
            <label htmlFor="srv-phone" className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1F4554] dark:text-cyan-300" />
                <span>رقم الموبايل (واتساب)</span>
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">رقم مصري</span>
            </label>
            <input
              id="srv-phone"
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError('');
              }}
              placeholder="01xxxxxxxxx"
              className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-2.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-slate-400 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors font-mono text-left"
            />
          </div>

          {/* Monthly Amount */}
          <div className="space-y-1.5">
            <label htmlFor="srv-amount" className="text-xs font-bold text-[#0E242D] dark:text-[#F2F6F8] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#1F4554] dark:text-cyan-300" />
                <span>قيمة الاشتراك الشهري الافتراضية</span>
              </span>
              <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">ج.م</span>
            </label>
            <div className="relative">
              <input
                id="srv-amount"
                type="number"
                step="any"
                min="10"
                required
                value={monthlyAmount}
                onChange={(e) => {
                  setMonthlyAmount(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl px-4 py-2.5 pl-12 text-sm font-bold text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-slate-400 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors font-mono"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#475569] dark:text-[#94A3B8] pointer-events-none">
                ج.م
              </span>
            </div>
          </div>

          {/* Error Message */}
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-[#1F4554]/20"
            >
              إضافة الخادم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
