import React from 'react';
import { CheckSquare } from 'lucide-react';
import { TaskDetails } from '../../types';

export interface TaskComposerDraft {
  title: string;
  assignee: string;
  dueDate: string;
  priority: TaskDetails['priority'];
  note: string;
}

interface InboxTaskComposerFormProps {
  taskForm: TaskComposerDraft;
  onChange: (next: TaskComposerDraft) => void;
  onCancel: () => void;
  onSubmit: (e?: React.FormEvent) => void;
}

const PRIORITY_OPTIONS: TaskDetails['priority'][] = ['ปกติ', 'ด่วน', 'ด่วนที่สุด'];

export const InboxTaskComposerForm: React.FC<InboxTaskComposerFormProps> = ({
  taskForm,
  onChange,
  onCancel,
  onSubmit,
}) => {
  return (
    <div className="bg-slate-50/80 border border-indigo-100 rounded-xl p-3.5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-divider pb-2">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          <span>มอบหมายงานติดตามลูกค้า (Task Assignment)</span>
        </div>
        <span className="text-[11px] text-text-secondary font-medium">
          เฉพาะทีมงานภายใน · ไม่แสดงให้ลูกค้าเห็น
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-primary mb-1">
          ชื่องาน / รายละเอียดที่ต้องทำ <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={taskForm.title}
          onChange={(e) => onChange({ ...taskForm, title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="เช่น ติดตามฝ่ายคลังเรื่องเลขพัสดุ SO-10482, โทรติดต่อลูกค้านัดหมายส่งสินค้า..."
          className="w-full px-3 py-2 text-[13px] bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            ผู้รับผิดชอบ (Assignee)
          </label>
          <select
            value={taskForm.assignee}
            onChange={(e) => onChange({ ...taskForm, assignee: e.target.value })}
            className="w-full px-2.5 py-1.5 text-[13px] bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="วิภา ส. (Customer Care)">วิภา ส. (Customer Care)</option>
            <option value="สมหญิง ร. (Supervisor)">สมหญิง ร. (Supervisor)</option>
            <option value="ธนพล ก. (Sales Manager)">ธนพล ก. (Sales Manager)</option>
            <option value="ประเทือง ว. (Credit Officer)">ประเทือง ว. (Credit Officer)</option>
            <option value="ทีมคลังสินค้า & ขนส่ง">ทีมคลังสินค้า & ขนส่ง</option>
            <option value="ทีมช่างเทคนิค">ทีมช่างเทคนิค</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            กำหนดเสร็จ (Due Date)
          </label>
          <input
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => onChange({ ...taskForm, dueDate: e.target.value })}
            className="w-full px-2.5 py-1.5 text-[13px] bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            ระดับความสำคัญ (Priority)
          </label>
          <select
            value={taskForm.priority}
            onChange={(e) => {
              const matched = PRIORITY_OPTIONS.find((p) => p === e.target.value);
              if (matched) onChange({ ...taskForm, priority: matched });
            }}
            className="w-full px-2.5 py-1.5 text-[13px] bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="ปกติ">● ปกติ</option>
            <option value="ด่วน">● ด่วน</option>
            <option value="ด่วนที่สุด">● ด่วนที่สุด (Urgent)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-primary mb-1">
          โน้ตเพิ่มเติม / ข้อมูลอ้างอิง
        </label>
        <textarea
          rows={2}
          value={taskForm.note}
          onChange={(e) => onChange({ ...taskForm, note: e.target.value })}
          placeholder="ระบุข้อความอ้างอิง ข้อมูลที่ลูกค้าต้องการ หรือคำแนะนำแก่ผู้รับมอบหมาย..."
          className="w-full p-2.5 text-[13px] bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 resize-none"
        />
      </div>

      <div className="flex items-center justify-between pt-1 select-none">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 transition-colors"
        >
          ยกเลิก
        </button>

        <button
          type="button"
          onClick={() => onSubmit()}
          disabled={!taskForm.title.trim()}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            taskForm.title.trim()
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>สร้างและมอบหมาย Task</span>
        </button>
      </div>
    </div>
  );
};
