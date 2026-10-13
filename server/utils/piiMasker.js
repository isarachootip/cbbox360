/**
 * PII Masker Utility (PDPA Compliance)
 * Masks Thai National IDs (13 digits), Bank Account Numbers (10-12 digits),
 * and Phone Numbers (9-10 digits) while keeping the last 4 digits intact.
 */

export const maskSensitiveData = (input) => {
  if (!input || typeof input !== 'string') return '';

  let result = input;

  // 1. Mask hyphenated 13-digit Thai National ID (e.g., 1-1004-00123-45-6)
  result = result.replace(
    /\b\d-\d{4}-\d{5}-\d{2}-\d\b/g,
    (match) => {
      const digits = match.replace(/\D/g, '');
      return `XXXXXXXXX${digits.slice(-4)}`;
    }
  );

  // 2. Mask contiguous 13-digit Thai National ID
  result = result.replace(/\b\d{13}\b/g, (match) => `XXXXXXXXX${match.slice(-4)}`);

  // 3. Mask hyphenated bank account numbers (e.g., 012-3-45678-9 or 012-345-6789)
  result = result.replace(
    /\b\d{3}-\d-\d{5}-\d\b/g,
    (match) => {
      const digits = match.replace(/\D/g, '');
      return `XXXXXX${digits.slice(-4)}`;
    }
  );

  // 4. Mask Thai phone numbers:
  // - Mobile: 06x-xxx-xxxx, 08x-xxx-xxxx, 09x-xxx-xxxx
  // - Landline: 02-xxx-xxxx, 03x-xxx-xxx, etc.
  result = result.replace(
    /\b0(?:2[\s-]?\d{3}[\s-]?\d{4}|[3456789]\d[\s-]?\d{3}[\s-]?\d{3,4})\b/g,
    (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length === 9 || digits.length === 10) {
        return `XXX-XXX-${digits.slice(-4)}`;
      }
      return match;
    }
  );

  // 5. Mask contiguous 10-to-12-digit numbers (bank accounts / unformatted phones)
  result = result.replace(/\b\d{10,12}\b/g, (match) => {
    const maskLen = match.length - 4;
    return `${'X'.repeat(maskLen)}${match.slice(-4)}`;
  });

  return result;
};
