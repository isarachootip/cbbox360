import {
  BusinessTemplateId,
  DeploymentMode,
  MenuItemConfig,
  TemplateApplyOptions,
  UserRole,
} from '../types';
import { businessTemplates } from '../data/businessTemplates';
import { useAuth } from '../context/AuthContext';
import { useBot } from '../context/BotContext';
import { useCannedResponses } from '../context/CannedResponseContext';
import { useMenu } from '../context/MenuContext';
import { useToast } from '../context/ToastContext';
import { useBusinessTemplateState } from '../context/BusinessTemplateContext';
import { loadStoredConnectors, saveStoredConnectors } from '../services/connectorStorage';
import {
  EMPTY_ADDED_RESOURCES,
  TemplateAddedResources,
  applyMenuGrants,
  computeMenuGrants,
  removeTemplateConnectors,
  revertMenuGrants,
  selectNewConnectors,
} from '../domain/templates/templateMerge';

const DEFAULT_OPERATIONAL_ROLES: UserRole[] = ['sysadmin', 'admin', 'supervisor', 'SF_1', 'SF_2'];
const ROLES_BY_TEMPLATE: Partial<Record<BusinessTemplateId, UserRole[]>> = {
  hospital: [...DEFAULT_OPERATIONAL_ROLES, 'doctor', 'nurse'],
};

const DEFAULT_OPTIONS: TemplateApplyOptions = {
  mergeConnectors: true,
  mergeCannedResponses: true,
  mergeBotRules: true,
  enableRecommendedMenus: true,
  mergeKnowledgeBase: true,
};

/** Orchestrates scoped business switching, Production Lock (sysadmin), and preset resets. */
export const useBusinessTemplate = () => {
  const { currentUser } = useAuth();
  const { resetBusinessBotData } = useBot();
  const { resetBusinessCannedResponses } = useCannedResponses();
  const { menus, updateMenu } = useMenu();
  const { showToast } = useToast();
  const {
    state,
    switchBusiness: setContextBusiness,
    setDeploymentMode: setContextMode,
    recordApplied,
    resetState,
  } = useBusinessTemplateState();

  const isSysAdmin = currentUser?.role === 'sysadmin';
  const isLocked = state.deploymentMode === 'production_locked';

  const persistMenuChanges = (next: MenuItemConfig[]) => {
    next.forEach((m, i) => {
      if (m !== menus[i]) updateMenu(m.id, { allowedRoles: m.allowedRoles });
    });
  };

  const applyTemplate = async (
    templateId: BusinessTemplateId,
    options: TemplateApplyOptions = DEFAULT_OPTIONS
  ) => {
    if (isLocked && templateId !== state.activeTemplateId) {
      showToast('ระบบถูกล็อกโหมดใช้งานจริงไว้ กรุณาให้ sysadmin ปลดล็อกก่อนเปลี่ยนธุรกิจ', 'warning');
      return;
    }
    const preset = businessTemplates.find((t) => t.id === templateId);
    if (!preset) return;
    const added: TemplateAddedResources = { ...EMPTY_ADDED_RESOURCES };

    if (options.mergeConnectors) {
      const current = loadStoredConnectors();
      const newConnectors = selectNewConnectors(current, preset);
      if (newConnectors.length > 0) saveStoredConnectors([...current, ...newConnectors]);
      added.connectorIds = newConnectors.map((c) => c.id);
    }

    if (options.enableRecommendedMenus) {
      const roles = ROLES_BY_TEMPLATE[templateId] ?? DEFAULT_OPERATIONAL_ROLES;
      const grants = computeMenuGrants(menus, preset.recommendedMenus, roles);
      persistMenuChanges(applyMenuGrants(menus, grants));
      added.menuGrants = grants;
    }

    recordApplied(templateId, added);
    showToast(
      `สลับโหมดธุรกิจเป็น "${preset.thaiTitle}" เรียบร้อยแล้ว (เปลี่ยนชุดข้อความ, Keyword, KM และเมนูเฉพาะทาง)`,
      'success'
    );
  };

  const quickSwitchBusiness = (templateId: BusinessTemplateId) => {
    if (isLocked) {
      showToast('ระบบถูกล็อกสำหรับใช้งานจริง (Production Locked)', 'warning');
      return;
    }
    const preset = businessTemplates.find((t) => t.id === templateId);
    if (!preset) return;
    const ok = setContextBusiness(templateId);
    if (ok) {
      const current = loadStoredConnectors();
      const newConnectors = selectNewConnectors(current, preset);
      if (newConnectors.length > 0) saveStoredConnectors([...current, ...newConnectors]);
      showToast(`สลับเป็นธุรกิจ "${preset.name}" สำเร็จ`, 'success');
    }
  };

  const setDeploymentMode = (mode: DeploymentMode) => {
    if (!isSysAdmin) {
      showToast('เฉพาะผู้ดูแลระบบสูงสุด (sysadmin) เท่านั้นที่ตั้งค่าล็อกธุรกิจได้', 'error');
      return;
    }
    const ok = setContextMode(mode, currentUser?.role);
    if (ok) {
      showToast(
        mode === 'production_locked'
          ? 'ล็อกประเภทธุรกิจสำหรับใช้งานจริงแล้ว (ซ่อนตัวสลับธุรกิจ Demo ทั้งหมด)'
          : 'เปิดโหมดสาธิตหลายธุรกิจ (Demo Mode) แล้ว',
        mode === 'production_locked' ? 'success' : 'info'
      );
    }
  };

  const resetToDefaultTemplate = async () => {
    if (isLocked) {
      showToast('กรุณาปลดล็อก Production Lock ก่อนรีเซ็ตเทมเพลต', 'warning');
      return;
    }
    try {
      const activeId = state.activeTemplateId;
      saveStoredConnectors(
        removeTemplateConnectors(
          loadStoredConnectors(),
          businessTemplates,
          state.addedResources.connectorIds
        )
      );
      resetBusinessCannedResponses(activeId);
      resetBusinessBotData(activeId);
      persistMenuChanges(revertMenuGrants(menus, state.addedResources.menuGrants));
      if (activeId === 'b2b_wholesale') resetState();
      showToast('รีเซ็ตข้อความตอบกลับ, กฎ Keyword และ KM ของธุรกิจปัจจุบันเป็นค่ามาตรฐานแล้ว', 'info');
    } catch (e) {
      console.error('Failed to reset template', e);
      showToast('รีเซ็ตเทมเพลตไม่สำเร็จ', 'error');
    }
  };

  return {
    templates: businessTemplates,
    activeTemplateId: state.activeTemplateId,
    deploymentMode: state.deploymentMode,
    isLocked,
    isSysAdmin,
    appliedTemplateIds: state.appliedTemplateIds,
    lastAppliedAt: state.lastAppliedAt,
    applyTemplate,
    quickSwitchBusiness,
    setDeploymentMode,
    resetToDefaultTemplate,
  };
};
