import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { StatusBadge } from '../components/common/StatusBadge';
import { VoiceSimulatorCard } from '../components/telephony/VoiceSimulatorCard';
import { CallHistoryTable } from '../components/telephony/CallHistoryTable';
import { useTelephony } from '../context/TelephonyContext';
import { useToast } from '../context/ToastContext';

export const VoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { callLogs } = useTelephony();
  const { showToast } = useToast();

  const stats = useMemo(() => {
    const completed = callLogs.filter((c) => c.status === 'Completed').length;
    const missed = callLogs.filter((c) => c.status === 'Missed').length;
    const unlinked = callLogs.filter((c) => !c.customerId).length;
    return {
      total: callLogs.length,
      completed,
      missed,
      unlinked,
    };
  }, [callLogs]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('คัดลอก URL สำหรับตั้งค่า 3CX Screen-Pop สำเร็จ', 'success');
  };

  const handleTriggerScreenPop = (phone: string, ext?: string, callId?: string) => {
    const params = new URLSearchParams();
    params.set('number', phone);
    if (ext) params.set('ext', ext);
    if (callId) params.set('callId', callId);
    navigate(`/crm?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2.5 text-text-secondary text-[13.5px]">
            <span>ACTIVITY</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[15px]">Voice (3CX Cloud PBX)</span>
            <StatusBadge status="connected" label="CTI Screen-Pop Active" className="ml-1" />
          </div>
        }
        actionButton={
          <Link
            to="/connectors"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-bg-subtle border border-border text-text-primary rounded-lg text-xs font-semibold transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-text-secondary" />
            <span>ตั้งค่า 3CX Connector</span>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 max-w-[1640px] w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiTile label="สายสนทนาทั้งหมด" value={stats.total} subValue="สาย" />
          <KpiTile
            label="รับสายสำเร็จ"
            value={stats.completed}
            subValue="สาย"
            variant="success"
          />
          <KpiTile
            label="สายไม่ได้รับ (Missed)"
            value={stats.missed}
            subValue="สาย"
            variant={stats.missed > 0 ? 'danger' : 'default'}
          />
          <KpiTile
            label="เบอร์ใหม่รอผูกโปรไฟล์"
            value={stats.unlinked}
            subValue="หมายเลข"
            variant={stats.unlinked > 0 ? 'warning' : 'default'}
          />
        </div>

        <VoiceSimulatorCard
          onCopyUrl={handleCopyUrl}
          onTriggerScreenPop={(num, ext, callId) => handleTriggerScreenPop(num, ext, callId)}
        />

        <CallHistoryTable callLogs={callLogs} onReopenScreenPop={handleTriggerScreenPop} />
      </div>
    </div>
  );
};
