import { Vehicle } from '../../types/industryProfile';

export const DEFAULT_SERVICE_INTERVAL_KM = 10_000;
export const SERVICE_DUE_SOON_KM = 1_000;

export type MileageCheck = { ok: true } | { ok: false; reason: string };
export type ServiceStatus = 'overdue' | 'due_soon' | 'ok' | 'unknown';

/** Odometer readings must be whole, non-negative and never go backwards. */
export const validateMileageUpdate = (previousKm: number, nextKm: number): MileageCheck => {
  if (!Number.isInteger(nextKm) || nextKm < 0) {
    return { ok: false, reason: 'เลขไมล์ต้องเป็นจำนวนเต็มที่ไม่ติดลบ' };
  }
  if (nextKm < previousKm) {
    return {
      ok: false,
      reason: `เลขไมล์ใหม่ (${nextKm.toLocaleString('en-US')}) ต้องไม่น้อยกว่าเลขไมล์เดิม (${previousKm.toLocaleString('en-US')})`,
    };
  }
  return { ok: true };
};

export const getNextServiceMileage = (vehicle: Vehicle): number | null => {
  if (vehicle.lastServiceMileageKm === undefined) return null;
  return vehicle.lastServiceMileageKm + (vehicle.serviceIntervalKm ?? DEFAULT_SERVICE_INTERVAL_KM);
};

export const getServiceStatus = (vehicle: Vehicle): ServiceStatus => {
  const next = getNextServiceMileage(vehicle);
  if (next === null) return 'unknown';
  const remaining = next - vehicle.currentMileageKm;
  if (remaining <= 0) return 'overdue';
  if (remaining <= SERVICE_DUE_SOON_KM) return 'due_soon';
  return 'ok';
};
