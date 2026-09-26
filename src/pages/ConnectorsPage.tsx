import React, { useState } from 'react';
import {
  Network,
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Settings,
  ShieldCheck,
  Send,
  Code,
  Radio,
  Sliders,
  Check,
  Zap,
  PhoneCall,
  Mail,
  Globe,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { Modal } from '../components/common/Modal';
import { initialConnectors } from '../data/connectors';
import { useToast } from '../context/ToastContext';
import { useCustomer } from '../context/CustomerContext';
import { ConnectorConfig, ConnectorCategory } from '../types';

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
  const [simulatorText, setSimulatorText] = useState('สวัสดีครับ สอบถามโปรโมชันเครื่องพิมพ์เลเซอร์และเงื่อนไขเครดิตครับ');

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
          <div className="w-10 h-10 rounded-xl bg-[#06C755] text-white font-extrabold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
            LINE
          </div>
        );
      case 'facebook':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white font-extrabold flex items-center justify-center text-lg shadow-sm flex-shrink-0">
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
            <Mail className="w-5 h-5" />
          </div>
        );
      case 'web':
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            <Globe className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-brand text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
            <Network className="w-5 h-5" />
          </div>
        );
    }
  };

  const handleOpenConfig = (conn: ConnectorConfig) => {
    setSelectedConnector(conn);
    setEditForm(JSON.parse(JSON.stringify(conn))); // deep copy
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    const updated = connectors.map((c) => (c.id === editForm.id ? editForm : c));
    saveConnectors(updated);
    showToast(`บันทึกการตั้งค่า ${editForm.name} สำเร็จ`, 'success');
    setIsConfigModalOpen(false);
  };

  const handleTestConnection = (conn: ConnectorConfig) => {
    showToast(`กำลังส่ง Ping ทดสอบ Webhook ของ ${conn.name}...`, 'info');
    setTimeout(() => {
      showToast(`การเชื่อมต่อ ${conn.name} ทำงานปกติ (HTTP 200 OK - Latency 42ms)`, 'success');
    }, 400);
  };

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('คัดลอก URL Webhook ไปยังคลิปบอร์ดแล้ว', 'success');
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

    // Simulate sending into Inbox conv-1
    addMessageToConversation('conv-1', simulatorText.trim(), false);
    showToast(`ส่ง Event ข้อความจำลองจาก ${simulatorChannel} เข้าสู่ระบบสำเร็จ (ดูได้ใน Omnichannel Inbox & Timeline)`, 'success');
    setIsSimulatorModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="Connectors & Omnichannel Config"
        subtitle="ตั้งค่าการเชื่อมต่อ LINE, Facebook, Instagram, TikTok, WhatsApp, 3CX และ Webhooks"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulatorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ จำลอง Webhook Event</span>
            </button>
            <button
              onClick={() => setIsWidgetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Code className="w-4 h-4 text-brand" />
              <span>โค้ด Web Widget</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* KPI Tiles (4 metrics) */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <KpiTile
            label="ช่องทางที่เชื่อมต่อแล้ว"
            value={`${connectedCount} / ${connectors.length}`}
            subValue="Channels Active"
            variant="success"
          />
          <KpiTile
            label="ข้อความ/อีเวนต์วันนี้"
            value={`${totalEventsToday} รายการ`}
            subValue="Realtime Ingestion"
            variant="default"
          />
          <KpiTile
            label="Webhook Health Status"
            value="99.98%"
            subValue="Avg Latency 38ms"
            variant="default"
          />
          <KpiTile
            label="Auto Leads & Tickets วันนี้"
            value="64 รายการ"
            subValue="จาก Social & Voice"
            variant="default"
          />
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center justify-between bg-white rounded-card border border-border p-3 shadow-card">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary">หมวดหมู่:</span>
            {[
              { key: 'ทั้งหมด', label: 'ทั้งหมด (All Connectors)' },
              { key: 'social', label: 'โซเชียล & แชท (LINE, FB, IG, TikTok, WA)' },
              { key: 'voice', label: 'โทรศัพท์ & เสียง (3CX PBX)' },
              { key: 'email_web', label: 'อีเมล & เว็บไซต์ (SMTP, LiveChat)' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  categoryFilter === cat.key
                    ? 'bg-brand text-white font-semibold shadow-xs'
                    : 'bg-bg-subtle text-text-secondary hover:bg-bg-app border border-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-text-secondary font-mono">
            แสดง {filteredConnectors.length} รายการ
          </span>
        </div>

        {/* Connectors Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConnectors.map((conn) => {
            const isConnected = conn.status === 'connected';

            return (
              <div
                key={conn.id}
                className="bg-white rounded-card border border-border p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-brand/40 transition-all"
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {getChannelIcon(conn.iconName)}
                      <div>
                        <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                          <span>{conn.name}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              isConnected
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                              }`}
                            />
                            <span>{isConnected ? 'Active' : 'Disconnected'}</span>
                          </span>
                        </h3>
                        <div className="text-xs font-semibold text-brand-deep font-mono mt-0.5">
                          {conn.accountName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-text-secondary block">
                        ข้อความวันนี้
                      </span>
                      <span className="text-sm font-bold font-mono text-brand">
                        {conn.messagesCountToday}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                    {conn.description}
                  </p>
                </div>

                {/* Webhook Endpoint Box */}
                <div className="p-2.5 bg-bg-muted rounded-lg border border-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                    <span>Webhook Callback URL</span>
                    <span className="text-[10px] text-emerald-700 font-mono">Status 200 OK</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-border font-mono text-[11px] text-text-primary">
                    <span className="truncate">{conn.webhookUrl}</span>
                    <button
                      onClick={() => handleCopyWebhook(conn.webhookUrl)}
                      title="คัดลอก Webhook URL"
                      className="text-text-secondary hover:text-brand p-0.5 rounded hover:bg-bg-app flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Enabled Feature Badges */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-text-secondary uppercase">
                    ฟังก์ชันที่เปิดใช้งาน (Features)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {conn.features.map((feat) => (
                      <span
                        key={feat.key}
                        className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          feat.enabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200 opacity-60'
                        }`}
                      >
                        {feat.enabled ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 text-center leading-none">✕</span>}
                        <span>{feat.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-divider flex items-center justify-between gap-2">
                  <span className="text-[11px] text-text-secondary font-mono">
                    ซิงก์ล่าสุด: {conn.lastSync}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(conn)}
                      className="px-3 py-1.5 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-text-secondary" />
                      <span>ทดสอบเชื่อมต่อ</span>
                    </button>
                    <button
                      onClick={() => handleOpenConfig(conn)}
                      className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
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
          title={`ตั้งค่าการเชื่อมต่อ: ${editForm.name}`}
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
                บันทึกการตั้งค่า
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* Account Name & ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  ชื่อบัญชี / เพจ (Account Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.accountName}
                  onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-medium"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Channel ID / Account ID *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.accountId}
                  onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
            </div>

            {/* App ID & Secret */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  App ID / Client ID
                </label>
                <input
                  type="text"
                  value={editForm.appId || ''}
                  onChange={(e) => setEditForm({ ...editForm, appId: e.target.value })}
                  placeholder="เช่น 1659281042"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  App Secret / Channel Secret
                </label>
                <input
                  type="password"
                  value={editForm.appSecret || ''}
                  onChange={(e) => setEditForm({ ...editForm, appSecret: e.target.value })}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
                />
              </div>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                Channel Access Token (Long-lived)
              </label>
              <textarea
                rows={2}
                value={editForm.accessToken || ''}
                onChange={(e) => setEditForm({ ...editForm, accessToken: e.target.value })}
                placeholder="วาง Access Token จาก Developer Console ที่นี่..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono text-[11px] resize-none"
              />
            </div>

            {/* Webhook & Verify Token */}
            <div className="p-3 bg-bg-muted rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-text-primary font-bold">
                  Webhook URL (นำไปใส่ในคอนโซลของ {editForm.name})
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyWebhook(editForm.webhookUrl)}
                  className="text-brand hover:underline font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>คัดลอก URL</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={editForm.webhookUrl}
                className="w-full px-3 py-1.5 bg-white border border-border rounded font-mono text-[11px] text-text-secondary"
              />

              {editForm.verifyToken && (
                <div>
                  <label className="block text-text-secondary font-medium mt-2 mb-1">
                    Verify Token (สำหรับ Meta / Webhook Handshake)
                  </label>
                  <input
                    type="text"
                    value={editForm.verifyToken}
                    onChange={(e) => setEditForm({ ...editForm, verifyToken: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-border rounded font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2 pt-2 border-t border-divider">
              <div className="font-bold text-text-primary text-xs">
                กำหนดการทำงานและการเชื่อมต่อโมดูล (Integration Switches)
              </div>
              <div className="space-y-2">
                {editForm.features.map((feat) => (
                  <label
                    key={feat.key}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-bg-subtle cursor-pointer transition-colors"
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
        title="⚡ จำลอง Webhook Event จาก Social / Voice"
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>ส่งข้อความทดสอบ</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleSimulateEvent} className="space-y-3.5 text-xs">
          <p className="text-text-secondary">
            เครื่องมือนี้จะยิง Webhook จำลองแบบเรียลไทม์ เพื่อทดสอบการรับข้อความเข้า Omnichannel Inbox, การสร้าง Lead ใน Pipeline หรือการเปิด Call Pop-up
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">
                ช่องทางที่ส่งเข้า (Channel)
              </label>
              <select
                value={simulatorChannel}
                onChange={(e) => setSimulatorChannel(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-semibold"
              >
                <option value="LINE">LINE Official Account</option>
                <option value="Facebook">Facebook Messenger</option>
                <option value="3CX">3CX Cloud PBX (สายโทรเข้า)</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">
                ลูกค้าผู้ส่ง (Customer)
              </label>
              <select
                value={simulatorSender}
                onChange={(e) => setSimulatorSender(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-semibold"
              >
                <option value="สมชาย ใจดี">สมชาย ใจดี (C00123 - PLATINUM)</option>
                <option value="บจก. นำชัยการพิมพ์">บจก. นำชัยการพิมพ์ (C00124 - GOLD)</option>
                <option value="ลูกค้าใหม่ (ยังไม่ผูก Profile)">ลูกค้าใหม่ (Lead แรกเข้า)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">
              ข้อความทดสอบ (Payload Text) *
            </label>
            <textarea
              rows={3}
              required
              value={simulatorText}
              onChange={(e) => setSimulatorText(e.target.value)}
              placeholder="พิมพ์ข้อความทดสอบที่ต้องการให้ระบบประมวลผล..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: WEB WIDGET SCRIPT ================= */}
      <Modal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        title="โค้ดฝัง LiveChat Web Widget บนเว็บไซต์"
        maxWidth="lg"
        footer={
          <button
            onClick={() => setIsWidgetModalOpen(false)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-text-secondary">
            คัดลอกโค้ด JavaScript ด้านล่างนี้ไปวางก่อนแท็กปิด <code className="bg-bg-app px-1 py-0.5 rounded border border-border">&lt;/body&gt;</code> บนเว็บไซต์ของคุณ เพื่อเปิดใช้งานปุ่มแชทสดที่เชื่อมตรงกับ Omnichannel Inbox
          </p>

          <div className="relative bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`<script\n  src="https://cb360.co.th/embed/chat-widget.js"\n  data-app-id="cb360_live_884920"\n  data-theme="#1F6FD1"\n  async>\n</script>`);
                showToast('คัดลอกโค้ด Widget สำเร็จ', 'success');
              }}
              className="absolute top-3 right-3 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 text-xs flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </button>

            <pre className="text-emerald-400">
{`<!-- CusBox360 LiveChat Widget Embed Code -->
<script
  src="https://cb360.co.th/embed/chat-widget.js"
  data-app-id="cb360_live_884920"
  data-theme="#1F6FD1"
  data-title="สอบถามเจ้าหน้าที่ CusBox360"
  async>
</script>`}
            </pre>
          </div>

          <div className="p-3 rounded-lg bg-bg-subtle border border-border text-[11px] space-y-1">
            <div className="font-bold text-text-primary">✨ คุณสมบัติของ Widget:</div>
            <div className="text-text-secondary">• ขอชื่อ, เบอร์โทร และ Consent PDPA ก่อนเริ่มแชท</div>
            <div className="text-text-secondary">• แปลงผู้ติดต่อเป็น Lead ส่งเข้า Sales Pipeline อัตโนมัติ</div>
            <div className="text-text-secondary">• เจ้าหน้าที่ตอบกลับผ่านหน้า Omnichannel Inbox แบบเรียลไทม์</div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
