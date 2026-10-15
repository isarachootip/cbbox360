import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { initialUserAccounts } from '../data/users';
import { useAuditLog } from './AuditLogContext';
import { AuthMode, AUTH_MODE, isServerAuth } from '../config/authMode';
import { authApi, AUTH_ERROR_MESSAGES } from '../services/authApi';
import { getRoleLabel, toUserAccount } from '../domain/auth/roles';
import { verifyTotpCode } from '../utils/totp';

export interface LoginOutcome {
  success: boolean;
  requireTwoFactor?: boolean;
  error?: string;
}

interface AuthContextType {
  authMode: AuthMode;
  /** True while the server session is being restored on page load (server mode only). */
  isAuthLoading: boolean;
  /** Server mode: the account must set a new password before using the app. */
  mustChangePassword: boolean;
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => Promise<LoginOutcome>;
  pendingTwoFactorUsername: string | null;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  cancelTwoFactor: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  /** Demo mode only (impersonation is disabled with real authentication). */
  switchUser: (username: string) => boolean;
  createUser: (user: Omit<UserAccount, 'id' | 'createdAt' | 'initials' | 'lastLogin' | 'roleLabel'> & { roleLabel?: string }) => { success: boolean; error?: string };
  updateUser: (id: string, user: Partial<Omit<UserAccount, 'id' | 'createdAt'>>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  resetPassword: (id: string, newPassword: string) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => void;
  toggleTwoFactor: (id: string, enabled: boolean, secret?: string) => { success: boolean; error?: string };
  isAdmin: boolean;
  isSysAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'cb360_users_data';
const CURRENT_USER_STORAGE_KEY = 'cb360_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logAction } = useAuditLog();
  // Load users from localStorage or initial
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
    }
    return initialUserAccounts;
  });

  // Demo mode: load current user from localStorage (default sysadmin).
  // Server mode: start logged out; the session is restored from the httpOnly cookie via /api/auth/me.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (isServerAuth) return null;
    try {
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      }
    } catch (e) {
      console.error('Failed to load current user from localStorage', e);
    }
    return initialUserAccounts[0]; // default to sysadmin
  });
  const [isAuthLoading, setIsAuthLoading] = useState(isServerAuth);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<UserAccount | null>(null);
  const [pendingServerTwoFactor, setPendingServerTwoFactor] = useState<string | null>(null);

  useEffect(() => {
    if (!isServerAuth) return;
    authApi
      .me()
      .then((user) => {
        setCurrentUser(user ? toUserAccount(user) : null);
        setMustChangePassword(Boolean(user?.mustChangePassword));
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  // Save users to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  // Save current user to localStorage whenever updated (demo mode only)
  useEffect(() => {
    if (isServerAuth) return;
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save current user to localStorage', e);
    }
  }, [currentUser]);

  const serverLogin = async (username: string, password: string): Promise<LoginOutcome> => {
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
      completeTwoFactorLogin(pendingTwoFactorUser);
      setPendingTwoFactorUser(null);
    }
    return valid;
  };

  const cancelTwoFactor = () => {
    setPendingTwoFactorUser(null);
    setPendingServerTwoFactor(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!isServerAuth) return { success: false, error: 'โหมดสาธิตไม่รองรับการเปลี่ยนรหัสผ่านที่เซิร์ฟเวอร์' };
    const result = await authApi.changePassword(currentPassword, newPassword);
    if (result.status !== 'ok') return { success: false, error: AUTH_ERROR_MESSAGES[result.code] };
    setMustChangePassword(false);
    return { success: true };
  };

  const login = async (username: string, password: string): Promise<LoginOutcome> => {
    if (isServerAuth) return serverLogin(username, password);
    return demoLogin(username, password);
  };

  /** Demo mode only: compares against mock accounts held in the browser. Not secure. */
  const demoLogin = (username: string, password: string): LoginOutcome => {
    const trimmedUser = username.trim().toLowerCase();
    const user = users.find((u) => u.username.toLowerCase() === trimmedUser);

    if (!user) {
      logAction({
        userId: username,
        action: 'เข้าสู่ระบบล้มเหลว (User Not Found)',
        category: 'security',
        status: 'failure',
        resource: 'Auth/Login',
      });
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' };
    }

    if (user.status === 'inactive') {
      logAction({
        userId: username,
        userRole: user.role,
        action: 'พยายามเข้าสู่ระบบแต่บัญชีถูกระงับ',
        category: 'security',
        status: 'warning',
        resource: 'Auth/Login',
      });
      return { success: false, error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    }

    if (user.password !== password) {
      logAction({
        userId: username,
        userRole: user.role,
        action: 'เข้าสู่ระบบล้มเหลวด้วยรหัสผ่านผิด',
        category: 'security',
        status: 'failure',
        resource: 'Auth/Login',
      });
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      logAction({
        userId: user.username,
        userRole: user.role,
        action: 'ร้องขอรหัสยืนยันตัวตน 2FA (TOTP)',
        category: 'security',
        status: 'success',
        resource: 'Auth/2FA',
      });
      setPendingTwoFactorUser(user);
      return { success: false, requireTwoFactor: true };
    }

    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updatedUser = { ...user, lastLogin: timeStr };

    logAction({
      userId: user.username,
      userRole: user.role,
      action: 'เข้าสู่ระบบสำเร็จ (Sign In Success)',
      category: 'security',
      status: 'success',
      resource: 'Auth/Login',
    });

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    return { success: true };
  };

  const completeTwoFactorLogin = (user: UserAccount) => {
    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updatedUser = { ...user, lastLogin: timeStr };

    logAction({
      userId: user.username,
      userRole: user.role,
      action: 'ยืนยันตัวตน 2FA สำเร็จ เข้าสู่ระบบ',
      category: 'security',
      status: 'success',
      resource: 'Auth/2FA',
    });

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
  };

  const logout = () => {
    if (isServerAuth) {
      // Server writes its own audit entry; the session is revoked server-side.
      void authApi.logout();
      setCurrentUser(null);
      setMustChangePassword(false);
      return;
    }
    if (currentUser) {
      logAction({
        userId: currentUser.username,
        userRole: currentUser.role,
        action: 'ออกจากระบบ (Sign Out)',
        category: 'security',
        status: 'success',
        resource: 'Auth/Logout',
      });
    }
    setCurrentUser(null);
  };

  const switchUser = (username: string): boolean => {
    // Impersonation without a password is a demo convenience only.
    if (isServerAuth) return false;
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (user && user.status === 'active') {
      const now = new Date();
      const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const updatedUser = { ...user, lastLogin: timeStr };
      setCurrentUser(updatedUser);
      return true;
    }
    return false;
  };

  const createUser = (
    userData: Omit<UserAccount, 'id' | 'createdAt' | 'initials' | 'lastLogin' | 'roleLabel'> & { roleLabel?: string }
  ): { success: boolean; error?: string } => {
    const existing = users.find(
      (u) => u.username.toLowerCase() === userData.username.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: `ชื่อผู้ใช้ "${userData.username}" มีอยู่ในระบบแล้ว` };
    }

    const initials = userData.name.trim().slice(0, 2);
    const roleLabel = userData.roleLabel || getRoleLabel(userData.role);
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];

    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      username: userData.username.trim(),
      initials,
      roleLabel,
      createdAt,
      avatarBg: userData.avatarBg || '#CFE2F8',
    };

    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const updateUser = (
    id: string,
    userData: Partial<Omit<UserAccount, 'id' | 'createdAt'>>
  ): { success: boolean; error?: string } => {
    if (userData.username) {
      const existing = users.find(
        (u) => u.id !== id && u.username.toLowerCase() === userData.username!.trim().toLowerCase()
      );
      if (existing) {
        return { success: false, error: `ชื่อผู้ใช้ "${userData.username}" ซ้ำกับผู้ใช้อื่น` };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...userData };
          if (userData.name) {
            updated.initials = userData.name.trim().slice(0, 2);
          }
          if (userData.role) {
            updated.roleLabel = getRoleLabel(userData.role);
          }
          // If editing currently logged in user, update currentUser as well
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; error?: string } => {
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) {
      return { success: false, error: 'ไม่พบผู้ใช้นี้ในระบบ' };
    }

    if (currentUser?.id === id) {
      return { success: false, error: 'ไม่สามารถลบบัญชีที่กำลังล็อกอินใช้งานอยู่ได้' };
    }

    if (userToDelete.role === 'sysadmin') {
      const sysAdminCount = users.filter((u) => u.role === 'sysadmin').length;
      if (sysAdminCount <= 1) {
        return { success: false, error: 'ต้องมี System Administrator อย่างน้อย 1 บัญชีในระบบ' };
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true };
  };

  const resetPassword = (id: string, newPassword: string): { success: boolean; error?: string } => {
    if (!newPassword.trim()) {
      return { success: false, error: 'รหัสผ่านต้องไม่เว้นว่าง' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPassword.trim() } : u))
    );

    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, password: newPassword.trim() } : null));
    }

    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    if (currentUser?.id === id) return; // Prevent disabling self
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    );
  };

  const toggleTwoFactor = (id: string, enabled: boolean, secret?: string): { success: boolean; error?: string } => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return {
          ...u,
          twoFactorEnabled: enabled,
          twoFactorSecret: enabled ? (secret || u.twoFactorSecret) : undefined,
          twoFactorEnrolledAt: enabled ? new Date().toISOString() : undefined,
        };
      })
    );

    if (currentUser?.id === id) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              twoFactorEnabled: enabled,
              twoFactorSecret: enabled ? (secret || prev.twoFactorSecret) : undefined,
              twoFactorEnrolledAt: enabled ? new Date().toISOString() : undefined,
            }
          : null
      );
    }

    return { success: true };
  };

  const isAdmin = currentUser?.role === 'sysadmin' || currentUser?.role === 'admin';
  const isSysAdmin = currentUser?.role === 'sysadmin';

  return (
    <AuthContext.Provider
      value={{
        authMode: AUTH_MODE,
        isAuthLoading,
        mustChangePassword,
        currentUser,
        users,
        login,
        pendingTwoFactorUsername: pendingServerTwoFactor ?? pendingTwoFactorUser?.username ?? null,
        verifyTwoFactor,
        cancelTwoFactor,
        changePassword,
        logout,
        switchUser,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        toggleUserStatus,
        toggleTwoFactor,
        isAdmin,
        isSysAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
