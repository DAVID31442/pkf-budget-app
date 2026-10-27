import { useState } from 'react';
import { Layout } from './components/Layout';
import { BudgetPage } from './pages/BudgetPage';
import { ServantsPage } from './pages/ServantsPage';
import { useApp } from './context/AppContext';
import { Cloud, Sparkles } from 'lucide-react';
import type { ActiveTab } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('budget');
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <div 
        dir="rtl"
        className="min-h-screen bg-[#F2F6F8] dark:bg-[#081318] flex flex-col items-center justify-center p-6 text-[#0E242D] dark:text-[#F2F6F8] select-none relative overflow-hidden font-sans transition-colors duration-200"
      >
        {/* Ambient subtle background glows */}
        <div className="absolute w-[500px] h-[500px] bg-[#1F4554]/5 dark:bg-[#1F4554]/15 rounded-full blur-3xl -top-24 -right-24 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-[#F7F1E8] dark:bg-[#132731]/30 rounded-full blur-3xl -bottom-24 -left-24 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6 bg-white dark:bg-[#0E242D] border border-[#E2E8F0] dark:border-[#1F4554]/30 p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/50 transition-colors">
          {/* Authentic Logo */}
          <div className="relative group">
            <img 
              src="/logo.png" 
              alt="أسرة البابا كيرلس السادس للمغتربين" 
              className="h-24 w-auto object-contain"
            />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-[#1F4554] text-white flex items-center justify-center shadow-md">
              <Cloud className="w-4 h-4 animate-bounce" />
            </div>
          </div>

          {/* Title & Status */}
          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold text-[#0E242D] dark:text-white tracking-tight flex items-center justify-center gap-2">
              <span>أسرة البابا كيرلس السادس</span>
              <Sparkles className="w-4 h-4 text-[#D12B2C]" />
            </h1>
            <p className="text-xs font-bold text-[#1F4554] dark:text-cyan-300">
              للمغتربين • نظام إدارة الميزانية والاشتراكات
            </p>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
              جاري الاتصال بالسحابة ومزامنة الحسابات لحظياً...
            </p>
          </div>

          {/* Progress bar in Primary Petrol */}
          <div className="w-full bg-[#F7F1E8] dark:bg-[#132731] border border-[#E2E8F0] dark:border-[#1F4554]/30 rounded-full h-2.5 p-0.5 overflow-hidden">
            <div className="h-full bg-[#1F4554] dark:bg-cyan-400 rounded-full animate-pulse w-3/4" />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>Firebase Firestore Live</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'budget' ? <BudgetPage /> : <ServantsPage />}
    </Layout>
  );
}

export default App;
