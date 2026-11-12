import { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { initialUserAccounts } from '../data/users';
import { getRoleLabel } from '../domain/auth/roles';

const USERS_STORAGE_KEY = 'cb360_users_data';

export type ActionResult = { success: boolean; error?: string };

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserAccount['role'];
  department: string;
  status: 'active' | 'inactive';
  avatarBg?: string;
  mustChangePassword?: boolean;
}

const loadInitialDemoUsers = (): UserAccount[] => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existing = parsed as UserAccount[];
        const knownNames = new Set(existing.map((u) => u.username.toLowerCase()));
        const missingDefaults = initialUserAccounts.filter(
          (seed) => !knownNames.has(seed.username.toLowerCase())
        );
        return missingDefaults.length > 0 ? [...existing, ...missingDefaults] : existing;
      }
    }
  } catch (e) {
    console.error('Failed to load users from localStorage', e);
  }
  return initialUserAccounts;
};

export const useDemoUsersStore = (
  currentUserId: string | undefined,
  onSyncCurrentUser: (updated: UserAccount) => void
) => {
  const [demoUsers, setDemoUsers] = useState<UserAccount[]>(loadInitialDemoUsers);

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(demoUsers));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [demoUsers]);

  const demoCreateUser = (data: CreateUserInput): ActionResult => {
    const clash = demoUsers.find((u) => u.username.toLowerCase() === data.username.trim().toLowerCase());
    if (clash) return { success: false, error: `ชื่อผู้ใช้ "${data.username}" มีอยู่ในระบบแล้ว` };

    const newUser: UserAccount = {
      ...data,
      id: `usr-${Date.now()}`,
      username: data.username.trim(),
      initials: data.name.trim().slice(0, 2),
      roleLabel: getRoleLabel(data.role),
      createdAt: new Date().toISOString().split('T')[0],
      avatarBg: data.avatarBg || '#CFE2F8',
    };
    setDemoUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const demoUpdateUser = (id: string, data: Partial<Omit<UserAccount, 'id' | 'createdAt'>>): ActionResult => {
    if (data.username) {
      const clash = demoUsers.find(
        (u) => u.id !== id && u.username.toLowerCase() === data.username!.trim().toLowerCase()
      );
      if (clash) return { success: false, error: `ชื่อผู้ใช้ "${data.username}" ซ้ำกับผู้ใช้อื่น` };
    }
    setDemoUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated: UserAccount = {
          ...u,
          ...data,
          initials: data.name ? data.name.trim().slice(0, 2) : u.initials,
          roleLabel: data.role ? getRoleLabel(data.role) : u.roleLabel,
        };
        if (currentUserId === id) onSyncCurrentUser(updated);
        return updated;
      })
    );
    return { success: true };
  };

  const demoDeleteUser = (id: string): ActionResult => {
    const target = demoUsers.find((u) => u.id === id);
    if (!target) return { success: false, error: 'ไม่พบผู้ใช้นี้ในระบบ' };
    if (currentUserId === id) return { success: false, error: 'ไม่สามารถลบบัญชีที่กำลังล็อกอินใช้งานอยู่ได้' };
    if (target.role === 'sysadmin' && demoUsers.filter((u) => u.role === 'sysadmin').length <= 1) {
      return { success: false, error: 'ต้องมี System Administrator อย่างน้อย 1 บัญชีในระบบ' };
    }
    setDemoUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true };
  };

  const demoResetPassword = (id: string, newPassword: string): ActionResult => {
    const clean = newPassword.trim();
    if (!clean) return { success: false, error: 'รหัสผ่านต้องไม่เว้นว่าง' };
    setDemoUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, password: clean };
        if (currentUserId === id) onSyncCurrentUser(updated);
        return updated;
      })
    );
    return { success: true };
  };

  const demoToggleStatus = (id: string): ActionResult => {
    if (currentUserId === id) return { success: false, error: 'ไม่สามารถระงับการใช้งานบัญชีของตัวเองได้' };
    setDemoUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    );
    return { success: true };
  };

  const demoToggleTwoFactor = (id: string, enabled: boolean, secret?: string): ActionResult => {
    setDemoUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated: UserAccount = {
          ...u,
          twoFactorEnabled: enabled,
          twoFactorSecret: enabled ? (secret || u.twoFactorSecret) : undefined,
          twoFactorEnrolledAt: enabled ? new Date().toISOString() : undefined,
        };
        if (currentUserId === id) onSyncCurrentUser(updated);
        return updated;
      })
    );
    return { success: true };
  };

  return {
    demoUsers,
    setDemoUsers,
    demoCreateUser,
    demoUpdateUser,
    demoDeleteUser,
    demoResetPassword,
    demoToggleStatus,
    demoToggleTwoFactor,
  };
};
