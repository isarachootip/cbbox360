import React, { useEffect, useState } from 'react';
import { Building2, Phone, Mail, MapPin, Globe, Clock, Check, RotateCcw } from 'lucide-react';
import { CompanyProfile } from '../../types';

interface CompanyProfileFormCardProps {
  profile: CompanyProfile;
  activeTemplateName: string;
  onSave: (updated: CompanyProfile) => void;
  onResetToTemplatePreset: () => void;
}

export const CompanyProfileFormCard: React.FC<CompanyProfileFormCardProps> = ({
  profile,
  activeTemplateName,
  onSave,
  onResetToTemplatePreset,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (key: keyof CompanyProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-border p-5 shadow-card space-y-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-divider pb-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary">
                1. ข้อมูลองค์กรและช่องทางติดต่อสำหรับ AI (Company Profile)
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>พร้อมใช้ตอบลูกค้า & แทนค่าตัวแปร</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              ข้อมูลชุดนี้ใช้ให้ Gemini AI ตอบคำถาม เช่น &quot;บริษัทชื่ออะไร ทำธุรกิจอะไร ขอเบอร์โทร/อีเมลติดต่อ&quot; และใช้แทนค่าตัวแปรในข้อความด่วน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetToTemplatePreset}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-all"
            title={`โหลดค่าตัวอย่างจากเทมเพลต ${activeTemplateName}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>โหลดค่าตัวอย่าง ({activeTemplateName})</span>
          </button>
          <button
            type="submit"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs ${
              isSaved ? 'bg-emerald-600' : 'bg-brand hover:bg-brand-hover'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSaved ? 'บันทึกเรียบร้อย' : 'บันทึกข้อมูลองค์กร'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            ชื่อบริษัท / หน่วยงาน <span className="font-mono text-brand">{'{company_name}'}</span>
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="เช่น บจก. คัสบอกซ์ สามหกศูนย์ (CusBox360)"
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1">
            ประเภทธุรกิจหลัก <span className="font-mono text-brand">{'{business_type}'}</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessType}
            onChange={(e) => handleChange('businessType', e.target.value)}
            placeholder="เช่น ธุรกิจค้าส่งอุปกรณ์สำนักงาน / โรงพยาบาลและคลินิก"
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-text-primary mb-1">
            รายละเอียดธุรกิจ สินค้า และบริการหลัก (สำหรับให้ AI อธิบายลูกค้า)
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="อธิบายว่าบริษัททำธุรกิจอะไร ให้บริการหรือจำหน่ายสินค้าใดบ้าง..."
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-text-secondary" />
            <span>เบอร์โทรศัพท์ติดต่อ</span>
            <span className="font-mono text-brand">{'{company_phone}'}</span>
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="เช่น 02-123-4567, 081-892-5678"
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-text-secondary" />
            <span>อีเมลติดต่อ (E-mail)</span>
            <span className="font-mono text-brand">{'{company_email}'}</span>
          </label>
          <input
            type="text"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="เช่น sales@cusbox360.co.th"
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-text-secondary" />
            <span>LINE Official / เว็บไซต์</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={formData.lineId}
              onChange={(e) => handleChange('lineId', e.target.value)}
              placeholder="@lineid"
              className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
            />
            <input
              type="text"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            <span>วันและเวลาทำการ</span>
          </label>
          <input
            type="text"
            value={formData.businessHoursText}
            onChange={(e) => handleChange('businessHoursText', e.target.value)}
            placeholder="เช่น จันทร์ - ศุกร์ 08:30 - 18:00 น."
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-text-primary mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-text-secondary" />
            <span>ที่อยู่ / สถานที่ตั้งสำนักงาน</span>
            <span className="font-mono text-brand">{'{company_address}'}</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="เลขที่ อาคาร ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
            className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          />
        </div>
      </div>
    </form>
  );
};
