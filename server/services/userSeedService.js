/**
 * userSeedService.js — creates the initial accounts when the users table is empty.
 * Every seeded account must change its password on first login.
 */
import { generateTemporaryPassword } from '../utils/cryptoUtils.js';

export const SEED_USERS = [
  { id: 'usr-1', username: 'sysadmin', displayName: 'สมศักดิ์ บริหารระบบ', email: 'sysadmin@cb360.co.th', role: 'sysadmin', department: 'IT & Security Infrastructure', initials: 'SA', avatarBg: '#E9E7F5' },
  { id: 'usr-2', username: 'admin', displayName: 'อนุชา จัดการระบบ', email: 'admin@cb360.co.th', role: 'admin', department: 'Operations & IT', initials: 'AD', avatarBg: '#CFE2F8' },
  { id: 'usr-3', username: 'SF_1', displayName: 'ธนพล ก.', email: 'thanapol.k@cb360.co.th', role: 'SF_1', department: 'Sales & Business Development', initials: 'ธพ', avatarBg: '#E8EEF5' },
  { id: 'usr-4', username: 'SF_2', displayName: 'วิภา ส.', email: 'wipa.s@cb360.co.th', role: 'SF_2', department: 'Customer Care & Support', initials: 'วภ', avatarBg: '#E3EEFB' },
  { id: 'usr-5', username: 'SF_3', displayName: 'ประเทือง ว.', email: 'pratheung.w@cb360.co.th', role: 'SF_3', department: 'Credit Control & Finance', initials: 'ปท', avatarBg: '#ECEEF2' },
  { id: 'usr-6', username: 'supervisor', displayName: 'สมหญิง ร.', email: 'somying.r@cb360.co.th', role: 'supervisor', department: 'Customer Operations Management', initials: 'สญ', avatarBg: '#CFE2F8' },
  { id: 'usr-7', username: 'doctor', displayName: 'นพ. กิตติพงศ์ วงศ์เวช', email: 'doctor@cb360.co.th', role: 'doctor', department: 'Medical Staff', initials: 'กพ', avatarBg: '#E3F5EC' },
  { id: 'usr-8', username: 'nurse', displayName: 'พว. รพีพร ใจงาม', email: 'nurse@cb360.co.th', role: 'nurse', department: 'Nursing', initials: 'รพ', avatarBg: '#FBEFF3' },
];

/**
 * @returns {Promise<{ username: string, temporaryPassword: string }[]>} credentials created (empty if skipped)
 */
export const ensureSeedUsers = async ({ userRepo, hashPassword, nodeEnv, defaultPassword = '1234' }) => {
  if ((await userRepo.count()) > 0) return [];
  const isProduction = nodeEnv === 'production';
  const created = [];

  for (const seed of SEED_USERS) {
    // Production never uses a shared/guessable default password.
    const temporaryPassword = isProduction ? generateTemporaryPassword(16) : defaultPassword;
    await userRepo.insert({ ...seed, passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true });
    created.push({ username: seed.username, temporaryPassword });
  }
  return created;
};

/**
 * Ensures all 8 seed accounts (including newly added roles like doctor/nurse) exist,
 * and unlocks any seed account that has never logged in (`last_login_at == null` & `must_change_password == true`)
 * so deployments on Coolify can sign in with `SEED_DEFAULT_PASSWORD` (default: '1234').
 */
export const ensureAllSeedAccounts = async ({
  userRepo,
  hashPassword,
  defaultPassword = '1234',
  mustChangePassword = false,
}) => {
  const passwordHash = await hashPassword(defaultPassword);
  const provisioned = [];

  for (const seed of SEED_USERS) {
    const existing = await userRepo.findByUsername(seed.username);
    if (!existing) {
      await userRepo.insert({
        ...seed,
        passwordHash,
        mustChangePassword,
      });
      provisioned.push({ username: seed.username, action: 'inserted' });
    } else if (existing.last_login_at == null && existing.must_change_password === true) {
      await userRepo.updatePassword(existing.id, passwordHash);
      provisioned.push({ username: seed.username, action: 'unlocked' });
    }
  }
  return provisioned;
};
