import React from 'react';
import { KpiTile } from '../../common/KpiTile';
import { CannedResponse } from '../../../types';
import { useBot } from '../../../context/BotContext';
import { AiFeaturesToggleCard } from '../AiFeaturesToggleCard';
import { TypographySettingsCard } from '../TypographySettingsCard';
import { PbxPhoneSettingsCard } from '../PbxPhoneSettingsCard';
import { OverviewModulesGrid } from '../OverviewModulesGrid';

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

      {/* Display & Typography Comfort Settings */}
      <TypographySettingsCard />

      {/* PABX WebPhone Click-to-Call URL Configuration */}
      <PbxPhoneSettingsCard />

      {/* AI Copilot Features Toggle (Suggested Reply & AI Summary) */}
      <AiFeaturesToggleCard />

      {/* Modules Grid */}
      <OverviewModulesGrid
        cannedResponses={cannedResponses}
        onSwitchToBotTab={onSwitchToBotTab}
        onSwitchToHoursTab={onSwitchToHoursTab}
      />
    </div>
  );
};
