import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquareText,
  Network,
  Users,
  Sliders,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { KpiTile } from '../../common/KpiTile';
import { CannedResponse } from '../../../types';
import { useBot } from '../../../context/BotContext';

interface OverviewTabProps {
  cannedResponses: CannedResponse[];
  onSwitchToBotTab: () => void;
  onSwitchToHoursTab: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  cannedResponses,
  onSwitchToBotTab,
  onSwitchToHoursTab,
}) => {
  const navigate = useNavigate();
  const { settings } = useBot();

  return (
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
            onClick={onSwitchToBotTab}
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
                <span>ระดับสิทธิ์ที่รองรับ:</span>
                <span className="font-semibold text-text-primary">5 ระดับ</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/menus')}
            className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
          >
            <span>กำหนดสิทธิ์เมนู</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 6: Business Hours */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:border-brand/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold text-text-secondary">
                {settings.businessHours.start} - {settings.businessHours.end} น.
              </span>
            </div>
            <h3 className="font-bold text-sm text-text-primary mb-1">
              เวลาทำการและการส่งต่องาน
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              กำหนดเวลาทำการศูนย์บริการ ข้อความตอบกลับนอกเวลา และเงื่อนไขการส่งต่อแชทให้เจ้าหน้าที่คนจริง
            </p>
            <div className="space-y-1.5 text-xs text-text-secondary border-t border-divider pt-3">
              <div className="flex justify-between">
                <span>วันเปิดทำการ:</span>
                <span className="font-semibold text-text-primary">จันทร์ - เสาร์</span>
              </div>
              <div className="flex justify-between">
                <span>ข้อความนอกเวลา:</span>
                <span className="font-semibold text-emerald-600">
                  {settings.offHoursMessageEnabled ? '● เปิดใช้งาน' : '● ปิด'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onSwitchToHoursTab}
            className="mt-4 w-full py-2 bg-bg-app hover:bg-bg-subtle text-brand rounded-lg text-xs font-bold border border-border flex items-center justify-center gap-1 transition-all"
          >
            <span>ตั้งค่าเวลาทำการ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
