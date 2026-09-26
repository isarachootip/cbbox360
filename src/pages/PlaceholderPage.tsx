import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction, Sparkles, ShieldCheck, PhoneCall, Network, Settings } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

export const PlaceholderPage: React.FC = () => {
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/consent':
        return {
          title: 'Consent (PDPA)',
          subtitle: 'ระบบจัดการความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล',
          icon: ShieldCheck,
        };
      case '/voice':
        return {
          title: 'Voice (3CX)',
          subtitle: 'ระบบโทรศัพท์คลาวด์ 3CX Telephony & Call Logs',
          icon: PhoneCall,
        };
      case '/connectors':
        return {
          title: 'Connectors',
          subtitle: 'ระบบเชื่อมต่อข้อมูล API & Third-party Integrations',
          icon: Network,
        };
      case '/settings':
        return {
          title: 'ตั้งค่าระบบ',
          subtitle: 'การกำหนดค่าระบบ สิทธิ์ผู้ใช้ และโมดูลส่วนกลาง',
          icon: Settings,
        };
      default:
        return {
          title: 'กำลังพัฒนา',
          subtitle: 'โมดูลนี้กำลังอยู่ระหว่างการพัฒนา',
          icon: Construction,
        };
    }
  };

  const { title, icon: Icon } = getPageInfo();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      <PageHeader title={title} />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-card border border-border p-8 text-center shadow-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-tint text-brand mx-auto flex items-center justify-center shadow-inner">
            <Icon className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-text-primary">{title}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
