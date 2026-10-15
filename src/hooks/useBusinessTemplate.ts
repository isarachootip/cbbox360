import { useState, useEffect } from 'react';
import {
  BusinessTemplateId,
  BusinessTemplatePreset,
  ConnectorConfig,
  TemplateApplyOptions,
  UserRole,
} from '../types';
import { businessTemplates } from '../data/businessTemplates';
import { initialConnectors } from '../data/connectors';
import { useBot } from '../context/BotContext';
import { useCannedResponses } from '../context/CannedResponseContext';
import { useMenu } from '../context/MenuContext';
import { useToast } from '../context/ToastContext';

const TEMPLATE_STORAGE_KEY = 'cb360_business_template_state';
const CONNECTORS_STORAGE_KEY = 'cb360_connectors_config';
const DEFAULT_OPERATIONAL_ROLES: UserRole[] = ['sysadmin', 'admin', 'supervisor', 'SF_1', 'SF_2'];

interface StoredTemplateState {
  activeTemplateId: BusinessTemplateId;
  appliedTemplateIds: BusinessTemplateId[];
  lastAppliedAt?: string;
}

export const useBusinessTemplate = () => {
  const { settings: botSettings, updateSettings: updateBotSettings } = useBot();
  const { cannedResponses, createCannedResponse } = useCannedResponses();
  const { menus, updateMenu, resetToDefaults: resetMenus } = useMenu();
  const { showToast } = useToast();

  const [state, setState] = useState<StoredTemplateState>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredTemplateState;
        if (parsed && parsed.activeTemplateId) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse business template state', e);
    }
    return { activeTemplateId: 'b2b_wholesale', appliedTemplateIds: ['b2b_wholesale'] };
  });

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save business template state', e);
    }
  }, [state]);

  const applyTemplate = async (
    templateId: BusinessTemplateId,
    options: TemplateApplyOptions = {
      mergeConnectors: true,
      mergeCannedResponses: true,
      mergeBotRules: true,
      enableRecommendedMenus: true,
    }
  ) => {
    const preset: BusinessTemplatePreset | undefined = businessTemplates.find(
      (t) => t.id === templateId
    );
    if (!preset) return;

    let addedConnectorsCount = 0;
    let addedCannedCount = 0;
    let addedRulesCount = 0;

    if (options.mergeConnectors && preset.connectors.length > 0) {
      try {
        const raw = localStorage.getItem(CONNECTORS_STORAGE_KEY);
        const currentConnectors: ConnectorConfig[] = raw
          ? (JSON.parse(raw) as ConnectorConfig[])
          : initialConnectors;

        const existingIds = new Set(currentConnectors.map((c) => c.id));
        const newConnectors = preset.connectors.filter((c) => !existingIds.has(c.id));
        addedConnectorsCount = newConnectors.length;

        if (newConnectors.length > 0) {
          const merged = [...currentConnectors, ...newConnectors];
          localStorage.setItem(CONNECTORS_STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (e) {
        console.error('Failed to merge connectors', e);
      }
    }

    const shortcutToIdMap = new Map<string, string>();
    cannedResponses.forEach((cr) => shortcutToIdMap.set(cr.shortcut.toLowerCase(), cr.id));

    if (options.mergeCannedResponses && preset.cannedResponses.length > 0) {
      for (const item of preset.cannedResponses) {
        const key = item.shortcut.toLowerCase();
        if (!shortcutToIdMap.has(key)) {
          const created = await createCannedResponse({
            title: item.title,
            shortcut: item.shortcut,
            category: item.category,
            content: item.content,
            tags: item.tags,
            isActive: item.isActive,
          });
          shortcutToIdMap.set(key, created.id);
          addedCannedCount += 1;
        }
      }
    }

    if (options.mergeBotRules && preset.botRules.length > 0) {
      const existingRuleNames = new Set(botSettings.rules.map((r) => r.name));
      const newRules = preset.botRules
        .filter((r) => !existingRuleNames.has(r.name))
        .map((r, index) => {
          const templateCr = preset.cannedResponses.find((c) => c.id === r.cannedResponseId);
          const resolvedCrId = templateCr
            ? shortcutToIdMap.get(templateCr.shortcut.toLowerCase()) || r.cannedResponseId
            : r.cannedResponseId;

          return {
            ...r,
            id: `${r.id}-${Date.now()}-${index}`,
            cannedResponseId: resolvedCrId,
            priority: botSettings.rules.length + index + 1,
          };
        });

      addedRulesCount = newRules.length;
      if (newRules.length > 0) {
        updateBotSettings({ rules: [...botSettings.rules, ...newRules] });
      }
    }

    if (options.enableRecommendedMenus && preset.recommendedMenus.length > 0) {
      preset.recommendedMenus.forEach((menuId) => {
        const target = menus.find((m) => m.id === menuId);
        if (target) {
          const nextRoles: UserRole[] = Array.from(
            new Set<UserRole>([...target.allowedRoles, ...DEFAULT_OPERATIONAL_ROLES])
          );
          updateMenu(menuId, { allowedRoles: nextRoles });
        }
      });
    }

    const nowStr = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setState((prev) => ({
      activeTemplateId: templateId,
      appliedTemplateIds: Array.from(new Set([...prev.appliedTemplateIds, templateId])),
      lastAppliedAt: `วันนี้ ${nowStr} น.`,
    }));

    showToast(
      `ติดตั้งเทมเพลต "${preset.name}" สำเร็จ (+${addedConnectorsCount} API, +${addedCannedCount} ข้อความ, +${addedRulesCount} กฎบอท)`,
      'success'
    );
  };

  const resetToDefaultTemplate = () => {
    try {
      localStorage.setItem(CONNECTORS_STORAGE_KEY, JSON.stringify(initialConnectors));
      const cleanedRules = botSettings.rules.filter(
        (r) =>
          !r.name.startsWith('[Hospital]') &&
          !r.name.startsWith('[Logistics]') &&
          !r.name.startsWith('[Auto Service]')
      );
      updateBotSettings({ rules: cleanedRules });
      resetMenus();
      setState({
        activeTemplateId: 'b2b_wholesale',
        appliedTemplateIds: ['b2b_wholesale'],
        lastAppliedAt: undefined,
      });
      showToast('รีเซ็ตกลับเป็นค่าเริ่มต้น (B2B Wholesale) เรียบร้อยแล้ว', 'info');
    } catch (e) {
      console.error('Failed to reset template', e);
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
