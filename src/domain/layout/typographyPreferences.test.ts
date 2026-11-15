import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_TYPOGRAPHY_PREFERENCES,
  TYPOGRAPHY_PREFERENCES_STORAGE_KEY,
  parseTypographyPreferences,
  getUserFontScale,
  setUserFontScale,
  loadTypographyPreferences,
  saveTypographyPreferences,
} from './typographyPreferences';

describe('typographyPreferences domain logic', () => {
  it('returns default comfortable scale when raw input is null or empty', () => {
    expect(parseTypographyPreferences(null)).toEqual(DEFAULT_TYPOGRAPHY_PREFERENCES);
    expect(parseTypographyPreferences('')).toEqual(DEFAULT_TYPOGRAPHY_PREFERENCES);
    expect(DEFAULT_TYPOGRAPHY_PREFERENCES.defaultScale).toBe('comfortable');
  });

  it('falls back safely when JSON is malformed or contains invalid scale values', () => {
    expect(parseTypographyPreferences('{broken-json')).toEqual(DEFAULT_TYPOGRAPHY_PREFERENCES);
    expect(
      parseTypographyPreferences(JSON.stringify({ defaultScale: 'giant', byUser: 'invalid' }))
    ).toEqual(DEFAULT_TYPOGRAPHY_PREFERENCES);
  });

  it('keeps valid per-user entries while ignoring invalid user entries', () => {
    const raw = JSON.stringify({
      defaultScale: 'standard',
      byUser: {
        sysadmin: 'standard',
        wipa: 'large',
        corruptedUser: 'huge',
      },
    });

    expect(parseTypographyPreferences(raw)).toEqual({
      defaultScale: 'standard',
      byUser: {
        sysadmin: 'standard',
        wipa: 'large',
      },
    });
  });

  it('resolves font scale per username and isolates preferences across users', () => {
    let prefs = DEFAULT_TYPOGRAPHY_PREFERENCES;
    expect(getUserFontScale(prefs, undefined)).toBe('comfortable');
    expect(getUserFontScale(prefs, 'wipa')).toBe('comfortable');

    prefs = setUserFontScale(prefs, 'large', 'wipa');
    prefs = setUserFontScale(prefs, 'standard', 'sysadmin');

    expect(getUserFontScale(prefs, 'wipa')).toBe('large');
    expect(getUserFontScale(prefs, 'sysadmin')).toBe('standard');
    expect(getUserFontScale(prefs, 'kitti')).toBe('comfortable');

    // Updating without username updates device defaultScale
    prefs = setUserFontScale(prefs, 'standard', undefined);
    expect(getUserFontScale(prefs, undefined)).toBe('standard');
    expect(getUserFontScale(prefs, 'wipa')).toBe('large');
  });

  it('loads and saves preferences via injected storage safely', () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };

    const updated = setUserFontScale(DEFAULT_TYPOGRAPHY_PREFERENCES, 'large', 'wipa');
    saveTypographyPreferences(updated, mockStorage);

    expect(store.has(TYPOGRAPHY_PREFERENCES_STORAGE_KEY)).toBe(true);
    expect(loadTypographyPreferences(mockStorage)).toEqual(updated);
  });

  it('gracefully handles storage SecurityError and QuotaExceededError', () => {
    const throwingStorage = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    };

    expect(loadTypographyPreferences(throwingStorage)).toEqual(DEFAULT_TYPOGRAPHY_PREFERENCES);
    expect(() =>
      saveTypographyPreferences(DEFAULT_TYPOGRAPHY_PREFERENCES, throwingStorage)
    ).not.toThrow();
  });
});
