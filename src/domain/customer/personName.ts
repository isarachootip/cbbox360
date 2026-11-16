import { z } from 'zod';
import type { CustomerType, PersonNameParts } from '../../types';

export const PERSON_PREFIX_OPTIONS = [
  '',
  'คุณ',
  'นาย',
  'นาง',
  'นางสาว',
  'ด.ช.',
  'ด.ญ.',
  'นพ.',
  'พญ.',
  'ดร.',
  'ช่าง',
] as const;

const KNOWN_PREFIXES_DESC = [...PERSON_PREFIX_OPTIONS]
  .filter((p) => p.length > 0)
  .sort((a, b) => b.length - a.length);

export const personNameSchema = z.object({
  prefix: z.string().trim().optional().default(''),
  firstName: z.string().trim().min(1, 'กรุณาระบุชื่อ'),
  lastName: z.string().trim().optional().default(''),
  nickname: z.string().trim().optional().default(''),
});

export type ValidatedPersonName = z.infer<typeof personNameSchema>;

const collapseSpaces = (value?: string): string =>
  (value ?? '').trim().replace(/\s+/g, ' ');

const isAsciiPrefix = (prefix: string): boolean => /^[A-Za-z.]+$/.test(prefix);

/**
 * Builds the canonical full display name from structured person parts.
 * Thai prefixes attach directly to firstName (e.g. "คุณสมชาย ใจดี"),
 * while Latin prefixes add a space (e.g. "Mr. John Doe").
 */
export const formatPersonFullName = (parts: PersonNameParts): string => {
  const prefix = collapseSpaces(parts.prefix);
  const firstName = collapseSpaces(parts.firstName);
  const lastName = collapseSpaces(parts.lastName);

  if (!firstName && !lastName) return '';
  if (!firstName) return lastName;

  const head = !prefix
    ? firstName
    : isAsciiPrefix(prefix)
      ? `${prefix} ${firstName}`
      : `${prefix}${firstName}`;

  return lastName ? `${head} ${lastName}` : head;
};

/**
 * Splits a legacy single-string name into { prefix, firstName, lastName }
 * using longest-prefix matching so "นางสาว" is matched before "นาง".
 */
export const parseLegacyPersonName = (
  rawName?: string
): { prefix: string; firstName: string; lastName: string } => {
  const cleaned = collapseSpaces(rawName);
  if (!cleaned) {
    return { prefix: '', firstName: '', lastName: '' };
  }

  for (const p of KNOWN_PREFIXES_DESC) {
    if (cleaned.startsWith(`${p} `)) {
      const rest = cleaned.slice(p.length + 1).trim();
      const spaceIdx = rest.indexOf(' ');
      if (spaceIdx === -1) {
        return { prefix: p, firstName: rest, lastName: '' };
      }
      return {
        prefix: p,
        firstName: rest.slice(0, spaceIdx),
        lastName: rest.slice(spaceIdx + 1).trim(),
      };
    }
  }

  const firstSpaceIdx = cleaned.indexOf(' ');
  const firstToken = firstSpaceIdx === -1 ? cleaned : cleaned.slice(0, firstSpaceIdx);
  const restLastName = firstSpaceIdx === -1 ? '' : cleaned.slice(firstSpaceIdx + 1).trim();

  for (const p of KNOWN_PREFIXES_DESC) {
    if (firstToken.startsWith(p) && firstToken.length > p.length) {
      return {
        prefix: p,
        firstName: firstToken.slice(p.length),
        lastName: restLastName,
      };
    }
  }

  return {
    prefix: '',
    firstName: firstToken,
    lastName: restLastName,
  };
};

/**
 * Extracts Thai base consonants (\u0E01-\u0E2E) and alphanumeric characters,
 * skipping Thai leading/combining vowels and tone marks so avatars stay legible.
 */
const extractBaseChars = (text: string): string[] => {
  const matches = text.match(/[\u0E01-\u0E2EA-Za-z0-9]/g);
  return matches ? matches.map((ch) => ch.toUpperCase()) : [];
};

const stripCorporateBoilerplate = (companyName: string): string =>
  collapseSpaces(companyName)
    .replace(/^(บริษัท|บจก\.?|บมจ\.?|ห้างหุ้นส่วนจำกัด|หจก\.?|ร้าน)\s*/i, '')
    .replace(/\s*(จำกัด\s*\(มหาชน\)|จำกัด)$/i, '')
    .trim();

export interface InitialsInput extends PersonNameParts {
  customerType?: CustomerType;
  companyName?: string;
  fallbackName?: string;
}

/**
 * Computes 1-2 character avatar initials for Individual or Corporate customers.
 */
export const computeCustomerInitials = (input: InitialsInput): string => {
  if (input.customerType === 'CORPORATE') {
    const rawCorp = input.companyName || input.fallbackName || '';
    const stripped = stripCorporateBoilerplate(rawCorp) || rawCorp;
    const chars = extractBaseChars(stripped);
    return chars.slice(0, 2).join('') || stripped.slice(0, 2) || 'B2';
  }

  const resolved =
    input.firstName || input.lastName
      ? { firstName: input.firstName || '', lastName: input.lastName || '' }
      : parseLegacyPersonName(input.fallbackName);

  const firstChars = extractBaseChars(resolved.firstName);
  const lastChars = extractBaseChars(resolved.lastName);

  if (firstChars[0] && lastChars[0]) {
    return `${firstChars[0]}${lastChars[0]}`;
  }
  if (firstChars.length >= 2) {
    return `${firstChars[0]}${firstChars[1]}`;
  }
  if (firstChars[0]) {
    return firstChars[0];
  }
  return (input.fallbackName || '').trim().slice(0, 2) || 'CU';
};

/**
 * Normalizes person fields and ensures `name` is synchronized with structured fields.
 */
export const normalizePersonRecord = (
  input: PersonNameParts & { name?: string }
): PersonNameParts & { name: string } => {
  const hasStructured = Boolean(collapseSpaces(input.firstName) || collapseSpaces(input.lastName));
  const parsed = hasStructured
    ? {
        prefix: collapseSpaces(input.prefix),
        firstName: collapseSpaces(input.firstName),
        lastName: collapseSpaces(input.lastName),
      }
    : parseLegacyPersonName(input.name);

  const nickname = collapseSpaces(input.nickname);
  const fullName = formatPersonFullName(parsed) || collapseSpaces(input.name);

  return {
    prefix: parsed.prefix || undefined,
    firstName: parsed.firstName || undefined,
    lastName: parsed.lastName || undefined,
    nickname: nickname || undefined,
    name: fullName,
  };
};
