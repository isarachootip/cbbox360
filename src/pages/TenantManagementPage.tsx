import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, RotateCcw } from 'lucide-react';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';
import { useToast } from '../context/ToastContext';
import {
  AdminTemplateMeta,
  AdminTenantRecord,
  CreateTenantPayload,
  tenantAdminApi,
} from '../services/tenantAdminApi';
import { TenantCardList } from '../components/tenants/TenantCardList';
import { CreateTenantModal } from '../components/tenants/CreateTenantModal';

export const TenantManagementPage: React.FC = () => {
  const { tenantSlug, activeOverrideSlug, switchTenantWorkspace } = useTenantRuntime();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<AdminTenantRecord[]>([]);
  const [templates, setTemplates] = useState<AdminTemplateMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tplList, tntList] = await Promise.all([
        tenantAdminApi.listTemplates(),
        tenantAdminApi.listTenants(),
      ]);
      setTemplates(tplList);
      setTenants(tntList);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'โหลดข้อมูล Tenant ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateTenant = async (payload: CreateTenantPayload) => {
    await tenantAdminApi.createTenant(payload);
    showToast(`สร้าง Tenant "${payload.name}" (${payload.slug}) เรียบร้อยแล้ว`, 'success');
    await loadData();
    await switchTenantWorkspace(payload.slug);
  };

  const handleSwitchWorkspace = async (slug: string) => {
    await switchTenantWorkspace(slug === 'default' ? null : slug);
    showToast(`สลับเข้าสู่องค์กร "${slug}" เรียบร้อยแล้ว`, 'success');
  };

  const handleToggleStatus = async (tenant: AdminTenantRecord) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await tenantAdminApi.patchTenant(tenant.slug, { status: nextStatus });
      showToast(`อัปเดตสถานะ ${tenant.name} เป็น ${nextStatus} แล้ว`, 'success');
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เปลี่ยนสถานะไม่สำเร็จ', 'error');
    }
  };

  const handleResyncTemplate = async (tenant: AdminTenantRecord) => {
    if (!tenant.templateId) return;
    try {
      await tenantAdminApi.reimportTemplate(tenant.slug, tenant.templateId);
      showToast(`Sync Template "${tenant.templateId}" ให้ ${tenant.name} เรียบร้อย`, 'success');
      await loadData();
      if (tenant.slug === tenantSlug) {
        await switchTenantWorkspace(activeOverrideSlug);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sync Template ไม่สำเร็จ', 'error');
    }
  };

  const activeCount = tenants.filter((t) => t.status === 'active').length;
  const domainCount = tenants.reduce((sum, t) => sum + t.domains.length, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" />
            <h1 className="text-xl font-bold text-text-primary">จัดการองค์กร &amp; Online Tenants</h1>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            สร้างลูกค้าใหม่จาก Industry Template (เช่น โรงพยาบาล, ประกันภัย, E-commerce) พร้อมผูก Subdomain{' '}
            <span className="font-mono">*.cbox360.online</span> หรือกดสลับดูบนหน้าเว็บได้ทันที
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeOverrideSlug && (
            <button
              type="button"
              onClick={() => void handleSwitchWorkspace('default')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border bg-white hover:bg-bg-subtle text-text-primary rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>กลับสู่โดเมนหลัก</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้าง Tenant ใหม่</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="text-xs text-text-secondary">Tenant ทั้งหมด</div>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">{tenants.length}</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="text-xs text-text-secondary">เปิดใช้งานอยู่</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="text-xs text-text-secondary">Custom Domains ที่ผูกไว้</div>
          <div className="text-2xl font-bold font-mono text-brand mt-1">{domainCount}</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="text-xs text-text-secondary">Industry Templates พร้อมใช้</div>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">{templates.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
          กำลังโหลดข้อมูลองค์กร...
        </div>
      ) : (
        <TenantCardList
          tenants={tenants}
          activeTenantSlug={tenantSlug}
          onSwitchWorkspace={(slug) => void handleSwitchWorkspace(slug)}
          onToggleStatus={(t) => void handleToggleStatus(t)}
          onResyncTemplate={(t) => void handleResyncTemplate(t)}
        />
      )}

      <CreateTenantModal
        isOpen={isModalOpen}
        templates={templates}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTenant}
      />
    </div>
  );
};
