/**
 * userController.js — HTTP boundary for /api/users with Zod validation and audit logging.
 */
import { z } from 'zod';

const roleSchema = z.enum(['sysadmin', 'admin', 'SF_1', 'SF_2', 'SF_3', 'supervisor', 'doctor', 'nurse']);
const statusSchema = z.enum(['active', 'inactive']);

const createSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(160).optional().default(''),
  role: roleSchema,
  department: z.string().trim().max(160).optional().default(''),
  status: statusSchema.optional().default('active'),
  avatarBg: z.string().trim().max(32).optional(),
  mustChangePassword: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  username: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().max(160).optional(),
  role: roleSchema.optional(),
  department: z.string().trim().max(160).optional(),
  status: statusSchema.optional(),
  avatarBg: z.string().trim().max(32).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(1).max(256),
  mustChangePassword: z.boolean().optional().default(false),
});

const patchStatusSchema = z.object({ status: statusSchema });

const totpSchema = z.object({
  enabled: z.boolean(),
  secret: z.string().trim().min(8).max(128).optional(),
  code: z.string().trim().regex(/^\d{6}$/).optional(),
});

const STATUS_BY_CODE = {
  USER_NOT_FOUND: 404,
  USERNAME_TAKEN: 409,
  FORBIDDEN_ROLE: 403,
  CANNOT_DISABLE_SELF: 400,
  CANNOT_DELETE_SELF: 400,
  LAST_SYSADMIN: 400,
  INVALID_TOTP: 400,
};

export const createUserController = ({ userManagementService, audit }) => {
  const fail = (res, result) =>
    res.status(STATUS_BY_CODE[result.code] ?? 400).json({ success: false, error: result.code });

  const safe = (handler) => async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      console.error('[User Management Error]:', err.message);
      return res.status(503).json({ success: false, error: 'USER_SERVICE_UNAVAILABLE' });
    }
  };

  const listUsers = safe(async (_req, res) => {
    const users = await userManagementService.listUsers();
    return res.status(200).json({ success: true, users });
  });

  const createUser = safe(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const result = await userManagementService.createUser(req.user, parsed.data);
    if (result.status !== 'ok') return fail(res, result);
    await audit({
      userId: req.user.username,
      userRole: req.user.role,
      action: `สร้างบัญชีผู้ใช้ใหม่: ${result.user.username} (${result.user.role})`,
      category: 'user',
      resource: `User/${result.user.username}`,
      ip: req.ip,
    });
    return res.status(201).json({ success: true, user: result.user });
  });

  const updateUser = safe(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const result = await userManagementService.updateUser(req.user, req.params.id, parsed.data);
    if (result.status !== 'ok') return fail(res, result);
    await audit({
      userId: req.user.username,
      userRole: req.user.role,
      action: `แก้ไขข้อมูลผู้ใช้: ${result.user.username}`,
      category: 'user',
      resource: `User/${result.user.username}`,
      ip: req.ip,
    });
    return res.status(200).json({ success: true, user: result.user });
  });

  const resetPassword = safe(async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const result = await userManagementService.resetUserPassword(
      req.user,
      req.params.id,
      parsed.data,
      req.sessionToken ?? null
    );
    if (result.status !== 'ok') return fail(res, result);
    await audit({
      userId: req.user.username,
      userRole: req.user.role,
      action: `รีเซ็ตรหัสผ่านผู้ใช้ ID: ${req.params.id}`,
      category: 'security',
      status: 'warning',
      resource: `User/${req.params.id}`,
      ip: req.ip,
    });
    return res.status(200).json({ success: true });
  });

  const setStatus = safe(async (req, res) => {
    const parsed = patchStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const result = await userManagementService.setUserStatus(
      req.user,
      req.params.id,
      parsed.data.status === 'active'
    );
    if (result.status !== 'ok') return fail(res, result);
    await audit({
      userId: req.user.username,
      userRole: req.user.role,
      action: `เปลี่ยนสถานะผู้ใช้ ${result.user.username} เป็น ${result.user.status}`,
      category: 'user',
      resource: `User/${result.user.username}`,
      ip: req.ip,
    });
    return res.status(200).json({ success: true, user: result.user });
  });

  const configureTotp = safe(async (req, res) => {
    const parsed = totpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'INVALID_INPUT' });
    const result = await userManagementService.configureUserTotp(req.user, req.params.id, parsed.data);
    if (result.status !== 'ok') return fail(res, result);
    await audit({
      userId: req.user.username,
      userRole: req.user.role,
      action: `${parsed.data.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} 2FA สำหรับ ${result.user.username}`,
      category: 'security',
      resource: `User/${result.user.username}`,
      ip: req.ip,
    });
    return res.status(200).json({ success: true, user: result.user });
  });

  const deleteUser = safe(async (req, res) => {
    const result = await userManagementService.deleteUser(req.user, req.params.id);
    if (result.status !== 'ok') return fail(res, result);
    await audit({
      userId: req.user.username,
      userRole: req.user.role,
      action: `ลบบัญชีผู้ใช้ ID: ${req.params.id}`,
      category: 'user',
      status: 'warning',
      resource: `User/${req.params.id}`,
      ip: req.ip,
    });
    return res.status(200).json({ success: true });
  });

  return { listUsers, createUser, updateUser, resetPassword, setStatus, configureTotp, deleteUser };
};
