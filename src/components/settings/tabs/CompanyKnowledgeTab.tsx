import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Eye, Sparkles } from 'lucide-react';
import { useBot } from '../../../context/BotContext';
import { useBusinessTemplate } from '../../../hooks/useBusinessTemplate';
import { useToast } from '../../../context/ToastContext';
import { KnowledgeCategory, KnowledgeItem } from '../../../types';
import { defaultCompanyProfile, defaultKnowledgeItems } from '../../../data/templateKnowledgePresets';
import { formatKnowledgeForPrompt } from '../../../domain/templates/knowledgeMerge';
import { CompanyProfileFormCard } from '../CompanyProfileFormCard';
import {
  KNOWLEDGE_CATEGORY_LABELS,
  KnowledgeItemFormData,
  KnowledgeItemModal,
} from '../KnowledgeItemModal';

export const CompanyKnowledgeTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateCompanyProfile,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    toggleKnowledgeItemActive,
  } = useBot();
  const { templates, activeTemplateId } = useBusinessTemplate();
  const { showToast } = useToast();

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? templates[0];
  const profile = settings.companyProfile ?? defaultCompanyProfile;
  const knowledgeItems = settings.knowledgeItems ?? defaultKnowledgeItems;

  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<KnowledgeItemFormData>({
    title: '',
    category: 'services_products',
    content: '',
    tagsStr: '',
    isActive: true,
  });

  const filteredItems =
    selectedCategory === 'all'
      ? knowledgeItems
      : knowledgeItems.filter((item) => item.category === selectedCategory);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      title: '',
      category: 'services_products',
      content: '',
      tagsStr: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KnowledgeItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      content: item.content,
      tagsStr: (item.tags ?? []).join(', '),
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (modalMode === 'create') {
      addKnowledgeItem({
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        tags,
        isActive: formData.isActive,
      });
    } else if (editingId) {
      updateKnowledgeItem(editingId, {
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        tags,
        isActive: formData.isActive,
      });
    }
    setIsModalOpen(false);
  };

  const handleResetProfileToTemplate = () => {
    updateSettings({
      companyProfile: activeTemplate.companyProfile,
      companyName: activeTemplate.companyProfile.companyName,
    });
    showToast(`โหลดข้อมูลองค์กรตัวอย่างจากเทมเพลต "${activeTemplate.name}" แล้ว`, 'info');
  };

  return (
    <div className="space-y-6">
      <CompanyProfileFormCard
        profile={profile}
        activeTemplateName={activeTemplate.name}
        onSave={updateCompanyProfile}
        onResetToTemplatePreset={handleResetProfileToTemplate}
      />

      {/* Section 2: Knowledge Base Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-text-primary">
                  2. คลังความรู้เฉพาะธุรกิจสำหรับ AI (Knowledge Management / KM)
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>{knowledgeItems.filter((k) => k.isActive).length} หัวข้อเปิดใช้งาน</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                รายการความรู้ เงื่อนไขบริการ และ FAQ ที่จะถูกส่งเข้า System Prompt ของทั้ง Gemini Auto-Reply และ AI Copilot (Suggested Reply / Summary)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPromptPreview ? 'ซ่อนตัวอย่าง Prompt' : 'ดูตัวอย่าง AI Prompt'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มหัวข้อความรู้ (KM)</span>
            </button>
          </div>
        </div>

        {showPromptPreview && (
          <div className="p-4 bg-slate-900 text-slate-100 border-b border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ตัวอย่างข้อมูล Grounding ที่ถูกส่งเข้า Gemini AI อัตโนมัติ:</span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-slate-200 max-h-56 overflow-y-auto custom-scrollbar">
              {formatKnowledgeForPrompt(profile, knowledgeItems)}
            </pre>
          </div>
        )}

        <div className="px-5 py-3 bg-bg-subtle/60 border-b border-border flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand text-white'
                : 'text-text-secondary hover:text-text-primary bg-white border border-border'
            }`}
          >
            ทั้งหมด ({knowledgeItems.length})
          </button>
          {(Object.keys(KNOWLEDGE_CATEGORY_LABELS) as KnowledgeCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:text-text-primary bg-white border border-border'
              }`}
            >
              {KNOWLEDGE_CATEGORY_LABELS[cat].split(' (')[0]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-muted/50 text-text-secondary font-bold">
                <th className="py-2.5 px-4 w-56">หัวข้อความรู้ (KM Topic)</th>
                <th className="py-2.5 px-4 w-44">หมวดหมู่</th>
                <th className="py-2.5 px-4">เนื้อหาสำหรับให้ AI ตอบลูกค้า</th>
                <th className="py-2.5 px-4 w-28 text-center">สถานะ</th>
                <th className="py-2.5 px-4 w-24 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="py-3 px-4 align-top">
                    <div className="font-bold text-text-primary">{item.title}</div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="text-[11px] text-text-muted mt-0.5">
                        Tags: {item.tags.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 align-top text-text-secondary font-medium">
                    {KNOWLEDGE_CATEGORY_LABELS[item.category]?.split(' (')[0] || item.category}
                  </td>
                  <td className="py-3 px-4 align-top text-text-secondary leading-relaxed">
                    {item.content}
                  </td>
                  <td className="py-3 px-4 align-top text-center">
                    <button
                      type="button"
                      onClick={() => toggleKnowledgeItemActive(item.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        item.isActive ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{item.isActive ? 'เปิดใช้' : 'ปิดพัก'}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 align-top text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg border border-border hover:bg-slate-50 text-text-secondary hover:text-brand"
                        title="แก้ไขหัวข้อ KM"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteKnowledgeItem(item.id)}
                        className="p-1.5 rounded-lg border border-border hover:bg-red-50 text-text-secondary hover:text-red-600"
                        title="ลบหัวข้อ KM"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <KnowledgeItemModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
};
