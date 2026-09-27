import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings,
  Bot,
  MessageSquareText,
  Network,
  Users,
  Sliders,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { useBot } from '../context/BotContext';
import { useCannedResponses } from '../context/CannedResponseContext';
import { useToast } from '../context/ToastContext';
import { BotAutoReplyRule } from '../types';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'bot' | 'hours'>(
    initialTab === 'bot' ? 'bot' : initialTab === 'hours' ? 'hours' : 'overview'
  );

  const {
    settings,
    updateSettings,
    toggleBot,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    testMatch,
  } = useBot();

  const { cannedResponses } = useCannedResponses();
  const { showToast } = useToast();

  // Simulator State
  const [simText, setSimText] = useState('สอบถามเลขบัญชีโอนเงินหน่อยครับ');
  const [simResult, setSimResult] = useState<any>(null);

  // Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalMode, setRuleModalMode] = useState<'create' | 'edit'>('create');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    triggerType: 'keyword' as const,
    keywordsStr: '',
    matchType: 'contains' as 'contains' | 'exact',
    cannedResponseId: '',
    customReplyText: '',
    isActive: true,
    priority: 10,
  });

  const handleTabChange = (tab: 'overview' | 'bot' | 'hours') => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const handleTestSimulate = () => {
    if (!simText.trim()) return;
    const res = testMatch(simText, {
      customer_name: 'คุณสมชาย',
      order_code: 'SO-10482',
      tracking_no: 'TH2609-88412',
    });
    setSimResult(res);
  };

  const handleOpenAddRule = () => {
    setRuleModalMode('create');
    setEditingRuleId(null);
    setRuleFormData({
      name: '',
      triggerType: 'keyword',
      keywordsStr: '',
      matchType: 'contains',
      cannedResponseId: cannedResponses[0]?.id || '',
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

    if (ruleModalMode === 'create') {
      addRule({
        name: ruleFormData.name.trim(),
        triggerType: ruleFormData.triggerType,
        keywords,
        matchType: ruleFormData.matchType,
        cannedResponseId: ruleFormData.cannedResponseId || undefined,
        customReplyText: ruleFormData.customReplyText.trim() || undefined,
        isActive: ruleFormData.isActive,
        priority: Number(ruleFormData.priority) || 1,
      });
    } else if (editingRuleId) {
      updateRule(editingRuleId, {
        name: ruleFormData.name.trim(),
        triggerType: ruleFormData.triggerType,
        keywords,
        matchType: ruleFormData.matchType,
        cannedResponseId: ruleFormData.cannedResponseId || undefined,
        customReplyText: ruleFormData.customReplyText.trim() || undefined,
        isActive: ruleFormData.isActive,
        priority: Number(ruleFormData.priority) || 1,
      });
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiTile
                label="สถานะ Bot Auto-Reply"
                value={settings.isEnabled ? 'Active (ออนไลน์)' : 'Inactive (ปิดพัก)'}
                variant={settings.isEnabled ? 'success' : 'default'}
                subValue={`${settings.rules.filter((r) => r.isActive).length} กฎพร้อมตอบ`}
              />
              <KpiTile
                label="ข้อความสำเร็จรูปทั้งหมด"
                value={`${cannedResponses.length} รายการ`}
                variant="default"
                subValue="รองรับ Greeting, Question, Answer"
              />
              <KpiTile
                label="ช่องทางเชื่อมต่อ (LINE/Social)"
                value="2 บัญชีใช้งาน"
                variant="success"
                subValue="LINE OA (@596vuzml) Active"
              />
              <KpiTile
                label="โหมดการทำงานของบอท"
                value={
                  settings.operatingMode === 'always'
                    ? 'ตลอด 24 ชม.'
                    : settings.operatingMode === 'off_hours_only'
                    ? 'นอกเวลาทำการ'
                    : 'เฉพาะคำสำคัญ'
                }
                variant="warning"
                subValue="เวลาทำการ 08:30 - 18:00 น."
              />
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Bot Auto-Reply Engine */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        settings.isEnabled ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          settings.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{settings.isEnabled ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">
                    🤖 Bot Auto-Reply Engine
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    กำหนดค่าคำสำคัญ (Trigger Keywords) สำหรับดึงข้อความสำเร็จรูปไปตอบอัตโนมัติบน LINE OA และ Web Chat
                  </p>
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
                    <div className="flex justify-between">
                      <span>จำนวนกฎอัตโนมัติ:</span>
                      <span className="font-mono font-bold text-text-primary">{settings.rules.length} กฎ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ทักทายแรกเข้า (Welcome):</span>
                      <span className="font-semibold text-emerald-600">
                        {settings.welcomeMessageEnabled ? '● เปิดใช้งาน' : '● ปิด'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ส่งต่องานคน (Human Handoff):</span>
                      <span className="font-semibold text-emerald-600">
                        {settings.humanHandoffEnabled ? '● เปิดใช้งาน' : '● ปิด'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange('bot')}
                  className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
                >
                  <span>กำหนดค่าบอทตอบกลับ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2: Canned Responses Library */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <MessageSquareText className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-text-secondary">
                      {cannedResponses.length} เทมเพลต
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">
                    ข้อความตอบกลับด่วน (Canned Responses)
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    จัดการคลังข้อความสำเร็จรูปและ Shortcut (<kbd className="font-mono bg-bg-app px-1 rounded">/</kbd>) สำหรับให้เจ้าหน้าที่กดส่งในหน้า Omnichannel Inbox
                  </p>
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
                    <div className="flex justify-between">
                      <span>หมวด Greeting:</span>
                      <span className="font-bold text-purple-700">
                        {cannedResponses.filter((c) => c.category === 'greeting').length} รายการ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>หมวด Question:</span>
                      <span className="font-bold text-amber-700">
                        {cannedResponses.filter((c) => c.category === 'question').length} รายการ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>หมวด Answer:</span>
                      <span className="font-bold text-emerald-700">
                        {cannedResponses.filter((c) => c.category === 'answer').length} รายการ
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/canned-responses')}
                  className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
                >
                  <span>จัดการคลังข้อความ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3: Connectors */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Network className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Connected</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">
                    การเชื่อมต่อระบบ (Connectors)
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    เชื่อมต่อ LINE Official Account Webhook, Access Token, Facebook Messenger, 3CX Telephony และ Web Chat
                  </p>
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
                    <div className="flex justify-between">
                      <span>LINE OA:</span>
                      <span className="font-semibold text-text-primary">cb360 (@596vuzml)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Webhook URL:</span>
                      <span className="font-mono text-[11px] text-text-secondary">/api/webhooks/line</span>
                    </div>
                    <div className="flex justify-between">
                      <span>สถานะ:</span>
                      <span className="font-bold text-emerald-600">● เชื่อมต่อเรียบร้อย</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/connectors')}
                  className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
                >
                  <span>จัดการ Connectors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 4: User Accounts */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-text-secondary">6 บัญชี</span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">
                    ผู้ใช้งานและสิทธิ์ (Users & Roles)
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    จัดการรายชื่อแอดมิน เจ้าหน้าที่ฝ่ายขาย (SF) และ Supervisor พร้อมกำหนดรหัสผ่านและสถานะการเข้าใช้งาน
                  </p>
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
                    <div className="flex justify-between">
                      <span>SysAdmin & Admin:</span>
                      <span className="font-semibold text-text-primary">สมศักดิ์, นภาลัย</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales & Care:</span>
                      <span className="font-semibold text-text-primary">วิภา ส., กิตติ, รพีพร</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/users')}
                  className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
                >
                  <span>จัดการผู้ใช้งาน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 5: Menu Management */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-text-secondary">RBAC Ready</span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">
                    จัดการสิทธิ์เมนู (Menu Permissions)
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    กำหนดการเปิด/ปิดเมนูแต่ละโมดูลในระบบ แยกตามระดับสิทธิ์ของผู้ใช้งาน (sysadmin, admin, SF_1, SF_2, supervisor)
                  </p>
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
                    <div className="flex justify-between">
                      <span>เมนูระบบทั้งหมด:</span>
                      <span className="font-mono font-bold text-text-primary">12 เมนู</span>
                    </div>
                    <div className="flex justify-between">
                      <span>การปรับแต่ง:</span>
                      <span className="font-semibold text-emerald-600">● บันทึกแบบเรียลไทม์</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/menus')}
                  className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
                >
                  <span>จัดการสิทธิ์เมนู</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 6: Operating Hours */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-text-secondary">
                      {settings.businessHours.start} - {settings.businessHours.end}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-text-primary mb-1">
                    เวลาทำการและศูนย์บริการ (Business Hours)
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    ตั้งค่าเวลาเปิด-ปิดทำการ เพื่อให้ Bot เลือกส่งข้อความต้อนรับหรือส่งข้อความแจ้งเตือนนอกเวลาทำการอัตโนมัติ
                  </p>
                  <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
                    <div className="flex justify-between">
                      <span>วันเปิดทำการ:</span>
                      <span className="font-semibold text-text-primary">จันทร์ - เสาร์</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ข้อความนอกเวลา:</span>
                      <span className="font-semibold text-emerald-600">● เปิดใช้งาน</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange('hours')}
                  className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
                >
                  <span>กำหนดเวลาทำการ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOT AUTO-REPLY ENGINE */}
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
                      <h2 className="text-base font-bold text-text-primary">{settings.botName}</h2>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          settings.isEnabled ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            settings.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{settings.isEnabled ? 'เปิดใช้งาน (Active)' : 'ปิดการทำงาน (Inactive)'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      ระบบ AI Bot อัจฉริยะที่จะวิเคราะห์คำสำคัญจากข้อความลูกค้าและตอบกลับอัตโนมัติบน LINE OA ทันที
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleBot}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                      settings.isEnabled
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-brand hover:bg-brand-hover text-white'
                    }`}
                  >
                    <span>{settings.isEnabled ? 'ปิดใช้งานบอท' : 'เปิดใช้งานบอท'}</span>
                  </button>
                  <button
                    onClick={handleOpenAddRule}
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
                    value={settings.operatingMode}
                    onChange={(e) => updateSettings({ operatingMode: e.target.value as any })}
                    className="w-full text-xs font-semibold py-2 px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="always">ทำงานตลอด 24 ชั่วโมง (24/7)</option>
                    <option value="off_hours_only">ทำงานเฉพาะนอกเวลาทำการ</option>
                    <option value="keyword_only">ตอบเฉพาะเมื่อตรงกับคำสำคัญ (Keywords)</option>
                  </select>
                  <p className="text-[11px] text-text-secondary mt-2">
                    {settings.operatingMode === 'always'
                      ? 'บอทจะช่วยตอบตลอดเวลา ทั้งในและนอกเวลาทำการ'
                      : settings.operatingMode === 'off_hours_only'
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
                      onClick={() =>
                        updateSettings({ welcomeMessageEnabled: !settings.welcomeMessageEnabled })
                      }
                      className={`text-xs font-semibold ${
                        settings.welcomeMessageEnabled ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {settings.welcomeMessageEnabled ? '● เปิด' : '● ปิด'}
                    </button>
                  </div>
                  <select
                    disabled={!settings.welcomeMessageEnabled}
                    value={settings.welcomeCannedResponseId || ''}
                    onChange={(e) => updateSettings({ welcomeCannedResponseId: e.target.value })}
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
                      onClick={() =>
                        updateSettings({ humanHandoffEnabled: !settings.humanHandoffEnabled })
                      }
                      className={`text-xs font-semibold ${
                        settings.humanHandoffEnabled ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {settings.humanHandoffEnabled ? '● เปิด' : '● ปิด'}
                    </button>
                  </div>
                  <div className="text-[11px] text-text-secondary mb-2 line-clamp-1">
                    คำตรวจจับ: {settings.humanHandoffKeywords.join(', ')}
                  </div>
                  <button
                    onClick={() => handleTabChange('hours')}
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
                    รายการกฎตอบกลับอัตโนมัติ ({settings.rules.length} กฎ)
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
                    {settings.rules.map((rule, idx) => {
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
                              onClick={() => toggleRuleActive(rule.id)}
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
                                onClick={() => handleOpenEditRule(rule)}
                                className="p-1 text-text-secondary hover:text-brand rounded hover:bg-bg-app transition-colors"
                                title="แก้ไขกฎ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteRule(rule.id)}
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
                        onClick={() => {
                          setSimText(text);
                          const res = testMatch(text, {
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

        {/* TAB 3: BUSINESS HOURS & HANDOFF */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-5">
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">
                  ตั้งค่าเวลาทำการ (Business Operating Hours)
                </h3>
                <p className="text-xs text-text-secondary">
                  กำหนดช่วงเวลาที่ศูนย์บริการเปิดให้บริการ เพื่อให้บอทเปิด/ปิดโหมดตอบรับอัตโนมัติตามช่วงเวลา
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-divider pt-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    เวลาเปิดทำการ (Start Time):
                  </label>
                  <input
                    type="time"
                    value={settings.businessHours.start}
                    onChange={(e) =>
                      updateSettings({
                        businessHours: { ...settings.businessHours, start: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    เวลาปิดทำการ (End Time):
                  </label>
                  <input
                    type="time"
                    value={settings.businessHours.end}
                    onChange={(e) =>
                      updateSettings({
                        businessHours: { ...settings.businessHours, end: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  ข้อความตอบกลับนอกเวลาทำการ (Off-Hours Auto Message):
                </label>
                <textarea
                  rows={3}
                  value={settings.offHoursText || ''}
                  onChange={(e) => updateSettings({ offHoursText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* Human Handoff Setup */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-5">
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">
                  คำสั่งส่งต่องานให้เจ้าหน้าที่ (Human Agent Handoff)
                </h3>
                <p className="text-xs text-text-secondary">
                  เมื่อลูกค้าพิมพ์คำสำคัญเหล่านี้ บอทจะหยุดตอบคำถามทั่วไป และส่งต่องานเข้าคิวให้เจ้าหน้าที่ในหน้า Omnichannel Inbox ทันที
                </p>
              </div>

              <div className="border-t border-divider pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    คำตรวจจับสำหรับส่งต่องาน (คั่นด้วยเครื่องหมายจุลภาค ,):
                  </label>
                  <input
                    type="text"
                    value={settings.humanHandoffKeywords.join(', ')}
                    onChange={(e) =>
                      updateSettings({
                        humanHandoffKeywords: e.target.value
                          .split(',')
                          .map((k) => k.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    ข้อความแจ้งลูกค้าเมื่อส่งต่องานสำเร็จ:
                  </label>
                  <textarea
                    rows={3}
                    value={settings.handoffMessage}
                    onChange={(e) => updateSettings({ handoffMessage: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title={ruleModalMode === 'create' ? 'สร้างกฎ Auto-Reply ใหม่' : 'แก้ไขกฎ Auto-Reply'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              ชื่อกฎ / หัวข้อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={ruleFormData.name}
              onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
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
              value={ruleFormData.keywordsStr}
              onChange={(e) => setRuleFormData({ ...ruleFormData, keywordsStr: e.target.value })}
              placeholder="เช่น เลขบัญชี, โอนเงิน, ชำระเงิน, จ่ายเงิน"
              className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
            />
            <span className="text-[10px] text-text-secondary mt-1 block">
              หากลูกค้าพิมพ์คำใดคำหนึ่งในนี้ บอทจะเลือกข้อความนี้ไปตอบ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                รูปแบบการจับคู่คำ
              </label>
              <select
                value={ruleFormData.matchType}
                onChange={(e) =>
                  setRuleFormData({ ...ruleFormData, matchType: e.target.value as any })
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
                value={ruleFormData.priority}
                onChange={(e) =>
                  setRuleFormData({ ...ruleFormData, priority: parseInt(e.target.value) || 10 })
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
              value={ruleFormData.cannedResponseId}
              onChange={(e) =>
                setRuleFormData({ ...ruleFormData, cannedResponseId: e.target.value })
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

          {!ruleFormData.cannedResponseId && (
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                ข้อความตอบกลับเฉพาะ (Custom Reply Text)
              </label>
              <textarea
                rows={3}
                value={ruleFormData.customReplyText}
                onChange={(e) =>
                  setRuleFormData({ ...ruleFormData, customReplyText: e.target.value })
                }
                placeholder="ระบุข้อความที่ต้องการให้บอทตอบ..."
                className="w-full px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand leading-relaxed"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ruleActiveCheck"
              checked={ruleFormData.isActive}
              onChange={(e) => setRuleFormData({ ...ruleFormData, isActive: e.target.checked })}
              className="rounded border-border text-brand focus:ring-brand"
            />
            <label htmlFor="ruleActiveCheck" className="text-xs font-semibold text-text-primary cursor-pointer">
              เปิดใช้งานกฎนี้ทันที
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-divider">
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
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
