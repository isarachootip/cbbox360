import React from 'react';
import {
  Search,
  Plus,
  Copy,
  FileText,
  Edit2,
  Trash2,
  Zap,
  Clock,
  Tag,
  SlidersHorizontal,
  HelpCircle,
  Bot,
} from 'lucide-react';
import { KpiTile } from '../common/KpiTile';
import { CATEGORIES_CONFIG } from '../../context/CannedResponseContext';
import { CannedResponse, CannedResponseCategory, BotAutoReplyRule } from '../../types';

interface CannedResponsesTabProps {
  cannedResponses: CannedResponse[];
  filteredResponses: CannedResponse[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
  sortBy: 'usage' | 'updated' | 'shortcut';
  setSortBy: (sort: 'usage' | 'updated' | 'shortcut') => void;
  botRules: BotAutoReplyRule[];
  onOpenCreate: (category?: CannedResponseCategory) => void;
  onOpenEdit: (item: CannedResponse) => void;
  onDuplicate: (item: CannedResponse) => void;
  onOpenDelete: (item: CannedResponse) => void;
  onCopyText: (item: CannedResponse) => void;
  onToggleActive: (id: string) => void;
  onOpenAddBotRule: (item: CannedResponse) => void;
  getCategoryBadge: (category: CannedResponseCategory) => React.ReactNode;
}

export const CannedResponsesTab: React.FC<CannedResponsesTabProps> = ({
  cannedResponses,
  filteredResponses,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  botRules,
  onOpenCreate,
  onOpenEdit,
  onDuplicate,
  onOpenDelete,
  onCopyText,
  onToggleActive,
  onOpenAddBotRule,
  getCategoryBadge,
}) => {
  // KPI Calculations
  const totalCount = cannedResponses.length;
  const greetingCount = cannedResponses.filter((c) => c.category === 'greeting').length;
  const questionCount = cannedResponses.filter((c) => c.category === 'question').length;
  const answerCount = cannedResponses.filter((c) => c.category === 'answer').length;
  const totalUsage = cannedResponses.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const mostPopular = [...cannedResponses].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

  return (
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

          <button
            onClick={() =>
              onOpenCreate(
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
              onClick={() => onOpenCreate()}
              className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-brand-hover inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มข้อความใหม่</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {filteredResponses.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition-all hover:bg-bg-subtle/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  !item.isActive ? 'opacity-60 bg-gray-50/60' : ''
                }`}
              >
                {/* Left Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onCopyText(item)}
                      title="คลิกเพื่อคัดลอกและนับการใช้งาน"
                      className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-brand-tint text-brand border border-brand/20 hover:bg-brand hover:text-white transition-all flex items-center gap-1.5 group cursor-pointer shadow-2xs"
                    >
                      <span>{item.shortcut}</span>
                      <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </button>

                    {getCategoryBadge(item.category)}

                    <span className="font-bold text-sm text-text-primary">{item.title}</span>

                    <button
                      onClick={() => onToggleActive(item.id)}
                      className={`text-xs font-semibold flex items-center gap-1.5 px-2 py-0.5 transition-all hover:opacity-80 ${
                        item.isActive ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-bg-app rounded-lg border border-border/70 text-xs text-text-primary leading-relaxed font-sans whitespace-pre-line">
                    {item.content}
                  </div>

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

                    {(() => {
                      const linkedRule = botRules.find((r) => r.cannedResponseId === item.id);
                      if (linkedRule) {
                        return (
                          <div className="flex items-center gap-1.5 text-[11px] text-brand font-medium">
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
                          onClick={() => onOpenAddBotRule(item)}
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
                    onClick={() => onCopyText(item)}
                    className="p-2 border border-border hover:bg-bg-subtle text-text-secondary hover:text-brand rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="คัดลอกข้อความ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">คัดลอก</span>
                  </button>

                  <button
                    onClick={() => onDuplicate(item)}
                    className="p-2 border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="คัดลอกเพื่อสร้างใหม่"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">สำเนา</span>
                  </button>

                  <button
                    onClick={() => onOpenEdit(item)}
                    className="p-2 border border-border hover:border-brand/40 hover:bg-brand-tint text-text-secondary hover:text-brand rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">แก้ไข</span>
                  </button>

                  <button
                    onClick={() => onOpenDelete(item)}
                    className="p-2 border border-border hover:border-rose-300 hover:bg-rose-50 text-text-secondary hover:text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="ลบข้อความนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
