/** Country code assumed for numbers typed without one (this dashboard is Lebanon-based). */
export const DEFAULT_COUNTRY_CODE = "961";

/**
 * Puts the country code on a phone number typed without one, so every saved number is international.
 * - "+44 7911 123456" is kept as typed;
 * - "00961 70 123 456" becomes "+961 70 123 456";
 * - "03 395 854" and "70 123 456" get the default country code, and a leading 0 (the national
 *   trunk prefix) is dropped: "+961 3 395 854", "+961 70 123 456".
 * Already-normalized numbers come back unchanged, so it is safe to apply more than once.
 */
export function normalizePhone(raw: string): string {
  const text = raw.trim().replace(/[()]/g, "").replace(/\s+/g, " ");
  if (text.startsWith("+")) {
    // "+961 03 123 456": the national leading 0 doesn't belong after the country code.
    return text.replace(new RegExp(`^\\+${DEFAULT_COUNTRY_CODE}\\s*0+\\s*`), `+${DEFAULT_COUNTRY_CODE} `);
  }
  if (/^00/.test(text)) return text.replace(/^00\s*/, "+");
  return `+${DEFAULT_COUNTRY_CODE} ${text.replace(/^0+\s*/, "")}`;
}

/** Link that opens a WhatsApp chat with the number (full international digits, no "+"), or null. */
export function whatsappLink(phone: string): string | null {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  return digits.length >= 5 ? `https://wa.me/${digits}` : null;
}
