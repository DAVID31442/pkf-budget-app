import type { Transaction, Servant, MonthlyPayment, YearBudget } from '../types';

export interface BackupData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  servants: Servant[];
  payments: MonthlyPayment[];
  yearBudgets?: YearBudget[];
  whatsappTemplate?: string;
}

/**
 * Downloads all application data as a JSON backup file.
 */
export function exportBackupJSON(data: {
  transactions: Transaction[];
  servants: Servant[];
  payments: MonthlyPayment[];
  yearBudgets: YearBudget[];
  whatsappTemplate: string;
}): void {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: data.transactions,
    servants: data.servants,
    payments: data.payments,
    yearBudgets: data.yearBudgets,
    whatsappTemplate: data.whatsappTemplate,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `budget-servants-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports current month data to a UTF-8 BOM CSV that opens seamlessly in Microsoft Excel.
 */
export function exportMonthCSV(params: {
  monthYear: string;
  monthLabel: string;
  transactions: Transaction[];
  servants: Servant[];
  payments: MonthlyPayment[];
}): void {
  const { monthYear, monthLabel, transactions, servants, payments } = params;

  // Filter transactions for this month
  const monthTx = transactions.filter((tx) => tx.date.startsWith(monthYear));
  const totalIncome = monthTx
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = monthTx
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const net = totalIncome - totalExpense;

  // Servants status for this month
  const servantsStatus = servants.map((srv) => {
    const payment = payments.find((p) => p.servantId === srv.id && p.monthYear === monthYear);
    const isPaid = payment?.isPaid ?? false;
    return {
      name: srv.name,
      phone: srv.phone,
      monthlyAmount: srv.monthlyAmount,
      isPaid: isPaid ? 'تم الدفع' : 'لم يدفع بعد',
      paidAt: payment?.paidAt || '-',
    };
  });

  const totalCollectedServants = servantsStatus
    .filter((s) => s.isPaid === 'تم الدفع')
    .reduce((sum, s) => sum + s.monthlyAmount, 0);

  // Build CSV content
  const lines: string[] = [];

  // Title & Summary
  lines.push(`"تقرير الحسابات واشتراكات الخدمة - شهر ${monthLabel} (${monthYear})"`);
  lines.push(`"تاريخ استخراج التقرير:","${new Date().toLocaleDateString('ar-EG')}"`);
  lines.push('');
  lines.push('"الملخص المالي العام لهذا الشهر"');
  lines.push(`"إجمالي الداخل (الإيرادات):","${totalIncome} ج.م"`);
  lines.push(`"إجمالي الخارج (المصروفات):","${totalExpense} ج.م"`);
  lines.push(`"الرصيد الصافي:","${net} ج.م"`);
  lines.push(`"إجمالي اشتراكات الخدام المحصلة:","${totalCollectedServants} ج.م"`);
  lines.push('');

  // Transactions Table
  lines.push('"=== جدول حركات الميزانية لهذا الشهر ==="');
  lines.push('"م","التاريخ","نوع الحركة","التصنيف","الوصف أو البيان","المبلغ (ج.م)"');

  monthTx.forEach((tx, idx) => {
    const typeLabel = tx.type === 'income' ? 'داخل (إيراد)' : 'خارج (مصروف)';
    const amountVal = tx.type === 'income' ? `+${tx.amount}` : `-${tx.amount}`;
    const desc = tx.description.replace(/"/g, '""');
    const cat = tx.category.replace(/"/g, '""');
    lines.push(`"${idx + 1}","${tx.date}","${typeLabel}","${cat}","${desc}","${amountVal}"`);
  });

  if (monthTx.length === 0) {
    lines.push('"لا توجد حركات مسجلة لهذا الشهر"');
  }

  lines.push('');
  // Servants Subscriptions Table
  lines.push('"=== جدول اشتراكات الخدام لهذا الشهر ==="');
  lines.push('"م","اسم الخادم","رقم الهاتف","قيمة الشهرية (ج.م)","حالة السداد","تاريخ السداد"');

  servantsStatus.forEach((srv, idx) => {
    const name = srv.name.replace(/"/g, '""');
    lines.push(`"${idx + 1}","${name}","${srv.phone}","${srv.monthlyAmount}","${srv.isPaid}","${srv.paidAt}"`);
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens Arabic characters correctly without garbled symbols
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير_الخدمة_${monthYear}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
