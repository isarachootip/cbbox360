import { FieldError, industryProfileSchema, toFieldErrors } from '../domain/industry/schemas';
import { IndustryKind, IndustryProfile } from '../types/industryProfile';

export const INDUSTRY_PROFILES_STORAGE_KEY = 'cb360_industry_profiles';

export type SaveProfileResult =
  | { ok: true; profile: IndustryProfile }
  | { ok: false; errors: FieldError[] };

/**
 * Async on purpose: Phase 2B swaps in an HTTP implementation without touching the UI.
 */
export interface IndustryProfileRepository {
  get(customerId: string, kind: IndustryKind): Promise<IndustryProfile | null>;
  save(customerId: string, profile: IndustryProfile): Promise<SaveProfileResult>;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const createMemoryStorage = (): KeyValueStorage => {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
};

const profileKey = (customerId: string, kind: IndustryKind) => `${customerId}:${kind}`;

const readStore = (storage: KeyValueStorage): Record<string, unknown> => {
  const raw = storage.getItem(INDUSTRY_PROFILES_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    console.warn('Industry profile store is corrupted; ignoring stored data');
    return {};
  }
};

export const createLocalIndustryProfileRepository = (
  storage: KeyValueStorage,
  seed: Record<string, IndustryProfile[]> = {}
): IndustryProfileRepository => ({
  async get(customerId, kind) {
    const store = readStore(storage);
    const key = profileKey(customerId, kind);
    if (key in store) {
      // Stored data is untrusted (user-editable localStorage): validate before use.
      const result = industryProfileSchema.safeParse(store[key]);
      return result.success && result.data.kind === kind ? result.data : null;
    }
    return seed[customerId]?.find((p) => p.kind === kind) ?? null;
  },

  async save(customerId, profile) {
    const result = industryProfileSchema.safeParse(profile);
    if (!result.success) return { ok: false, errors: toFieldErrors(result.error) };
    const store = readStore(storage);
    store[profileKey(customerId, result.data.kind)] = result.data;
    storage.setItem(INDUSTRY_PROFILES_STORAGE_KEY, JSON.stringify(store));
    return { ok: true, profile: result.data };
  },
});
