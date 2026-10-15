import {
  BusinessTemplateId,
  MenuItemConfig,
  TemplateApplyOptions,
  UserRole,
} from '../types';
import { businessTemplates } from '../data/businessTemplates';
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
  buildRulesToAdd,
  computeMenuGrants,
  removeTemplateConnectors,
  removeTemplateRules,
  revertMenuGrants,
  selectNewCannedResponses,
  selectNewConnectors,
} from '../domain/templates/templateMerge';

const DEFAULT_OPERATIONAL_ROLES: UserRole[] = ['sysadmin', 'admin', 'supervisor', 'SF_1', 'SF_2'];

const DEFAULT_OPTIONS: TemplateApplyOptions = {
  mergeConnectors: true,
  mergeCannedResponses: true,
  mergeBotRules: true,
  enableRecommendedMenus: true,
};

/** Orchestrates applying / resetting templates across connectors, canned responses, bot rules and menus. */
export const useBusinessTemplate = () => {
  const { settings: botSettings, updateSettings: updateBotSettings } = useBot();
  const { cannedResponses, createCannedResponse, deleteCannedResponse } = useCannedResponses();
  const { menus, updateMenu } = useMenu();
  const { showToast } = useToast();
  const { state, recordApplied, resetState } = useBusinessTemplateState();

  const persistMenuChanges = (next: MenuItemConfig[]) => {
    next.forEach((m, i) => {
      if (m !== menus[i]) updateMenu(m.id, { allowedRoles: m.allowedRoles });
    });
  };

  const applyTemplate = async (
    templateId: BusinessTemplateId,
    options: TemplateApplyOptions = DEFAULT_OPTIONS
  ) => {
    const preset = businessTemplates.find((t) => t.id === templateId);
    if (!preset) return;
    const added: TemplateAddedResources = { ...EMPTY_ADDED_RESOURCES };

    if (options.mergeConnectors) {
      const current = loadStoredConnectors();
      const newConnectors = selectNewConnectors(current, preset);
      if (newConnectors.length > 0) saveStoredConnectors([...current, ...newConnectors]);
      added.connectorIds = newConnectors.map((c) => c.id);
    }

    const shortcutToId = new Map(cannedResponses.map((c) => [c.shortcut.toLowerCase(), c.id]));
    if (options.mergeCannedResponses) {
      const toCreate = selectNewCannedResponses(cannedResponses.map((c) => c.shortcut), preset);
      const createdIds: string[] = [];
      for (const item of toCreate) {
        const created = await createCannedResponse({
          title: item.title,
          shortcut: item.shortcut,
          category: item.category,
          content: item.content,
          tags: item.tags,
          isActive: item.isActive,
        });
        shortcutToId.set(item.shortcut.toLowerCase(), created.id);
        createdIds.push(created.id);
      }
      added.cannedResponseIds = createdIds;
    }

    if (options.mergeBotRules) {
      const newRules = buildRulesToAdd(botSettings.rules, preset, shortcutToId, Date.now());
      if (newRules.length > 0) updateBotSettings({ rules: [...botSettings.rules, ...newRules] });
      added.ruleIds = newRules.map((r) => r.id);
    }

    if (options.enableRecommendedMenus) {
      const grants = computeMenuGrants(menus, preset.recommendedMenus, DEFAULT_OPERATIONAL_ROLES);
      persistMenuChanges(applyMenuGrants(menus, grants));
      added.menuGrants = grants;
    }

    recordApplied(templateId, added);
    showToast(
      `ติดตั้งเทมเพลต "${preset.name}" สำเร็จ (+${added.connectorIds.length} API, +${added.cannedResponseIds.length} ข้อความ, +${added.ruleIds.length} กฎบอท)`,
      'success'
    );
  };

  /** Removes only what templates added. User-edited connectors, own rules and own menu roles are kept. */
  const resetToDefaultTemplate = async () => {
    try {
      const tracked = state.addedResources;
      saveStoredConnectors(
        removeTemplateConnectors(loadStoredConnectors(), businessTemplates, tracked.connectorIds)
      );
      const remainingRules = removeTemplateRules(botSettings.rules, businessTemplates, tracked.ruleIds);
      if (remainingRules.length !== botSettings.rules.length) {
        updateBotSettings({ rules: remainingRules });
      }
      const existingCannedIds = new Set(cannedResponses.map((c) => c.id));
      for (const id of tracked.cannedResponseIds) {
        if (existingCannedIds.has(id)) await deleteCannedResponse(id);
      }
      persistMenuChanges(revertMenuGrants(menus, tracked.menuGrants));
      resetState();
      showToast('ลบรายการที่มาจากเทมเพลตแล้ว (การตั้งค่าที่คุณแก้เองยังอยู่ครบ)', 'info');
    } catch (e) {
      console.error('Failed to reset template', e);
      showToast('รีเซ็ตเทมเพลตไม่สำเร็จ', 'error');
    }
  };

  return {
    templates: businessTemplates,
    activeTemplateId: state.activeTemplateId,
    appliedTemplateIds: state.appliedTemplateIds,
    lastAppliedAt: state.lastAppliedAt,
    applyTemplate,
    resetToDefaultTemplate,
  };
};
