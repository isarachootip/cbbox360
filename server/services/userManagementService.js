/**
 * userManagementService.js — Admin CRUD, password reset, status toggle, and 2FA configuration.
 * Enforces RBAC boundaries (non-sysadmins cannot touch sysadmin accounts; last sysadmin protected).
 */
import crypto from 'crypto';
import { hashSessionToken } from '../utils/cryptoUtils.js';

const err = (code) => ({ status: 'error', code });

export const toManagedUser = (row) => ({
  id: row.id,
  username: row.username,
  name: row.display_name,
  email: row.email ?? '',
  role: row.role,
  department: row.department ?? '',
  initials: row.initials ?? String(row.display_name || '').slice(0, 2),
  avatarBg: row.avatar_bg ?? '#CFE2F8',
  status: row.is_active ? 'active' : 'inactive',
  mustChangePassword: Boolean(row.must_change_password),
  totpEnabled: Boolean(row.totp_enabled),
  createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
  lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
});

export const createUserManagementService = ({
  userRepo,
  sessionRepo,
  hashPassword,
  encryptSecret,
  verifyTotpCode,
}) => {
  const canTouchTarget = (actor, targetRole) => actor.role === 'sysadmin' || targetRole !== 'sysadmin';

  const countActiveSysadmins = async () => {
    const all = await userRepo.listAll();
    return all.filter((u) => u.role === 'sysadmin' && u.is_active).length;
  };

  const listUsers = async () => {
    const rows = await userRepo.listAll();
    return rows.map(toManagedUser);
  };

  const createUser = async (actor, input) => {
    if (!canTouchTarget(actor, input.role)) return err('FORBIDDEN_ROLE');
    const username = String(input.username).trim();
    if (await userRepo.findByUsername(username)) return err('USERNAME_TAKEN');

    const displayName = String(input.name).trim();
    const initials = displayName.slice(0, 2) || username.slice(0, 2).toUpperCase();
    const passwordHash = await hashPassword(String(input.password));
    const inserted = await userRepo.insert({
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      username,
      email: input.email?.trim() ?? '',
      displayName,
      role: input.role,
      department: input.department?.trim() ?? '',
      initials,
      avatarBg: input.avatarBg || '#CFE2F8',
      passwordHash,
      mustChangePassword: Boolean(input.mustChangePassword),
      isActive: input.status !== 'inactive',
    });
    return { status: 'ok', user: toManagedUser(inserted) };
  };

  const updateUser = async (actor, id, input) => {
    const target = await userRepo.findById(id);
    if (!target) return err('USER_NOT_FOUND');
    if (!canTouchTarget(actor, target.role)) return err('FORBIDDEN_ROLE');
    const nextRole = input.role ?? target.role;
    if (!canTouchTarget(actor, nextRole)) return err('FORBIDDEN_ROLE');

    const nextActive = input.status ? input.status === 'active' : Boolean(target.is_active);
    if (actor.id === id && !nextActive) return err('CANNOT_DISABLE_SELF');

    if (target.role === 'sysadmin' && target.is_active && (nextRole !== 'sysadmin' || !nextActive)) {
      if ((await countActiveSysadmins()) <= 1) return err('LAST_SYSADMIN');
    }

    const nextUsername = input.username ? String(input.username).trim() : target.username;
    if (nextUsername.toLowerCase() !== target.username.toLowerCase()) {
      const clash = await userRepo.findByUsername(nextUsername);
      if (clash && clash.id !== id) return err('USERNAME_TAKEN');
    }

    const nextName = input.name ? String(input.name).trim() : target.display_name;
    const updated = await userRepo.updateProfile(id, {
      username: nextUsername,
      email: input.email !== undefined ? String(input.email).trim() : (target.email ?? ''),
      displayName: nextName,
      role: nextRole,
      department: input.department !== undefined ? String(input.department).trim() : (target.department ?? ''),
      initials: nextName.slice(0, 2) || target.initials,
      avatarBg: input.avatarBg ?? target.avatar_bg ?? '#CFE2F8',
      isActive: nextActive,
    });
    if (!nextActive) await sessionRepo.deleteByUserExcept(id, null);
    return { status: 'ok', user: toManagedUser(updated) };
  };

  const resetUserPassword = async (actor, id, { newPassword, mustChangePassword = false }, keepSessionToken = null) => {
    const target = await userRepo.findById(id);
    if (!target) return err('USER_NOT_FOUND');
    if (!canTouchTarget(actor, target.role)) return err('FORBIDDEN_ROLE');

    const passwordHash = await hashPassword(String(newPassword));
    await userRepo.setPassword(id, passwordHash, Boolean(mustChangePassword));
    const keepHash = actor.id === id && keepSessionToken ? hashSessionToken(keepSessionToken) : null;
    await sessionRepo.deleteByUserExcept(id, keepHash);
    return { status: 'ok' };
  };

  const setUserStatus = async (actor, id, isActive) => {
    const target = await userRepo.findById(id);
    if (!target) return err('USER_NOT_FOUND');
    if (!canTouchTarget(actor, target.role)) return err('FORBIDDEN_ROLE');
    if (actor.id === id && !isActive) return err('CANNOT_DISABLE_SELF');
    if (target.role === 'sysadmin' && target.is_active && !isActive && (await countActiveSysadmins()) <= 1) {
      return err('LAST_SYSADMIN');
    }
    await userRepo.setActive(id, Boolean(isActive));
    if (!isActive) await sessionRepo.deleteByUserExcept(id, null);
    const refreshed = await userRepo.findById(id);
    return { status: 'ok', user: toManagedUser(refreshed) };
  };

  const configureUserTotp = async (actor, id, { enabled, secret, code }) => {
    const target = await userRepo.findById(id);
    if (!target) return err('USER_NOT_FOUND');
    if (!canTouchTarget(actor, target.role)) return err('FORBIDDEN_ROLE');

    if (enabled) {
      if (!secret || !code || !verifyTotpCode(String(code), String(secret), 2)) {
        return err('INVALID_TOTP');
      }
      await userRepo.setTotp(id, { enabled: true, secretEncrypted: encryptSecret(String(secret)) });
    } else {
      await userRepo.setTotp(id, { enabled: false, secretEncrypted: null });
    }
    const refreshed = await userRepo.findById(id);
    return { status: 'ok', user: toManagedUser(refreshed) };
  };

  const deleteUser = async (actor, id) => {
    const target = await userRepo.findById(id);
    if (!target) return err('USER_NOT_FOUND');
    if (actor.id === id) return err('CANNOT_DELETE_SELF');
    if (!canTouchTarget(actor, target.role)) return err('FORBIDDEN_ROLE');
    if (target.role === 'sysadmin' && (await countActiveSysadmins()) <= 1) {
      return err('LAST_SYSADMIN');
    }
    await sessionRepo.deleteByUserExcept(id, null);
    await userRepo.deleteById(id);
    return { status: 'ok' };
  };

  return {
    listUsers,
    createUser,
    updateUser,
    resetUserPassword,
    setUserStatus,
    configureUserTotp,
    deleteUser,
  };
};
