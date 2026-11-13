import { z } from 'zod';

export const AGENT_SKILLS = ['telephone', 'line_chat_shop'];

export const AGENT_SKILL_LABELS = {
  telephone: 'Telephone (3CX)',
  line_chat_shop: 'LINE Chat & Shop',
};

export const agentSkillSchema = z.enum(['telephone', 'line_chat_shop']);
export const agentSkillsArraySchema = z.array(agentSkillSchema);

export const normalizeAgentSkills = (raw) => {
  if (!raw) return [];
  const candidate = typeof raw === 'string' ? (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  })() : raw;
  const parsed = agentSkillsArraySchema.safeParse(candidate);
  return parsed.success ? Array.from(new Set(parsed.data)) : [];
};

export const OPERATOR_SEED_DEFINITIONS = [
  {
    id: 'usr-tumtum',
    username: 'tumtum',
    displayName: 'Tumtum',
    email: 'tumtum@cb360.co.th',
    role: 'admin',
    department: 'Operations & IT',
    initials: 'TT',
    avatarBg: '#CFE2F8',
    skills: [],
    extension: '',
    initialPassword: '1234',
  },
  {
    id: 'usr-tel-1',
    username: 'tel_agent1',
    displayName: 'กานดา สายตรง',
    email: 'kanda.tel@cb360.co.th',
    role: 'SF_2',
    department: 'Contact Center · Telephony (3CX)',
    initials: 'กด',
    avatarBg: '#E3EEFB',
    skills: ['telephone'],
    extension: '101',
    initialPassword: '1234',
  },
  {
    id: 'usr-tel-2',
    username: 'tel_agent2',
    displayName: 'วรพล รับสาย',
    email: 'worapol.tel@cb360.co.th',
    role: 'SF_2',
    department: 'Contact Center · Telephony (3CX)',
    initials: 'วพ',
    avatarBg: '#E3EEFB',
    skills: ['telephone'],
    extension: '102',
    initialPassword: '1234',
  },
  {
    id: 'usr-tel-3',
    username: 'tel_agent3',
    displayName: 'ชลธิชา คอลเซ็นเตอร์',
    email: 'chonticha.tel@cb360.co.th',
    role: 'SF_2',
    department: 'Contact Center · Telephony (3CX)',
    initials: 'ชธ',
    avatarBg: '#E3EEFB',
    skills: ['telephone'],
    extension: '103',
    initialPassword: '1234',
  },
  {
    id: 'usr-chat-1',
    username: 'chat_agent1',
    displayName: 'พิมพ์ชนก แชทช้อป',
    email: 'pimchanok.chat@cb360.co.th',
    role: 'SF_1',
    department: 'Social Commerce · LINE Chat & Shop',
    initials: 'พช',
    avatarBg: '#E3F5EC',
    skills: ['line_chat_shop'],
    extension: '',
    initialPassword: '1234',
  },
  {
    id: 'usr-chat-2',
    username: 'chat_agent2',
    displayName: 'ณัฐดนัย ไลน์ช้อป',
    email: 'natdanai.chat@cb360.co.th',
    role: 'SF_1',
    department: 'Social Commerce · LINE Chat & Shop',
    initials: 'ณด',
    avatarBg: '#E3F5EC',
    skills: ['line_chat_shop'],
    extension: '',
    initialPassword: '1234',
  },
];
