import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenantRuntime } from '../../../core/client/providers/TenantRuntimeContext';
import { AdminTenantRecord, tenantAdminApi } from '../../services/tenantAdminApi';

interface TenantWorkspaceSwitcherProps {
  isCollapsed?: boolean;
}

export const TenantWorkspaceSwitcher: React.FC<TenantWorkspaceSwitcherProps> = ({
  isCollapsed = false,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tenantSlug, tenantName, branding, switchTenantWorkspace } = useTenantRuntime();
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<AdminTenantRecord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSysAdmin = currentUser?.role === 'sysadmin';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isSysAdmin || !isOpen) return;
    tenantAdminApi
      .listTenants()
      .then(setTenants)
      .catch(() => {
        // Silent fallback in offline/mock mode
      });
  }, [isSysAdmin, isOpen]);

  if (!isSysAdmin) return null;

  return (
    <div ref={containerRef} className="relative px-0.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`องค์กรปัจจุบัน: ${tenantName} (${tenantSlug})`}
        className={`w-full flex items-center rounded-xl bg-white/85 hover:bg-white border border-sidebar-border/80 transition-all text-left shadow-2xs cursor-pointer ${
          isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-2'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg border border-border bg-slate-50 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: branding.primaryColor || '#059669' }}
                  />
                  <span>TENANT · {tenantSlug.toUpperCase()}</span>
                </span>
              </div>
              <div className="text-xs font-bold text-text-primary truncate">{tenantName}</div>
            </div>
          )}
        </div>
        {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0" />}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 bg-white border border-border rounded-xl shadow-modal p-2 z-50 space-y-1 ${
            isCollapsed ? 'left-0 w-[260px]' : 'left-0 right-0'
          }`}
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-text-secondary border-b border-divider">
            สลับองค์กร / Online Tenant
          </div>
          <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar pt-0.5">
            {tenants.map((t) => {
              const current = t.slug === tenantSlug;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    void switchTenantWorkspace(t.slug === 'default' ? null : t.slug);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    current ? 'bg-brand-tint text-brand' : 'hover:bg-bg-subtle text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.branding?.primaryColor || '#1F6FD1' }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{t.name}</div>
                      <div className="text-[10px] font-mono text-text-secondary truncate">
                        {t.slug} · {t.templateId || 'default'}
                      </div>
                    </div>
                  </div>
                  {current && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="pt-1.5 border-t border-divider">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/tenants');
              }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-brand hover:bg-bg-subtle cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้าง / จัดการ Tenant ทั้งหมด</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
