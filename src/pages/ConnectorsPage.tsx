import React, { useState } from 'react';
import {
  Network,
  RefreshCw,
  Copy,
  Settings,
  Mail,
  Globe,
  Zap,
  Code,
  Check,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { initialConnectors } from '../data/connectors';
import { useToast } from '../context/ToastContext';
import { useCustomer } from '../context/CustomerContext';
import { ConnectorConfig } from '../types';

export const ConnectorsPage: React.FC = () => {
  const { showToast } = useToast();
  const { addMessageToConversation } = useCustomer();

  const [connectors, setConnectors] = useState<ConnectorConfig[]>(() => {
    const saved = localStorage.getItem('cb360_connectors_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialConnectors;
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('ทั้งหมด');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorConfig | null>(null);

  // Modal states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<ConnectorConfig | null>(null);

  // Simulator state
  const [simulatorChannel, setSimulatorChannel] = useState<'LINE' | 'Facebook' | '3CX'>('LINE');
  const [simulatorSender, setSimulatorSender] = useState('สมชาย ใจดี');
  const [simulatorText, setSimulatorText] = useState('สอบถามโปรโมชันเครื่องพิมพ์และเงื่อนไขเครดิต');

  const saveConnectors = (newConnectors: ConnectorConfig[]) => {
    setConnectors(newConnectors);
    localStorage.setItem('cb360_connectors_config', JSON.stringify(newConnectors));
  };

  // Filter connectors
  const filteredConnectors = connectors.filter((c) => {
    if (categoryFilter === 'ทั้งหมด') return true;
    if (categoryFilter === 'social') return c.category === 'social';
    if (categoryFilter === 'voice') return c.category === 'voice';
    if (categoryFilter === 'email_web') return c.category === 'email' || c.category === 'web';
    return true;
  });

  // KPIs
  const connectedCount = connectors.filter((c) => c.status === 'connected').length;
  const totalEventsToday = connectors.reduce((sum, c) => sum + c.messagesCountToday, 0);

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'line':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#06C755] text-white font-extrabold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            LINE
          </div>
        );
      case 'facebook':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white font-extrabold flex items-center justify-center text-base shadow-sm flex-shrink-0">
            f
          </div>
        );
      case 'instagram':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#405DE6] text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            IG
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-10 h-10 rounded-xl bg-black text-white font-extrabold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            TT
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white font-extrabold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            WA
          </div>
        );
      case '3cx':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            3CX
          </div>
        );
      case 'email':
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        );
      case 'web':
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-brand text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            <Network className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleOpenConfig = (conn: ConnectorConfig) => {
    setSelectedConnector(conn);
    setEditForm(JSON.parse(JSON.stringify(conn)));
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    const updated = connectors.map((c) => (c.id === editForm.id ? editForm : c));
    saveConnectors(updated);
    showToast(`บันทึก ${editForm.name} สำเร็จ`, 'success');
    setIsConfigModalOpen(false);
  };

  const handleTestConnection = (conn: ConnectorConfig) => {
    showToast(`ทดสอบการเชื่อมต่อ ${conn.name}...`, 'info');
    setTimeout(() => {
      showToast(`${conn.name}: เชื่อมต่อสำเร็จ (200 OK)`, 'success');
    }, 300);
  };

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('คัดลอก Webhook URL สำเร็จ', 'success');
  };

  const handleToggleFeature = (featureKey: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      features: editForm.features.map((f) =>
        f.key === featureKey ? { ...f, enabled: !f.enabled } : f
      ),
    });
  };

  const handleSimulateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatorText.trim()) return;

    addMessageToConversation('conv-1', simulatorText.trim(), false);
    showToast(`ส่ง Event จาก ${simulatorChannel} สำเร็จ`, 'success');
    setIsSimulatorModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header - CLEAN */}
      <PageHeader
        title="Connectors"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulatorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>จำลอง Event</span>
            </button>
            <button
              onClick={() => setIsWidgetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-brand" />
              <span>Web Widget</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* KPI Tiles - CLEAN */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <KpiTile
            label="ช่องทางเชื่อมต่อแล้ว"
            value={`${connectedCount} / ${connectors.length}`}
            variant="success"
          />
          <KpiTile
            label="ข้อความวันนี้"
            value={`${totalEventsToday.toLocaleString()}`}
            variant="default"
          />
          <KpiTile
            label="Webhook Health"
            value="99.98%"
            variant="default"
          />
          <KpiTile
            label="Leads & Tickets วันนี้"
            value="64"
            variant="default"
          />
        </div>

        {/* Category Filters Bar - CLEAN */}
        <div className="flex items-center justify-between bg-white rounded-card border border-border p-2.5 shadow-card">
          <div className="flex items-center gap-1.5">
            {[
              { key: 'ทั้งหมด', label: 'ทั้งหมด' },
              { key: 'social', label: 'Social & Messaging' },
              { key: 'voice', label: 'Voice (3CX)' },
              { key: 'email_web', label: 'Email & Web' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  categoryFilter === cat.key
                    ? 'bg-brand text-white font-semibold shadow-xs'
                    : 'text-text-secondary hover:bg-bg-subtle'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-text-secondary px-2">
            {filteredConnectors.length} รายการ
          </span>
        </div>

        {/* Connectors Cards Grid - CLEAN & UNCLUTTERED */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredConnectors.map((conn) => {
            const isConnected = conn.status === 'connected';

            return (
              <div
                key={conn.id}
                className="bg-white rounded-card border border-border p-4 shadow-card flex flex-col justify-between hover:border-brand/40 transition-all space-y-3.5"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {getChannelIcon(conn.iconName)}
                    <div className="min-w-0">
                      <div className="font-bold text-[13px] text-text-primary truncate">
                        {conn.name}
                      </div>
                      <div className="text-[11px] font-mono text-brand font-medium truncate">
                        {conn.accountName}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                    <span>{isConnected ? 'Active' : 'Offline'}</span>
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-bg-subtle rounded-lg border border-border/80 text-xs">
                  <div>
                    <span className="text-[11px] text-text-secondary block">ข้อความวันนี้</span>
                    <span className="font-mono font-bold text-text-primary text-[13px]">
                      {conn.messagesCountToday}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-secondary block">ซิงก์ล่าสุด</span>
                    <span className="font-mono text-text-primary text-[11px]">
                      {conn.lastSync}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-divider flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyWebhook(conn.webhookUrl)}
                    title="คัดลอก Webhook URL"
                    className="text-xs text-text-secondary hover:text-brand flex items-center gap-1 px-1.5 py-1 rounded hover:bg-bg-app transition-colors font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Webhook</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTestConnection(conn)}
                      className="px-2.5 py-1 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 text-text-secondary" />
                      <span>ทดสอบ</span>
                    </button>
                    <button
                      onClick={() => handleOpenConfig(conn)}
                      className="px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      <span>ตั้งค่า</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ================= MODAL: CONFIGURE CONNECTOR ================= */}
      {editForm && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title={`ตั้งค่า ${editForm.name}`}
          maxWidth="lg"
          footer={
            <>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                บันทึก
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.accountName}
                  onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Account / Channel ID *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.accountId}
                  onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  App / Client ID
                </label>
                <input
                  type="text"
                  value={editForm.appId || ''}
                  onChange={(e) => setEditForm({ ...editForm, appId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  App / Channel Secret
                </label>
                <input
                  type="password"
                  value={editForm.appSecret || ''}
                  onChange={(e) => setEditForm({ ...editForm, appSecret: e.target.value })}
                  className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">
                Access Token
              </label>
              <textarea
                rows={2}
                value={editForm.accessToken || ''}
                onChange={(e) => setEditForm({ ...editForm, accessToken: e.target.value })}
                className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand font-mono text-[11px] resize-none"
              />
            </div>

            <div className="p-3 bg-bg-muted rounded-lg border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-text-primary font-bold">Webhook URL</label>
                <button
                  type="button"
                  onClick={() => handleCopyWebhook(editForm.webhookUrl)}
                  className="text-brand hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={editForm.webhookUrl}
                className="w-full px-3 py-1.5 bg-white border border-border rounded font-mono text-[11px] text-text-secondary"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-divider">
              <div className="font-bold text-text-primary text-xs">ฟังก์ชันการทำงาน</div>
              <div className="space-y-1.5">
                {editForm.features.map((feat) => (
                  <label
                    key={feat.key}
                    className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-bg-subtle cursor-pointer transition-colors"
                  >
                    <span className="text-text-primary font-medium">{feat.label}</span>
                    <input
                      type="checkbox"
                      checked={feat.enabled}
                      onChange={() => handleToggleFeature(feat.key)}
                      className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                    />
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: SIMULATOR ================= */}
      <Modal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        title="จำลอง Webhook Event"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setIsSimulatorModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSimulateEvent}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              ส่ง Event
            </button>
          </>
        }
      >
        <form onSubmit={handleSimulateEvent} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">ช่องทาง</label>
              <select
                value={simulatorChannel}
                onChange={(e) => setSimulatorChannel(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="LINE">LINE Official Account</option>
                <option value="Facebook">Facebook Messenger</option>
                <option value="3CX">3CX Cloud PBX</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">ลูกค้า</label>
              <select
                value={simulatorSender}
                onChange={(e) => setSimulatorSender(e.target.value)}
                className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="สมชาย ใจดี">สมชาย ใจดี (C00123)</option>
                <option value="บจก. นำชัยการพิมพ์">บจก. นำชัยการพิมพ์ (C00124)</option>
                <option value="ลูกค้าใหม่">ลูกค้าใหม่</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">ข้อความ</label>
            <textarea
              rows={2}
              required
              value={simulatorText}
              onChange={(e) => setSimulatorText(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:border-brand resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: WEB WIDGET SCRIPT ================= */}
      <Modal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        title="Web Widget Script"
        maxWidth="lg"
        footer={
          <button
            onClick={() => setIsWidgetModalOpen(false)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            ปิด
          </button>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`<script src="https://cb360.co.th/embed/chat-widget.js" data-app-id="cb360_live_884920" async></script>`);
                showToast('คัดลอกโค้ดสำเร็จ', 'success');
              }}
              className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 text-xs flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>

            <pre className="text-emerald-400">
{`<script
  src="https://cb360.co.th/embed/chat-widget.js"
  data-app-id="cb360_live_884920"
  async>
</script>`}
            </pre>
          </div>
        </div>
      </Modal>

    </div>
  );
};
