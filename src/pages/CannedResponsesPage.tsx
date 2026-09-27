import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageSquareText,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  TrendingUp,
  Tag,
  Filter,
  Check,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
  CornerDownRight,
  Eye,
  SlidersHorizontal,
  Bot,
  Send,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { useCannedResponses, CATEGORIES_CONFIG } from '../context/CannedResponseContext';
import { useBot } from '../context/BotContext';
import { useToast } from '../context/ToastContext';
import { CannedResponse, CannedResponseCategory, BotAutoReplyRule } from '../types';

export const CannedResponsesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'bot' ? 'bot' : 'templates';
  const setActiveTab = (tab: 'templates' | 'bot') => {
    setSearchParams(tab === 'bot' ? { tab: 'bot' } : {});
  };

  const {
    settings: botSettings,
    toggleBot,
    updateSettings: updateBotSettings,
    addRule: addBotRule,
    updateRule: updateBotRule,
    deleteRule: deleteBotRule,
    toggleRuleActive: toggleBotRuleActive,
    testMatch: testBotMatch,
  } = useBot();

  const {
    cannedResponses,
    categories,
    createCannedResponse,
    updateCannedResponse,
    deleteCannedResponse,
    toggleActiveStatus,
    incrementUsage,
    replaceVariables,
  } = useCannedResponses();

  const { showToast } = useToast();

  // Bot Simulator State
  const [simText, setSimText] = useState('สอบถามเลขบัญชีโอนเงินหน่อยครับ');
  const [simResult, setSimResult] = useState<any>(null);

  // Bot Rule Modal State
  const [isBotRuleModalOpen, setIsBotRuleModalOpen] = useState(false);
  const [botRuleModalMode, setBotRuleModalMode] = useState<'create' | 'edit'>('create');
  const [editingBotRuleId, setEditingBotRuleId] = useState<string | null>(null);
  const [botRuleFormData, setBotRuleFormData] = useState({
    name: '',
    triggerType: 'keyword' as const,
    keywordsStr: '',
    matchType: 'contains' as 'contains' | 'exact',
    cannedResponseId: '',
    customReplyText: '',
    isActive: true,
    priority: 10,
  });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'usage' | 'updated' | 'shortcut'>('usage');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CannedResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    shortcut: '',
    category: 'greeting' as CannedResponseCategory,
    content: '',
    tagsString: '',
    isActive: true,
  });

  // Calculate KPIs
  const totalCount = cannedResponses.length;
  const greetingCount = cannedResponses.filter((c) => c.category === 'greeting').length;
  const questionCount = cannedResponses.filter((c) => c.category === 'question').length;
  const answerCount = cannedResponses.filter((c) => c.category === 'answer').length;
  const totalUsage = cannedResponses.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const mostPopular = [...cannedResponses].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

  // Filter and sort items
  const filteredResponses = cannedResponses
    .filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inShortcut = item.shortcut.toLowerCase().includes(q);
        const inTitle = item.title.toLowerCase().includes(q);
        const inContent = item.content.toLowerCase().includes(q);
        const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        return inShortcut || inTitle || inContent || inTags;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
      if (sortBy === 'updated') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      if (sortBy === 'shortcut') return a.shortcut.localeCompare(b.shortcut);
      return 0;
    });

  // Handlers
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

    if (!formData.title.trim()) {
      showToast('กรุณาระบุหัวข้อข้อความสำเร็จรูป', 'error');
      return;
    }
    if (!formData.shortcut.trim()) {
      showToast('กรุณาระบุคีย์ลัด (Shortcut เช่น /greeting)', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showToast('กรุณาระบุเนื้อหาข้อความ', 'error');
      return;
    }

    const tags = formData.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

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
    } catch (err) {
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

  const insertVariableIntoContent = (varTag: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content} {${varTag}}` : `{${varTag}}`,
    }));
  };

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
    const keywords = botRuleFormData.keywordsStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      showToast('กรุณาระบุคำสำคัญ (Keywords) อย่างน้อย 1 คำ', 'error');
      return;
    }

    if (botRuleModalMode === 'create') {
      addBotRule({
        name: botRuleFormData.name.trim(),
        triggerType: botRuleFormData.triggerType,
        keywords,
        matchType: botRuleFormData.matchType,
        cannedResponseId: botRuleFormData.cannedResponseId || undefined,
        customReplyText: botRuleFormData.customReplyText.trim() || undefined,
        isActive: botRuleFormData.isActive,
        priority: Number(botRuleFormData.priority) || 1,
      });
    } else if (editingBotRuleId) {
      updateBotRule(editingBotRuleId, {
        name: botRuleFormData.name.trim(),
        triggerType: botRuleFormData.triggerType,
        keywords,
        matchType: botRuleFormData.matchType,
        cannedResponseId: botRuleFormData.cannedResponseId || undefined,
        customReplyText: botRuleFormData.customReplyText.trim() || undefined,
        isActive: botRuleFormData.isActive,
        priority: Number(botRuleFormData.priority) || 1,
      });
    }
    setIsBotRuleModalOpen(false);
  };

  const handleTestSimulate = () => {
    if (!simText.trim()) return;
    const res = testBotMatch(simText, {
      customer_name: 'คุณสมชาย',
      order_code: 'SO-10482',
      tracking_no: 'TH2609-88412',
    });
    setSimResult(res);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-app overflow-y-auto custom-scrollbar select-none">
      {/* Page Header */}
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
            <span>🤖 ตั้งค่า Bot ตอบอัตโนมัติ (Bot Auto-Reply Engine)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                botSettings.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {botSettings.rules.filter((r) => r.isActive).length} กฎ Active
            </span>
          </button>
        </div>

        {/* Module Content */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* KPI Overview Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiTile
            label="ข้อความทั้งหมด"
            value={totalCount}
            subValue="ทุกหมวดหมู่รวมกัน"
            variant="default"
          />
          <KpiTile
            label="Greeting (ทักทาย)"
            value={greetingCount}
            subValue="เปิดบทสนทนา & ต้อนรับ"
            variant="highlight"
          />
          <KpiTile
            label="Question (คำถาม)"
            value={questionCount}
            subValue="ขอข้อมูล & สลิป & ที่อยู่"
            variant="warning"
          />
          <KpiTile
            label="Answer (คำตอบ)"
            value={answerCount}
            subValue="เลขบัญชี & รอบส่ง & เครดิต"
            variant="success"
          />
          <KpiTile
            label="การใช้งานสะสม"
            value={`${totalUsage} ครั้ง`}
            subValue={mostPopular ? `ใช้บ่อยสุด: ${mostPopular.shortcut}` : 'สถิติการส่ง'}
            variant="default"
          />
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3.5">
          {/* Main Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-bg-app p-1 rounded-xl">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-white text-brand shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                ทั้งหมด ({totalCount})
              </button>

              {CATEGORIES_CONFIG.map((cat) => {
                const count = cannedResponses.filter((c) => c.category === cat.key).length;
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-brand shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label.split(' ')[0]}</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Add under selected category */}
            <button
              onClick={() =>
                handleOpenCreate(
                  selectedCategory !== 'all' ? (selectedCategory as CannedResponseCategory) : 'greeting'
                )
              }
              className="text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มข้อความในหมวดนี้</span>
            </button>
          </div>

          {/* Sub Filters: Search, Status, Sort */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา shortcut (/ทักทาย), ชื่อหัวข้อ, เนื้อหาข้อความ หรือ Tag..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary flex-shrink-0">สถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-bg-app border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">ทั้งหมด (เปิด/ปิดใช้งาน)</option>
                <option value="active">✓ เปิดใช้งานเท่านั้น</option>
                <option value="inactive">✕ ปิดใช้งาน</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary flex-shrink-0">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-bg-app border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="usage">⚡ ยอดการใช้งานสูงสุด</option>
                <option value="updated">⏱️ อัปเดตล่าสุด</option>
                <option value="shortcut">🔤 ชื่อ Shortcut (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responses Table / Card List */}
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-bg-subtle/60">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand" />
              <span className="font-bold text-xs text-text-primary">
                รายการข้อความตอบกลับอัตโนมัติ ({filteredResponses.length} รายการ)
              </span>
            </div>
            <span className="text-[11px] text-text-secondary">
              สามารถกดคัดลอกข้อความ หรือใช้ Shortcut <kbd className="font-mono bg-white px-1 py-0.5 rounded border">/</kbd> ในหน้า Inbox ได้ทันที
            </span>
          </div>

          {filteredResponses.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-bg-app mx-auto flex items-center justify-center text-text-secondary">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-text-primary">ไม่พบข้อความตอบกลับตามเงื่อนไข</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                ลองปรับคำค้นหา หรือสร้างข้อความตอบกลับอัตโนมัติใหม่สำหรับหมวดนี้
              </p>
              <button
                onClick={() => handleOpenCreate()}
                className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-brand-hover inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มข้อความใหม่</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {filteredResponses.map((item) => {
                const categoryConfig = CATEGORIES_CONFIG.find((c) => c.key === item.category);

                return (
                  <div
                    key={item.id}
                    className={`p-4 transition-all hover:bg-bg-subtle/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      !item.isActive ? 'opacity-60 bg-gray-50/60' : ''
                    }`}
                  >
                    {/* Left Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Shortcut Pill */}
                        <button
                          onClick={() => handleCopyText(item)}
                          title="คลิกเพื่อคัดลอกและนับการใช้งาน"
                          className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-brand-tint text-brand border border-brand/20 hover:bg-brand hover:text-white transition-all flex items-center gap-1.5 group cursor-pointer shadow-2xs"
                        >
                          <span>{item.shortcut}</span>
                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </button>

                        {/* Category Badge */}
                        {getCategoryBadge(item.category)}

                        {/* Title */}
                        <span className="font-bold text-sm text-text-primary">{item.title}</span>

                        {/* Active Toggle Switch */}
                        <button
                          onClick={() => toggleActiveStatus(item.id)}
                          className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-0.5 transition-all hover:opacity-80 ${
                            item.isActive
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                        </button>
                      </div>

                      {/* Content Preview */}
                      <div className="p-3 bg-bg-app rounded-lg border border-border/70 text-xs text-text-primary leading-relaxed font-sans whitespace-pre-line">
                        {item.content}
                      </div>

                      {/* Tags & Meta info */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            ใช้งานไปแล้ว <strong className="text-text-primary font-mono">{item.usageCount || 0}</strong> ครั้ง
                          </span>
                        </div>

                        {item.lastUsedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-text-secondary" />
                            <span>ใช้ล่าสุด: {item.lastUsedAt}</span>
                          </div>
                        )}

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-text-secondary" />
                            <div className="flex items-center gap-1">
                              {item.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px]"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bot Auto-Reply Link Status */}
                        {(() => {
                          const linkedRule = botSettings.rules.find((r) => r.cannedResponseId === item.id);
                          if (linkedRule) {
                            return (
                              <div className="flex items-center gap-1.5 text-[11px] text-brand bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded-md font-medium">
                                <Bot className="w-3.5 h-3.5" />
                                <span>
                                  Bot Auto-Reply: <strong>{linkedRule.name}</strong> ({linkedRule.keywords.slice(0, 2).join(', ')}...)
                                </span>
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenAddBotRule(item)}
                              className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-brand hover:underline font-semibold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>ตั้งค่าให้ Bot ตอบคำนี้ Auto</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleCopyText(item)}
                        className="p-2 border border-border hover:bg-bg-subtle text-text-secondary hover:text-brand rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="คัดลอกข้อความ"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">คัดลอก</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-2 border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="คัดลอกเพื่อสร้างใหม่"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">สำเนา</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 border border-border hover:border-brand/40 hover:bg-brand-tint text-text-secondary hover:text-brand rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">แก้ไข</span>
                      </button>

                      <button
                        onClick={() => {
                          setItemToDelete(item);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 border border-border hover:border-rose-300 hover:bg-rose-50 text-text-secondary hover:text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="ลบข้อความนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

    {/* BOT AUTO-REPLY ENGINE VIEW */}
    {activeTab === 'bot' && (
      <div className="space-y-6">
        {/* Master Bot Controller Card */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-text-primary">{botSettings.botName}</h2>
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
                    <span>{botSettings.isEnabled ? 'เปิดใช้งาน (Active)' : 'ปิดการทำงาน (Inactive)'}</span>
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  ระบบ AI Bot ตอบกลับอัตโนมัติเมื่อลูกค้าส่งข้อความเข้ามาผ่าน LINE OA หรือ Social Channels
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleBot}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                  botSettings.isEnabled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-brand hover:bg-brand-hover text-white'
                }`}
              >
                <span>{botSettings.isEnabled ? 'พักบอทชั่วคราว' : 'เปิดใช้งานบอท'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddBotRule()}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกฎตอบกลับใหม่</span>
              </button>
            </div>
          </div>

          {/* Bot Core Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Operating Mode */}
            <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border">
              <span className="text-xs font-bold text-text-primary block mb-2">
                โหมดการทำงานของบอท
              </span>
              <select
                value={botSettings.operatingMode}
                onChange={(e) => updateBotSettings({ operatingMode: e.target.value as any })}
                className="w-full text-xs font-semibold py-2 px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="always">ทำงานตลอด 24 ชั่วโมง (24/7)</option>
                <option value="off_hours_only">ทำงานเฉพาะนอกเวลาทำการ</option>
                <option value="keyword_only">ตอบเฉพาะเมื่อตรงกับคำสำคัญ (Keywords)</option>
              </select>
              <p className="text-[11px] text-text-secondary mt-2">
                {botSettings.operatingMode === 'always'
                  ? 'บอทจะช่วยตอบตลอดเวลา ทั้งในและนอกเวลาทำการ'
                  : botSettings.operatingMode === 'off_hours_only'
                  ? 'ในเวลาทำการจะให้เจ้าหน้าที่คนตอบ นอกเวลาบอทจะตอบแทน'
                  : 'บอทจะตอบเฉพาะคำที่มีในลิสต์กฎเท่านั้น'}
              </p>
            </div>

            {/* Welcome Message Toggle */}
            <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-primary">
                  ข้อความทักทายแรกเข้า (Welcome)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateBotSettings({ welcomeMessageEnabled: !botSettings.welcomeMessageEnabled })
                  }
                  className={`text-xs font-semibold ${
                    botSettings.welcomeMessageEnabled ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {botSettings.welcomeMessageEnabled ? '● เปิด' : '● ปิด'}
                </button>
              </div>
              <select
                disabled={!botSettings.welcomeMessageEnabled}
                value={botSettings.welcomeCannedResponseId || ''}
                onChange={(e) => updateBotSettings({ welcomeCannedResponseId: e.target.value })}
                className="w-full text-xs font-semibold py-2 px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer disabled:opacity-50"
              >
                {cannedResponses
                  .filter((c) => c.category === 'greeting')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortcut} - {c.title}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-text-secondary mt-2">
                ส่งข้อความนี้อัตโนมัติทันทีที่ลูกค้าเปิดห้องแชทหรือทักข้อความแรก
              </p>
            </div>

            {/* Human Handoff */}
            <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-primary">
                  คำสั่งส่งต่อเจ้าหน้าที่ (Handoff)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateBotSettings({ humanHandoffEnabled: !botSettings.humanHandoffEnabled })
                  }
                  className={`text-xs font-semibold ${
                    botSettings.humanHandoffEnabled ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {botSettings.humanHandoffEnabled ? '● เปิด' : '● ปิด'}
                </button>
              </div>
              <div className="text-[11px] text-text-secondary mb-2 line-clamp-1">
                คำตรวจจับ: {botSettings.humanHandoffKeywords.join(', ')}
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings?tab=hours')}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
              >
                <span>แก้ไขคำสั่งส่งต่อ & ข้อความ</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-bg-subtle/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <h3 className="font-bold text-xs text-text-primary">
                รายการกฎตอบกลับอัตโนมัติ ({botSettings.rules.length} กฎ)
              </h3>
            </div>
            <span className="text-[11px] text-text-secondary">
              ลำดับความสำคัญ: บอทจะประมวลผลกฎจากบนลงล่างตาม Priority
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-muted/50 text-text-secondary font-bold">
                  <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-4">ชื่อกฎ / วัตถุประสงค์</th>
                  <th className="py-2.5 px-4">คำสำคัญที่ตรวจจับ (Trigger Keywords)</th>
                  <th className="py-2.5 px-4">ข้อความที่ใช้ตอบกลับ</th>
                  <th className="py-2.5 px-4 w-28 text-center">สถานะ</th>
                  <th className="py-2.5 px-4 w-24 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {botSettings.rules.map((rule, idx) => {
                  const linkedCanned = cannedResponses.find(
                    (c) => c.id === rule.cannedResponseId
                  );

                  return (
                    <tr key={rule.id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-center text-text-secondary">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-text-primary">{rule.name}</div>
                        <span className="text-[10px] text-text-secondary font-mono">
                          จับคู่แบบ: {rule.matchType === 'exact' ? 'ตรงกันทุกตัวอักษร' : 'มีคำนี้ในประโยค'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {rule.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-bg-app border border-border rounded text-[11px] text-brand font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {linkedCanned ? (
                          <div>
                            <span className="font-mono text-xs font-bold text-brand">
                              {linkedCanned.shortcut}
                            </span>
                            <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5 max-w-sm">
                              {linkedCanned.content}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-text-secondary line-clamp-1">
                            {rule.customReplyText || '-'}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleBotRuleActive(rule.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                            rule.isActive ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rule.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{rule.isActive ? 'เปิดใช้' : 'ปิด'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBotRule(rule)}
                            className="p-1 text-text-secondary hover:text-brand rounded hover:bg-bg-app transition-colors"
                            title="แก้ไขกฎ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBotRule(rule.id)}
                            className="p-1 text-text-secondary hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="ลบกฎ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Bot Simulator */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-divider pb-3">
            <Zap className="w-4 h-4 text-brand" />
            <h3 className="font-bold text-sm text-text-primary">
              ทดสอบการตอบของ Bot (Interactive Chat Simulator)
            </h3>
            <span className="text-[11px] text-text-secondary ml-auto">
              พิมพ์ข้อความจำลองจากลูกค้าเพื่อทดสอบการจับคู่คำสำคัญทันที
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Input pane */}
            <div className="lg:col-span-6 space-y-3">
              <label className="block text-xs font-bold text-text-primary">
                ข้อความที่ลูกค้าพิมพ์ส่งมา:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestSimulate()}
                  placeholder="เช่น ขอเลขบัญชีหน่อยครับ, ส่งของหรือยัง, ติดต่อเจ้าหน้าที่..."
                  className="flex-1 px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={handleTestSimulate}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ทดสอบ</span>
                </button>
              </div>

              {/* Preset Quick Chips for testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-text-secondary mr-1">ลองคลิกข้อความตัวอย่าง:</span>
                {[
                  'ขอเลขบัญชีโอนเงินครับ',
                  'ส่งของหรือยังครับ',
                  'ตัดรอบส่งกี่โมง',
                  'โอนเงินเรียบร้อยแล้วค่ะ',
                  'สินค้าพังเปิดไม่ติด ขอเคลม',
                  'เปิดปิดกี่โมงครับ',
                  'ติดต่อเจ้าหน้าที่หน่อยค่ะ',
                ].map((text, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSimText(text);
                      const res = testBotMatch(text, {
                        customer_name: 'คุณสมชาย',
                        order_code: 'SO-10482',
                        tracking_no: 'TH2609-88412',
                      });
                      setSimResult(res);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded border border-border bg-bg-subtle hover:bg-bg-app text-text-primary font-medium transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Output pane */}
            <div className="lg:col-span-6 bg-bg-subtle/80 rounded-xl p-4 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-text-primary flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-brand" />
                    <span>ผลลัพธ์ที่ Bot ตอบกลับ:</span>
                  </span>
                  {simResult && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        simResult.matched ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          simResult.matched ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>
                        {simResult.type === 'handoff'
                          ? 'ตรวจพบคำสั่งส่งต่อ (Handoff)'
                          : simResult.matched
                          ? `จับคู่กฎ: "${simResult.rule?.name || 'Rule'}"`
                          : 'ไม่ตรงกับกฎใดๆ'}
                      </span>
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-lg p-3 border border-border min-h-[90px] text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                  {simResult ? (
                    simResult.replyText
                  ) : (
                    <span className="text-text-secondary italic">
                      พิมพ์ข้อความด้านซ้ายแล้วกดปุ่ม &quot;ทดสอบ&quot; เพื่อดูข้อความตอบกลับของบอท
                    </span>
                  )}
                </div>
              </div>

              {simResult?.matchedKeyword && (
                <div className="text-[11px] text-text-secondary mt-2 pt-2 border-t border-divider">
                  คำสำคัญที่ตรงกัน:{' '}
                  <span className="font-bold text-brand">{simResult.matchedKeyword}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </div>

      {/* ================= MODAL: CREATE / EDIT ================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'เพิ่มข้อความสำเร็จรูปอัตโนมัติ' : 'แก้ไขข้อความสำเร็จรูป'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 select-none">
          {/* Group / Category Radio Selector */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              หมวดหมู่ข้อความ (Group) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES_CONFIG.map((cat) => {
                const isSelected = formData.category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.key })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${cat.color.bg} ${cat.color.border} ring-2 ring-brand/30`
                        : 'border-border bg-white hover:bg-bg-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{cat.icon}</span>
                      <span className={`text-xs font-bold ${isSelected ? cat.color.text : 'text-text-primary'}`}>
                        {cat.label.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight line-clamp-2">
                      {cat.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shortcut & Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                คีย์ลัด (Shortcut) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="/ส่งเลขพัสดุ หรือ /greeting"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
                />
              </div>
              <span className="text-[10px] text-text-secondary mt-0.5 block">
                ขึ้นต้นด้วยเครื่องหมาย <code className="bg-slate-100 px-1 rounded">/</code> เพื่อเรียกใช้ง่าย
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                ชื่อหัวข้อ (Title) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น แจ้งหมายเลขพัสดุและลิงก์ติดตาม"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Content Message Area + Smart Variable Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text-primary">
                เนื้อหาข้อความ (Message Template) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-brand font-medium">
                💡 คลิกแท็กตัวแปรด้านล่างเพื่อแทรกอัตโนมัติ
              </span>
            </div>

            {/* Variable Insertion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 bg-brand-tint/40 border border-brand/20 rounded-lg">
              <span className="text-[11px] font-bold text-brand flex-shrink-0">ตัวแปรระบบ:</span>
              <button
                type="button"
                onClick={() => insertVariableIntoContent('customer_name')}
                className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
              >
                + {'{customer_name}'} (ชื่อลูกค้า)
              </button>
              <button
                type="button"
                onClick={() => insertVariableIntoContent('order_code')}
                className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
              >
                + {'{order_code}'} (เลขคำสั่งซื้อ)
              </button>
              <button
                type="button"
                onClick={() => insertVariableIntoContent('tracking_no')}
                className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
              >
                + {'{tracking_no}'} (เลขพัสดุ)
              </button>
              <button
                type="button"
                onClick={() => insertVariableIntoContent('agent_name')}
                className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-brand hover:text-white border border-brand/30 text-brand font-medium transition-all shadow-2xs"
              >
                + {'{agent_name}'} (ชื่อแอดมิน)
              </button>
            </div>

            <textarea
              required
              rows={4}
              placeholder="พิมพ์ข้อความที่ต้องการใช้ตอบลูกค้า..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-3 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Live Preview Simulation Box */}
          <div>
            <label className="text-[11px] font-bold text-text-secondary mb-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-brand" />
              <span>ตัวอย่างข้อความจริงเมื่อส่งถึงลูกค้า (Live Preview):</span>
            </label>
            <div className="p-3 bg-[#EAF2FC]/60 rounded-xl border border-border/80 flex flex-col items-end">
              <div className="bg-brand text-white p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed max-w-[85%] shadow-xs">
                {formData.content
                  ? replaceVariables(formData.content)
                  : 'ตัวอย่างข้อความจะแสดงที่นี่พร้อมแทนที่ชื่อลูกค้าและข้อมูลอัตโนมัติ...'}
              </div>
              <span className="text-[10px] text-text-secondary mt-1 font-mono">10:42 · วิภา ส.</span>
            </div>
          </div>

          {/* Tags & Active Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-divider">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                แท็กกำกับ (คั่นด้วยเครื่องหมายจุลภาค ,)
              </label>
              <input
                type="text"
                placeholder="เช่น ทักทาย, ด่วน, ธนาคาร"
                value={formData.tagsString}
                onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
              <label className="text-xs font-bold text-text-primary cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                />
                <span>เปิดใช้งานข้อความนี้ทันที</span>
              </label>
            </div>
          </div>

          {/* Footer Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-divider">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border hover:bg-bg-subtle text-text-secondary rounded-lg text-xs font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              {modalMode === 'create' ? 'บันทึกข้อความ' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบข้อความตอบกลับอัตโนมัติ"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <p className="font-bold">คุณต้องการลบข้อความนี้ใช่หรือไม่?</p>
            <p className="font-mono text-text-primary">
              Shortcut: <strong>{itemToDelete?.shortcut}</strong> ({itemToDelete?.title})
            </p>
            <p className="text-[11px] text-rose-600">
              เมื่อลบแล้ว แอดมินจะไม่สามารถเรียกใช้ข้อความนี้ผ่านคีย์ลัดได้อีก
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-border hover:bg-bg-subtle text-text-secondary rounded-lg text-xs font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              ยืนยันการลบ
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL: ADD / EDIT BOT RULE ================= */}
      <Modal
        isOpen={isBotRuleModalOpen}
        onClose={() => setIsBotRuleModalOpen(false)}
        title={botRuleModalMode === 'create' ? 'สร้างกฎ Auto-Reply ใหม่' : 'แก้ไขกฎ Auto-Reply'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveBotRule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              ชื่อกฎ / หัวข้อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={botRuleFormData.name}
              onChange={(e) => setBotRuleFormData({ ...botRuleFormData, name: e.target.value })}
              placeholder="เช่น แจ้งเลขที่บัญชีธนาคาร"
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              คำสำคัญที่ตรวจจับ (Keywords คั่นด้วยจุลภาค ,) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={botRuleFormData.keywordsStr}
              onChange={(e) => setBotRuleFormData({ ...botRuleFormData, keywordsStr: e.target.value })}
              placeholder="เช่น เลขบัญชี, โอนเงิน, ชำระเงิน, จ่ายเงิน"
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
            />
            <span className="text-[10px] text-text-secondary mt-1 block">
              หากลูกค้าพิมพ์คำใดคำหนึ่งในนี้ บอทจะเลือกข้อความนี้ไปตอบทันที
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                รูปแบบการจับคู่คำ
              </label>
              <select
                value={botRuleFormData.matchType}
                onChange={(e) =>
                  setBotRuleFormData({ ...botRuleFormData, matchType: e.target.value as any })
                }
                className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand"
              >
                <option value="contains">มีคำนี้อยู่ในประโยค (Contains)</option>
                <option value="exact">ตรงกันทุกตัวอักษรเป๊ะๆ (Exact)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                ลำดับความสำคัญ (Priority)
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={botRuleFormData.priority}
                onChange={(e) =>
                  setBotRuleFormData({ ...botRuleFormData, priority: parseInt(e.target.value) || 10 })
                }
                className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              เลือกข้อความสำเร็จรูปจากคลัง (Canned Response)
            </label>
            <select
              value={botRuleFormData.cannedResponseId}
              onChange={(e) =>
                setBotRuleFormData({ ...botRuleFormData, cannedResponseId: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
            >
              <option value="">-- กำหนดข้อความเฉพาะเอง (Custom Text) --</option>
              {cannedResponses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortcut} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {!botRuleFormData.cannedResponseId && (
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                ข้อความตอบกลับเฉพาะ (Custom Reply Text)
              </label>
              <textarea
                rows={3}
                value={botRuleFormData.customReplyText}
                onChange={(e) =>
                  setBotRuleFormData({ ...botRuleFormData, customReplyText: e.target.value })
                }
                placeholder="ระบุข้อความที่ต้องการให้บอทตอบ..."
                className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand leading-relaxed"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="botRuleActiveCheck"
              checked={botRuleFormData.isActive}
              onChange={(e) => setBotRuleFormData({ ...botRuleFormData, isActive: e.target.checked })}
              className="rounded border-border text-brand focus:ring-brand"
            />
            <label htmlFor="botRuleActiveCheck" className="text-xs font-semibold text-text-primary cursor-pointer">
              เปิดใช้งานกฎนี้ทันที
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-divider">
            <button
              type="button"
              onClick={() => setIsBotRuleModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary hover:bg-bg-app rounded-lg text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold shadow-xs"
            >
              บันทึกกฎ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
