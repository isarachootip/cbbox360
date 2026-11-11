import { z } from 'zod';

export const PANEL_PREFERENCES_STORAGE_KEY = 'cb360_panel_preferences_v1';

export const PanelPreferencesSchema = z.object({
  isSidebarCollapsed: z.boolean(),
  isInboxRightPanelOpen: z.boolean(),
  isServiceRightPanelOpen: z.boolean(),
});

export type PanelPreferences = z.infer<typeof PanelPreferencesSchema>;

export const DEFAULT_PANEL_PREFERENCES: PanelPreferences = {
  isSidebarCollapsed: false,
  isInboxRightPanelOpen: true,
  isServiceRightPanelOpen: true,
};

const PartialPanelPreferencesSchema = PanelPreferencesSchema.partial();

export function parsePanelPreferences(raw: string | null): PanelPreferences {
  if (!raw || !raw.trim()) {
    return { ...DEFAULT_PANEL_PREFERENCES };
  }

  try {
    const parsedJson: unknown = JSON.parse(raw);
    const result = PartialPanelPreferencesSchema.safeParse(parsedJson);
    if (!result.success) {
      return { ...DEFAULT_PANEL_PREFERENCES };
    }
    return {
      ...DEFAULT_PANEL_PREFERENCES,
      ...result.data,
    };
  } catch {
    return { ...DEFAULT_PANEL_PREFERENCES };
  }
}

export function loadPanelPreferences(
  storage?: Pick<Storage, 'getItem'> | null
): PanelPreferences {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  if (!targetStorage) {
    return { ...DEFAULT_PANEL_PREFERENCES };
  }

  try {
    return parsePanelPreferences(targetStorage.getItem(PANEL_PREFERENCES_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_PANEL_PREFERENCES };
  }
}

export function savePanelPreferences(
  prefs: PanelPreferences,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const validated = PanelPreferencesSchema.safeParse(prefs);
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
    targetStorage.setItem(PANEL_PREFERENCES_STORAGE_KEY, JSON.stringify(validated.data));
  } catch {
    // Ignore storage quota or private-mode security errors
  }
}
