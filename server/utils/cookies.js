/**
 * cookies.js — minimal cookie parsing/serialisation for the session cookie
 * (avoids adding a cookie-parser dependency for a single cookie).
 */
export const SESSION_COOKIE = 'cb360_session';

export const parseCookies = (header) => {
  if (!header) return {};
  return String(header)
    .split(';')
    .reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const raw = part.slice(idx + 1).trim();
      try {
        acc[key] = decodeURIComponent(raw);
      } catch {
        acc[key] = raw;
      }
      return acc;
    }, {});
};

const baseAttributes = (secure) => ['Path=/', 'HttpOnly', 'SameSite=Lax', ...(secure ? ['Secure'] : [])];

/** SameSite=Lax blocks the cookie on cross-site POST/PUT/DELETE, which covers CSRF for this API. */
export const serializeSessionCookie = (token, { maxAgeSeconds, secure }) =>
  [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, `Max-Age=${maxAgeSeconds}`, ...baseAttributes(secure)].join('; ');

export const serializeClearedCookie = ({ secure }) =>
  [`${SESSION_COOKIE}=`, 'Max-Age=0', ...baseAttributes(secure)].join('; ');
