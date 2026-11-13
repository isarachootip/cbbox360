import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneIncoming, PhoneOutgoing, ExternalLink } from 'lucide-react';
import type { CallLogRecord, CallLogStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface CallHistoryTableProps {
  callLogs: CallLogRecord[];
  onReopenScreenPop: (phone: string, ext?: string, callId?: string) => void;
}

const mapCallStatusBadge = (status: CallLogStatus): { status: string; label: string } => {
  switch (status) {
    case 'Active':
      return { status: 'open', label: 'กำลังสนทนา' };
    case 'Completed':
      return { status: 'completed', label: 'เสร็จสิ้น' };
    case 'Missed':
      return { status: 'danger', label: 'ไม่ได้รับสาย' };
  }
};

export const CallHistoryTable: React.FC<CallHistoryTableProps> = ({
  callLogs,
  onReopenScreenPop,
}) => {
  return (
    <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-divider flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">
          ประวัติสายสนทนาล่าสุด (3CX Call Activity Logs)
        </h3>
        <span className="text-xs text-text-secondary font-mono">{callLogs.length} รายการ</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-bg-muted border-b border-border text-text-secondary font-semibold">
              <th className="py-2.5 px-4">เวลา / ทิศทาง</th>
              <th className="py-2.5 px-4">เบอร์โทร / Ext</th>
              <th className="py-2.5 px-4">ลูกค้า / ผู้ติดต่อ</th>
              <th className="py-2.5 px-4">สรุปการสนทนา</th>
              <th className="py-2.5 px-4">สถานะ</th>
              <th className="py-2.5 px-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {callLogs.map((log) => {
              const badge = mapCallStatusBadge(log.status);
              return (
                <tr key={log.id} className="hover:bg-bg-subtle/60 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono font-medium text-text-primary">{log.timestamp}</div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                      {log.direction === 'outbound' ? (
                        <PhoneOutgoing className="w-3 h-3 text-slate-500" />
                      ) : (
                        <PhoneIncoming className="w-3 h-3 text-brand" />
                      )}
                      <span>{log.direction === 'outbound' ? 'สายโทรออก' : 'สายเรียกเข้า'}</span>
                      <span>·</span>
                      <span className="font-mono">{log.durationFormatted}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono">
                    <div className="font-bold text-text-primary">{log.phone}</div>
                    <div className="text-[11px] text-text-secondary">
                      Ext: {log.ext || '—'} {log.callId ? `· ${log.callId}` : ''}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {log.customerId ? (
                      <div>
                        <Link
                          to={`/customers/${log.customerId}`}
                          className="font-bold text-brand hover:underline"
                        >
                          {log.customerName}
                        </Link>{' '}
                        <span className="font-mono text-[11px] text-text-secondary">
                          ({log.customerId})
                        </span>
                        {log.matchedContactName && (
                          <div className="text-[11px] text-text-secondary truncate max-w-[220px]">
                            {log.matchedContactName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-secondary italic">ยังไม่ผูกโปรไฟล์ลูกค้า</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-text-secondary max-w-xs">
                    <span className="line-clamp-2">{log.summary || '—'}</span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={badge.status} label={badge.label} />
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onReopenScreenPop(log.phone, log.ext, log.callId)}
                      className="px-2.5 py-1 border border-border hover:bg-bg-subtle rounded-lg text-[11px] font-semibold text-text-primary inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Screen-Pop</span>
                      <ExternalLink className="w-3 h-3 text-brand" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
