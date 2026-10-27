/**
 * Fiscal Year Helpers for ServiceHub (أسرة البابا كيرلس السادس للمغتربين)
 * Academic / Service year runs across two calendar years: e.g. "2026 / 2027"
 * typically starting around September/October of the first year and ending
 * around September/October of the second year.
 */

/**
 * Standardizes a fiscal year string to "YYYY / YYYY"
 * Examples:
 *  "2026/2027" -> "2026 / 2027"
 *  "2026-2027" -> "2026 / 2027"
 *  2027 -> "2026 / 2027" (if mapped or single)
 */
export function normalizeFiscalYear(yearInput: string | number | undefined | null): string {
  if (!yearInput) return getCurrentFiscalYear();
  const raw = String(yearInput).trim();

  // If already like "2026 / 2027"
  if (raw.includes('/') || raw.includes('-')) {
    const parts = raw.split(/[/ -]/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} / ${parts[1]}`;
    }
  }

  // Single number like 2026 or 2027
  const num = parseInt(raw, 10);
  if (!isNaN(num)) {
    if (num === 2027 || num === 2026) {
      return '2026 / 2027';
    }
    // Any other single year YYYY -> suggest YYYY / YYYY+1
    return `${num} / ${num + 1}`;
  }

  return raw;
}

/**
 * Firestore doesn't allow '/' in document IDs.
 * Converts "2026 / 2027" -> "2026-2027"
 */
export function toFirestoreFiscalYearId(year: string | number): string {
  const norm = normalizeFiscalYear(year);
  return norm.replace(/\s+/g, '').replace(/\//g, '-');
}

/**
 * Converts Firestore document ID "2026-2027" -> "2026 / 2027"
 */
export function fromFirestoreFiscalYearId(id: string): string {
  return normalizeFiscalYear(id);
}

/**
 * Returns the current fiscal year based on current date.
 * If month >= 9 (September), year is YYYY / YYYY+1
 * Otherwise, year is YYYY-1 / YYYY
 */
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12
  if (m >= 9) {
    return `${y} / ${y + 1}`;
  } else {
    return `${y - 1} / ${y}`;
  }
}

/**
 * Returns suggested fiscal year list for pickers
 */
export function getSuggestedFiscalYears(): string[] {
  return [
    '2026 / 2027',
    '2027 / 2028',
    '2025 / 2026',
    '2028 / 2029',
  ];
}

/**
 * Checks if a transaction date string (YYYY-MM-DD) falls within the fiscal year.
 */
export function isDateInFiscalYear(dateStr: string, fiscalYearInput: string | number): boolean {
  if (!dateStr) return false;
  const normYear = normalizeFiscalYear(fiscalYearInput);
  const parts = normYear.split('/').map((s) => s.trim());

  if (parts.length >= 2) {
    const startYear = parseInt(parts[0], 10);
    const endYear = parseInt(parts[1], 10);

    const [y, m] = dateStr.split('-').map(Number);
    if (isNaN(y) || isNaN(m)) return false;

    // Service year runs from startYear-09-01 through endYear-10-31
    // Month 9, 10, 11, 12 in startYear
    if (y === startYear && m >= 8) return true;
    // Month 1 through 10 in endYear
    if (y === endYear && m <= 10) return true;

    // Direct string range check
    const startRange = `${startYear}-08-01`;
    const endRange = `${endYear}-10-31`;
    return dateStr >= startRange && dateStr <= endRange;
  }

  // Fallback if single year
  return dateStr.startsWith(String(fiscalYearInput));
}

/**
 * Returns the 12-14 relevant months of a fiscal year cycle
 * Format: { value: 'YYYY-MM', label: 'اسم الشهر والسنة' }
 */
export function getFiscalYearMonths(fiscalYearInput: string | number): { value: string; label: string }[] {
  const normYear = normalizeFiscalYear(fiscalYearInput);
  const parts = normYear.split('/').map((s) => s.trim());
  const list: { value: string; label: string }[] = [];

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  if (parts.length >= 2) {
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);

    // Months of Year 1: September, October, November, December
    for (let m = 9; m <= 12; m++) {
      const val = `${y1}-${String(m).padStart(2, '0')}`;
      list.push({
        value: val,
        label: `${arabicMonths[m - 1]} ${y1}`,
      });
    }

    // Months of Year 2: January through September
    for (let m = 1; m <= 9; m++) {
      const val = `${y2}-${String(m).padStart(2, '0')}`;
      list.push({
        value: val,
        label: `${arabicMonths[m - 1]} ${y2}`,
      });
    }
  } else {
    // Single calendar year fallback
    const y = parseInt(String(fiscalYearInput), 10) || new Date().getFullYear();
    for (let m = 1; m <= 12; m++) {
      const val = `${y}-${String(m).padStart(2, '0')}`;
      list.push({
        value: val,
        label: `${arabicMonths[m - 1]} ${y}`,
      });
    }
  }

  return list;
}
