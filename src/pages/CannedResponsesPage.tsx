import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquareText,
  Plus,
  Bot,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useCannedResponses, CATEGORIES_CONFIG } from '../context/CannedResponseContext';
import { useBot } from '../context/BotContext';
import { useToast } from '../context/ToastContext';
import { CannedResponse, CannedResponseCategory, BotAutoReplyRule } from '../types';
import { useCannedResponseFilter } from '../hooks/useCannedResponseFilter';
import { CannedResponsesTab } from '../components/canned-responses/CannedResponsesTab';
import { BotAutoReplyTab } from '../components/canned-responses/BotAutoReplyTab';
import { CannedResponseModal, CannedResponseFormData } from '../components/canned-responses/CannedResponseModal';
import { CannedResponseDeleteModal } from '../components/canned-responses/CannedResponseDeleteModal';
import { BotRuleModal, BotRuleFormData } from '../components/canned-responses/BotRuleModal';

export const CannedResponsesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'bot' ? 'bot' : 'templates';
  const setActiveTab = (tab: 'templates' | 'bot') => {
    setSearchParams(tab === 'bot' ? { tab: 'bot' } : {});
  };

  const {
    settings: botSettings,
    toggleBot,
    addRule: addBotRule,
    updateRule: updateBotRule,
  } = useBot();

  const {
    cannedResponses,
    createCannedResponse,
    updateCannedResponse,
    deleteCannedResponse,
    toggleActiveStatus,
    incrementUsage,
    replaceVariables,
  } = useCannedResponses();

  const { showToast } = useToast();

  // Filters hook
  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredResponses,
  } = useCannedResponseFilter(cannedResponses);

  // Canned Response Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CannedResponseFormData>({
    title: '',
    shortcut: '',
    category: 'greeting',
    content: '',
    tagsString: '',
    isActive: true,
  });

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CannedResponse | null>(null);

  // Bot Rule Modal States
  const [isBotRuleModalOpen, setIsBotRuleModalOpen] = useState(false);
  const [botRuleModalMode, setBotRuleModalMode] = useState<'create' | 'edit'>('create');
  const [editingBotRuleId, setEditingBotRuleId] = useState<string | null>(null);
  const [botRuleFormData, setBotRuleFormData] = useState<BotRuleFormData>({
    name: '',
    triggerType: 'keyword',
    keywordsStr: '',
    matchType: 'contains',
    cannedResponseId: '',
    customReplyText: '',
    isActive: true,
    priority: 10,
  });

  // Category Badge Helper
  const getCategoryBadge = (category: CannedResponseCategory) => {
    const conf = CATEGORIES_CONFIG.find((c) => c.key === category);
    if (!conf) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${conf.color.badge}`}
      >
        <span>{conf.icon}</span>
        <span>{conf.label.split(' ')[0]}</span>
      </span>
    );
  };

  // Handlers for Canned Responses
  const handleOpenCreate = (category?: CannedResponseCategory) => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      title: '',
      shortcut: '/',
      category: category || 'greeting',
      content: '',
      tagsString: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CannedResponse) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormData({
      title: item.title,
      shortcut: item.shortcut,
      category: item.category,
      content: item.content,
      tagsString: item.tags?.join(', ') || '',
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (item: CannedResponse) => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      title: `${item.title} (สำเนา)`,
      shortcut: `${item.shortcut}_copy`,
      category: item.category,
      content: item.content,
      tagsString: item.tags?.join(', ') || '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.shortcut.trim() || !formData.content.trim()) {
      showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error');
      return;
    }
    const tags = formData.tagsString.split(',').map((t) => t.trim()).filter(Boolean);
    try {
      if (modalMode === 'create') {
        await createCannedResponse({
          title: formData.title.trim(),
          shortcut: formData.shortcut.trim(),
          category: formData.category,
          content: formData.content.trim(),
          tags,
          isActive: formData.isActive,
        });
        showToast('สร้างข้อความสำเร็จรูปใหม่เรียบร้อยแล้ว', 'success');
      } else if (editingId) {
        await updateCannedResponse(editingId, {
          title: formData.title.trim(),
          shortcut: formData.shortcut.trim(),
          category: formData.category,
          content: formData.content.trim(),
          tags,
          isActive: formData.isActive,
        });
        showToast('อัปเดตข้อความสำเร็จรูปเรียบร้อยแล้ว', 'success');
      }
      setIsModalOpen(false);
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteCannedResponse(itemToDelete.id);
    showToast(`ลบข้อความ "${itemToDelete.title}" เรียบร้อยแล้ว`, 'success');
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleCopyText = (item: CannedResponse) => {
    const text = replaceVariables(item.content);
    navigator.clipboard.writeText(text);
    incrementUsage(item.id);
    showToast(`คัดลอกข้อความ "${item.shortcut}" ลงคลิปบอร์ดแล้ว`, 'success');
  };

  // Handlers for Bot Rules
  const handleOpenAddBotRule = (presetCanned?: CannedResponse) => {
    setBotRuleModalMode('create');
    setEditingBotRuleId(null);
    setBotRuleFormData({
      name: presetCanned ? `ตอบอัตโนมัติ: ${presetCanned.title}` : '',
      triggerType: 'keyword',
      keywordsStr: presetCanned ? (presetCanned.tags?.join(', ') || presetCanned.shortcut.replace('/', '')) : '',
      matchType: 'contains',
      cannedResponseId: presetCanned ? presetCanned.id : (cannedResponses[0]?.id || ''),
      customReplyText: '',
      isActive: true,
      priority: botSettings.rules.length + 1,
    });
    setIsBotRuleModalOpen(true);
  };

  const handleOpenEditBotRule = (rule: BotAutoReplyRule) => {
    setBotRuleModalMode('edit');
    setEditingBotRuleId(rule.id);
    setBotRuleFormData({
      name: rule.name,
      triggerType: rule.triggerType as any,
      keywordsStr: rule.keywords.join(', '),
      matchType: rule.matchType,
      cannedResponseId: rule.cannedResponseId || '',
      customReplyText: rule.customReplyText || '',
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsBotRuleModalOpen(true);
  };

  const handleSaveBotRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botRuleFormData.name.trim()) {
      showToast('กรุณาระบุชื่อกฎ Auto-Reply', 'error');
      return;
    }
    const keywords = botRuleFormData.keywordsStr.split(',').map((k) => k.trim()).filter(Boolean);
    if (keywords.length === 0) {
      showToast('กรุณาระบุคำสำคัญ (Keywords) อย่างน้อย 1 คำ', 'error');
      return;
    }

    const payload = {
      name: botRuleFormData.name.trim(),
      triggerType: botRuleFormData.triggerType,
      keywords,
      matchType: botRuleFormData.matchType,
      cannedResponseId: botRuleFormData.cannedResponseId || undefined,
      customReplyText: botRuleFormData.customReplyText.trim() || undefined,
      isActive: botRuleFormData.isActive,
      priority: Number(botRuleFormData.priority) || 1,
    };

    if (botRuleModalMode === 'create') {
      addBotRule(payload);
    } else if (editingBotRuleId) {
      updateBotRule(editingBotRuleId, payload);
    }
    setIsBotRuleModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-app overflow-y-auto custom-scrollbar select-none">
      <PageHeader
        title={
          activeTab === 'templates'
            ? 'จัดการข้อความตอบกลับด่วน (Canned Responses)'
            : '🤖 ตั้งค่า Bot ตอบอัตโนมัติ (Bot Auto-Reply Engine)'
        }
        subtitle={
          activeTab === 'templates'
            ? 'จัดการเทมเพลตข้อความสำเร็จรูปสำหรับตอบลูกค้าบน Omnichannel Inbox (Greeting, Question, Answer)'
            : 'กำหนดเงื่อนไขคำสำคัญ (Keyword Triggers) เพื่อให้ Bot ดึงข้อความไปตอบกลับอัตโนมัติบน LINE OA ทันที'
        }
        actionButton={
          activeTab === 'templates' ? (
            <button
              onClick={() => handleOpenCreate()}
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างข้อความตอบกลับใหม่</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  botSettings.isEnabled ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    botSettings.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{botSettings.isEnabled ? '● Bot Active' : '● Bot Inactive'}</span>
              </span>
              <button
                onClick={toggleBot}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                  botSettings.isEnabled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-brand hover:bg-brand-hover text-white'
                }`}
              >
                {botSettings.isEnabled ? 'พักบอทชั่วคราว' : 'เปิดใช้งานบอท'}
              </button>
              <button
                onClick={() => handleOpenAddBotRule()}
                className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกฎตอบกลับใหม่</span>
              </button>
            </div>
          )
        }
      />

      <div className="p-6 space-y-6 max-w-[1440px] w-full mx-auto">
        {/* Module Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'templates'
                ? 'bg-brand text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>คลังข้อความสำเร็จรูป (Canned Templates)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'templates' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {cannedResponses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'bot'
                ? 'bg-brand text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Bot Auto-Reply Engine</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'bot' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {botSettings.rules.filter((r) => r.isActive).length} กฎ Active
            </span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'templates' ? (
          <CannedResponsesTab
            cannedResponses={cannedResponses}
            filteredResponses={filteredResponses}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            botRules={botSettings.rules}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            onDuplicate={handleDuplicate}
            onOpenDelete={(item) => {
              setItemToDelete(item);
              setIsDeleteModalOpen(true);
            }}
            onCopyText={handleCopyText}
            onToggleActive={toggleActiveStatus}
            onOpenAddBotRule={handleOpenAddBotRule}
            getCategoryBadge={getCategoryBadge}
          />
        ) : (
          <BotAutoReplyTab
            cannedResponses={cannedResponses}
            onOpenAddBotRule={handleOpenAddBotRule}
            onOpenEditBotRule={handleOpenEditBotRule}
          />
        )}
      </div>

      {/* Modals */}
      <CannedResponseModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        replaceVariables={replaceVariables}
      />

      <CannedResponseDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={itemToDelete}
      />

      <BotRuleModal
        isOpen={isBotRuleModalOpen}
        mode={botRuleModalMode}
        formData={botRuleFormData}
        setFormData={setBotRuleFormData}
        cannedResponses={cannedResponses}
        onClose={() => setIsBotRuleModalOpen(false)}
        onSubmit={handleSaveBotRule}
      />
    </div>
  );
};
