import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, FileDown, Play } from 'lucide-react';
import type { Customer, DsrRequest, DsrStatus } from '../../types';
import { DSR_REQUEST_TYPE_META } from '../../data/consent';
import { StatusBadge } from '../common/StatusBadge';

interface DsrRequestsTabProps {
  dsrRequests: DsrRequest[];
  customers: Customer[];
  onSelectCustomerId: (id: string) => void;
  onOpenNewModal: () => void;
  onAdvanceStatus: (dsr: DsrRequest, nextStatus: DsrStatus) => void;
  onExportCustomerCsv: (customer: Customer) => void;
}

const STATUS_FILTERS: ('all' | DsrStatus)[] = [
  'all',
  'Open',
  'In Review',
  'Overdue',
  'Completed',
];

export const DsrRequestsTab: React.FC<DsrRequestsTabProps> = ({
  dsrRequests,
  customers,
  onSelectCustomerId,
  onOpenNewModal,
  onAdvanceStatus,
  onExportCustomerCsv,
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | DsrStatus>('all');

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? dsrRequests
        : dsrRequests.filter((r) => r.status === statusFilter),
    [dsrRequests, statusFilter]
  );

  return (
    <div className="space-y-3.5">
      <div className="bg-white border border-border rounded-card p-3.5 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-brand text-white'
                  : 'bg-bg-subtle text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {st === 'all' ? `ทั้งหมด (${dsrRequests.length})` : st}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-card transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>รับคำขอใช้สิทธิ์ใหม่ (DSR)</span>
        </button>
      </div>

      <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-muted text-text-secondary text-xs font-medium">
                <th className="py-3 px-4 font-medium">เลขคำขอ / วันที่รับ</th>
                <th className="py-3 px-4 font-medium">เจ้าของข้อมูล (ลูกค้า)</th>
                <th className="py-3 px-4 font-medium">ประเภทสิทธิ์ตามกฎหมาย · เหตุผล</th>
                <th className="py-3 px-4 font-medium">ผู้รับผิดชอบ</th>
                <th className="py-3 px-4 font-medium">กรอบ SLA (30 วัน)</th>
                <th className="py-3 px-4 font-medium">สถานะ</th>
                <th className="py-3 px-4 font-medium text-right">การดำเนินการอัตโนมัติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filtered.map((dsr) => {
                const meta = DSR_REQUEST_TYPE_META[dsr.requestType];
                const linkedCustomer = customers.find((c) => c.id === dsr.customerId);
                const slaTextClass =
                  dsr.status === 'Completed'
                    ? 'text-emerald-600'
                    : dsr.slaDaysLeft < 0 || dsr.status === 'Overdue'
                      ? 'text-rose-600 font-bold'
                      : dsr.slaDaysLeft <= 5
                        ? 'text-amber-600 font-semibold'
                        : 'text-text-primary';

                return (
                  <tr key={dsr.id} className="hover:bg-bg-subtle/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-xs text-brand">{dsr.id}</div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">{dsr.createdAt}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCustomerId(dsr.customerId);
                          navigate(`/customers/${dsr.customerId}`);
                        }}
                        className="font-semibold text-sm text-text-primary hover:text-brand transition-colors cursor-pointer text-left"
                      >
                        {dsr.customerName}
                      </button>
                      <div className="text-xs text-text-muted font-mono">
                        {dsr.customerId} · {dsr.channel}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-xs text-text-primary">{meta.label}</div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{dsr.reason}</p>
                      {dsr.resolutionNote && (
                        <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                          ✓ {dsr.resolutionNote}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-text-secondary font-medium">
                      {dsr.assignee}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums">
                      <span className={slaTextClass}>
                        {dsr.status === 'Completed'
                          ? `เสร็จสิ้น (${dsr.resolvedAt || '-'})`
                          : dsr.slaDaysLeft < 0
                            ? `เกินกำหนด ${Math.abs(dsr.slaDaysLeft)} วัน`
                            : `เหลือ ${dsr.slaDaysLeft} วัน`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={dsr.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {linkedCustomer && (
                          <button
                            type="button"
                            onClick={() => onExportCustomerCsv(linkedCustomer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white transition-colors cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5 text-brand" />
                            <span>CSV</span>
                          </button>
                        )}

                        {dsr.status === 'Open' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(dsr, 'In Review')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs font-semibold text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-purple-600" />
                            <span>รับเรื่อง</span>
                          </button>
                        )}

                        {dsr.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(dsr, 'Completed')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ดำเนินการ & ปิดงาน</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
