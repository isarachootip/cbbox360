import React, { useState } from 'react';
import { X, Building2, Globe, Sparkles } from 'lucide-react';
import {
  AdminTemplateMeta,
  CreateTenantPayload,
  suggestSubdomainBase,
} from '../../services/tenantAdminApi';

interface CreateTenantModalProps {
  isOpen: boolean;
  templates: AdminTemplateMeta[];
  onClose: () => void;
  onSubmit: (payload: CreateTenantPayload) => Promise<void>;
}

const sanitizeSlug = (val: string): string =>
  val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  templates,
  onClose,
  onSubmit,
}) => {
  const baseDomain = suggestSubdomainBase();
  const [template, setTemplate] = useState<string>(templates[0]?.id || 'hospital');
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('hospital');
  const [domain, setDomain] = useState<string>(`hospital.${baseDomain}`);
  const [domainTouched, setDomainTouched] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSlugChange = (raw: string) => {
    const clean = sanitizeSlug(raw);
    setSlug(clean);
    if (!domainTouched) setDomain(clean ? `${clean}.${baseDomain}` : '');
  };

  const handleTemplateSelect = (tplId: string) => {
    setTemplate(tplId);
    if (!name.trim() && tplId !== template) {
      const nextSlug = sanitizeSlug(tplId.replace(/_/g, '-'));
      setSlug(nextSlug);
      if (!domainTouched) setDomain(`${nextSlug}.${baseDomain}`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!slug || slug.length < 2) return setError('กรุณาระบุรหัส Slug อย่างน้อย 2 ตัวอักษร (a-z, 0-9, -)');
    if (!name.trim()) return setError('กรุณาระบุชื่อองค์กร / โรงพยาบาล / บริษัท');

    setSubmitting(true);
    try {
      await onSubmit({ slug, name: name.trim(), template, domain: domain.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง Tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-border rounded-2xl shadow-modal overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider bg-bg-muted">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-brand" />
            <h2 className="text-base font-bold text-text-primary">สร้างองค์กรใหม่ (Online Tenant)</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-text-secondary hover:text-text-primary rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs font-medium text-rose-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              1. เลือกชุดธุรกิจเริ่มต้น (Industry Template)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl) => {
                const active = tpl.id === template;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active ? 'border-brand bg-brand-tint' : 'border-border bg-white hover:bg-bg-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-text-primary truncate">{tpl.name}</span>
                      <Sparkles className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-brand' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-[11px] font-mono text-text-secondary mt-0.5">{tpl.id}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">2. ชื่อองค์กร / ลูกค้า</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น โรงพยาบาลเมดิคอลแคร์"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-brand"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">3. รหัส Tenant Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="hospital"
                className="w-full px-3 py-2 text-sm font-mono border border-border rounded-lg focus:outline-none focus:border-brand"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              4. Subdomain / Custom Domain สำหรับเข้าใช้งานจริง
            </label>
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-text-secondary absolute left-3" />
              <input
                type="text"
                value={domain}
                onChange={(e) => { setDomainTouched(true); setDomain(e.target.value); }}
                placeholder={`hospital.${baseDomain}`}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-border rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              ชี้ DNS CNAME ของ <span className="font-mono">{domain || `<slug>.${baseDomain}`}</span> มาที่ Server เพื่อเปิดผ่านโดเมนแยก หรือกด &ldquo;สลับดูทันที&rdquo; ได้เลย
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-divider">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-lg cursor-pointer">
              ยกเลิก
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg disabled:opacity-60 cursor-pointer">
              {submitting ? 'กำลังสร้าง Tenant...' : 'สร้าง Tenant ทันที'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
