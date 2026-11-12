import { useState, useEffect, useCallback } from 'react';
import { UserAccount } from '../types';
import { isServerAuth } from '../config/authMode';
import { userApi, USER_ERROR_MESSAGES } from '../services/userApi';
import { toManagedUserAccount } from '../domain/auth/roles';
import { ActionResult, CreateUserInput, useDemoUsersStore } from './useDemoUsersStore';

const CAN_VIEW_USERS_ROLES = new Set(['sysadmin', 'admin', 'supervisor']);

export const useUserManagementActions = (
  currentUser: UserAccount | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount | null>>
) => {
  const demo = useDemoUsersStore(currentUser?.id, (updated) => setCurrentUser(updated));
  const [serverUsers, setServerUsers] = useState<UserAccount[]>([]);

  const refreshUsers = useCallback(async () => {
    if (!isServerAuth || !currentUser || !CAN_VIEW_USERS_ROLES.has(currentUser.role)) return;
    const res = await userApi.list();
    if (res.status === 'ok') {
      setServerUsers(res.users.map(toManagedUserAccount));
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!isServerAuth) return;
    if (!currentUser || !CAN_VIEW_USERS_ROLES.has(currentUser.role)) {
      setServerUsers([]);
      return;
    }
    void refreshUsers();
  }, [currentUser?.id, currentUser?.role, refreshUsers]);

  const syncUpdatedUser = (managed: UserAccount) => {
    setServerUsers((prev) => prev.map((u) => (u.id === managed.id ? managed : u)));
    if (currentUser?.id === managed.id) {
      setCurrentUser(managed);
    }
  };

  const createUser = async (data: CreateUserInput): Promise<ActionResult> => {
    if (!isServerAuth) return demo.demoCreateUser(data);
    const res = await userApi.create(data);
    if (res.status !== 'ok') return { success: false, error: USER_ERROR_MESSAGES[res.code] };
    setServerUsers((prev) => [...prev, toManagedUserAccount(res.user)]);
    return { success: true };
  };

  const updateUser = async (
    id: string,
    data: Partial<Omit<UserAccount, 'id' | 'createdAt'>>
  ): Promise<ActionResult> => {
    if (!isServerAuth) return demo.demoUpdateUser(id, data);
    const res = await userApi.update(id, {
      username: data.username,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      status: data.status,
      avatarBg: data.avatarBg,
    });
    if (res.status !== 'ok') return { success: false, error: USER_ERROR_MESSAGES[res.code] };
    syncUpdatedUser(toManagedUserAccount(res.user));
    return { success: true };
  };

  const deleteUser = async (id: string): Promise<ActionResult> => {
    if (!isServerAuth) return demo.demoDeleteUser(id);
    const res = await userApi.remove(id);
    if (res.status !== 'ok') return { success: false, error: USER_ERROR_MESSAGES[res.code] };
    setServerUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true };
  };

  const resetPassword = async (
    id: string,
    newPassword: string,
    mustChangePassword = false
  ): Promise<ActionResult> => {
    if (!isServerAuth) return demo.demoResetPassword(id, newPassword);
    const res = await userApi.resetPassword(id, {
      newPassword: newPassword.trim(),
      mustChangePassword,
    });
    if (res.status !== 'ok') return { success: false, error: USER_ERROR_MESSAGES[res.code] };
    setServerUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, mustChangePassword } : u))
    );
    return { success: true };
  };

  const toggleUserStatus = async (id: string): Promise<ActionResult> => {
    if (!isServerAuth) return demo.demoToggleStatus(id);
    const target = serverUsers.find((u) => u.id === id);
    if (!target) return { success: false, error: USER_ERROR_MESSAGES.USER_NOT_FOUND };
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    const res = await userApi.setStatus(id, nextStatus);
    if (res.status !== 'ok') return { success: false, error: USER_ERROR_MESSAGES[res.code] };
    syncUpdatedUser(toManagedUserAccount(res.user));
    return { success: true };
  };

  const toggleTwoFactor = async (
    id: string,
    enabled: boolean,
    secret?: string,
    code?: string
  ): Promise<ActionResult> => {
    if (!isServerAuth) return demo.demoToggleTwoFactor(id, enabled, secret);
    const res = await userApi.configureTotp(id, { enabled, secret, code });
    if (res.status !== 'ok') return { success: false, error: USER_ERROR_MESSAGES[res.code] };
    syncUpdatedUser(toManagedUserAccount(res.user));
    return { success: true };
  };

  return {
    users: isServerAuth ? serverUsers : demo.demoUsers,
    demoUsers: demo.demoUsers,
    setDemoUsers: demo.setDemoUsers,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
    toggleTwoFactor,
  };
};
