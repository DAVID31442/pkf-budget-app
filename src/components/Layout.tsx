import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import { 
  Wallet, 
  Users, 
  Calendar, 
  Database,
  Cloud
} from 'lucide-react';
import type { ActiveTab } from '../types';
import { DataManagementModal } from './DataManagementModal';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ activeTab, onTabChange, children }) => {
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

  const navItems = [
    {
      id: 'budget' as ActiveTab,
      label: 'الميزانية (الداخل والخارج)',
      shortLabel: 'الميزانية',
      description: 'إدارة وتتبع التدفقات النقدية والمصروفات',
      icon: Wallet,
      badge: 'الرئيسية'
    },
    {
      id: 'servants' as ActiveTab,
      label: 'اشتراكات الخدام',
      shortLabel: 'الاشتراكات',
      description: 'متابعة المساهمات والتحصيل الشهري',
      icon: Users,
      badge: 'شهرياً'
    },
  ];

  const currentDateArabic = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F2F6F8] dark:bg-[#081318] text-[#0E242D] dark:text-[#F2F6F8] flex flex-col md:flex-row antialiased selection:bg-[#1F4554]/15 selection:text-[#1F4554] transition-colors duration-200">
      {/* ================= Sidebar for Desktop ================= */}
      <aside className="hidden md:flex md:w-72 lg:w-80 flex-col bg-white dark:bg-[#0E242D] border-l border-[#E2E8F0] dark:border-[#1F4554]/30 p-5 shrink-0 z-30 sticky top-0 h-screen justify-between shadow-sm transition-colors duration-200">
        <div className="space-y-6">
          {/* Brand Header with Authentic Logo Beside Text */}
          <div className="flex items-center gap-3.5 px-1 py-1">
            <img 
              src="/logo.png" 
              alt="أسرة البابا كيرلس السادس للمغتربين" 
              className="h-12 w-auto object-contain shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                <h1 className="text-sm font-extrabold tracking-tight text-[#0E242D] dark:text-white leading-tight">
                  أسرة البابا كيرلس
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1F4554]/10 dark:bg-[#1F4554]/40 text-[#1F4554] dark:text-cyan-200 font-bold shrink-0">
                  للمغتربين
                </span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] font-medium mt-0.5 truncate">
                نظام إدارة الميزانية والاشتراكات
              </p>
            </div>
          </div>

          {/* Quick Date Card (Secondary / Warm #F7F1E8) */}
          <div className="bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-[#0E242D] dark:text-[#F2F6F8] transition-colors">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 flex items-center justify-center text-[#1F4554] dark:text-cyan-300 shrink-0 shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] font-medium">التاريخ اليوم</p>
              <p className="font-bold text-[#0E242D] dark:text-white">{currentDateArabic}</p>
            </div>
          </div>

          {/* Navigation Links - Primary Petrol (#1F4554) with Crimson Micro-Accent (#D12B2C) */}
          <div className="space-y-1.5">
            <p className="px-3 text-[11px] font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider">
              لوحة التحكم
            </p>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer text-right text-sm font-medium min-h-[48px] ${
                      isActive
                        ? 'bg-[#1F4554] text-white shadow-md shadow-[#1F4554]/20'
                        : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white hover:bg-[#F7F1E8] dark:hover:bg-[#132731] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-[#F2F6F8] dark:bg-[#081318] text-[#1F4554] dark:text-cyan-200 group-hover:bg-[#EAE4DB] dark:group-hover:bg-[#1a3442]'
                        }`}
                      >
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="text-right">
                        <span className="block leading-tight font-bold">{item.label}</span>
                        <span className={`text-[11px] block mt-0.5 ${isActive ? 'text-white/80' : 'text-[#475569] dark:text-[#94A3B8]'}`}>
                          {item.description}
                        </span>
                      </div>
                    </div>
                    {/* Micro-Accent: Crimson bar for active tab as per design system */}
                    {isActive && (
                      <span className="w-1.5 h-6 rounded-full bg-[#D12B2C] shadow-sm" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Info: Removed as requested because all controls are already conveniently present in the Header */}
      </aside>

      {/* ================= Main Content Area ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-[#0E242D]/90 border-b border-[#E2E8F0] dark:border-[#1F4554]/30 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Mobile Logo beside Title */}
            <img 
              src="/pope_icon.png" 
              alt="أسرة البابا كيرلس" 
              className="md:hidden h-10 w-10 object-contain shrink-0" 
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0E242D] dark:text-white flex items-center gap-2">
                {activeTab === 'budget' ? 'الميزانية (الداخل والخارج)' : 'اشتراكات الخدام الشهرية'}
              </h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] hidden sm:block">
                {activeTab === 'budget'
                  ? 'أسرة البابا كيرلس السادس للمغتربين • متابعة القيود المالية والإيرادات والمصروفات'
                  : 'أسرة البابا كيرلس السادس للمغتربين • جدول تحصيل الاشتراكات والالتزامات'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Trigger in Header */}
            <ThemeToggle />

            {/* Backup & Reports Button in Header */}
            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F1E8] dark:bg-[#132731] hover:bg-[#EAE4DB] dark:hover:bg-[#18323f] border border-[#1F4554]/15 dark:border-[#1F4554]/30 text-xs font-bold text-[#1F4554] dark:text-[#F2F6F8] transition-all cursor-pointer min-h-[44px]"
              title="تصدير التقارير والنسخ الاحتياطي"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">البيانات والتقارير</span>
            </button>

            {/* Live Cloud Status */}
            <div 
              className="flex items-center gap-1.5 bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 px-3 py-1.5 rounded-xl text-xs text-[#0E242D] dark:text-[#F2F6F8] min-h-[44px] transition-colors"
              title="متصل سحابياً ومحدث لحظياً عبر Firebase Firestore"
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="hidden sm:inline font-bold text-[#10B981]">سحابي مباشر</span>
              <Cloud className="w-3.5 h-3.5 text-[#1F4554] dark:text-cyan-300" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ================= Bottom Navigation Bar (Mobile) ================= */}
      <nav 
        aria-label="شريط التنقل السفلي للهواتف" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E242D]/95 backdrop-blur-xl border-t border-[#E2E8F0] dark:border-[#1F4554]/30 px-3 py-2 shadow-lg transition-colors duration-200"
      >
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center min-h-[48px] py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-[#1F4554] dark:text-cyan-200 bg-[#1F4554]/10 dark:bg-[#1F4554]/30 font-bold'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0E242D] dark:hover:text-white active:bg-[#F7F1E8] dark:active:bg-[#132731] font-medium'
                }`}
              >
                {/* Micro-Accent: Crimson pill on mobile bar */}
                {isActive && (
                  <span className="absolute top-1 w-8 h-1 rounded-full bg-[#D12B2C]" />
                )}
                <Icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? 'scale-110 text-[#1F4554] dark:text-cyan-200' : ''}`} />
                <span className="text-xs truncate">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Data & Reports Management Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
      />
    </div>
  );
};
