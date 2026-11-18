import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import type { ModuleSlotProps } from '../../../core/client/registry/clientModuleRegistry';

interface AppointmentRecord {
  id: string;
  department: string;
  doctorName: string;
  scheduledAt: string;
  status: 'Active' | 'Pending' | 'Closed';
}

const INITIAL_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'APT-2611-01',
    department: 'ศูนย์อายุรกรรมหัวใจ ชั้น 3',
    doctorName: 'นพ. กิตติพงศ์ วงศ์เวช',
    scheduledAt: '2026-11-25 09:30 น.',
    status: 'Active',
  },
];

export const ContactAppointmentTab: React.FC<ModuleSlotProps> = () => {
  const [items, setItems] = useState<AppointmentRecord[]>(INITIAL_APPOINTMENTS);
  const [department, setDepartment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department.trim() || !doctorName.trim() || !scheduledAt.trim()) return;
    setItems((prev) => [
      {
        id: `APT-${Date.now().toString().slice(-4)}`,
        department: department.trim(),
        doctorName: doctorName.trim(),
        scheduledAt: scheduledAt.trim(),
        status: 'Active',
      },
      ...prev,
    ]);
    setDepartment('');
    setDoctorName('');
    setScheduledAt('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-bg-subtle border border-border">
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="แผนก / ศูนย์การแพทย์"
          className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-brand"
        />
        <input
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          placeholder="แพทย์ผู้ตรวจ"
          className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-brand"
        />
        <input
          type="text"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          placeholder="วัน-เวลานัด (เช่น 30 พ.ย. 10:00)"
          className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>จองนัดหมาย</span>
        </button>
      </form>

      <div className="border border-border rounded-xl overflow-hidden divide-y divide-divider">
        {items.map((apt) => (
          <div key={apt.id} className="p-3.5 flex items-center justify-between hover:bg-bg-subtle">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-brand" />
                <span className="font-mono text-xs font-bold text-brand">{apt.id}</span>
                <span className="text-xs font-semibold text-text-primary">{apt.doctorName}</span>
              </div>
              <div className="text-xs text-text-secondary">
                {apt.department} · เวลานัด <span className="font-mono">{apt.scheduledAt}</span>
              </div>
            </div>
            <StatusBadge status={apt.status} />
          </div>
        ))}
      </div>
    </div>
  );
};
