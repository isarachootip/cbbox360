import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Send,
  PhoneCall,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  ArrowRight,
  Check,
  Webhook,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { TierBadge } from '../components/common/TierBadge';
import { Modal } from '../components/common/Modal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { Segment, SegmentRule, TierType } from '../types';

export const SegmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { segments, customers, toggleSegmentWebhook, updateSegmentRules, setSelectedCustomerId } = useCustomer();

  // Selected Segment
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('seg-8'); // Default to Gold+ ไม่ซื้อ 60 วัน
  const [groupFilter, setGroupFilter] = useState<string>('ทั้งหมด');

  // New Segment modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentType, setNewSegmentType] = useState<'Dynamic' | 'Static'>('Dynamic');

  // Active segment
  const activeSegment = segments.find((s) => s.id === selectedSegmentId) || segments[7];

  // Rules state for editing
  const [rules, setRules] = useState<SegmentRule[]>(
    activeSegment.rules || [
      { id: 'r-1', field: 'Tier', operator: 'อยู่ใน', value: 'Gold, Platinum' },
      { id: 'r-2', field: 'วันที่ซื้อล่าสุด', operator: 'นานกว่า', value: '60 วัน' },
      { id: 'r-3', field: 'Consent · การตลาด · LINE', operator: 'เท่ากับ', value: 'ยินยอม' },
    ]
  );

  // Sync rules when segment changes
  const handleSelectSegment = (seg: Segment) => {
    setSelectedSegmentId(seg.id);
    setRules(
      seg.rules && seg.rules.length > 0
        ? seg.rules
        : [
            { id: 'r-1', field: 'Tier', operator: 'อยู่ใน', value: 'Gold, Platinum' },
            { id: 'r-2', field: 'วันที่ซื้อล่าสุด', operator: 'นานกว่า', value: '60 วัน' },
          ]
    );
  };

  const handleAddRule = () => {
    const newRule: SegmentRule = {
      id: `r-${Date.now()}`,
      field: 'ยอดซื้อ 12 เดือน',
      operator: 'มากกว่า',
      value: '50000',
    };
    const updated = [...rules, newRule];
    setRules(updated);
    updateSegmentRules(activeSegment.id, updated);
    showToast('เพิ่มเงื่อนไขใหม่เรียบร้อย คำนวณกลุ่มเป้าหมายใหม่ทันที', 'success');
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    updateSegmentRules(activeSegment.id, updated);
    showToast('ลบเงื่อนไขและอัปเดตจำนวนสมาชิกแล้ว', 'info');
  };

  const handleRuleFieldChange = (ruleId: string, field: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, field } : r));
    setRules(updated);
    updateSegmentRules(activeSegment.id, updated);
  };

  const handleRuleOpChange = (ruleId: string, operator: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, operator } : r));
    setRules(updated);
    updateSegmentRules(activeSegment.id, updated);
  };

  const handleRuleValChange = (ruleId: string, value: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, value } : r));
    setRules(updated);
    updateSegmentRules(activeSegment.id, updated);
  };

  // Filter segments
  const filteredSegments = segments.filter((s) => {
    if (groupFilter === 'ทั้งหมด') return true;
    return s.group === groupFilter;
  });

  // Mock preview members for the active segment
  const previewMembers = [
    { name: 'บจก. เจริญวัสดุ', id: 'C00129', tier: 'PLATINUM' as TierType, daysAgo: '64 วันก่อน', spend: '฿412,000', lineConsent: true },
    { name: 'รพ.สัตว์ใจดี', id: 'C00134', tier: 'GOLD' as TierType, daysAgo: '71 วันก่อน', spend: '฿96,500', lineConsent: true },
    { name: 'ปกรณ์ ทองดี', id: 'C00136', tier: 'GOLD' as TierType, daysAgo: '63 วันก่อน', spend: '฿74,200', lineConsent: true },
    { name: 'สนง. บัญชี พรเจริญ', id: 'C00127', tier: 'GOLD' as TierType, daysAgo: '88 วันก่อน', spend: '฿68,900', lineConsent: true },
    { name: 'ศิริพร แสงทอง', id: 'C00137', tier: 'PLATINUM' as TierType, daysAgo: '61 วันก่อน', spend: '฿155,300', lineConsent: true },
    { name: 'ร้านเครื่องเขียนสยาม', id: 'C00132', tier: 'GOLD' as TierType, daysAgo: '95 วันก่อน', spend: '฿61,000', lineConsent: true },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="Segments"
        actionButton={
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Segment ใหม่</span>
          </button>
        }
      />

      {/* Main 3-Region Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= REGION 1: SEGMENTS LIST (340px) ================= */}
        <div className="w-[340px] flex-shrink-0 bg-white border-r border-border flex flex-col h-full">
          {/* Group Filter Chips */}
          <div className="p-3 border-b border-border flex flex-wrap gap-1.5">
            {['ทั้งหมด', 'RFM', 'Lifecycle', 'Service', 'Credit', 'สร้างเอง'].map((grp) => (
              <button
                key={grp}
                onClick={() => setGroupFilter(grp)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  groupFilter === grp
                    ? 'bg-brand text-white'
                    : 'bg-bg-subtle text-text-secondary hover:bg-bg-app border border-border'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          {/* Segment List Rows */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-divider">
            {filteredSegments.map((seg) => {
              const isSelected = seg.id === activeSegment.id;
              return (
                <div
                  key={seg.id}
                  onClick={() => handleSelectSegment(seg)}
                  className={`p-3.5 cursor-pointer transition-all flex items-center justify-between border-l-[3px] ${
                    isSelected
                      ? 'bg-brand-selected border-brand'
                      : 'hover:bg-bg-subtle border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-text-primary">
                      {seg.name}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {seg.group} · {seg.type}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-text-primary">
                      {seg.memberCount.toLocaleString()}
                    </div>
                    <div
                      className={`text-[11px] font-mono ${
                        seg.trend.startsWith('+')
                          ? 'text-emerald-600'
                          : seg.trend.startsWith('-')
                          ? 'text-rose-600'
                          : 'text-text-secondary'
                      }`}
                    >
                      {seg.trend}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= REGION 2: MIDDLE BUILDER & PREVIEW (FLEX) ================= */}
        <div className="flex-1 flex flex-col h-full bg-bg-app overflow-y-auto custom-scrollbar p-5 space-y-4">
          
          {/* Segment Name & Type Row */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                ชื่อ Segment
              </label>
              <input
                type="text"
                value={activeSegment.name}
                readOnly
                className="w-full text-base font-bold text-text-primary bg-bg-subtle/50 px-3 py-1.5 rounded-lg border border-border focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                ประเภท
              </label>
              <div className="flex rounded-lg border border-border bg-bg-subtle p-0.5">
                <button
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeSegment.type === 'Dynamic'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  Dynamic
                </button>
                <button
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeSegment.type === 'Static'
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  Static
                </button>
              </div>
            </div>
          </div>

          {/* Rule Builder Box (AND / OR) */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary">
                ตรงทุกเงื่อนไข (AND)
              </span>
              <span className="text-[11px] text-text-secondary font-mono">
                เงื่อนไขแบบเรียลไทม์
              </span>
            </div>

            {/* Condition Rows */}
            <div className="space-y-2.5 bg-bg-muted p-3.5 rounded-lg border border-border">
              {rules.map((rule, idx) => (
                <div key={rule.id} className="flex items-center gap-2">
                  <span className="w-8 text-[11px] font-semibold text-text-secondary">
                    {idx === 0 ? 'ถ้า' : 'และ'}
                  </span>

                  {/* Field */}
                  <select
                    value={rule.field}
                    onChange={(e) => handleRuleFieldChange(rule.id, e.target.value)}
                    className="flex-1 text-xs bg-white border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-brand font-medium"
                  >
                    <option value="Tier">Tier</option>
                    <option value="วันที่ซื้อล่าสุด">วันที่ซื้อล่าสุด</option>
                    <option value="Consent · การตลาด · LINE">Consent · การตลาด · LINE</option>
                    <option value="ยอดซื้อ 12 เดือน">ยอดซื้อ 12 เดือน</option>
                    <option value="จำนวน Order รวม">จำนวน Order รวม</option>
                    <option value="CSAT ล่าสุด">CSAT ล่าสุด</option>
                    <option value="Credit Grade">Credit Grade</option>
                  </select>

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) => handleRuleOpChange(rule.id, e.target.value)}
                    className="w-36 text-xs bg-white border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-brand font-medium"
                  >
                    <option value="อยู่ใน">อยู่ใน</option>
                    <option value="นานกว่า">นานกว่า</option>
                    <option value="เท่ากับ">เท่ากับ</option>
                    <option value="มากกว่า">มากกว่า</option>
                    <option value="น้อยกว่า">น้อยกว่า</option>
                    <option value="ระหว่าง">ระหว่าง</option>
                  </select>

                  {/* Value */}
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => handleRuleValChange(rule.id, e.target.value)}
                    className="flex-1 text-xs bg-white border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-brand font-medium"
                  />

                  {/* Delete Rule */}
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-text-secondary hover:text-rose-600 p-1.5 rounded hover:bg-white"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Action Buttons: + เงื่อนไข, + กลุ่ม OR */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleAddRule}
                  className="px-3 py-1 text-xs font-semibold bg-white border border-border hover:bg-bg-app rounded-md text-brand flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ เงื่อนไข</span>
                </button>
                <button
                  onClick={() => showToast('เพิ่มกลุ่มเงื่อนไขทางเลือก (OR Group)', 'info')}
                  className="px-3 py-1 text-xs font-medium bg-white border border-border hover:bg-bg-app rounded-md text-text-secondary transition-colors"
                >
                  + กลุ่ม OR
                </button>
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-[11px] text-text-secondary leading-relaxed">
              ข้อมูลที่ใช้เป็นเงื่อนไขได้: <strong className="text-text-primary">Profile · Tier · Order · Deal · Ticket · แชท · CSAT/NPS · Credit · Consent · Custom attributes</strong>
            </p>
          </div>

          {/* Member Preview Table */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary">
                ตัวอย่างสมาชิก
              </span>
              <span className="text-[11px] text-text-secondary font-mono">
                แสดง 6 จาก {activeSegment.memberCount} คน
              </span>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-muted text-text-secondary border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-medium">ลูกค้า</th>
                    <th className="px-3 py-2 font-medium">Tier</th>
                    <th className="px-3 py-2 font-medium">ซื้อล่าสุด</th>
                    <th className="px-3 py-2 font-medium text-right">ยอด 12 เดือน</th>
                    <th className="px-3 py-2 font-medium text-center">Consent LINE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {previewMembers.map((m, idx) => (
                    <tr
                      key={idx}
                      onClick={() => {
                        setSelectedCustomerId(m.id);
                        navigate(`/customers/${m.id}`);
                      }}
                      className="hover:bg-bg-subtle cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 font-semibold text-text-primary hover:text-brand">
                        {m.name}
                      </td>
                      <td className="px-3 py-2.5">
                        <TierBadge tier={m.tier} size="sm" />
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary font-mono">
                        {m.daysAgo}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-text-primary">
                        {m.spend}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          ✓ ยินยอม
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ================= REGION 3: RIGHT ACTIONS & LIVE COUNT (300px) ================= */}
        <div className="w-[300px] flex-shrink-0 bg-white border-l border-border flex flex-col h-full p-4 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Live Count Card */}
          <div className="p-4 bg-bg-subtle rounded-card border border-border space-y-3">
            <div className="text-xs text-text-secondary font-medium">
              ตรงเงื่อนไขตอนนี้
            </div>
            <div className="text-3xl font-extrabold font-mono text-brand">
              {activeSegment.memberCount.toLocaleString()}{' '}
              <span className="text-base font-bold text-text-primary">คน</span>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-2 pt-2 border-t border-divider text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Gold</span>
                <span className="font-mono font-bold text-text-primary">
                  {activeSegment.tierBreakdown?.gold || 701}
                </span>
              </div>
              <div className="w-full bg-divider h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#C9962E] h-full" style={{ width: '83%' }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-text-secondary">Platinum</span>
                <span className="font-mono font-bold text-text-primary">
                  {activeSegment.tierBreakdown?.platinum || 141}
                </span>
              </div>
              <div className="w-full bg-divider h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#6A5CB8] h-full" style={{ width: '17%' }} />
              </div>

              <div className="pt-2 text-[11px] text-text-secondary border-t border-divider">
                ยอดซื้อรวม 12 เดือนของกลุ่มนี้ <strong className="font-mono text-text-primary">{activeSegment.tierBreakdown?.totalSpend12M || '฿71.4M'}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons: ใช้ Segment นี้ */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-secondary uppercase">
              ใช้ Segment นี้
            </div>

            <button
              onClick={() => showToast('เปิดแบบฟอร์มส่ง LINE Broadcast ถึง 842 คน', 'success')}
              className="w-full py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่ง LINE Broadcast</span>
            </button>

            <button
              onClick={() => showToast('สร้าง Outbound Call List ในระบบ 3CX สำหรับทีมขาย', 'info')}
              className="w-full py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-text-secondary" />
              <span>สร้าง Outbound call list (3CX)</span>
            </button>

            <button
              onClick={() => showToast('เปิดหน้าต่างสร้างแบบสำรวจ CSAT/NPS', 'info')}
              className="w-full py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>ส่ง Survey</span>
            </button>

            <button
              onClick={() => showToast('ส่งคำขอ Export CSV ไปยังระบบ Audit Log', 'info')}
              className="w-full py-2 border border-border hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-text-secondary" />
              <span>Export CSV</span>
            </button>

            <p className="text-[10px] text-text-secondary leading-tight pt-1">
              * ส่งเฉพาะคนที่ให้ Consent ช่องทางนั้น · Export ต้องมีสิทธิ์และบันทึกเหตุผล
            </p>
          </div>

          {/* Webhook Card */}
          <div className="p-3.5 bg-bg-muted rounded-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-brand" />
                <span>Webhook</span>
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              <code>segment.joined</code> / <code>segment.left</code> ส่งไป Sales Pipeline และ Omnichannel Inbox
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={activeSegment.webhookEnabled}
                onChange={() => toggleSegmentWebhook(activeSegment.id)}
                className="rounded border-border text-brand focus:ring-brand"
              />
              <span className="text-xs font-semibold text-text-primary">
                เปิดใช้งาน
              </span>
            </label>
          </div>

        </div>

      </div>

      {/* Modal: + Segment ใหม่ */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="สร้าง Segment ใหม่"
        footer={
          <>
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                showToast(`สร้าง Segment "${newSegmentName || 'กลุ่มเป้าหมายใหม่'}" เรียบร้อยแล้ว`, 'success');
                setIsNewModalOpen(false);
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              สร้าง Segment
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">ชื่อ Segment *</label>
            <input
              type="text"
              required
              value={newSegmentName}
              onChange={(e) => setNewSegmentName(e.target.value)}
              placeholder="เช่น ลูกค้า VIP ไม่สั่งซื้อใน 30 วัน"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">ประเภทการคำนวณ</label>
            <select
              value={newSegmentType}
              onChange={(e) => setNewSegmentType(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
            >
              <option value="Dynamic">Dynamic (คำนวณอัตโนมัติทุกคืน/เรียลไทม์)</option>
              <option value="Static">Static (กำหนดรายชื่อคงที่ / นำเข้าไฟล์)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
