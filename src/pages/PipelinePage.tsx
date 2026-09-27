import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Kanban,
  AlertTriangle,
  ChevronDown,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiTile } from '../components/common/KpiTile';
import { ChannelChip } from '../components/common/ChannelChip';
import { Modal } from '../components/common/Modal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { Deal, DealStage, ChannelType } from '../types';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { deals, customers, updateDealStage, addDeal, setSelectedCustomerId } = useCustomer();

  // Filters
  const [pipelineType, setPipelineType] = useState('ลูกค้าใหม่');
  const [selectedOwner, setSelectedOwner] = useState('ทั้งหมด');
  const [selectedPeriod, setSelectedPeriod] = useState('ไตรมาสนี้');

  // Modal: + Deal ใหม่
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    customerId: 'C00123',
    customerName: 'สมชาย ใจดี',
    title: '',
    value: '',
    stage: 'Lead' as DealStage,
    ownerName: 'ธนพล ก.',
    ownerInitials: 'ธพ',
    source: 'LINE' as ChannelType,
  });

  // Modal: Closed Lost Reason
  const [isLostReasonModalOpen, setIsLostReasonModalOpen] = useState(false);
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null);
  const [lostReasonInput, setLostReasonInput] = useState('ราคา');

  // Stages configuration
  const stages: { stage: DealStage; label: string; prob: number; color: string }[] = [
    { stage: 'Lead', label: 'Lead', prob: 10, color: '#3B82F6' },
    { stage: 'Qualified', label: 'Qualified', prob: 25, color: '#06B6D4' },
    { stage: 'Proposal', label: 'Proposal', prob: 50, color: '#8B5CF6' },
    { stage: 'Negotiation', label: 'Negotiation', prob: 75, color: '#F59E0B' },
    { stage: 'Closed Won', label: 'Closed Won', prob: 100, color: '#10B981' },
    { stage: 'Closed Lost', label: 'Closed Lost', prob: 0, color: '#EF4444' },
  ];

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (selectedOwner !== 'ทั้งหมด' && d.ownerName !== selectedOwner) return false;
      return true;
    });
  }, [deals, selectedOwner]);

  // Compute KPIs
  const kpis = useMemo(() => {
    const openDeals = filteredDeals.filter(
      (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
    );
    const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
    const forecastValue = openDeals.reduce(
      (sum, d) => sum + (d.value * d.probability) / 100,
      0
    );

    const wonDeals = filteredDeals.filter((d) => d.stage === 'Closed Won');
    const lostDeals = filteredDeals.filter((d) => d.stage === 'Closed Lost');
    const closedCount = wonDeals.length + lostDeals.length;
    const winRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 50;

    const staleDealsCount = openDeals.filter((d) => d.daysInStage > 14).length;

    return {
      totalPipelineValue,
      forecastValue,
      winRate,
      staleDealsCount,
    };
  }, [filteredDeals]);

  const handleStageChange = (dealId: string, targetStage: DealStage) => {
    if (targetStage === 'Closed Lost') {
      setPendingLostDealId(dealId);
      setIsLostReasonModalOpen(true);
    } else {
      updateDealStage(dealId, targetStage);
      showToast(`ย้าย Deal ไปยังขั้นตอน ${targetStage} สำเร็จ`, 'success');
    }
  };

  const handleConfirmLostReason = () => {
    if (pendingLostDealId) {
      updateDealStage(pendingLostDealId, 'Closed Lost', lostReasonInput);
      showToast(`บันทึกสถานะ Closed Lost (เหตุผล: ${lostReasonInput}) เรียบร้อย`, 'warning');
      setIsLostReasonModalOpen(false);
      setPendingLostDealId(null);
    }
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealForm.title || !newDealForm.value) return;

    const matchedCust = customers.find(c => c.id === newDealForm.customerId) || customers[0];

    addDeal({
      customerId: matchedCust.id,
      customerName: matchedCust.name,
      title: newDealForm.title,
      value: parseFloat(newDealForm.value) || 10000,
      stage: newDealForm.stage,
      probability: stages.find((s) => s.stage === newDealForm.stage)?.prob || 10,
      ownerName: newDealForm.ownerName,
      ownerInitials: newDealForm.ownerInitials,
      source: newDealForm.source,
      daysInStage: 0,
    });

    showToast(`สร้าง Deal "${newDealForm.title}" เรียบร้อยแล้ว`, 'success');
    setIsAddDealModalOpen(false);
    setNewDealForm({
      customerId: 'C00123',
      customerName: 'สมชาย ใจดี',
      title: '',
      value: '',
      stage: 'Lead',
      ownerName: 'ธนพล ก.',
      ownerInitials: 'ธพ',
      source: 'LINE',
    });
  };

  const handleOpenCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    navigate(`/customers/${custId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="Sales Pipeline"
        centerControls={
          <div className="flex items-center gap-2.5">
            {/* Filter 1: Pipeline */}
            <select
              value={pipelineType}
              onChange={(e) => setPipelineType(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ลูกค้าใหม่">ลูกค้าใหม่ ▾</option>
              <option value="ลูกค้าเก่า / ต่อสัญญา">ลูกค้าเก่า / ต่อสัญญา ▾</option>
              <option value="โครงการองค์กร">โครงการองค์กร ▾</option>
            </select>

            {/* Filter 2: Owner */}
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ทั้งหมด">Owner: ทั้งหมด ▾</option>
              <option value="ธนพล ก.">Owner: ธนพล ก. (Sales Manager)</option>
              <option value="อนันต์ ศ.">Owner: อนันต์ ศ. (Sales Rep)</option>
              <option value="วิภา ส.">Owner: วิภา ส. (Chat Agent)</option>
            </select>

            {/* Filter 3: Period */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ไตรมาสนี้">ไตรมาสนี้ ▾</option>
              <option value="เดือนนี้">เดือนนี้ ▾</option>
              <option value="ปีนี้">ปีนี้ ▾</option>
            </select>
          </div>
        }
        actionButton={
          <button
            onClick={() => setIsAddDealModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Deal ใหม่</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-5 overflow-hidden gap-4">
        
        {/* KPI Row (4 metrics) */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <KpiTile
            label="มูลค่า Pipeline (เปิดอยู่)"
            value={`฿${kpis.totalPipelineValue.toLocaleString()}`}
            variant="default"
          />
          <KpiTile
            label="Forecast (มูลค่า × Probability)"
            value={`฿${Math.round(kpis.forecastValue).toLocaleString()}`}
            variant="default"
          />
          <KpiTile
            label="Win rate ไตรมาสนี้"
            value={`${kpis.winRate}%`}
            variant="default"
          />
          <KpiTile
            label="Deal นิ่งเกิน 14 วัน"
            value={kpis.staleDealsCount}
            variant={kpis.staleDealsCount > 0 ? 'warning' : 'default'}
            rightElement={
              kpis.staleDealsCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : null
            }
          />
        </div>

        {/* 6-Column Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
          <div className="flex gap-3 h-full min-w-[1240px]">
            {stages.map((stg) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === stg.stage);
              const columnTotalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

              return (
                <div
                  key={stg.stage}
                  className="flex-1 flex flex-col bg-bg-muted/70 rounded-card border border-border h-full overflow-hidden min-w-[200px]"
                >
                  {/* Column Header */}
                  <div
                    className="p-3 bg-white border-b relative"
                    style={{ borderBottomColor: stg.color, borderBottomWidth: '3px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-text-primary">
                        {stg.label}
                      </span>
                      <span className="text-[11px] text-text-secondary font-medium">
                        {stageDeals.length} deals
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-text-secondary font-mono">{stg.prob}%</span>
                      <span className="font-mono font-bold text-text-primary">
                        ฿{columnTotalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Column Cards List */}
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                    {stageDeals.map((deal) => {
                      const isStale = deal.daysInStage > 14;
                      return (
                        <div
                          key={deal.id}
                          className="p-3 bg-white rounded-lg border border-border hover:border-brand/50 hover:shadow-sm transition-all group relative"
                        >
                          {/* Title */}
                          <div className="font-semibold text-xs text-text-primary leading-snug">
                            {deal.title}
                          </div>

                          {/* Customer Name */}
                          <div
                            onClick={() => handleOpenCustomer(deal.customerId)}
                            className="text-[11px] text-text-secondary hover:text-brand cursor-pointer mt-1 truncate"
                          >
                            {deal.customerName}
                          </div>

                          {/* Value */}
                          <div className="mt-2 text-[14px] font-bold font-mono text-text-primary">
                            ฿{deal.value.toLocaleString()}
                          </div>

                          {/* Meta footer */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-divider text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <ChannelChip channel={deal.source} size="sm" />
                            </div>

                            {/* Owner Initials */}
                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                              {deal.ownerInitials}
                            </div>
                          </div>

                          {/* Days in stage / Lost reason */}
                          <div className="mt-1.5 flex items-center justify-between text-[10px]">
                            {deal.stage === 'Closed Lost' ? (
                              <span className="text-rose-600 font-medium">
                                Lost: {deal.lostReason || 'ราคา'}
                              </span>
                            ) : (
                              <span
                                className={`font-mono ${
                                  isStale
                                    ? 'text-amber-600 font-bold'
                                    : 'text-text-secondary'
                                }`}
                              >
                                {deal.daysInStage} วันใน Stage
                              </span>
                            )}

                            {/* Stage Move Dropdown Button */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <select
                                value={deal.stage}
                                onChange={(e) =>
                                  handleStageChange(deal.id, e.target.value as DealStage)
                                }
                                className="text-[10px] bg-bg-subtle border border-border rounded px-1 py-0.5 text-text-primary cursor-pointer focus:outline-none"
                              >
                                {stages.map((s) => (
                                  <option key={s.stage} value={s.stage}>
                                    ย้าย → {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Modal: + Deal ใหม่ */}
      <Modal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        title="สร้าง Deal ใหม่ใน Sales Pipeline"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setIsAddDealModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateDeal}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              สร้าง Deal
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">เลือกลูกค้า (CDP) *</label>
            <select
              value={newDealForm.customerId}
              onChange={(e) => {
                const c = customers.find(x => x.id === e.target.value);
                setNewDealForm({
                  ...newDealForm,
                  customerId: e.target.value,
                  customerName: c ? c.name : 'ลูกค้า',
                });
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id}) · {c.tier}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">ชื่อดีล / รายการสินค้า *</label>
            <input
              type="text"
              required
              value={newDealForm.title}
              onChange={(e) => setNewDealForm({ ...newDealForm, title: e.target.value })}
              placeholder="เช่น สั่งซื้อเครื่องพิมพ์ล็อตใหญ่ 10 เครื่อง"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">มูลค่าดีล (บาท) *</label>
              <input
                type="number"
                required
                value={newDealForm.value}
                onChange={(e) => setNewDealForm({ ...newDealForm, value: e.target.value })}
                placeholder="150000"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand font-mono"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">ขั้นตอนเริ่มต้น</label>
              <select
                value={newDealForm.stage}
                onChange={(e) => setNewDealForm({ ...newDealForm, stage: e.target.value as DealStage })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                {stages.map((s) => (
                  <option key={s.stage} value={s.stage}>
                    {s.label} ({s.prob}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">ช่องทางที่มา (Source)</label>
              <select
                value={newDealForm.source}
                onChange={(e) => setNewDealForm({ ...newDealForm, source: e.target.value as ChannelType })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="LINE">LINE</option>
                <option value="Facebook">Facebook</option>
                <option value="3CX">3CX (Voice)</option>
                <option value="Web form">Web form</option>
                <option value="Sales rep">Sales rep</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">ผู้รับผิดชอบ (Owner)</label>
              <select
                value={newDealForm.ownerName}
                onChange={(e) => {
                  const name = e.target.value;
                  const initials = name === 'ธนพล ก.' ? 'ธพ' : name === 'อนันต์ ศ.' ? 'อศ' : 'วภ';
                  setNewDealForm({ ...newDealForm, ownerName: name, ownerInitials: initials });
                }}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="ธนพล ก.">ธนพล ก. (Sales Manager)</option>
                <option value="อนันต์ ศ.">อนันต์ ศ. (Sales)</option>
                <option value="วิภา ส.">วิภา ส. (Service Agent)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Closed Lost Reason */}
      <Modal
        isOpen={isLostReasonModalOpen}
        onClose={() => setIsLostReasonModalOpen(false)}
        title="ระบุเหตุผลการปิดดีลไม่สำเร็จ (Closed Lost)"
        footer={
          <>
            <button
              onClick={() => setIsLostReasonModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirmLostReason}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              บันทึก Closed Lost
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <label className="block text-text-secondary font-medium">
            โปรดเลือกเหตุผลหลักที่ลูกค้าปฏิเสธหรือไม่สามารถปิดการขายได้:
          </label>
          <select
            value={lostReasonInput}
            onChange={(e) => setLostReasonInput(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white font-medium"
          >
            <option value="ราคา">ราคา (สูงกว่างบประมาณ)</option>
            <option value="ไม่ตอบกลับ">ไม่ตอบกลับ / ติดต่อไม่ได้</option>
            <option value="เลือกคู่แข่ง">เลือกคู่แข่ง</option>
            <option value="เลื่อน/ยกเลิกโครงการ">เลื่อนหรือยกเลิกโครงการ</option>
            <option value="คุณสมบัติไม่ตรงความต้องการ">คุณสมบัติไม่ตรงความต้องการ</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};
