import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, ExternalLink, Tag } from 'lucide-react';
import { Customer } from '../../types';
import { TierBadge } from './TierBadge';
import { GradeBadge } from './GradeBadge';
import { useToast } from '../../context/ToastContext';
import { useCustomer } from '../../context/CustomerContext';

interface CustomerSideCardProps {
  customer: Customer;
  onOpenTask?: () => void;
}

export const CustomerSideCard: React.FC<CustomerSideCardProps> = ({ customer, onOpenTask }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { deals, tickets } = useCustomer();
  const [labels, setLabels] = useState<string[]>(['จัดส่ง', 'ลูกค้าองค์กร']);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');

  // Find customer's active deal and ticket
  const activeDeal = deals.find(
    (d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  );
  const activeTicket = tickets.find(
    (t) => t.customerId === customer.id && t.status !== 'Closed'
  );

  const handleAddLabel = () => {
    if (newLabelInput.trim()) {
      setLabels([...labels, newLabelInput.trim()]);
      setNewLabelInput('');
      setShowAddLabel(false);
      showToast(`เพิ่มป้ายกำกับ "${newLabelInput.trim()}" สำเร็จ`, 'success');
    }
  };

  return (
    <div className="w-[320px] flex-shrink-0 bg-white border-l border-border h-full overflow-y-auto custom-scrollbar flex flex-col p-4 text-[13px]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-divider">
        <span className="text-xs font-semibold text-text-secondary tracking-wider">
          ข้อมูลจาก CDP
        </span>
        <button
          onClick={() => navigate(`/customers/${customer.id}`)}
          className="text-brand hover:text-brand-hover text-xs font-medium flex items-center gap-1"
        >
          <span>เปิด Customer 360</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Customer Avatar & Name */}
      <div className="py-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-brand-tint text-brand-deep font-bold flex items-center justify-center text-sm">
          {customer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] text-text-primary truncate">
            {customer.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <TierBadge tier={customer.tier} size="sm" />
            <GradeBadge grade={customer.creditGrade} size="sm" />
          </div>
        </div>
      </div>

      {/* CDP Quick Info */}
      <div className="space-y-2 py-3 border-y border-divider text-xs">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">มือถือ</span>
          <span className="font-mono text-text-primary">{customer.phone}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">ยอด 12 เดือน</span>
          <span className="font-mono font-semibold text-text-primary">
            ฿{customer.spend12Months.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">ซื้อล่าสุด</span>
          <span className="text-text-primary font-mono text-[11px]">
            {customer.lastOrderCode} · {customer.lastOrderDaysAgo} วันก่อน
          </span>
        </div>
      </div>

      {/* Segments */}
      <div className="py-3 border-b border-divider">
        <div className="text-[11px] font-semibold text-text-secondary mb-2">
          SEGMENTS
        </div>
        <div className="flex flex-wrap gap-1.5">
          {customer.segments.map((seg, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-bg-app text-sidebar-text border border-border px-2 py-0.5 rounded-full"
            >
              {seg}
            </span>
          ))}
        </div>
      </div>

      {/* Activity เปิดอยู่ */}
      <div className="py-3 border-b border-divider space-y-2">
        <div className="text-[11px] font-semibold text-text-secondary">
          Activity เปิดอยู่
        </div>
        {activeDeal && (
          <div
            onClick={() => navigate('/pipeline')}
            className="p-2.5 rounded-lg bg-bg-subtle border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between text-xs"
          >
            <div>
              <div className="text-text-secondary text-[11px]">Deal · {activeDeal.title}</div>
              <div className="font-mono font-bold text-text-primary mt-0.5">
                ฿{activeDeal.value.toLocaleString()}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
          </div>
        )}
        {activeTicket && (
          <div
            onClick={() => navigate('/cases')}
            className="p-2.5 rounded-lg bg-bg-subtle border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between text-xs"
          >
            <div>
              <div className="text-text-secondary text-[11px]">Ticket {activeTicket.id}</div>
              <div className="font-semibold text-amber-600 mt-0.5">
                SLA เหลือ {activeTicket.slaFormatted}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="py-3 border-b border-divider">
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary mb-2">
          <span>LABELS</span>
          <button
            onClick={() => setShowAddLabel(!showAddLabel)}
            className="text-brand hover:text-brand-hover flex items-center gap-0.5 text-xs font-normal"
          >
            <Plus className="w-3 h-3" />
            <span>เพิ่ม</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {labels.map((lbl, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
            >
              <Tag className="w-2.5 h-2.5 opacity-60" />
              {lbl}
            </span>
          ))}
          {showAddLabel && (
            <div className="flex items-center gap-1 mt-1 w-full">
              <input
                type="text"
                placeholder="ชื่อ label"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="w-full text-xs px-2 py-1 border border-brand rounded focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAddLabel}
                className="text-xs bg-brand text-white px-2 py-1 rounded"
              >
                บันทึก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => {
              navigate('/pipeline');
              showToast('เปิดสร้าง Lead ใหม่สำหรับลูกค้า', 'info');
            }}
            className="w-full py-1.5 text-xs font-medium border border-border bg-white hover:bg-bg-subtle rounded-lg text-text-primary transition-colors text-center"
          >
            + Lead
          </button>
          <button
            onClick={() => {
              navigate('/cases');
              showToast('เปิดสร้าง Ticket ใหม่สำหรับลูกค้า', 'info');
            }}
            className="w-full py-1.5 text-xs font-medium border border-border bg-white hover:bg-bg-subtle rounded-lg text-text-primary transition-colors text-center"
          >
            + Ticket
          </button>
          <button
            onClick={() => {
              if (onOpenTask) {
                onOpenTask();
                showToast('สลับไปยังแท็บสร้าง Task ให้ทีมงาน', 'info');
              } else {
                navigate(`/customers/${customer.id}`);
                showToast('เปิดหน้า Customer 360 เพื่อสร้าง Task', 'info');
              }
            }}
            className="w-full py-1.5 text-xs font-medium border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-center"
          >
            + Task
          </button>
        </div>
        <button
          onClick={() => navigate(`/customers/${customer.id}`)}
          className="w-full py-2 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>เปิด Customer 360</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
