import { UserProfile } from '../types';

export const mockUsers: Record<string, UserProfile> = {
  supervisor: {
    name: 'สมหญิง ร.',
    initials: 'สญ',
    role: 'Supervisor',
    avatarBg: '#CFE2F8',
  },
  serviceAgent: {
    name: 'วิภา ส.',
    initials: 'วภ',
    role: 'Service Agent',
    avatarBg: '#E3EEFB',
  },
  salesManager: {
    name: 'ธนพล ก.',
    initials: 'ธพ',
    role: 'Sales Manager',
    avatarBg: '#E8EEF5',
  },
  salesRep: {
    name: 'อนันต์ ศ.',
    initials: 'อศ',
    role: 'Sales',
    avatarBg: '#EAF0F6',
  },
  marketing: {
    name: 'มาลี ต.',
    initials: 'มล',
    role: 'Marketing',
    avatarBg: '#EAEBF5',
  },
  creditOfficer: {
    name: 'ประเทือง ว.',
    initials: 'ปท',
    role: 'Credit Officer',
    avatarBg: '#ECEEF2',
  },
};
