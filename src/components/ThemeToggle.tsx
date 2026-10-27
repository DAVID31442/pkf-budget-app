import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer select-none min-h-[44px] ${
        isDark
          ? 'bg-[#132731] hover:bg-[#18323f] border-[#1F4554]/50 text-amber-300 shadow-sm shadow-black/20'
          : 'bg-[#F7F1E8] hover:bg-[#EAE4DB] border-[#1F4554]/20 text-[#1F4554] shadow-2xs'
      } ${className}`}
      aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الليلي'}
      title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الليلي'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-[#1F4554] transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold leading-none">
          {isDark ? 'الوضع الفاتح' : 'الوضع الليلي'}
        </span>
      )}
    </button>
  );
};
