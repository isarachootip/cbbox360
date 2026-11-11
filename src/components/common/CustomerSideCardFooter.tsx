import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Tag } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface CustomerSideCardFooterProps {
  customerId: string;
  labels: string[];
  onAddLabel: (label: string) => void;
  onOpenTask?: () => void;
}

export const CustomerSideCardFooter: React.FC<CustomerSideCardFooterProps> = ({
  customerId,
  labels,
  onAddLabel,
  onOpenTask,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');

  const submitLabel = () => {
    const trimmed = newLabelInput.trim();
    if (!trimmed) return;
    onAddLabel(trimmed);
    setNewLabelInput('');
    setShowAddLabel(false);
  };

  return (
    <>
      <div className="py-3 border-b border-divider">
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary tracking-[0.06em] uppercase mb-2 select-none">
          <span>Labels</span>
          <button
            type="button"
            onClick={() => setShowAddLabel(!showAddLabel)}
            className="text-brand hover:text-brand-hover flex items-center gap-0.5 text-xs font-medium normal-case tracking-normal"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่ม</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {labels.map((lbl, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
            >
              <Tag className="w-2.5 h-2.5 opacity-60" />
              {lbl}
            </span>
          ))}
          {showAddLabel && (
            <div className="flex items-center gap-1 mt-1.5 w-full">
              <input
                type="text"
                placeholder="ชื่อ label"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitLabel()}
                className="w-full text-xs px-2 py-1 border border-brand rounded-md focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={submitLabel}
                className="text-xs bg-brand text-white px-2.5 py-1 rounded-md font-medium"
              >
                บันทึก
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 space-y-2 select-none">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => {
              navigate('/pipeline');
              showToast('เปิดสร้าง Lead ใหม่สำหรับลูกค้า', 'info');
            }}
            className="py-1.5 text-xs font-medium border border-border bg-white hover:bg-bg-subtle rounded-lg text-text-primary transition-colors"
          >
            + Lead
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/cases');
              showToast('เปิดสร้าง Ticket ใหม่สำหรับลูกค้า', 'info');
            }}
            className="py-1.5 text-xs font-medium border border-border bg-white hover:bg-bg-subtle rounded-lg text-text-primary transition-colors"
          >
            + Ticket
          </button>
          <button
            type="button"
            onClick={() => {
              if (onOpenTask) {
                onOpenTask();
                showToast('สลับไปยังแท็บสร้าง Task ให้ทีมงาน', 'info');
              } else {
                navigate(`/customers/${customerId}`);
              }
            }}
            className="py-1.5 text-xs font-medium border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
          >
            + Task
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/customers/${customerId}`)}
          className="w-full py-2 text-[13px] font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <span>เปิด Customer 360</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
};
