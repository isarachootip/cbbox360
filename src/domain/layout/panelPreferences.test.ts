import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_PANEL_PREFERENCES,
  PANEL_PREFERENCES_STORAGE_KEY,
  parsePanelPreferences,
  loadPanelPreferences,
  savePanelPreferences,
} from './panelPreferences';

describe('panelPreferences domain logic', () => {
  it('returns default preferences when raw input is null or empty', () => {
    expect(parsePanelPreferences(null)).toEqual(DEFAULT_PANEL_PREFERENCES);
    expect(parsePanelPreferences('')).toEqual(DEFAULT_PANEL_PREFERENCES);
  });

  it('returns default preferences when JSON is malformed or has invalid field types', () => {
    expect(parsePanelPreferences('{invalid-json')).toEqual(DEFAULT_PANEL_PREFERENCES);
    expect(parsePanelPreferences(JSON.stringify({ isSidebarCollapsed: 'yes' }))).toEqual(
      DEFAULT_PANEL_PREFERENCES
    );
    expect(parsePanelPreferences(JSON.stringify([1, 2, 3]))).toEqual(DEFAULT_PANEL_PREFERENCES);
  });

  it('merges partial valid stored preferences with defaults', () => {
    const partial = JSON.stringify({ isSidebarCollapsed: true });
    expect(parsePanelPreferences(partial)).toEqual({
      isSidebarCollapsed: true,
      isInboxRightPanelOpen: true,
      isServiceRightPanelOpen: true,
    });
  });

  it('loads and saves preferences via injected storage interface safely', () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };

    const nextPrefs = {
      isSidebarCollapsed: true,
      isInboxRightPanelOpen: false,
      isServiceRightPanelOpen: true,
    };

    savePanelPreferences(nextPrefs, mockStorage);
    expect(store.has(PANEL_PREFERENCES_STORAGE_KEY)).toBe(true);
    expect(loadPanelPreferences(mockStorage)).toEqual(nextPrefs);
  });

  it('gracefully falls back if storage throws SecurityError or QuotaExceededError', () => {
    const throwingStorage = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    };

    expect(loadPanelPreferences(throwingStorage)).toEqual(DEFAULT_PANEL_PREFERENCES);
    expect(() =>
      savePanelPreferences(DEFAULT_PANEL_PREFERENCES, throwingStorage)
    ).not.toThrow();
  });
});
