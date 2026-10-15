/** Converts raw form strings into typed values. Validation itself is left to the Zod schemas. */

export const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const optionalText = (value: string): string | undefined => value.trim() || undefined;

/** Returns undefined for blank input and NaN for non-numeric input (rejected later by the schema). */
export const optionalInt = (value: string): number | undefined => {
  const trimmed = value.trim().replace(/,/g, '');
  return trimmed ? Number(trimmed) : undefined;
};

export const newId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
