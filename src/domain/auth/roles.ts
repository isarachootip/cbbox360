import { UserAccount, UserRole } from '../../types';
import { ServerUser } from '../../services/authApi';

export const ROLE_LABELS: Record<UserRole, string> = {
  sysadmin: 'System Administrator (ดูแลระบบสูงสุด)',
  admin: 'Administrator (ผู้ดูแลระบบ)',
  SF_1: 'Sales Force 1 (ทีมขาย/Pipeline)',
  SF_2: 'Sales Force 2 (บริการลูกค้า/Inbox/Case)',
  SF_3: 'Sales Force 3 (สินเชื่อ/Credit Sales)',
  supervisor: 'Supervisor (หัวหน้างานกำกับดูแล)',
  doctor: 'Doctor (แพทย์)',
  nurse: 'Nurse (พยาบาล)',
};

export const getRoleLabel = (role: UserRole): string => ROLE_LABELS[role] ?? role;

/** Adapts the server's public user to the UI's UserAccount shape (no password is ever held client-side). */
export const toUserAccount = (u: ServerUser): UserAccount => ({
  id: u.id,
  username: u.username,
  password: '',
  name: u.name,
  email: u.email,
  role: u.role,
  roleLabel: getRoleLabel(u.role),
  department: u.department,
  status: 'active',
  initials: u.initials,
  avatarBg: u.avatarBg,
  createdAt: '',
  twoFactorEnabled: u.totpEnabled,
});
