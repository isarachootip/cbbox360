import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Check,
  Settings,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { TierBadge } from '../components/common/TierBadge';
import { Modal } from '../components/common/Modal';
import { mockTiersInfo, mockTierChanges } from '../data/tiers';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';

export const TierLoyaltyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setSelectedCustomerId } = useCustomer();

  const [notifyLine, setNotifyLine] = useState(true);
  const [sendWebhook, setSendWebhook] = useState(true);
  const [isEditRulesModalOpen, setIsEditRulesModalOpen] = useState(false);

  const handleOpenCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    navigate(`/customers/${custId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app select-none">
      {/* Top Header */}
      <PageHeader
        title="Tier & Loyalty"
        subtitle="วัดจากยอดสุทธิ 12 เดือนย้อนหลัง หรือจำนวน Order · ข้อมูล ณ 26 ก.ย. 2026"
        actionButton={
          <button
            onClick={() => setIsEditRulesModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border bg-white hover:bg-bg-subtle text-text-primary rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-text-secondary" />
            <span>แก้ไขเกณฑ์ Tier</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* ================= 4 TIER CARDS ================= */}
        <div className="grid grid-cols-4 gap-4">
          {mockTiersInfo.map((t) => {
            const borderColors = {
              MEMBER: 'border-t-[#9AA3AD]',
              SILVER: 'border-t-[#8C959F]',
              GOLD: 'border-t-[#C9962E]',
              PLATINUM: 'border-t-[#6A5CB8]',
            }[t.tier];

            return (
              <div
                key={t.tier}
                className={`bg-white rounded-card border border-border p-4 shadow-card flex flex-col justify-between border-t-[4px] ${borderColors}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <TierBadge tier={t.tier} size="md" />
                    <span className="text-xs font-bold text-text-secondary font-mono">
                      {t.sharePercent}%
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <span className="text-2xl font-extrabold font-mono text-text-primary">
                      {t.memberCount.toLocaleString()}{' '}
                    </span>
                    <span className="text-xs font-medium text-text-secondary">คน</span>
                  </div>

                  <div className="mt-2 text-xs text-text-secondary font-medium pb-3 border-b border-divider">
                    {t.spendingRule}
                  </div>
                </div>

                <div className="pt-3 space-y-1.5 text-xs">
                  <div>
                    <span className="text-text-secondary">การตลาด: </span>
                    <span className="text-text-primary font-medium">{t.marketingBenefits}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">บริการ: </span>
                    <span className="text-text-primary font-medium">{t.serviceBenefits}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= KPI ROW (3 TILES) ================= */}
        <div className="grid grid-cols-3 gap-4">
          {/* ขึ้น Tier เดือนนี้ */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary font-medium">
                ขึ้น Tier เดือนนี้
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-600 mt-1 flex items-baseline gap-1">
                <TrendingUp className="w-5 h-5" />
                <span>312</span>
              </div>
            </div>
          </div>

          {/* ลง Tier เดือนนี้ */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary font-medium">
                ลง Tier เดือนนี้
              </div>
              <div className="text-2xl font-extrabold font-mono text-rose-600 mt-1 flex items-baseline gap-1">
                <TrendingDown className="w-5 h-5" />
                <span>87</span>
              </div>
            </div>
          </div>

          {/* จะลง Tier ใน 30 วัน */}
          <div className="bg-warn-bg border border-warn-border rounded-card p-4 shadow-card flex items-center justify-between text-warn-text">
            <div>
              <div className="text-xs font-semibold text-[#6E4400]">
                จะลง Tier ใน 30 วัน
              </div>
              <div className="text-2xl font-extrabold font-mono text-warn-text mt-1">
                146
              </div>
            </div>
            <button
              onClick={() => navigate('/segments')}
              className="px-3 py-1.5 bg-white border border-warn-border rounded-lg text-xs font-bold text-warn-text hover:bg-amber-50/80 transition-all flex items-center gap-1 shadow-xs"
            >
              <span>Win-back</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= LOWER TWO COLUMNS ================= */}
        <div className="grid grid-cols-[1fr_380px] gap-4">
          
          {/* Left Table: การเปลี่ยน Tier ล่าสุด */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-text-primary">
                การเปลี่ยน Tier ล่าสุด
              </span>
              <button
                onClick={() => showToast('แสดงประวัติการเปลี่ยน Tier ย้อนหลัง 90 วัน', 'info')}
                className="text-xs text-brand hover:text-brand-hover font-semibold"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-muted text-text-secondary border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">ลูกค้า</th>
                    <th className="px-3.5 py-2.5 font-medium">เปลี่ยนจาก → เป็น</th>
                    <th className="px-3.5 py-2.5 font-medium">เหตุผล</th>
                    <th className="px-3.5 py-2.5 font-medium text-right">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {mockTierChanges.map((tc) => (
                    <tr
                      key={tc.id}
                      onClick={() => handleOpenCustomer(tc.customerId)}
                      className="hover:bg-bg-subtle cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-semibold text-text-primary hover:text-brand">
                        {tc.customerName}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <TierBadge tier={tc.fromTier} size="sm" />
                          <span
                            className={`font-bold ${
                              tc.direction === 'up' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tc.direction === 'up' ? '↑' : '↓'}
                          </span>
                          <TierBadge tier={tc.toTier} size="sm" />
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-text-secondary">
                        {tc.reason}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-text-secondary">
                        {tc.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: กฎการขึ้น-ลงระดับ */}
          <div className="bg-white rounded-card border border-border p-4 shadow-card flex flex-col justify-between space-y-3.5">
            <div>
              <div className="font-bold text-xs text-text-primary pb-2 border-b border-divider">
                กฎการขึ้น-ลงระดับ
              </div>

              <div className="mt-3 space-y-3 text-xs text-text-secondary">
                <div>
                  <span className="font-semibold text-text-primary block">ช่วงเวลาที่วัด</span>
                  <p className="mt-0.5">ยอดสุทธิ 12 เดือนย้อนหลัง (หักคืนสินค้าและยกเลิก)</p>
                </div>

                <div>
                  <span className="font-semibold text-text-primary block">ขึ้น-ดับ</span>
                  <p className="mt-0.5">ทันทีเมื่อถึงเกณฑ์ · อายุ Tier 12 เดือน</p>
                </div>

                <div>
                  <span className="font-semibold text-text-primary block">ลง-ระดับ</span>
                  <p className="mt-0.5">ครั้งละไม่เกิน 1 ขั้น · แจ้งล่วงหน้า 30 วัน</p>
                </div>

                <div>
                  <span className="font-semibold text-text-primary block">ขายเงินเชื่อ</span>
                  <p className="mt-0.5">นับตามยอด Invoice · Credit Grade C–D ไม่ขึ้น Tier</p>
                </div>

                <div>
                  <span className="font-semibold text-text-primary block">Manual override</span>
                  <p className="mt-0.5">ต้องมีผู้อนุมัติ + วันหมดอายุ + เหตุผลใน Log</p>
                </div>

                <div>
                  <span className="font-semibold text-text-primary block">VIP flag</span>
                  <p className="mt-0.5">แยกจาก Tier ใช้กับบุคคลสำคัญ</p>
                </div>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-3 border-t border-divider space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyLine}
                  onChange={(e) => setNotifyLine(e.target.checked)}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-text-primary font-medium">
                  แจ้งลูกค้าทาง LINE เมื่อ Tier เปลี่ยน
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWebhook}
                  onChange={(e) => setSendWebhook(e.target.checked)}
                  className="rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-text-primary font-medium">
                  ส่ง Webhook <code>tier.changed</code> ให้ทุก Activity Module
                </span>
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* Modal: แก้ไขเกณฑ์ Tier */}
      <Modal
        isOpen={isEditRulesModalOpen}
        onClose={() => setIsEditRulesModalOpen(false)}
        title="กำหนดเกณฑ์ยอดใช้จ่ายและสิทธิประโยชน์ตาม Tier"
        footer={
          <>
            <button
              onClick={() => setIsEditRulesModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                showToast('บันทึกการตั้งค่าเกณฑ์ Tier เรียบร้อยแล้ว', 'success');
                setIsEditRulesModalOpen(false);
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              บันทึกการแก้ไข
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary">
            การเปลี่ยนแปลงเกณฑ์จะมีผลต่อการคำนวณรอบถัดไปเวลา 02:00 น.
          </p>
          <div className="space-y-2">
            <div className="p-2.5 bg-bg-subtle rounded border border-border flex items-center justify-between">
              <span className="font-bold">Platinum เกณฑ์ยอดสุทธิ</span>
              <input type="text" defaultValue="฿150,000" className="w-28 px-2 py-1 border rounded text-right font-mono" />
            </div>
            <div className="p-2.5 bg-bg-subtle rounded border border-border flex items-center justify-between">
              <span className="font-bold">Gold เกณฑ์ยอดสุทธิ</span>
              <input type="text" defaultValue="฿60,000" className="w-28 px-2 py-1 border rounded text-right font-mono" />
            </div>
            <div className="p-2.5 bg-bg-subtle rounded border border-border flex items-center justify-between">
              <span className="font-bold">Silver เกณฑ์ยอดสุทธิ</span>
              <input type="text" defaultValue="฿20,000" className="w-28 px-2 py-1 border rounded text-right font-mono" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
