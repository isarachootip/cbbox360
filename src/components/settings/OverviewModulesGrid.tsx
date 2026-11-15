import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, MessageSquareText, Network, Users, Sliders, Clock } from 'lucide-react';
import { CannedResponse } from '../../types';
import { useBot } from '../../context/BotContext';
import { ModuleCardConfig, OverviewModuleCard } from './OverviewModuleCard';

interface OverviewModulesGridProps {
  cannedResponses: CannedResponse[];
  onSwitchToBotTab: () => void;
  onSwitchToHoursTab: () => void;
}

const StatusDotLabel: React.FC<{ active: boolean; activeText: string; inactiveText: string }> = ({
  active,
  activeText,
  inactiveText,
}) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? 'text-emerald-600' : 'text-slate-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    <span>{active ? activeText : inactiveText}</span>
  </span>
);

export const OverviewModulesGrid: React.FC<OverviewModulesGridProps> = ({
  cannedResponses,
  onSwitchToBotTab,
  onSwitchToHoursTab,
}) => {
  const navigate = useNavigate();
  const { settings } = useBot();

  const greetingCount = cannedResponses.filter((c) => c.category === 'greeting').length;
  const questionCount = cannedResponses.filter((c) => c.category === 'question').length;
  const answerCount = cannedResponses.filter((c) => c.category === 'answer').length;

  const cards: ModuleCardConfig[] = [
    {
      key: 'bot',
      icon: <Bot className="w-5 h-5" />,
      iconBgClass: 'bg-blue-50 text-brand',
      headerRight: <StatusDotLabel active={settings.isEnabled} activeText="Active" inactiveText="Inactive" />,
      title: 'Bot Auto-Reply Engine',
      description: 'กำหนดค่าคำสำคัญ (Trigger Keywords) สำหรับดึงข้อความสำเร็จรูปไปตอบอัตโนมัติบน LINE OA และ Web Chat',
      rows: [
        { label: 'จำนวนกฎอัตโนมัติ:', value: <span className="font-semibold tabular-nums text-text-primary">{settings.rules.length} กฎ</span> },
        { label: 'ทักทายแรกเข้า (Welcome):', value: <span className="font-medium text-emerald-600">{settings.welcomeMessageEnabled ? '● เปิดใช้งาน' : '● ปิด'}</span> },
        { label: 'ส่งต่องานคน (Human Handoff):', value: <span className="font-medium text-emerald-600">{settings.humanHandoffEnabled ? '● เปิดใช้งาน' : '● ปิด'}</span> },
      ],
      ctaLabel: 'กำหนดค่าบอทตอบกลับ',
      onAction: onSwitchToBotTab,
    },
    {
      key: 'canned',
      icon: <MessageSquareText className="w-5 h-5" />,
      iconBgClass: 'bg-purple-50 text-purple-600',
      headerRight: <span className="text-2xs tabular-nums font-medium text-text-secondary">{cannedResponses.length} เทมเพลต</span>,
      title: 'ข้อความตอบกลับด่วน (Canned Responses)',
      description: (
        <>จัดการคลังข้อความสำเร็จรูปและ Shortcut (<kbd className="font-mono bg-bg-app px-1 rounded">/</kbd>) สำหรับเจ้าหน้าที่ในหน้า Omnichannel Inbox</>
      ),
      rows: [
        { label: 'หมวด Greeting:', value: <span className="font-medium tabular-nums text-purple-700">{greetingCount} รายการ</span> },
        { label: 'หมวด Question:', value: <span className="font-medium tabular-nums text-amber-700">{questionCount} รายการ</span> },
        { label: 'หมวด Answer:', value: <span className="font-medium tabular-nums text-emerald-700">{answerCount} รายการ</span> },
      ],
      ctaLabel: 'จัดการคลังข้อความ',
      onAction: () => navigate('/canned-responses'),
    },
    {
      key: 'connectors',
      icon: <Network className="w-5 h-5" />,
      iconBgClass: 'bg-emerald-50 text-emerald-600',
      headerRight: <StatusDotLabel active activeText="Connected" inactiveText="Disconnected" />,
      title: 'การเชื่อมต่อระบบ (Connectors)',
      description: 'เชื่อมต่อ LINE Official Account Webhook, Access Token, Facebook Messenger, 3CX Telephony และ Web Chat',
      rows: [
        { label: 'LINE OA:', value: <span className="font-medium text-text-primary">cb360 (@596vuzml)</span> },
        { label: 'Webhook URL:', value: <span className="font-mono text-2xs text-text-secondary">/api/webhooks/line</span> },
        { label: 'สถานะ:', value: <span className="font-medium text-emerald-600">● เชื่อมต่อเรียบร้อย</span> },
      ],
      ctaLabel: 'จัดการ Connectors',
      onAction: () => navigate('/connectors'),
    },
    {
      key: 'users',
      icon: <Users className="w-5 h-5" />,
      iconBgClass: 'bg-amber-50 text-amber-600',
      headerRight: <span className="text-2xs tabular-nums font-medium text-text-secondary">6 บัญชี</span>,
      title: 'ผู้ใช้งานและสิทธิ์ (Users & Roles)',
      description: 'จัดการรายชื่อแอดมิน เจ้าหน้าที่ฝ่ายขาย (SF) และ Supervisor พร้อมกำหนดรหัสผ่านและสถานะการเข้าใช้งาน',
      rows: [
        { label: 'SysAdmin & Admin:', value: <span className="font-medium text-text-primary">สมศักดิ์, นภาลัย</span> },
        { label: 'Sales & Care:', value: <span className="font-medium text-text-primary">วิภา ส., กิตติ, รพีพร</span> },
      ],
      ctaLabel: 'จัดการผู้ใช้งาน',
      onAction: () => navigate('/users'),
    },
    {
      key: 'menus',
      icon: <Sliders className="w-5 h-5" />,
      iconBgClass: 'bg-indigo-50 text-indigo-600',
      headerRight: <span className="text-2xs font-medium text-text-secondary">RBAC Ready</span>,
      title: 'จัดการสิทธิ์เมนู (Menu Permissions)',
      description: 'กำหนดการเปิด/ปิดเมนูแต่ละโมดูลในระบบ แยกตามระดับสิทธิ์ของผู้ใช้งาน (sysadmin, admin, SF_1, SF_2, supervisor)',
      rows: [
        { label: 'เมนูระบบทั้งหมด:', value: <span className="font-semibold tabular-nums text-text-primary">12 เมนู</span> },
        { label: 'ระดับสิทธิ์ที่รองรับ:', value: <span className="font-medium tabular-nums text-text-primary">5 ระดับ</span> },
      ],
      ctaLabel: 'กำหนดสิทธิ์เมนู',
      onAction: () => navigate('/menus'),
    },
    {
      key: 'hours',
      icon: <Clock className="w-5 h-5" />,
      iconBgClass: 'bg-rose-50 text-rose-600',
      headerRight: (
        <span className="text-2xs tabular-nums font-medium text-text-secondary">
          {settings.businessHours.start} - {settings.businessHours.end} น.
        </span>
      ),
      title: 'เวลาทำการและการส่งต่องาน',
      description: 'กำหนดเวลาทำการศูนย์บริการ ข้อความตอบกลับนอกเวลา และเงื่อนไขการส่งต่อแชทให้เจ้าหน้าที่คนจริง',
      rows: [
        { label: 'วันเปิดทำการ:', value: <span className="font-medium text-text-primary">จันทร์ - เสาร์</span> },
        { label: 'ข้อความนอกเวลา:', value: <span className="font-medium text-emerald-600">{settings.offHoursMessageEnabled ? '● เปิดใช้งาน' : '● ปิด'}</span> },
      ],
      ctaLabel: 'ตั้งค่าเวลาทำการ',
      onAction: onSwitchToHoursTab,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card) => (
        <OverviewModuleCard key={card.key} card={card} />
      ))}
    </div>
  );
};
