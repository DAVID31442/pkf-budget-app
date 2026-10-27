import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { X, MessageSquare, RotateCcw, Check } from 'lucide-react';
import { DEFAULT_WHATSAPP_TEMPLATE } from '../utils/whatsapp';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: string;
  onSave: (template: string) => void;
}

export const WhatsAppTemplateModal: FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onSave,
}) => {
  const [template, setTemplate] = useState<string>(currentTemplate);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setTemplate(currentTemplate);
  }, [currentTemplate, isOpen]);

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
    onSave(template);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#0E242D]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white dark:bg-[#0E242D] border border-[#1F4554]/15 dark:border-[#1F4554]/30 rounded-3xl shadow-2xl p-6 sm:p-7 z-10 space-y-5 overflow-hidden transition-colors"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F4554]" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] text-[#1F4554] dark:text-cyan-200 border border-[#1F4554]/15 dark:border-[#1F4554]/30 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0E242D] dark:text-white">
                تخصيص رسالة تذكير الواتساب
              </h3>
              <p className="text-xs text-[#0E242D]/60 dark:text-[#94A3B8]">تعديل صيغة الرسالة التي يتم إرسالها للخادم</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#F2F6F8] dark:hover:bg-[#1a3442] border border-[#1F4554]/15 dark:border-[#1F4554]/30 text-[#0E242D]/60 dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tpl-textarea" className="text-xs font-semibold text-[#0E242D] dark:text-[#F2F6F8]">
                نص الرسالة
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-[#1F4554] dark:text-cyan-300 hover:text-[#0E242D] dark:hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>استعادة النص الافتراضي</span>
              </button>
            </div>

            <textarea
              id="tpl-textarea"
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full bg-[#F2F6F8] dark:bg-[#081318] border border-[#1F4554]/20 dark:border-[#1F4554]/30 rounded-2xl p-3.5 text-xs text-[#0E242D] dark:text-[#F2F6F8] leading-relaxed placeholder:text-[#0E242D]/40 dark:placeholder:text-[#8B9FA8] focus:outline-none focus:border-[#1F4554] dark:focus:border-cyan-400 focus:ring-1 focus:ring-[#1F4554] transition-colors resize-none"
            />

            {/* Variable Tags Guide */}
            <div className="bg-[#F7F1E8] dark:bg-[#132731] border border-[#1F4554]/15 dark:border-[#1F4554]/30 rounded-xl p-3 space-y-1.5 text-[11px] text-[#0E242D]/70 dark:text-[#94A3B8]">
              <span className="font-semibold text-[#0E242D] dark:text-white block">الرموز المتغيرة المتاحة:</span>
              <div className="flex flex-wrap gap-2 text-[#1F4554] dark:text-cyan-200 font-mono font-medium">
                <span className="bg-white dark:bg-[#0E242D] px-2 py-0.5 rounded border border-[#1F4554]/15 dark:border-[#1F4554]/30 shadow-2xs">
                  {'{name}'} = اسم الخادم
                </span>
                <span className="bg-white dark:bg-[#0E242D] px-2 py-0.5 rounded border border-[#1F4554]/15 dark:border-[#1F4554]/30 shadow-2xs">
                  {'{month}'} = اسم الشهر
                </span>
                <span className="bg-white dark:bg-[#0E242D] px-2 py-0.5 rounded border border-[#1F4554]/15 dark:border-[#1F4554]/30 shadow-2xs">
                  {'{amount}'} = قيمة الاشتراك
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#F2F6F8] dark:hover:bg-[#1a3442] border border-[#1F4554]/20 dark:border-[#1F4554]/30 text-[#1F4554] dark:text-cyan-200 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1F4554] hover:bg-[#0E242D] dark:hover:bg-[#2a5c70] text-white font-bold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>تم الحفظ!</span>
                </>
              ) : (
                <span>حفظ القالب</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
