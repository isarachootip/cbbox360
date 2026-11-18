import { TenantBranding } from '../../core/client/providers/tenantRuntimeTypes';

export interface AdminTemplateMeta {
  id: string;
  name: string;
  industry: string;
  version: string;
  description?: string;
}

export interface AdminTenantRecord {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended' | 'provisioning';
  templateId: string | null;
  templateVersion: string;
  isolationMode: 'shared_db' | 'dedicated_db';
  domains: string[];
  branding: TenantBranding;
}

export interface CreateTenantPayload {
  slug: string;
  name: string;
  template: string;
  domain?: string;
  adminUsername?: string;
  adminPassword?: string;
}

export const suggestSubdomainBase = (): string => {
  if (typeof window === 'undefined') return 'cbox360.online';
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.cbox360.online') || host === 'cbox360.online') return 'cbox360.online';
  if (host.endsWith('.cb360.online') || host === 'cb360.online') return 'cb360.online';
  return 'cbox360.online';
};

export const tenantAdminApi = {
  async listTemplates(): Promise<AdminTemplateMeta[]> {
    const res = await fetch('/api/admin/templates', { credentials: 'include' });
    if (!res.ok) throw new Error('ไม่สามารถโหลดรายการ Industry Templates ได้');
    const data = await res.json();
    return Array.isArray(data.templates) ? data.templates : [];
  },

  async listTenants(): Promise<AdminTenantRecord[]> {
    const res = await fetch('/api/admin/tenants', { credentials: 'include' });
    if (!res.ok) throw new Error('ไม่สามารถโหลดรายการ Tenant ได้');
    const data = await res.json();
    return Array.isArray(data.tenants) ? data.tenants : [];
  },

  async createTenant(payload: CreateTenantPayload): Promise<void> {
    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'สร้าง Tenant ไม่สำเร็จ');
    }
  },

  async patchTenant(
    slug: string,
    patch: { name?: string; status?: 'active' | 'suspended'; domain?: string }
  ): Promise<void> {
    const res = await fetch(`/api/admin/tenants/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'อัปเดตข้อมูล Tenant ไม่สำเร็จ');
    }
  },

  async reimportTemplate(slug: string, templateName: string): Promise<void> {
    const res = await fetch(`/api/admin/tenants/${encodeURIComponent(slug)}/template/import`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: templateName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'อัปเดต Template ไม่สำเร็จ');
    }
  },

  getExportYamlUrl(slug: string): string {
    return `/api/admin/tenants/${encodeURIComponent(slug)}/template/export`;
  },
};
