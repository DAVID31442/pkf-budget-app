import { useState, useRef } from 'react';
import type { FC, ChangeEvent } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck, 
  Database, 
  AlertTriangle, 
  CloudUpload, 
  Loader2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { exportBackupJSON, exportMonthCSV } from '../utils/exportImport';
import type { BackupData } from '../utils/exportImport';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagementModal: FC<DataManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    transactions, 
    servants, 
    payments, 
    yearBudgets, 
    whatsappTemplate, 
    syncLocalToCloud, 
    restoreAllData, 
    resetAllData 
  } = useApp();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  if (!isOpen) return null;

  // Cloud Sync Handler
  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLocalToCloud();
      showToast(
        `تم نقل ${res.yearsCount} سنوات و${res.txCount} حركات و${res.servantsCount} خدام إلى السحابة بنجاح! ☁️✅`,
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الاتصال ونقل البيانات للسحابة', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Format month label
  const formatMonthLabel = (m: string) => {
    try {
      const [year, month] = m.split('-').map(Number);
      return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
    } catch {
      return m;
    }
  };

  // 1. Export JSON Backup
  const handleExportJSON = () => {
    try {
      exportBackupJSON({
        transactions,
        servants,
        payments,
        yearBudgets,
        whatsappTemplate,
      });
      showToast('تم تصدير النسخة الاحتياطية (JSON) بنجاح', 'success');
    } catch {
      showToast('فشل تصدير النسخة الاحتياطية', 'error');
    }
  };

  // 2. Import JSON Backup
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupData;

        if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.servants)) {
          showToast('الملف المختار غير صالح أو تالف', 'error');
          return;
        }

        restoreAllData({
          transactions: parsed.transactions,
          servants: parsed.servants,
          payments: parsed.payments || [],
          yearBudgets: parsed.yearBudgets,
          whatsappTemplate: parsed.whatsappTemplate,
        });

        showToast('تم استعادة البيانات والنسخة الاحتياطية بنجاح!', 'success');
        onClose();
      } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Export CSV Excel
  const handleExportCSV = () => {
    try {
      exportMonthCSV({
        monthYear: selectedMonth,
        monthLabel: formatMonthLabel(selectedMonth),
        transactions,
        servants,
        payments,
      });
      showToast(`تم استخراج تقرير شهر ${formatMonthLabel(selectedMonth)} بتنسيق Excel بنجاح`, 'success');
    } catch {
      showToast('حدث خطأ أثناء استخراج ملف CSV', 'error');
    }
  };

  // 4. Reset to Initial Defaults
  const handleReset = () => {
    resetAllData();
    setConfirmReset(false);
    showToast('تمت استعادة البيانات التجريبية الافتراضية بنجاح', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0E242D]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white dark:bg-[#0E242D] border border-[#1F4554]/15 dark:border-[#1F4554]/30 rounded-3xl shadow-2xl p-6 sm:p-7 z-10 space-y-6 overflow-hidden transition-colors"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F4554]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 border border-[#1F4554]/15 dark:border-[#1F4554]/30 flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0E242D] dark:text-white">
                إدارة البيانات وتأمينها والتقارير
              </h3>
              <p className="text-xs text-[#0E242D]/60 dark:text-[#94A3B8]">حفظ النسخ الاحتياطية واستخراج تقارير Excel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#F2F6F8] dark:hover:bg-[#1a3442] border border-[#1F4554]/15 dark:border-[#1F4554]/30 text-[#0E242D]/60 dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input for Restore */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".json,application/json" 
          onChange={handleFileChange}
          className="hidden" 
        />

        {/* Actions Grid */}
        <div className="space-y-4">
          {/* Section 0: Sync Local to Cloud Firestore */}
          <div className="bg-[#F7F1E8]/70 dark:bg-[#132731] border border-[#1F4554]/20 dark:border-[#1F4554]/30 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F4554] dark:text-cyan-200">
                <CloudUpload className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
                <span>نقل البيانات الحالية إلى السحابة (Sync Local to Cloud)</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Firestore Live
              </span>
            </div>
            <p className="text-[11px] text-[#0E242D]/80 dark:text-[#F2F6F8]/80 leading-relaxed">
              ارفع جميع البيانات المسجلة على هذا الجهاز (السنوات المالية، الحركات، والخدام) مباشرة إلى قاعدة بيانات Firebase السحابية لتتم مزامنتها والوصول إليها لحظياً من الموبايل أو أي كمبيوتر آخر.
            </p>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncToCloud}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري المزامنة مع Firestore...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 stroke-[2.2]" />
                  <span>نقل البيانات الحالية إلى السحابة (Sync Local to Cloud)</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: CSV Excel Export */}
          <div className="bg-white dark:bg-[#0E242D] border border-[#1F4554]/15 dark:border-[#1F4554]/30 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير تقرير الشهر لبرنامج Excel (CSV)</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-mono font-medium">
                UTF-8 BOM
              </span>
            </div>
            <p className="text-[11px] text-[#0E242D]/70 dark:text-[#94A3B8] leading-relaxed">
              يصدر كشف حساب كامل وحركات الميزانية واشتراكات الخدام للشهر المختار بصيغة متوافقة تماماً مع إكسيل دون ظهور حروف مكسورة.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 bg-[#F2F6F8] dark:bg-[#081318] border border-[#1F4554]/20 dark:border-[#1F4554]/30 text-xs text-[#0E242D] dark:text-[#F2F6F8] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 cursor-pointer"
              >
                <option value="2026-10" className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">أكتوبر 2026</option>
                <option value="2026-09" className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">سبتمبر 2026</option>
                <option value="2026-11" className="bg-white dark:bg-[#0E242D] text-[#0E242D] dark:text-[#F2F6F8]">نوفمبر 2026</option>
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* Section 2: JSON Backup & Restore */}
          <div className="bg-white dark:bg-[#0E242D] border border-[#1F4554]/15 dark:border-[#1F4554]/30 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F4554] dark:text-cyan-200">
              <ShieldCheck className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
              <span>النسخ الاحتياطي الشامل (Backup & Restore)</span>
            </div>
            <p className="text-[11px] text-[#0E242D]/70 dark:text-[#94A3B8] leading-relaxed">
              احتفظ بنسخة كاملة من سجلات الحسابات والخدام في ملف خارجي، أو استعد بياناتك على أي جهاز آخر بسهولة.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2.5 px-3 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#F2F6F8] dark:hover:bg-[#1a3442] border border-[#1F4554]/20 dark:border-[#1F4554]/30 text-[#1F4554] dark:text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
                <span>تصدير نسخة (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#F2F6F8] dark:hover:bg-[#1a3442] border border-[#1F4554]/20 dark:border-[#1F4554]/30 text-[#1F4554] dark:text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <Upload className="w-4 h-4 text-[#1F4554] dark:text-cyan-300" />
                <span>استيراد نسخة (JSON)</span>
              </button>
            </div>
          </div>

          {/* Section 3: Reset Data Option */}
          <div className="pt-1">
            {confirmReset ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-2xl space-y-2">
                <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  هل أنت متأكد من استعادة البيانات الأولية الافتراضية؟
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer min-h-[44px]"
                  >
                    نعم، استعد الافتراضي
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-4 py-2 bg-[#F7F1E8] dark:bg-[#132731] text-[#0E242D]/70 dark:text-[#94A3B8] rounded-xl text-xs hover:bg-[#F2F6F8] dark:hover:bg-[#1a3442] transition-colors cursor-pointer min-h-[44px]"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full text-center text-xs text-[#0E242D]/40 dark:text-[#94A3B8]/60 hover:text-rose-600 dark:hover:text-rose-400 py-2 transition-colors cursor-pointer"
              >
                إعادة ضبط البيانات للحالة الأولية (Seed Data)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
