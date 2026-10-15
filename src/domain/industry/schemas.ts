import { z } from 'zod';

/** Shared boundary schemas for industry profiles. Reused by the server API in Phase 2B. */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD');
const requiredText = (message: string) => z.string().trim().min(1, message);

/** ISO 3779: 17 chars, letters I, O, Q are not allowed. */
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export const insurancePolicySchema = z.object({
  id: z.string().min(1),
  provider: requiredText('กรุณาระบุบริษัทประกัน / ประเภทสิทธิ์'),
  policyNo: requiredText('กรุณาระบุเลขกรมธรรม์ / เลขสิทธิ์'),
  coverageType: z.enum(['OPD', 'IPD', 'OPD_IPD', 'SSO', 'UCS']),
  validUntil: isoDate.optional(),
});

export const hospitalProfileSchema = z.object({
  kind: z.literal('hospital'),
  hn: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{3,20}$/, 'HN ต้องเป็นตัวอักษร/ตัวเลข/ขีด 3–20 ตัว'),
  bloodType: z.enum(['A', 'B', 'AB', 'O', 'unknown']),
  drugAllergies: z.array(z.string().trim().min(1)),
  chronicConditions: z.array(z.string().trim().min(1)),
  insurancePolicies: z.array(insurancePolicySchema),
  preferredDoctor: z.string().trim().optional(),
  emergencyContact: z
    .object({
      name: requiredText('กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน'),
      phone: z.string().trim().regex(/^[0-9+\-\s]{9,15}$/, 'เบอร์โทรไม่ถูกต้อง'),
      relation: requiredText('กรุณาระบุความสัมพันธ์'),
    })
    .optional(),
});

export const vehicleSchema = z
  .object({
    id: z.string().min(1),
    licensePlate: z.string().trim().min(2, 'กรุณาระบุทะเบียนรถ').max(12, 'ทะเบียนรถยาวเกินไป'),
    province: requiredText('กรุณาระบุจังหวัดของทะเบียน'),
    brand: requiredText('กรุณาระบุยี่ห้อ'),
    model: requiredText('กรุณาระบุรุ่น'),
    year: z.number().int().min(1950).max(2100).optional(),
    vin: z.string().trim().toUpperCase().regex(VIN_PATTERN, 'VIN ต้องมี 17 ตัว และห้ามมีตัว I, O, Q').optional(),
    currentMileageKm: z.number().int('เลขไมล์ต้องเป็นจำนวนเต็ม').nonnegative('เลขไมล์ต้องไม่ติดลบ'),
    lastServiceMileageKm: z.number().int().nonnegative().optional(),
    lastServiceDate: isoDate.optional(),
    serviceIntervalKm: z.number().int().positive().optional(),
    insuranceExpiry: isoDate.optional(),
    taxExpiry: isoDate.optional(),
  })
  .refine((v) => v.lastServiceMileageKm === undefined || v.lastServiceMileageKm <= v.currentMileageKm, {
    message: 'เลขไมล์ตอนเข้าบริการล่าสุดต้องไม่มากกว่าเลขไมล์ปัจจุบัน',
    path: ['lastServiceMileageKm'],
  });

export const autoServiceProfileSchema = z.object({
  kind: z.literal('auto_service'),
  vehicles: z.array(vehicleSchema),
});

export const logisticsProfileSchema = z
  .object({
    kind: z.literal('logistics'),
    accountCode: requiredText('กรุณาระบุรหัสบัญชีผู้ส่ง'),
    originBranch: requiredText('กรุณาระบุสาขาต้นทาง'),
    defaultService: z.enum(['standard', 'express', 'same_day', 'freight']),
    codEnabled: z.boolean(),
    codBankAccount: z.string().trim().optional(),
    recentTrackingNumbers: z.array(z.string().trim().min(1)),
  })
  .refine((p) => !p.codEnabled || Boolean(p.codBankAccount), {
    message: 'เปิดใช้ COD ต้องระบุบัญชีรับเงิน',
    path: ['codBankAccount'],
  });

export const industryProfileSchema = z.union([
  hospitalProfileSchema,
  autoServiceProfileSchema,
  logisticsProfileSchema,
]);

export interface FieldError {
  path: string;
  message: string;
}

export const toFieldErrors = (error: z.ZodError): FieldError[] =>
  error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
