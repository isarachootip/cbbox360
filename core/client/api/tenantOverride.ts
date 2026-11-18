/**
 * tenantOverride.ts — Browser-side Workspace Switcher override for single-host / preview switching.
 * When `sysadmin` selects a tenant via `?tenant=<slug>` or the Sidebar Workspace Switcher,
 * all same-origin `/api/*` fetch calls automatically include `x-tenant-slug` without altering Subdomain mode.
 */

const STORAGE_KEY = 'cb360_active_tenant_slug';
let fetchPatched = false;

export const getTenantSlugOverride = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('tenant')?.trim().toLowerCase();
    if (fromQuery) {
      window.sessionStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }
    return window.sessionStorage.getItem(STORAGE_KEY)?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
};

export const setTenantSlugOverride = (slug: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    const clean = slug?.trim().toLowerCase() || '';
    if (!clean) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, clean);
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has('tenant')) {
      if (clean) url.searchParams.set('tenant', clean);
      else url.searchParams.delete('tenant');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
};

export const installTenantFetchInterceptor = (): void => {
  if (fetchPatched || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  fetchPatched = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const slug = getTenantSlugOverride();
    if (!slug) return nativeFetch(input, init);

    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isSameOriginApi =
      urlStr.startsWith('/api/') ||
      (typeof window.location?.origin === 'string' && urlStr.startsWith(`${window.location.origin}/api/`));

    if (!isSameOriginApi) return nativeFetch(input, init);

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('x-tenant-slug') && !headers.has('x-tenant-id')) {
      headers.set('x-tenant-slug', slug);
    }
    return nativeFetch(input, { ...init, headers });
  };
};
