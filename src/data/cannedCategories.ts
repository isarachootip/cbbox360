import { CannedResponseCategory } from '../types';

export interface CannedCategoryConfig {
  key: CannedResponseCategory;
  label: string;
  icon: string;
  description: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    lightBg: string;
  };
}

export const CATEGORIES_CONFIG: CannedCategoryConfig[] = [
  {
    key: 'greeting',
    label: 'Greeting (ทักทาย / ต้อนรับ)',
    icon: '👋',
    description: 'ข้อความเปิดการสนทนา ต้อนรับลูกค้า และกล่าวทักทาย',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'text-purple-700 font-semibold',
      lightBg: 'hover:bg-purple-50/50',
    },
  },
  {
    key: 'question',
    label: 'Question (คำถาม / ขอข้อมูล)',
    icon: '❓',
    description: 'คำถามเก็บข้อมูล ขอหลักฐาน ที่อยู่ หรือสอบถามเพิ่มเติม',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'text-amber-700 font-semibold',
      lightBg: 'hover:bg-amber-50/50',
    },
  },
  {
    key: 'answer',
    label: 'Answer (คำตอบ / ข้อมูลสำคัญ)',
    icon: '💡',
    description: 'คำตอบสำเร็จรูป ข้อมูลชำระเงิน รอบส่งพัสดุ และเงื่อนไขบริการ',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'text-emerald-700 font-semibold',
      lightBg: 'hover:bg-emerald-50/50',
    },
  },
];
