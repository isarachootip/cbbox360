/**
 * Auth mode:
 * - 'server': real login against /api/auth (default for production builds).
 * - 'demo'  : client-side mock accounts, for presales demos and local dev without a database.
 *             NOT secure — the server still rejects API calls without a real session.
 *
 * Override with VITE_AUTH_MODE=server|demo.
 */
export type AuthMode = 'server' | 'demo';

const explicit = import.meta.env.VITE_AUTH_MODE;

export const AUTH_MODE: AuthMode =
  explicit === 'server' || explicit === 'demo' ? explicit : import.meta.env.PROD ? 'server' : 'demo';

export const isServerAuth = AUTH_MODE === 'server';
