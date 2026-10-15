import React, { useState } from 'react';
import { Car, Pencil, Plus } from 'lucide-react';
import { AutoServiceProfile, Vehicle } from '../../../types/industryProfile';
import { FieldError } from '../../../domain/industry/schemas';
import { UseIndustryProfileResult } from '../../../hooks/useIndustryProfile';
import { getNextServiceMileage, getServiceStatus } from '../../../domain/industry/vehicleRules';
import { getExpiryStatus } from '../../../domain/industry/dateRules';
import { EXPIRY_DISPLAY, IndustryStatusDot, SERVICE_DISPLAY } from './IndustryStatusDot';
import { VehicleFormModal } from './VehicleFormModal';
import { primaryButtonClass, secondaryButtonClass } from './FormErrorList';

interface VehicleListProps {
  profile: AutoServiceProfile | null;
  onSave: UseIndustryProfileResult['save'];
}

type EditorState = { mode: 'closed' } | { mode: 'open'; vehicle: Vehicle | null };

const km = (value: number) => `${value.toLocaleString('en-US')} กม.`;

export const VehicleList: React.FC<VehicleListProps> = ({ profile, onSave }) => {
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });
  const vehicles = profile?.vehicles ?? [];
  const today = new Date();

  const handleSubmit = async (vehicle: Vehicle): Promise<FieldError[]> => {
    const exists = vehicles.some((v) => v.id === vehicle.id);
    const nextVehicles = exists ? vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)) : [...vehicles, vehicle];
    const result = await onSave({ kind: 'auto_service', vehicles: nextVehicles });
    return result.ok ? [] : result.errors;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">รถของลูกค้า ({vehicles.length} คัน)</h3>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'open', vehicle: null })}
          className={`${primaryButtonClass} flex items-center gap-1`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มรถ</span>
        </button>
      </div>

      {vehicles.length === 0 && (
        <div className="py-10 text-center">
          <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-text-secondary">ยังไม่มีข้อมูลรถ</p>
        </div>
      )}

      {vehicles.map((v) => {
        const nextService = getNextServiceMileage(v);
        return (
          <div key={v.id} className="p-3.5 rounded-xl border border-border bg-white space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-text-primary">
                  {v.licensePlate} <span className="font-medium text-text-secondary">{v.province}</span>
                </div>
                <div className="text-xs text-text-secondary">
                  {v.brand} {v.model} {v.year ?? ''} {v.vin && `· VIN ${v.vin}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditor({ mode: 'open', vehicle: v })}
                className={`${secondaryButtonClass} flex items-center gap-1 shrink-0`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข / อัปเดตไมล์</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-text-secondary">
              <span>ไมล์ปัจจุบัน: <strong className="text-text-primary">{km(v.currentMileageKm)}</strong></span>
              <span>เช็คครั้งถัดไป: <strong className="text-text-primary">{nextService ? km(nextService) : '—'}</strong></span>
              <span>เข้าบริการล่าสุด: <strong className="text-text-primary">{v.lastServiceDate ?? '—'}</strong></span>
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              <IndustryStatusDot {...SERVICE_DISPLAY[getServiceStatus(v)]} />
              <IndustryStatusDot prefix="ประกัน" {...EXPIRY_DISPLAY[getExpiryStatus(v.insuranceExpiry, today)]} />
              <IndustryStatusDot prefix="ภาษี" {...EXPIRY_DISPLAY[getExpiryStatus(v.taxExpiry, today)]} />
            </div>
          </div>
        );
      })}

      {editor.mode === 'open' && (
        <VehicleFormModal
          key={editor.vehicle?.id ?? 'new'}
          vehicle={editor.vehicle}
          onClose={() => setEditor({ mode: 'closed' })}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
