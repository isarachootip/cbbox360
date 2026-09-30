import React from 'react';
import { useBot } from '../../../context/BotContext';

export const BusinessHoursTab: React.FC = () => {
  const { settings, updateSettings } = useBot();

  return (
    <div className="space-y-6">
      {/* Operating Hours Card */}
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
  );
};
