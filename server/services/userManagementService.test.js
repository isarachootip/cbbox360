import { describe, it, expect, vi } from 'vitest';
import { createUserManagementService } from './userManagementService.js';

const makeHarness = (initialRows = []) => {
  const store = new Map(initialRows.map((r) => [r.id, { ...r }]));
  const userRepo = {
    listAll: vi.fn(async () => Array.from(store.values())),
    findById: vi.fn(async (id) => store.get(id) ?? null),
    findByUsername: vi.fn(async (u) => {
      const lower = u.toLowerCase();
      for (const row of store.values()) {
        if (row.username.toLowerCase() === lower) return row;
      }
      return null;
    }),
    insert: vi.fn(async (u) => {
      const row = {
        id: u.id,
        username: u.username,
        email: u.email,
        display_name: u.displayName,
        role: u.role,
        department: u.department,
        skills: u.skills ?? [],
        extension: u.extension ?? '',
        initials: u.initials,
        avatar_bg: u.avatarBg,
        password_hash: u.passwordHash,
        must_change_password: Boolean(u.mustChangePassword),
        is_active: u.isActive !== false,
        totp_enabled: false,
        totp_secret_encrypted: null,
        last_login_at: null,
        created_at: '2026-11-12T00:00:00Z',
      };
      store.set(row.id, row);
      return row;
    }),
    updateProfile: vi.fn(async (id, f) => {
      const row = store.get(id);
      if (!row) return null;
      Object.assign(row, {
        username: f.username,
        email: f.email,
        display_name: f.displayName,
        role: f.role,
        department: f.department,
        skills: f.skills ?? row.skills ?? [],
        extension: f.extension ?? row.extension ?? '',
        initials: f.initials,
        avatar_bg: f.avatarBg,
        is_active: f.isActive,
      });
      return row;
    }),
    setPassword: vi.fn(async (id, hash, mustChange) => {
      const row = store.get(id);
      if (row) {
        row.password_hash = hash;
        row.must_change_password = mustChange;
      }
    }),
    setActive: vi.fn(async (id, isActive) => {
      const row = store.get(id);
      if (row) row.is_active = isActive;
    }),
    setTotp: vi.fn(async (id, { enabled, secretEncrypted }) => {
      const row = store.get(id);
      if (row) {
        row.totp_enabled = enabled;
        row.totp_secret_encrypted = enabled ? secretEncrypted : null;
      }
    }),
    deleteById: vi.fn(async (id) => store.delete(id)),
  };
  const sessionRepo = { deleteByUserExcept: vi.fn(async () => {}) };
  const svc = createUserManagementService({
    userRepo,
    sessionRepo,
    hashPassword: vi.fn(async (p) => `hash:${p}`),
    encryptSecret: vi.fn((s) => `enc:${s}`),
    verifyTotpCode: vi.fn((code) => code === '123456'),
  });
  return { svc, userRepo, sessionRepo, store };
};

const sysadminActor = { id: 'usr-1', username: 'sysadmin', role: 'sysadmin' };
const adminActor = { id: 'usr-2', username: 'admin', role: 'admin' };

const baseUsers = [
  { id: 'usr-1', username: 'sysadmin', display_name: 'SysAdmin', email: 'sa@x.co', role: 'sysadmin', department: 'IT', initials: 'SA', avatar_bg: '#E9E7F5', password_hash: 'hash:pw', must_change_password: false, is_active: true, totp_enabled: false },
  { id: 'usr-2', username: 'admin', display_name: 'Admin', email: 'ad@x.co', role: 'admin', department: 'Ops', initials: 'AD', avatar_bg: '#CFE2F8', password_hash: 'hash:pw', must_change_password: false, is_active: true, totp_enabled: false },
];

describe('userManagementService', () => {
  it('creates a user with immediate login password (1234) and mustChangePassword=false by default', async () => {
    const { svc } = makeHarness(baseUsers);
    const res = await svc.createUser(adminActor, {
      username: 'tumtum',
      password: '1234',
      name: 'ตั้มตั้ม ทดสอบ',
      email: 'tumtum@cb360.co.th',
      role: 'SF_1',
      department: 'Sales',
      status: 'active',
    });
    expect(res.status).toBe('ok');
    expect(res.user).toMatchObject({
      username: 'tumtum',
      name: 'ตั้มตั้ม ทดสอบ',
      role: 'SF_1',
      status: 'active',
      mustChangePassword: false,
    });
  });

  it('rejects duplicate username and blocks admin from creating sysadmin', async () => {
    const { svc } = makeHarness(baseUsers);
    const dup = await svc.createUser(sysadminActor, {
      username: 'ADMIN',
      password: '1234',
      name: 'Dup',
      email: '',
      role: 'SF_1',
      department: 'Sales',
      status: 'active',
    });
    expect(dup).toEqual({ status: 'error', code: 'USERNAME_TAKEN' });

    const esc = await svc.createUser(adminActor, {
      username: 'rogue',
      password: '1234',
      name: 'Rogue',
      email: '',
      role: 'sysadmin',
      department: 'IT',
      status: 'active',
    });
    expect(esc).toEqual({ status: 'error', code: 'FORBIDDEN_ROLE' });
  });

  it('resets password (including short 1234) and blocks admin from resetting sysadmin', async () => {
    const { svc, userRepo, sessionRepo } = makeHarness(baseUsers);
    const blocked = await svc.resetUserPassword(adminActor, 'usr-1', { newPassword: '1234' });
    expect(blocked).toEqual({ status: 'error', code: 'FORBIDDEN_ROLE' });

    const ok = await svc.resetUserPassword(sysadminActor, 'usr-2', { newPassword: '1234', mustChangePassword: true });
    expect(ok.status).toBe('ok');
    expect(userRepo.setPassword).toHaveBeenCalledWith('usr-2', 'hash:1234', true);
    expect(sessionRepo.deleteByUserExcept).toHaveBeenCalledWith('usr-2', null);
  });

  it('prevents self-disable/self-delete and protects the last sysadmin', async () => {
    const { svc, sessionRepo } = makeHarness(baseUsers);
    expect(await svc.setUserStatus(sysadminActor, 'usr-1', false)).toEqual({ status: 'error', code: 'CANNOT_DISABLE_SELF' });
    expect(await svc.deleteUser(sysadminActor, 'usr-1')).toEqual({ status: 'error', code: 'CANNOT_DELETE_SELF' });

    const disabled = await svc.setUserStatus(sysadminActor, 'usr-2', false);
    expect(disabled.status).toBe('ok');
    expect(sessionRepo.deleteByUserExcept).toHaveBeenCalledWith('usr-2', null);
  });

  it('enrolls 2FA only when 6-digit TOTP verifies and encrypts secret at rest', async () => {
    const { svc, userRepo } = makeHarness(baseUsers);
    const bad = await svc.configureUserTotp(sysadminActor, 'usr-2', { enabled: true, secret: 'JBSWY3DPEHPK3PXP', code: '000000' });
    expect(bad).toEqual({ status: 'error', code: 'INVALID_TOTP' });

    const good = await svc.configureUserTotp(sysadminActor, 'usr-2', { enabled: true, secret: 'JBSWY3DPEHPK3PXP', code: '123456' });
    expect(good.status).toBe('ok');
    expect(userRepo.setTotp).toHaveBeenCalledWith('usr-2', { enabled: true, secretEncrypted: 'enc:JBSWY3DPEHPK3PXP' });
  });

  it('persists agent skills and 3CX extension on create and update', async () => {
    const { svc } = makeHarness(baseUsers);
    const created = await svc.createUser(adminActor, {
      username: 'tel_agent_x',
      password: '1234',
      name: 'สมศรี สายตรง',
      email: 'somsri@cb360.co.th',
      role: 'SF_2',
      department: 'Contact Center',
      skills: ['telephone'],
      extension: '109',
      status: 'active',
    });
    expect(created.status).toBe('ok');
    expect(created.user.skills).toEqual(['telephone']);
    expect(created.user.extension).toBe('109');

    const updated = await svc.updateUser(adminActor, created.user.id, {
      skills: ['telephone', 'line_chat_shop'],
      extension: '110',
    });
    expect(updated.status).toBe('ok');
    expect(updated.user.skills).toEqual(['telephone', 'line_chat_shop']);
    expect(updated.user.extension).toBe('110');
  });
});
