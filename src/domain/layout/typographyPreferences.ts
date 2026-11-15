import { z } from 'zod';

export const TYPOGRAPHY_PREFERENCES_STORAGE_KEY = 'cb360_typography_preferences_v1';

export const FontScaleSchema = z.enum(['standard', 'comfortable', 'large']);
export type FontScale = z.infer<typeof FontScaleSchema>;

export const TypographyPreferencesSchema = z.object({
  defaultScale: FontScaleSchema,
  byUser: z.record(z.string(), FontScaleSchema),
});

export type TypographyPreferences = z.infer<typeof TypographyPreferencesSchema>;

export const DEFAULT_TYPOGRAPHY_PREFERENCES: TypographyPreferences = {
  defaultScale: 'comfortable',
  byUser: {},
};

const RawTypographyShapeSchema = z.object({
  defaultScale: z.unknown().optional(),
  byUser: z.record(z.string(), z.unknown()).optional(),
});

export function parseTypographyPreferences(raw: string | null): TypographyPreferences {
  if (!raw || !raw.trim()) {
    return { defaultScale: 'comfortable', byUser: {} };
  }

  try {
    const parsedJson: unknown = JSON.parse(raw);
    const shapeResult = RawTypographyShapeSchema.safeParse(parsedJson);
    if (!shapeResult.success) {
      return { defaultScale: 'comfortable', byUser: {} };
    }

    const scaleCheck = FontScaleSchema.safeParse(shapeResult.data.defaultScale);
    const defaultScale: FontScale = scaleCheck.success ? scaleCheck.data : 'comfortable';

    const cleanByUser: Record<string, FontScale> = {};
    if (shapeResult.data.byUser) {
      for (const [key, val] of Object.entries(shapeResult.data.byUser)) {
        const userScale = FontScaleSchema.safeParse(val);
        if (key.trim() && userScale.success) {
          cleanByUser[key] = userScale.data;
        }
      }
    }

    return { defaultScale, byUser: cleanByUser };
  } catch {
    return { defaultScale: 'comfortable', byUser: {} };
  }
}

export function getUserFontScale(
  prefs: TypographyPreferences,
  username?: string | null
): FontScale {
  const cleanUser = username?.trim();
  if (cleanUser && prefs.byUser[cleanUser]) {
    return prefs.byUser[cleanUser];
  }
  return prefs.defaultScale;
}

export function setUserFontScale(
  prefs: TypographyPreferences,
  scale: FontScale,
  username?: string | null
): TypographyPreferences {
  const validScale = FontScaleSchema.parse(scale);
  const cleanUser = username?.trim();

  if (cleanUser) {
    return {
      ...prefs,
      byUser: {
        ...prefs.byUser,
        [cleanUser]: validScale,
      },
    };
  }

  return {
    ...prefs,
    defaultScale: validScale,
  };
}

export function loadTypographyPreferences(
  storage?: Pick<Storage, 'getItem'> | null
): TypographyPreferences {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) {
    return { defaultScale: 'comfortable', byUser: {} };
  }

  try {
    return parseTypographyPreferences(targetStorage.getItem(TYPOGRAPHY_PREFERENCES_STORAGE_KEY));
  } catch {
    return { defaultScale: 'comfortable', byUser: {} };
  }
}

export function saveTypographyPreferences(
  prefs: TypographyPreferences,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const validated = TypographyPreferencesSchema.safeParse(prefs);
  if (!validated.success) {
    return;
  }

  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) {
    return;
  }

  try {
    targetStorage.setItem(TYPOGRAPHY_PREFERENCES_STORAGE_KEY, JSON.stringify(validated.data));
  } catch {
    // Ignore storage quota or private-mode security errors
  }
}
