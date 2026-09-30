import React from 'react';

interface AddressFormFieldsProps {
  addressLine1: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  receiverName: string;
  receiverPhone: string;
  deliveryNotes: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  onChange: (field: string, value: any) => void;
}

export const AddressFormFields: React.FC<AddressFormFieldsProps> = ({
  addressLine1,
  subdistrict,
  district,
  province,
  postalCode,
  receiverName,
  receiverPhone,
  deliveryNotes,
  isDefaultShipping,
  isDefaultBilling,
  onChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Address Lines */}
      <div>
        <label className="block text-text-secondary font-medium mb-1">
          รายละเอียดที่อยู่ (เลขที่ ซอย ถนน อาคาร) <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={2}
          required
          value={addressLine1}
          onChange={(e) => onChange('addressLine1', e.target.value)}
          placeholder="เช่น 123/45 อาคาร ABC ชั้น 4 ถ.สาทรใต้"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white text-text-primary resize-none text-xs"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-text-secondary font-medium mb-1">ตำบล / แขวง</label>
          <input
            type="text"
            value={subdistrict}
            onChange={(e) => onChange('subdistrict', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">อำเภอ / เขต</label>
          <input
            type="text"
            value={district}
            onChange={(e) => onChange('district', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">จังหวัด</label>
          <input
            type="text"
            value={province}
            onChange={(e) => onChange('province', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">รหัสไปรษณีย์</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => onChange('postalCode', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs font-mono"
          />
        </div>
      </div>

      {/* Contact at this location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-text-secondary font-medium mb-1">ผู้รับสินค้า / ผู้ติดต่อหน้างาน</label>
          <input
            type="text"
            value={receiverName}
            onChange={(e) => onChange('receiverName', e.target.value)}
            placeholder="เช่น คุณกิตติศักดิ์ หรือ ช่างวิรัช"
            className="w-full px-3 py-2 border border-border rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="block text-text-secondary font-medium mb-1">เบอร์ติดต่อหน้างาน</label>
          <input
            type="tel"
            value={receiverPhone}
            onChange={(e) => onChange('receiverPhone', e.target.value)}
            placeholder="08x-xxx-xxxx"
            className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono"
          />
        </div>
      </div>

      {/* Delivery Constraints */}
      <div>
        <label className="block text-text-secondary font-medium mb-1">เงื่อนไขการส่งสินค้า / ข้อจำกัดหน้างาน</label>
        <input
          type="text"
          value={deliveryNotes}
          onChange={(e) => onChange('deliveryNotes', e.target.value)}
          placeholder="เช่น รถ 6 ล้อเข้าไม่ได้, เปิดรับสินค้า 09:00 - 16:30 น., ลิฟต์ขนของอยู่ด้านหลัง"
          className="w-full px-3 py-2 border border-border rounded-lg text-xs"
        />
      </div>

      {/* Default toggles */}
      <div className="pt-2 border-t border-divider flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDefaultShipping}
            onChange={(e) => onChange('isDefaultShipping', e.target.checked)}
            className="w-4 h-4 text-brand rounded border-border"
          />
          <span className="text-text-primary font-medium text-xs">ตั้งเป็นที่อยู่จัดส่งหลัก (Default Shipping)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isDefaultBilling}
            onChange={(e) => onChange('isDefaultBilling', e.target.checked)}
            className="w-4 h-4 text-brand rounded border-border"
          />
          <span className="text-text-primary font-medium text-xs">ตั้งเป็นที่อยู่ออกใบกำกับภาษีหลัก (Default Billing)</span>
        </label>
      </div>
    </div>
  );
};
