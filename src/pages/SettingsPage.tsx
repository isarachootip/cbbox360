import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Bot,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useBot } from '../context/BotContext';
import { useCannedResponses } from '../context/CannedResponseContext';
import { useToast } from '../context/ToastContext';
import { BotAutoReplyRule, CannedResponse } from '../types';
import { OverviewTab } from '../components/settings/tabs/OverviewTab';
import { BusinessHoursTab } from '../components/settings/tabs/BusinessHoursTab';
import { BotAutoReplyTab } from '../components/canned-responses/BotAutoReplyTab';
import { BotRuleModal, BotRuleFormData } from '../components/canned-responses/BotRuleModal';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'bot' | 'hours'>(
    initialTab === 'bot' ? 'bot' : initialTab === 'hours' ? 'hours' : 'overview'
  );

  const {
    settings,
    toggleBot,
    addRule,
    updateRule,
  } = useBot();

  const { cannedResponses } = useCannedResponses();
  const { showToast } = useToast();

  // Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalMode, setRuleModalMode] = useState<'create' | 'edit'>('create');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormData, setRuleFormData] = useState<BotRuleFormData>({
    name: '',
    triggerType: 'keyword',
    keywordsStr: '',
    matchType: 'contains',
    cannedResponseId: '',
    customReplyText: '',
    isActive: true,
    priority: 10,
  });

  const handleTabChange = (tab: 'overview' | 'bot' | 'hours') => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const handleOpenAddRule = (presetCanned?: CannedResponse) => {
    setRuleModalMode('create');
    setEditingRuleId(null);
    setRuleFormData({
      name: presetCanned ? `ตอบอัตโนมัติ: ${presetCanned.title}` : '',
      triggerType: 'keyword',
      keywordsStr: presetCanned ? (presetCanned.tags?.join(', ') || presetCanned.shortcut.replace('/', '')) : '',
      matchType: 'contains',
      cannedResponseId: presetCanned ? presetCanned.id : (cannedResponses[0]?.id || ''),
      customReplyText: '',
      isActive: true,
      priority: settings.rules.length + 1,
    });
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: BotAutoReplyRule) => {
    setRuleModalMode('edit');
    setEditingRuleId(rule.id);
    setRuleFormData({
      name: rule.name,
      triggerType: rule.triggerType as any,
      keywordsStr: rule.keywords.join(', '),
      matchType: rule.matchType,
      cannedResponseId: rule.cannedResponseId || '',
      customReplyText: rule.customReplyText || '',
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleFormData.name.trim()) {
      showToast('กรุณาระบุชื่อกฎ Auto-Reply', 'error');
      return;
    }
    const keywords = ruleFormData.keywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      showToast('กรุณาระบุคำสำคัญ (Keywords) อย่างน้อย 1 คำ', 'error');
      return;
    }

    const payload = {
      name: ruleFormData.name.trim(),
      triggerType: ruleFormData.triggerType,
      keywords,
      matchType: ruleFormData.matchType,
      cannedResponseId: ruleFormData.cannedResponseId || undefined,
      customReplyText: ruleFormData.customReplyText.trim() || undefined,
      isActive: ruleFormData.isActive,
      priority: Number(ruleFormData.priority) || 1,
    };

    if (ruleModalMode === 'create') {
      addRule(payload);
    } else if (editingRuleId) {
      updateRule(editingRuleId, payload);
    }
    setIsRuleModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-app overflow-y-auto custom-scrollbar select-none">
      <PageHeader
        title="ตั้งค่าระบบ (System Settings)"
        subtitle="ศูนย์ควบคุมการตั้งค่าระบบ สิทธิ์ผู้ใช้ บอทตอบกลับอัตโนมัติ และการเชื่อมต่อทุกช่องทาง"
        actionButton={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                settings.isEnabled ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{settings.isEnabled ? '● Bot Auto-Reply ทำงาน' : '● Bot พักการทำงาน'}</span>
            </span>
            <button
              onClick={toggleBot}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                settings.isEnabled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-brand hover:bg-brand-hover text-white'
              }`}
            >
              {settings.isEnabled ? 'ปิดใช้งานชั่วคราว' : 'เปิดใช้งานบอท'}
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-[1440px] w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-brand text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>ภาพรวมการตั้งค่า (Overview)</span>
          </button>

          <button
            onClick={() => handleTabChange('bot')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'bot'
                ? 'bg-brand text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>🤖 ตั้งค่า Bot ตอบอัตโนมัติ (Auto-Reply Engine)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                settings.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {settings.rules.filter((r) => r.isActive).length} กฎ
            </span>
          </button>

          <button
            onClick={() => handleTabChange('hours')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'hours'
                ? 'bg-brand text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>เวลาทำการ & ส่งต่องาน (Business Hours)</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <OverviewTab
            cannedResponses={cannedResponses}
            onSwitchToBotTab={() => handleTabChange('bot')}
            onSwitchToHoursTab={() => handleTabChange('hours')}
          />
        )}

        {activeTab === 'bot' && (
          <BotAutoReplyTab
            cannedResponses={cannedResponses}
            onOpenAddBotRule={handleOpenAddRule}
            onOpenEditBotRule={handleOpenEditRule}
          />
        )}

        {activeTab === 'hours' && <BusinessHoursTab />}
      </div>

      {/* Add / Edit Rule Modal */}
      <BotRuleModal
        isOpen={isRuleModalOpen}
        mode={ruleModalMode}
        formData={ruleFormData}
        setFormData={setRuleFormData}
        cannedResponses={cannedResponses}
        onClose={() => setIsRuleModalOpen(false)}
        onSubmit={handleSaveRule}
      />
    </div>
  );
};
