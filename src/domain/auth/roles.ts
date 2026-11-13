import { UserAccount, UserRole } from '../../types';
import { ServerUser } from '../../services/authApi';
import { ManagedServerUser } from '../../services/userApi';

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

const formatLoginTimestamp = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Adapts the server's public session user to the UI's UserAccount shape. */
export const toUserAccount = (u: ServerUser): UserAccount => ({
  id: u.id,
  username: u.username,
  password: '',
  name: u.name,
  email: u.email,
  role: u.role,
  roleLabel: getRoleLabel(u.role),
  department: u.department,
  skills: u.skills ?? [],
  extension: u.extension ?? '',
  status: 'active',
  initials: u.initials,
  avatarBg: u.avatarBg,
  createdAt: '',
  mustChangePassword: u.mustChangePassword,
  twoFactorEnabled: u.totpEnabled,
});

/** Adapts a /api/users record to the UI's UserAccount shape. */
export const toManagedUserAccount = (u: ManagedServerUser): UserAccount => ({
  id: u.id,
  username: u.username,
  password: '',
  name: u.name,
  email: u.email,
  role: u.role,
  roleLabel: getRoleLabel(u.role),
  department: u.department,
  skills: u.skills ?? [],
  extension: u.extension ?? '',
  status: u.status,
  initials: u.initials,
  avatarBg: u.avatarBg,
  createdAt: u.createdAt,
  lastLogin: formatLoginTimestamp(u.lastLoginAt),
  mustChangePassword: u.mustChangePassword,
  twoFactorEnabled: u.totpEnabled,
});
