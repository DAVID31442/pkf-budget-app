import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Plus, 
  Search, 
  AlertCircle, 
  Coins,
  MessageCircle,
  Calendar,
  Settings,
  Trash2,
  Check,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { AddServantModal } from '../components/AddServantModal';
import { WhatsAppTemplateModal } from '../components/WhatsAppTemplateModal';
import { formatEgyptianPhoneForWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';

export const ServantsPage: FC = () => {
  const { 
    servants, 
    payments, 
    addServant, 
    deleteServant, 
    togglePayment, 
    whatsappTemplate, 
    setWhatsAppTemplate 
  } = useApp();
  const { showToast } = useToast();

  // Active Month (Default current month format YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [deletingServantId, setDeletingServantId] = useState<string | null>(null);

  // Helper for formatting month in Arabic
  const formatMonthLabel = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(date);
    } catch {
      return monthStr;
    }
  };

  const currentMonthLabel = formatMonthLabel(selectedMonth);

  // Pre-generate recent and upcoming months list for the picker
  const monthOptions = useMemo(() => {
    const list: string[] = [];
    const baseDate = new Date(2026, 9, 1); // 2026-10
    for (let i = -6; i <= 6; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      list.push(`${y}-${m}`);
    }
    return list;
  }, []);

  // Compute payment status for each servant in the selected month
  const servantsWithStatus = useMemo(() => {
    return servants.map((srv) => {
      const payment = payments.find(
        (p) => p.servantId === srv.id && p.monthYear === selectedMonth
      );
      const isPaid = payment?.isPaid ?? false;
      return {
        ...srv,
        payment,
        isPaid,
      };
    });
  }, [servants, payments, selectedMonth]);

  // Filtered servants based on search and status
  const filteredServants = useMemo(() => {
    return servantsWithStatus.filter((srv) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = srv.name.toLowerCase().includes(query);
        const matchesPhone = srv.phone.includes(query);
        if (!matchesName && !matchesPhone) return false;
      }

      if (statusFilter === 'paid' && !srv.isPaid) return false;
      if (statusFilter === 'unpaid' && srv.isPaid) return false;

      return true;
    });
  }, [servantsWithStatus, searchQuery, statusFilter]);

  // Quick stats for selected month
  const stats = useMemo(() => {
    const totalServants = servants.length;
    const paidCount = servantsWithStatus.filter((s) => s.isPaid).length;
    const unpaidCount = totalServants - paidCount;
    const collectedAmount = servantsWithStatus
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + s.monthlyAmount, 0);
    const totalTarget = servants.reduce((sum, s) => sum + s.monthlyAmount, 0);
    const percentage = totalServants > 0 ? Math.round((paidCount / totalServants) * 100) : 0;

    return {
      totalServants,
      paidCount,
      unpaidCount,
      collectedAmount,
      totalTarget,
      percentage,
    };
  }, [servants, servantsWithStatus]);

  // Toggle payment handler with automatic Toast
  const handleTogglePayment = (servant: typeof servantsWithStatus[0]) => {
    const newStatus = !servant.isPaid;
    togglePayment(servant.id, selectedMonth);

    if (newStatus) {
      showToast(
        `تم تسجيل سداد اشتراك الخادم (${servant.name}) لشهر ${currentMonthLabel} وإيداعه بالميزانية 🎉`,
        'success'
      );
    } else {
      showToast(
        `تم إلغاء سداد اشتراك الخادم (${servant.name}) وخصمه من الميزانية`,
        'info'
      );
    }
  };

  const handleAddServant = (data: Parameters<typeof addServant>[0]) => {
    addServant(data);
    showToast(`تمت إضافة الخادم (${data.name}) بنجاح`, 'success');
  };

  const handleDeleteServant = (id: string, name: string) => {
    deleteServant(id);
    setDeletingServantId(null);
    showToast(`تم حذف الخادم (${name}) وسجلاته`, 'info');
  };

  // WhatsApp Reminder handler
  const handleSendWhatsApp = (servant: typeof servantsWithStatus[0]) => {
    const formattedPhone = formatEgyptianPhoneForWhatsApp(servant.phone);
    const message = generateWhatsAppMessage(whatsappTemplate, {
      name: servant.name,
      month: currentMonthLabel,
      amount: servant.monthlyAmount,
    });

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`تم فتح محادثة واتساب مع الخادم (${servant.name})`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. Top Month Control & Quick Stats ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Month Selector & Target Card */}
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1F4554] dark:text-cyan-300" />
              تحديد شهر المتابعة
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#1F4554] dark:text-cyan-200 font-bold px-2.5 py-0.5 rounded-full bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30">
              {currentMonthLabel}
            </div>
          </div>

          <div className="relative mt-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 text-[#0E242D] dark:text-[#F2F6F8] font-bold text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 cursor-pointer transition-colors min-h-[44px]"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">
                  شهر {formatMonthLabel(m)} ({m})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-between text-xs text-[#475569] dark:text-[#94A3B8]">
            <span>المستهدف الكامل للشهر:</span>
            <span className="font-bold text-[#0E242D] dark:text-white font-mono text-sm">
              {stats.totalTarget.toLocaleString('ar-EG')} ج.م
            </span>
          </div>
        </div>

        {/* Stats Card: Paid vs Total */}
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">حالة السداد للشهر</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#10B981] font-mono">
              {stats.paidCount}
            </span>
            <span className="text-sm font-semibold text-[#475569] dark:text-[#94A3B8]">/ {stats.totalServants} خادم</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#10B981] h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#475569] dark:text-[#94A3B8] pt-0.5 font-medium">
              <span>نسبة الإنجاز: {stats.percentage}%</span>
              <span>متبقي: {stats.unpaidCount}</span>
            </div>
          </div>
        </div>

        {/* Stats Card: Collected Amount */}
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#475569] dark:text-[#94A3B8]">المحصل الفعلي (هذا الشهر)</span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 border border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-center shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F4554] dark:text-cyan-300 font-mono">
              {stats.collectedAmount.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">ج.م</span>
          </div>
          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-3 flex items-center gap-1">
            <span>متوقع تحصيل متبقي:</span>
            <span className="text-amber-500 font-bold font-mono">
              {(stats.totalTarget - stats.collectedAmount).toLocaleString('ar-EG')} ج.م
            </span>
          </p>
        </div>
      </div>

      {/* ================= 2. Search, Badges & Action Bar ================= */}
      <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-4 shadow-xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الخادم أو رقم الهاتف..."
              className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-xl pr-10 pl-4 py-2.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] placeholder:text-[#475569] dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 transition-colors min-h-[44px]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              title="تعديل قالب رسالة الواتساب"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#1a3442] border border-[#1F4554]/15 dark:border-[#1F4554]/40 text-xs font-bold text-[#1F4554] dark:text-cyan-200 transition-colors cursor-pointer min-h-[44px]"
            >
              <Settings className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
              <span className="hidden sm:inline">قالب الواتساب</span>
            </button>

            {/* Primary CTA: Add Servant Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white font-bold text-xs shadow-md shadow-[#1F4554]/20 transition-all cursor-pointer shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة خادم جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1F4554]/30">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                statusFilter === 'all'
                  ? 'bg-[#1F4554] text-white shadow-xs'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#F7F1E8] dark:hover:bg-[#132731]'
              }`}
            >
              الكل ({servants.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('unpaid')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                statusFilter === 'unpaid'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-amber-600'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>لم يدفع ⚠️ ({stats.unpaidCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                statusFilter === 'paid'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#10B981]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>تم الدفع ✅ ({stats.paidCount})</span>
            </button>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-[#1F4554] dark:text-cyan-300 hover:text-[#0E242D] dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer min-h-[40px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء الفلتر</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 3. Servants Responsive Cards / List ================= */}
      {filteredServants.length === 0 ? (
        <div className="bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl text-center py-14 px-4 space-y-3 shadow-xs transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 flex items-center justify-center mx-auto border border-[#E2E8F0] dark:border-[#1F4554]/30">
            <Users className="w-6 h-6 opacity-60" />
          </div>
          <h4 className="text-sm font-bold text-[#0E242D] dark:text-white">لا يوجد خدام مطابقين للبحث</h4>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8] max-w-sm mx-auto">
            لم نجد نتائج مطابقة لبحثك أو الفلاتر المختارة لهذا الشهر.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل خادم جديد</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServants.map((servant) => {
            const isPaid = servant.isPaid;
            const paidAtDate = servant.payment?.paidAt;

            return (
              <div
                key={servant.id}
                className={`border rounded-2xl p-5 transition-all group flex flex-col justify-between shadow-xs ${
                  isPaid
                    ? 'bg-white dark:bg-[#0E242D] border-[#E2E8F0] dark:border-[#1F4554]/30 hover:border-emerald-300 dark:hover:border-emerald-500/50'
                    : 'border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-[#0E242D] hover:border-amber-300 dark:hover:border-amber-500/50'
                }`}
              >
                <div>
                  {/* Card Top: Avatar, Name, Phone & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-center text-[#1F4554] dark:text-cyan-200 font-extrabold text-base shrink-0 shadow-xs">
                        {servant.name.split(' ')[0]?.[0]} {servant.name.split(' ')[1]?.[0] || ''}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-[#0E242D] dark:text-[#F2F6F8] group-hover:text-[#1F4554] dark:group-hover:text-cyan-300 transition-colors truncate">
                          {servant.name}
                        </h4>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8] flex items-center gap-1.5" dir="ltr">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="font-mono">{servant.phone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Payment Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                        isPaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981] border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم الدفع</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>لم يدفع بعد</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Monthly Amount & Paid Info */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-[#475569] dark:text-[#94A3B8] block">قيمة الشهرية</span>
                      <span className="text-sm font-extrabold text-[#0E242D] dark:text-[#F2F6F8] font-mono">
                        {servant.monthlyAmount} ج.م
                      </span>
                    </div>

                    <div className="text-left">
                      {isPaid ? (
                        <div className="text-[11px] text-[#10B981] font-bold">
                          سُددت بتاريخ: {paidAtDate || 'هذا الشهر'}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                          مستحقة لشهر {currentMonthLabel}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Toggle Payment Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(servant)}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                        isPaid
                          ? 'bg-[#F7F1E8] dark:bg-[#132731] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#475569] dark:text-[#94A3B8] hover:text-[#D12B2C] dark:hover:text-rose-400 border border-[#E2E8F0] dark:border-[#1F4554]/30'
                          : 'bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white shadow-sm'
                      }`}
                      title={isPaid ? 'اضغط لإلغاء حالة السداد' : 'اضغط لتسجيل السداد وإضافته للميزانية'}
                    >
                      {isPaid ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[2.5]" />
                          <span>مسدد (إلغاء؟)</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>تسجيل السداد</span>
                        </>
                      )}
                    </button>

                    {/* WhatsApp Button (Semantic Success Green as per Section 5) */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(servant)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-[#10B981] text-[#10B981] hover:text-white border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold transition-all cursor-pointer min-h-[44px]"
                      title="إرسال رسالة تذكير عبر واتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">واتساب</span>
                    </button>
                  </div>

                  {/* Delete Servant Button with confirmation */}
                  {deletingServantId === servant.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-xl border border-rose-200 dark:border-rose-800/40 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteServant(servant.id, servant.name)}
                        className="px-2.5 py-1.5 bg-[#D12B2C] text-white text-[11px] font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer min-h-[36px]"
                      >
                        تأكيد
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingServantId(null)}
                        className="px-2.5 py-1.5 text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white text-[11px] rounded-lg transition-colors cursor-pointer min-h-[36px]"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingServantId(servant.id)}
                      title="حذف الخادم"
                      aria-label="حذف الخادم"
                      className="w-10 h-10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[#D12B2C] hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 min-h-[44px] min-w-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= Modals ================= */}
      <AddServantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddServant}
      />

      <WhatsAppTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        currentTemplate={whatsappTemplate}
        onSave={(tpl) => {
          setWhatsAppTemplate(tpl);
          showToast('تم حفظ قالب رسالة الواتساب بنجاح', 'success');
        }}
      />
    </div>
  );
};
