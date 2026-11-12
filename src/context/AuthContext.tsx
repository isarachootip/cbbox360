import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { initialUserAccounts } from '../data/users';
import { useAuditLog } from './AuditLogContext';
import { AuthMode, AUTH_MODE, isServerAuth } from '../config/authMode';
import { authApi, AUTH_ERROR_MESSAGES } from '../services/authApi';
import { toUserAccount } from '../domain/auth/roles';
import { verifyTotpCode } from '../utils/totp';
import { ActionResult, CreateUserInput } from '../hooks/useDemoUsersStore';
import { useUserManagementActions } from '../hooks/useUserManagementActions';

export interface LoginOutcome {
  success: boolean;
  requireTwoFactor?: boolean;
  error?: string;
}

interface AuthContextType {
  authMode: AuthMode;
  isAuthLoading: boolean;
  mustChangePassword: boolean;
  currentUser: UserAccount | null;
  users: UserAccount[];
  refreshUsers: () => Promise<void>;
  login: (username: string, password: string) => Promise<LoginOutcome>;
  pendingTwoFactorUsername: string | null;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  cancelTwoFactor: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ActionResult>;
  logout: () => void;
  switchUser: (username: string) => boolean;
  createUser: (user: CreateUserInput) => Promise<ActionResult>;
  updateUser: (id: string, user: Partial<Omit<UserAccount, 'id' | 'createdAt'>>) => Promise<ActionResult>;
  deleteUser: (id: string) => Promise<ActionResult>;
  resetPassword: (id: string, newPassword: string, mustChangePassword?: boolean) => Promise<ActionResult>;
  toggleUserStatus: (id: string) => Promise<ActionResult>;
  toggleTwoFactor: (id: string, enabled: boolean, secret?: string, code?: string) => Promise<ActionResult>;
  isAdmin: boolean;
  isSysAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CURRENT_USER_STORAGE_KEY = 'cb360_current_user';

const formatTodayLogin = (): string => {
  const now = new Date();
  return `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logAction } = useAuditLog();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (isServerAuth) return null;
    try {
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserAccount;
        if (parsed?.username) return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return initialUserAccounts[0];
  });

  const [isAuthLoading, setIsAuthLoading] = useState(isServerAuth);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<UserAccount | null>(null);
  const [pendingServerTwoFactor, setPendingServerTwoFactor] = useState<string | null>(null);
  const userMgmt = useUserManagementActions(currentUser, setCurrentUser);

  useEffect(() => {
    if (!isServerAuth) return;
    authApi
      .me()
      .then((u) => {
        setCurrentUser(u ? toUserAccount(u) : null);
        setMustChangePassword(Boolean(u?.mustChangePassword));
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  useEffect(() => {
    if (isServerAuth) return;
    try {
      if (currentUser) localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
      else localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch {
      // Ignore storage quota errors
    }
  }, [currentUser]);

  const demoLogin = (username: string, password: string): LoginOutcome => {
    const user = userMgmt.demoUsers.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      logAction({ userId: username, action: 'เข้าสู่ระบบล้มเหลว (User Not Found)', category: 'security', status: 'failure', resource: 'Auth/Login' });
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' };
    }
    if (user.status === 'inactive') return { success: false, error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    if (user.password !== password) return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      setPendingTwoFactorUser(user);
      return { success: false, requireTwoFactor: true };
    }
    const updated = { ...user, lastLogin: formatTodayLogin() };
    setCurrentUser(updated);
    userMgmt.setDemoUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    return { success: true };
  };

  const login = async (username: string, password: string): Promise<LoginOutcome> => {
    if (!isServerAuth) return demoLogin(username, password);
    const result = await authApi.login(username, password);
    if (result.status === 'ok') {
      setCurrentUser(toUserAccount(result.user));
      setMustChangePassword(result.user.mustChangePassword);
      return { success: true };
    }
    if (result.status === 'totp_required') {
      setPendingServerTwoFactor(username);
      return { success: false, requireTwoFactor: true };
    }
    return { success: false, error: AUTH_ERROR_MESSAGES[result.code] };
  };

  const verifyTwoFactor = async (code: string): Promise<boolean> => {
    if (isServerAuth) {
      const result = await authApi.verifyTotp(code);
      if (result.status !== 'ok') return false;
      setCurrentUser(toUserAccount(result.user));
      setMustChangePassword(result.user.mustChangePassword);
      setPendingServerTwoFactor(null);
      return true;
    }
    if (!pendingTwoFactorUser?.twoFactorSecret) return false;
    const valid = await verifyTotpCode(code, pendingTwoFactorUser.twoFactorSecret);
    if (valid) {
      const updated = { ...pendingTwoFactorUser, lastLogin: formatTodayLogin() };
      setCurrentUser(updated);
      userMgmt.setDemoUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setPendingTwoFactorUser(null);
    }
    return valid;
  };

  const cancelTwoFactor = () => {
    setPendingTwoFactorUser(null);
    setPendingServerTwoFactor(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<ActionResult> => {
    if (!isServerAuth) return { success: false, error: 'โหมดสาธิตไม่รองรับการเปลี่ยนรหัสผ่านที่เซิร์ฟเวอร์' };
    const res = await authApi.changePassword(currentPassword, newPassword);
    if (res.status !== 'ok') return { success: false, error: AUTH_ERROR_MESSAGES[res.code] };
    setMustChangePassword(false);
    return { success: true };
  };

  const logout = () => {
    if (isServerAuth) void authApi.logout();
    setCurrentUser(null);
    setMustChangePassword(false);
  };

  const switchUser = (username: string): boolean => {
    if (isServerAuth) return false;
    const user = userMgmt.demoUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.status !== 'active') return false;
    setCurrentUser({ ...user, lastLogin: formatTodayLogin() });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        authMode: AUTH_MODE, isAuthLoading, mustChangePassword, currentUser,
        users: userMgmt.users, refreshUsers: userMgmt.refreshUsers,
        login, pendingTwoFactorUsername: pendingServerTwoFactor ?? pendingTwoFactorUser?.username ?? null,
        verifyTwoFactor, cancelTwoFactor, changePassword, logout, switchUser,
        createUser: userMgmt.createUser, updateUser: userMgmt.updateUser, deleteUser: userMgmt.deleteUser,
        resetPassword: userMgmt.resetPassword, toggleUserStatus: userMgmt.toggleUserStatus, toggleTwoFactor: userMgmt.toggleTwoFactor,
        isAdmin: currentUser?.role === 'sysadmin' || currentUser?.role === 'admin',
        isSysAdmin: currentUser?.role === 'sysadmin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
