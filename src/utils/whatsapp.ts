/**
 * Formats Egyptian mobile numbers for WhatsApp API (wa.me)
 * Example inputs:
 *  - "01223456789" -> "201223456789"
 *  - "+201223456789" -> "201223456789"
 *  - "010-9876-5432" -> "201098765432"
 */
export function formatEgyptianPhoneForWhatsApp(phone: string): string {
  // Extract only digits
  let clean = phone.replace(/\D/g, '');

  if (clean.startsWith('0020')) {
    clean = clean.substring(2); // removes 00 -> 20...
  } else if (clean.startsWith('20')) {
    // Already has 20 country code
  } else if (clean.startsWith('01') && clean.length === 11) {
    clean = '20' + clean.substring(1); // removes 0, adds 20
  } else if (clean.startsWith('1') && clean.length === 10) {
    clean = '20' + clean;
  }

  return clean;
}

export const DEFAULT_WHATSAPP_TEMPLATE = 
  'سلام ونعمة يا {name} 🤍، بنفكرك بمحبة باشتراك الخدمة لشهر {month} وقيمته {amount} ج.م. ربنا يبارك تعب محبتك!';

export function generateWhatsAppMessage(
  template: string,
  variables: { name: string; month: string; amount: number }
): string {
  return template
    .replace('{name}', variables.name)
    .replace('{month}', variables.month)
    .replace('{amount}', variables.amount.toString());
}
