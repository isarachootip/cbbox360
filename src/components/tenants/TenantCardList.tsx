import React from 'react';
import { ExternalLink, ArrowRightLeft, Download, RefreshCw, Power } from 'lucide-react';
import { AdminTenantRecord, suggestSubdomainBase, tenantAdminApi } from '../../services/tenantAdminApi';

interface TenantCardListProps {
  tenants: AdminTenantRecord[];
  activeTenantSlug: string;
  onSwitchWorkspace: (slug: string) => void;
  onToggleStatus: (tenant: AdminTenantRecord) => void;
  onResyncTemplate: (tenant: AdminTenantRecord) => void;
}

const renderCleanStatus = (status: AdminTenantRecord['status']) => {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Active</span>
      </span>
    );
  }
  if (status === 'provisioning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Provisioning</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      <span>Suspended</span>
    </span>
  );
};

export const TenantCardList: React.FC<TenantCardListProps> = ({
  tenants,
  activeTenantSlug,
  onSwitchWorkspace,
  onToggleStatus,
  onResyncTemplate,
}) => {
  const baseDomain = suggestSubdomainBase();

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-muted border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              <th className="px-4 py-3">องค์กร / Tenant</th>
              <th className="px-4 py-3">Template ธุรกิจ</th>
              <th className="px-4 py-3">Subdomain / URL</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider text-sm">
            {tenants.map((t) => {
              const isCurrent = t.slug === activeTenantSlug;
              const primaryHost =
                t.domains[0] || (t.slug !== 'default' ? `${t.slug}.${baseDomain}` : '');

              return (
                <tr
                  key={t.id}
                  className={
                    isCurrent
                      ? 'bg-brand-selected border-l-[3px] border-l-brand'
                      : 'hover:bg-bg-subtle transition-colors'
                  }
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: t.branding?.primaryColor || '#1F6FD1' }}
                        title={`สีหลัก: ${t.branding?.primaryColor || '#1F6FD1'}`}
                      />
                      <div>
                        <div className="font-semibold text-text-primary flex items-center gap-2">
                          <span>{t.name}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span>กำลังเปิดดู</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-text-secondary">slug: {t.slug}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="text-xs font-mono font-semibold text-text-primary">
                      {t.templateId || 'b2b_wholesale'}
                    </div>
                    <div className="text-[11px] text-text-secondary">v{t.templateVersion || '1.0.0'}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    {primaryHost ? (
                      <a
                        href={`https://${primaryHost}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-brand hover:underline"
                      >
                        <span>{primaryHost}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary">โดเมนหลักของระบบ (Default)</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">{renderCleanStatus(t.status)}</td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSwitchWorkspace(t.slug)}
                        disabled={isCurrent}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-bg-subtle text-text-primary disabled:opacity-50 cursor-pointer"
                        title="สลับหน้าเว็บปัจจุบันเพื่อเข้าดูและตั้งค่า Tenant นี้ทันที"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-brand" />
                        <span>{isCurrent ? 'ใช้งานอยู่' : 'สลับดูทันที'}</span>
                      </button>

                      {t.templateId && (
                        <button
                          type="button"
                          onClick={() => onResyncTemplate(t)}
                          className="p-1.5 rounded-lg border border-border bg-white hover:bg-bg-subtle text-text-secondary hover:text-brand cursor-pointer"
                          title="Sync ค่ามาตรฐานจาก Template ซ้ำ (ไม่ทับค่าที่ปรับแต่งเอง)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <a
                        href={tenantAdminApi.getExportYamlUrl(t.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-border bg-white hover:bg-bg-subtle text-text-secondary hover:text-brand"
                        title="ดาวน์โหลดไฟล์ template.yaml ของ Tenant นี้"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {t.slug !== 'default' && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(t)}
                          className="p-1.5 rounded-lg border border-border bg-white hover:bg-bg-subtle text-text-secondary hover:text-rose-600 cursor-pointer"
                          title={t.status === 'active' ? 'ระงับการใช้งานชั่วคราว' : 'เปิดใช้งานอีกครั้ง'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
