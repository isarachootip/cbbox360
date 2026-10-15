import { FieldError, industryProfileSchema, toFieldErrors } from '../domain/industry/schemas';
import {
  IndustryKind,
  IndustryProfile,
  MedicalAccess,
  RedactedHospitalProfile,
} from '../types/industryProfile';

export const INDUSTRY_PROFILES_STORAGE_KEY = 'cb360_industry_profiles';

export type SaveProfileResult =
  | { ok: true; profile: IndustryProfile }
  | { ok: false; errors: FieldError[] };

export interface LoadedProfile {
  access: MedicalAccess;
  profile: IndustryProfile | null;
  /** Set instead of `profile` when the server withholds hospital details (PDPA minimisation). */
  redacted: RedactedHospitalProfile | null;
  error?: string;
}

/** Async so the localStorage (demo) and HTTP (server) implementations are interchangeable. */
export interface IndustryProfileRepository {
  get(customerId: string, kind: IndustryKind): Promise<LoadedProfile>;
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
    let profile: IndustryProfile | null;
    if (key in store) {
      // Stored data is untrusted (user-editable localStorage): validate before use.
      const result = industryProfileSchema.safeParse(store[key]);
      profile = result.success && result.data.kind === kind ? result.data : null;
    } else {
      profile = seed[customerId]?.find((p) => p.kind === kind) ?? null;
    }
    // Demo mode has no server-side roles; everything is visible.
    return { access: 'full', profile, redacted: null };
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
