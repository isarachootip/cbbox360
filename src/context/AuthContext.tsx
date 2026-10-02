import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { initialUserAccounts } from '../data/users';

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => { success: boolean; requireTwoFactor?: boolean; user?: UserAccount; error?: string };
  completeTwoFactorLogin: (user: UserAccount) => void;
  logout: () => void;
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

  // Load current user from localStorage or default to sysadmin
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
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

  // Save users to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  // Save current user to localStorage whenever updated
  useEffect(() => {
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

  const login = (
    username: string,
    password: string
  ): { success: boolean; requireTwoFactor?: boolean; user?: UserAccount; error?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const user = users.find((u) => u.username.toLowerCase() === trimmedUser);

    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    }

    if (user.password !== password) {
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234)' };
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return { success: false, requireTwoFactor: true, user };
    }

    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updatedUser = { ...user, lastLogin: timeStr };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    return { success: true };
  };

  const completeTwoFactorLogin = (user: UserAccount) => {
    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updatedUser = { ...user, lastLogin: timeStr };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (username: string): boolean => {
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

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'sysadmin': return 'System Administrator (ดูแลระบบสูงสุด)';
      case 'admin': return 'Administrator (ผู้ดูแลระบบ)';
      case 'SF_1': return 'Sales Force 1 (ทีมขาย/Pipeline)';
      case 'SF_2': return 'Sales Force 2 (บริการลูกค้า/Inbox/Case)';
      case 'SF_3': return 'Sales Force 3 (สินเชื่อ/Credit Sales)';
      case 'supervisor': return 'Supervisor (หัวหน้างานกำกับดูแล)';
      default: return role;
    }
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
        currentUser,
        users,
        login,
        completeTwoFactorLogin,
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
