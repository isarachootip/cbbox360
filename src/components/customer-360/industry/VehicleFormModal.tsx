import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Vehicle } from '../../../types/industryProfile';
import { FieldError } from '../../../domain/industry/schemas';
import { validateMileageUpdate } from '../../../domain/industry/vehicleRules';
import { newId, optionalInt, optionalText } from '../../../utils/formParsers';
import {
  FormErrorList,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './FormErrorList';

type FieldKey =
  | 'licensePlate' | 'province' | 'brand' | 'model' | 'year' | 'vin'
  | 'currentMileageKm' | 'lastServiceMileageKm' | 'lastServiceDate' | 'insuranceExpiry' | 'taxExpiry';

type FormState = Record<FieldKey, string>;

const FIELDS: { key: FieldKey; label: string; type?: 'date' | 'number'; placeholder?: string }[] = [
  { key: 'licensePlate', label: 'ทะเบียนรถ *', placeholder: '1กข-9988' },
  { key: 'province', label: 'จังหวัด *', placeholder: 'กรุงเทพมหานคร' },
  { key: 'brand', label: 'ยี่ห้อ *' },
  { key: 'model', label: 'รุ่น *' },
  { key: 'year', label: 'ปีรถ', type: 'number' },
  { key: 'vin', label: 'เลขตัวถัง (VIN)', placeholder: '17 หลัก' },
  { key: 'currentMileageKm', label: 'เลขไมล์ปัจจุบัน (กม.) *' },
  { key: 'lastServiceMileageKm', label: 'เลขไมล์ตอนเข้าบริการล่าสุด' },
  { key: 'lastServiceDate', label: 'วันที่เข้าบริการล่าสุด', type: 'date' },
  { key: 'insuranceExpiry', label: 'ประกันภัยหมดอายุ', type: 'date' },
  { key: 'taxExpiry', label: 'ภาษี / พ.ร.บ. หมดอายุ', type: 'date' },
];

const toFormState = (v: Vehicle | null): FormState => ({
  licensePlate: v?.licensePlate ?? '',
  province: v?.province ?? '',
  brand: v?.brand ?? '',
  model: v?.model ?? '',
  year: v?.year?.toString() ?? '',
  vin: v?.vin ?? '',
  currentMileageKm: v?.currentMileageKm.toString() ?? '',
  lastServiceMileageKm: v?.lastServiceMileageKm?.toString() ?? '',
  lastServiceDate: v?.lastServiceDate ?? '',
  insuranceExpiry: v?.insuranceExpiry ?? '',
  taxExpiry: v?.taxExpiry ?? '',
});

const fromFormState = (s: FormState, base: Vehicle | null): Vehicle => ({
  id: base?.id ?? newId('veh'),
  licensePlate: s.licensePlate.trim(),
  province: s.province.trim(),
  brand: s.brand.trim(),
  model: s.model.trim(),
  year: optionalInt(s.year),
  vin: optionalText(s.vin),
  currentMileageKm: optionalInt(s.currentMileageKm) ?? Number.NaN,
  lastServiceMileageKm: optionalInt(s.lastServiceMileageKm),
  lastServiceDate: optionalText(s.lastServiceDate),
  serviceIntervalKm: base?.serviceIntervalKm,
  insuranceExpiry: optionalText(s.insuranceExpiry),
  taxExpiry: optionalText(s.taxExpiry),
});

interface VehicleFormModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  /** Resolves to validation errors, or an empty array on success. */
  onSubmit: (vehicle: Vehicle) => Promise<FieldError[]>;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ vehicle, onClose, onSubmit }) => {
  const [form, setForm] = useState<FormState>(() => toFormState(vehicle));
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = fromFormState(form, vehicle);
    if (vehicle) {
      const check = validateMileageUpdate(vehicle.currentMileageKm, next.currentMileageKm);
      if (!check.ok) {
        setErrors([{ path: 'currentMileageKm', message: check.reason }]);
        return;
      }
    }
    setIsSaving(true);
    const result = await onSubmit(next);
    setIsSaving(false);
    if (result.length === 0) onClose();
    else setErrors(result);
  };

  return (
    <Modal isOpen onClose={onClose} title={vehicle ? `แก้ไขข้อมูลรถ ${vehicle.licensePlate}` : 'เพิ่มรถของลูกค้า'} maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <input
                type={f.type === 'date' ? 'date' : 'text'}
                inputMode={f.type === 'number' || f.key.endsWith('Km') ? 'numeric' : undefined}
                className={inputClass}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <FormErrorList errors={errors} />
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            ยกเลิก
          </button>
          <button type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรถ'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
