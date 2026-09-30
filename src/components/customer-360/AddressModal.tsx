import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CustomerAddress, AddressType } from '../../types';
import { GoogleMapPicker } from '../common/GoogleMapPicker';
import { LocationData } from '../../utils/googleMaps';
import { AddressFormFields } from './AddressFormFields';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addressData: Omit<CustomerAddress, 'id'>) => void;
  initialData?: CustomerAddress | null;
}

const defaultFormData = {
  type: 'SHIPPING' as AddressType,
  title: '',
  receiverName: '',
  receiverPhone: '',
  addressLine1: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
  taxId: '',
  branchCode: '',
  latitude: 13.7563,
  longitude: 100.5018,
  formattedAddress: '',
  isDefaultBilling: false,
  isDefaultShipping: false,
  deliveryNotes: '',
};

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        receiverName: initialData.receiverName || '',
        receiverPhone: initialData.receiverPhone || '',
        deliveryNotes: initialData.deliveryNotes || '',
        taxId: initialData.taxId || '',
        branchCode: initialData.branchCode || '',
        formattedAddress: initialData.formattedAddress || '',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, isOpen]);

  const handleLocationSelect = (loc: LocationData) => {
    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude,
      longitude: loc.longitude,
      formattedAddress: loc.formattedAddress || prev.formattedAddress,
      subdistrict: loc.subdistrict || prev.subdistrict,
      district: loc.district || prev.district,
      province: loc.province || prev.province,
      postalCode: loc.postalCode || prev.postalCode,
      addressLine1: prev.addressLine1 || loc.formattedAddress || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.addressLine1.trim()) return;

    onSubmit({
      type: formData.type,
      title: formData.title.trim(),
      receiverName: formData.receiverName.trim() || undefined,
      receiverPhone: formData.receiverPhone.trim() || undefined,
      addressLine1: formData.addressLine1.trim(),
      subdistrict: formData.subdistrict.trim(),
      district: formData.district.trim(),
      province: formData.province.trim(),
      postalCode: formData.postalCode.trim(),
      taxId: formData.taxId.trim() || undefined,
      branchCode: formData.branchCode.trim() || undefined,
      latitude: formData.latitude,
      longitude: formData.longitude,
      formattedAddress: formData.formattedAddress || undefined,
      mapUrl: `https://maps.google.com/?q=${formData.latitude},${formData.longitude}`,
      isDefaultBilling: formData.isDefaultBilling,
      isDefaultShipping: formData.isDefaultShipping,
      deliveryNotes: formData.deliveryNotes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'แก้ไขที่อยู่ & พิกัด' : 'เพิ่มที่อยู่ใหม่และปักหมุด Google Maps'}
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            บันทึกที่อยู่ & พิกัด
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto px-0.5 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              ประเภทที่อยู่ <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AddressType })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:border-brand bg-white text-text-primary"
            >
              <option value="SHIPPING">ที่อยู่จัดส่ง / หน้างาน</option>
              <option value="BILLING">ที่อยู่ออกใบกำกับภาษี</option>
              <option value="WAREHOUSE">คลังสินค้า / โรงงาน</option>
              <option value="OFFICE">สำนักงาน / บริษัท</option>
              <option value="BRANCH">สาขา</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-text-secondary font-medium mb-1">
              ชื่อเรียกที่อยู่ / จุดหมาย <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="เช่น สำนักงานใหญ่ สาทร หรือ โกดังบางพลี ประตู 2"
              className="w-full px-3 py-2 border border-border rounded-lg focus:border-brand bg-white text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-secondary font-medium mb-1">
            ค้นหาและปักหมุดพิกัด Google Maps (Real GPS Coordinates)
          </label>
          <GoogleMapPicker
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            initialAddress={formData.formattedAddress}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        <AddressFormFields
          addressLine1={formData.addressLine1}
          subdistrict={formData.subdistrict}
          district={formData.district}
          province={formData.province}
          postalCode={formData.postalCode}
          receiverName={formData.receiverName}
          receiverPhone={formData.receiverPhone}
          deliveryNotes={formData.deliveryNotes}
          isDefaultShipping={formData.isDefaultShipping}
          isDefaultBilling={formData.isDefaultBilling}
          onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
        />
      </form>
    </Modal>
  );
};
