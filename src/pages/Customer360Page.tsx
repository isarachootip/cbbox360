import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ArrowRight,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Headphones,
  CreditCard,
  Layers,
  Building2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { TierBadge } from '../components/common/TierBadge';
import { GradeBadge } from '../components/common/GradeBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { TimelineEventType, TierType, CreditGrade } from '../types';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    customers,
    selectedCustomer,
    setSelectedCustomerId,
    timelineEvents,
    deals,
    tickets,
    creditRequests,
    addTicket,
  } = useCustomer();

  // Active tab in middle column
  const [activeTab, setActiveTab] = useState<'Timeline' | 'Orders' | 'Service' | 'Credit' | 'Segments'>('Timeline');
  // Timeline filter
  const [timelineFilter, setTimelineFilter] = useState<string>('ทั้งหมด');
  // Modal for new customer
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'MEMBER' as TierType,
    creditGrade: 'B' as CreditGrade,
  });

  // Modal for creating Credit Task
  const [isCreditTaskModalOpen, setIsCreditTaskModalOpen] = useState(false);

  // Search filter
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Sync route customer
  const customer = customers.find(c => c.id.toLowerCase() === (id || 'c00123').toLowerCase()) || selectedCustomer;

  // Filtered timeline
  const filteredEvents = timelineEvents.filter((evt) => {
    if (timelineFilter === 'ทั้งหมด') return true;
    return evt.type === timelineFilter;
  });

  // Filtered customers for search
  const searchResults = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const handleSelectSearchedCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    navigate(`/customers/${custId}`);
    setCustomerSearch('');
    setIsSearchDropdownOpen(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`เพิ่มลูกค้า "${newCustomerForm.name}" เรียบร้อยแล้ว`, 'success');
    setIsNewCustomerModalOpen(false);
  };

  const handleCreateCreditTask = () => {
    addTicket({
      customerId: customer.id,
      customerName: customer.name,
      customerTier: customer.tier,
      title: `เสนอเพิ่มวงเงินเครดิตเป็น ฿400,000 (${customer.name})`,
      category: 'Credit',
      channel: 'LINE',
      status: 'Open',
      slaHoursLeft: 24,
      slaFormatted: '1 วัน',
      slaStatus: 'normal',
      assignee: 'ประเทือง ว.',
    });
    showToast('สร้าง Task ให้ทีมสินเชื่อเรียบร้อยแล้ว (อัปเดตในโมดูล Service & Case)', 'success');
    setIsCreditTaskModalOpen(false);
  };

  // Find customer's active deal
  const customerDeal = deals.find(
    (d) => d.customerId === customer.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  ) || deals[0];

  // Find customer's active ticket
  const customerTicket = tickets.find(
    (t) => t.customerId === customer.id && t.status !== 'Closed'
  ) || tickets[1];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      {/* Top Header */}
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13px]">
            <span>CDP</span>
            <span>/</span>
            <span>ลูกค้า</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[14px]">
              {customer.name}
            </span>
          </div>
        }
        centerControls={
          <div className="relative w-full max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="ค้นหา ชื่อ · เบอร์ · LINE UID · Customer ID"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>

            {/* Live Search Dropdown */}
            {isSearchDropdownOpen && customerSearch.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectSearchedCustomer(c.id)}
                      className="px-3 py-2.5 hover:bg-bg-subtle cursor-pointer flex items-center justify-between text-xs border-b border-divider last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-tint text-brand-deep font-bold flex items-center justify-center text-[11px]">
                          {c.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{c.name}</div>
                          <div className="text-[11px] text-text-secondary font-mono">{c.id} · {c.phone}</div>
                        </div>
                      </div>
                      <TierBadge tier={c.tier} size="sm" />
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-text-secondary text-center">ไม่พบข้อมูลลูกค้า</div>
                )}
              </div>
            )}
          </div>
        }
        actionButton={
          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ ลูกค้าใหม่</span>
          </button>
        }
      />

      {/* Main 3-Column Responsive Layout */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[330px_1fr_320px] gap-4 max-w-[1600px] mx-auto">
          
          {/* ================= LEFT COLUMN: PROFILE CARD ================= */}
          <div className="bg-white rounded-card border border-border p-5 flex flex-col gap-4 shadow-card">
            {/* Top Identity */}
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-full bg-brand-tint text-brand-deep font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                {customer.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-bold text-text-primary leading-snug truncate">
                  {customer.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-xs font-semibold text-brand-deep bg-brand-tint/60 px-1.5 py-0.5 rounded">
                    {customer.id}
                  </span>
                  <TierBadge tier={customer.tier} size="sm" />
                  <GradeBadge grade={customer.creditGrade} size="sm" />
                </div>
              </div>
            </div>

            {/* Segment Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {customer.segments.map((seg, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-bg-app text-sidebar-text border border-border"
                >
                  {seg}
                </span>
              ))}
            </div>

            {/* 2x2 Stat Tiles */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-bg-subtle rounded-lg p-2.5 border border-border/80">
                <div className="text-[11px] text-text-secondary font-medium">Lifetime Value</div>
                <div className="text-[15px] font-bold font-mono text-text-primary mt-0.5">
                  ฿{customer.lifetimeValue.toLocaleString()}
                </div>
              </div>
              <div className="bg-bg-subtle rounded-lg p-2.5 border border-border/80">
                <div className="text-[11px] text-text-secondary font-medium">ยอด 12 เดือน</div>
                <div className="text-[15px] font-bold font-mono text-text-primary mt-0.5">
                  ฿{customer.spend12Months.toLocaleString()}
                </div>
              </div>
              <div className="bg-bg-subtle rounded-lg p-2.5 border border-border/80">
                <div className="text-[11px] text-text-secondary font-medium">Order 12 เดือน</div>
                <div className="text-[15px] font-bold font-mono text-text-primary mt-0.5">
                  {customer.orders12Months}
                </div>
              </div>
              <div className="bg-bg-subtle rounded-lg p-2.5 border border-border/80">
                <div className="text-[11px] text-text-secondary font-medium">ซื้อล่าสุด</div>
                <div className="text-[14px] font-bold text-text-primary mt-0.5">
                  {customer.lastOrderDaysAgo} วันก่อน
                </div>
              </div>
            </div>

            {/* Tier Retention Progress */}
            <div className="p-3 bg-tier-platinum-bg/40 border border-tier-platinum-accent/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">
                  คงระดับ Platinum ถึง {customer.tierValidUntil}
                </span>
                <span className="font-mono font-bold text-brand-deep">
                  {customer.tierProgressPercent}%
                </span>
              </div>
              <ProgressBar
                value={customer.tierProgressPercent}
                max={100}
                color="brand"
                height="sm"
              />
              <div className="text-[11px] text-text-secondary">
                ยอดเกินเกณฑ์คงระดับ (฿{customer.tierTargetSpend.toLocaleString()}) แล้ว
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-divider pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-text-secondary" />
                  <span>มือถือ</span>
                </span>
                <span className="font-mono text-text-primary font-medium">
                  {customer.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-text-secondary" />
                  <span>อีเมล</span>
                </span>
                <span className="text-text-primary font-medium truncate max-w-[170px]">
                  {customer.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">ช่องทาง</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[#0B6B34] font-medium text-[11px]">
                    LINE <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#1146A8] font-medium text-[11px]">
                    Facebook <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                  <span>วันเกิด</span>
                </span>
                <span className="text-text-primary font-medium">{customer.birthday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-secondary" />
                  <span>ลูกค้าตั้งแต่</span>
                </span>
                <span className="text-text-primary font-medium">{customer.customerSince}</span>
              </div>
            </div>

            {/* Consent (PDPA) */}
            <div className="border-t border-divider pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Consent (PDPA)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  การตลาด · LINE <Check className="w-3 h-3 text-emerald-600" />
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  การตลาด · Email <Check className="w-3 h-3 text-emerald-600" />
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  การตลาด · SMS <X className="w-3 h-3 text-rose-500" />
                </span>
              </div>
            </div>
          </div>

          {/* ================= MIDDLE COLUMN: TIMELINE & SUB-VIEWS ================= */}
          <div className="bg-white rounded-card border border-border flex flex-col shadow-card overflow-hidden">
            {/* Tabs Header */}
            <div className="border-b border-border px-5 flex items-center gap-6 bg-white">
              {(['Timeline', 'Orders', 'Service', 'Credit', 'Segments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-[13px] font-semibold transition-all relative ${
                    activeTab === tab
                      ? 'text-brand'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'Timeline' && (
                <div className="space-y-4">
                  {/* Timeline Filter Chips */}
                  <div className="flex items-center gap-2 pb-2">
                    <span className="text-xs text-text-secondary font-medium">กรอง:</span>
                    {['ทั้งหมด', 'Order', 'แชท', 'โทร', 'Ticket', 'Deal'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimelineFilter(filter)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          timelineFilter === filter
                            ? 'bg-brand text-white'
                            : 'bg-bg-subtle text-text-secondary hover:bg-bg-app border border-border'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Vertical Timeline Items */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-divider">
                    {filteredEvents.map((evt) => {
                      const iconBg = {
                        green: 'bg-[#E3F7EA] text-[#0B6B34]',
                        blue: 'bg-[#E6EEFF] text-[#1146A8]',
                        purple: 'bg-[#E9E7F5] text-[#4A3F8C]',
                        teal: 'bg-[#E0F2FE] text-[#0E7490]',
                        amber: 'bg-[#FDF6E9] text-[#7A4F00]',
                      }[evt.colorScheme];

                      return (
                        <div key={evt.id} className="relative group">
                          {/* Circular Badge on line */}
                          <div
                            className={`absolute -left-[31px] top-0.5 w-7 h-7 rounded-full font-bold font-mono text-[11px] flex items-center justify-center border-2 border-white shadow-sm ${iconBg}`}
                          >
                            {evt.iconCode}
                          </div>

                          {/* Event Body */}
                          <div className="bg-bg-muted/60 border border-border/80 rounded-lg p-3.5 hover:border-brand/30 transition-all">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[13px] text-text-primary">
                                {evt.title}
                              </span>
                              <span className="text-xs text-text-secondary font-mono">
                                {evt.time}
                              </span>
                            </div>

                            <p className="text-xs text-text-body2 mt-1.5 leading-relaxed">
                              {evt.detail}
                            </p>

                            {/* Meta & Link */}
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-divider/60 text-xs">
                              <div className="flex items-center gap-2">
                                {evt.meta.map((m, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[11px] text-text-secondary bg-white px-2 py-0.5 rounded border border-border/60"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>

                              <button
                                onClick={() => navigate(evt.linkRoute)}
                                className="text-brand hover:text-brand-hover font-semibold text-xs flex items-center gap-1 transition-colors"
                              >
                                <span>{evt.linkText}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub Tab: Orders */}
              {activeTab === 'Orders' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>ประวัติคำสั่งซื้อทั้งหมด ({customer.orders12Months} รายการใน 12 เดือน)</span>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-bg-muted text-text-secondary border-b border-border">
                        <tr>
                          <th className="px-3 py-2 font-medium">Order ID</th>
                          <th className="px-3 py-2 font-medium">วันที่</th>
                          <th className="px-3 py-2 font-medium">รายการ</th>
                          <th className="px-3 py-2 font-medium">ช่องทาง</th>
                          <th className="px-3 py-2 font-medium text-right">ยอดรวม</th>
                          <th className="px-3 py-2 font-medium text-center">เครดิต</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-divider">
                        <tr className="hover:bg-bg-subtle">
                          <td className="px-3 py-2.5 font-mono font-bold text-brand">SO-10482</td>
                          <td className="px-3 py-2.5 text-text-secondary">14 ก.ย. 2026</td>
                          <td className="px-3 py-2.5 text-text-primary">หมึกพิมพ์แท้ x 6 ชุด</td>
                          <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px]">Sales rep</span></td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">฿8,950</td>
                          <td className="px-3 py-2.5 text-center"><span className="text-emerald-700">30 วัน</span></td>
                        </tr>
                        <tr className="hover:bg-bg-subtle">
                          <td className="px-3 py-2.5 font-mono font-bold text-brand">SO-10398</td>
                          <td className="px-3 py-2.5 text-text-secondary">28 ส.ค. 2026</td>
                          <td className="px-3 py-2.5 text-text-primary">กระดาษการ์ดพิมพ์ A3 x 20 รีม</td>
                          <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px]">LINE</span></td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">฿14,200</td>
                          <td className="px-3 py-2.5 text-center"><span className="text-emerald-700">30 วัน</span></td>
                        </tr>
                        <tr className="hover:bg-bg-subtle">
                          <td className="px-3 py-2.5 font-mono font-bold text-brand">SO-10320</td>
                          <td className="px-3 py-2.5 text-text-secondary">10 ส.ค. 2026</td>
                          <td className="px-3 py-2.5 text-text-primary">หัวพิมพ์สำรอง + บริการล้างหัวพิมพ์</td>
                          <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px]">3CX</span></td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">฿22,500</td>
                          <td className="px-3 py-2.5 text-center"><span className="text-emerald-700">30 วัน</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub Tab: Service */}
              {activeTab === 'Service' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Ticket การบริการและการสนับสนุน</span>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden divide-y divide-divider">
                    {tickets.filter(t => t.customerId === customer.id).map(t => (
                      <div key={t.id} className="p-3 flex items-center justify-between hover:bg-bg-subtle">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand">{t.id}</span>
                            <span className="font-semibold text-text-primary">{t.title}</span>
                          </div>
                          <div className="text-xs text-text-secondary mt-1">
                            {t.category} · ช่องทาง {t.channel} · สร้างเมื่อ {t.createdAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={t.status} />
                          <button
                            onClick={() => navigate('/cases')}
                            className="text-xs text-brand font-medium hover:underline"
                          >
                            เปิดดู
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub Tab: Credit */}
              {activeTab === 'Credit' && (
                <div className="space-y-4">
                  <div className="p-4 bg-bg-subtle rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary text-sm">ข้อมูลวงเงินสินเชื่อและการชำระเงิน</span>
                      <GradeBadge grade={customer.creditGrade} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                      <div>
                        <div className="text-text-secondary">วงเงินอนุมัติ</div>
                        <div className="text-base font-bold font-mono text-text-primary">฿{customer.creditLimit.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-text-secondary">ยอดใช้ไป</div>
                        <div className="text-base font-bold font-mono text-brand">฿{customer.creditUsed.toLocaleString()} (42%)</div>
                      </div>
                      <div>
                        <div className="text-text-secondary">ยอดเกินกำหนด</div>
                        <div className="text-base font-bold font-mono text-emerald-600">฿0 (ปกติ)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub Tab: Segments */}
              {activeTab === 'Segments' && (
                <div className="space-y-3">
                  <div className="text-xs text-text-secondary">กลุ่ม Segment ที่ลูกค้ารายนี้สังกัดอยู่:</div>
                  <div className="grid grid-cols-2 gap-3">
                    {customer.segments.map((seg, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-bg-subtle flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-text-primary">{seg}</div>
                          <div className="text-[11px] text-text-secondary mt-0.5">ประเภท Dynamic CDP</div>
                        </div>
                        <button
                          onClick={() => navigate('/segments')}
                          className="text-xs text-brand font-semibold hover:underline"
                        >
                          เปิดเงื่อนไข
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: RELATED ACTIVITY ================= */}
          <div className="flex flex-col gap-3.5 lg:col-span-2 xl:col-span-1">
            {/* Card 1: Deal เปิดอยู่ */}
            <div className="bg-white rounded-card border border-border p-4 shadow-card">
              <div className="flex items-center justify-between pb-2.5 border-b border-divider">
                <span className="text-xs font-bold text-text-primary">
                  Deal เปิดอยู่ (1)
                </span>
                <button
                  onClick={() => navigate('/pipeline')}
                  className="text-xs text-brand hover:text-brand-hover font-medium flex items-center gap-1"
                >
                  <span>Sales Pipeline</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="pt-3">
                <div className="font-semibold text-xs text-text-primary">
                  {customerDeal.title}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-text-secondary font-medium">
                    {customerDeal.stage} · {customerDeal.probability}%
                  </span>
                  <span className="font-mono font-bold text-text-primary text-[14px]">
                    ฿{customerDeal.value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Ticket เปิดอยู่ */}
            <div className="bg-white rounded-card border border-border p-4 shadow-card">
              <div className="flex items-center justify-between pb-2.5 border-b border-divider">
                <span className="text-xs font-bold text-text-primary">
                  Ticket เปิดอยู่ (1)
                </span>
                <button
                  onClick={() => navigate('/cases')}
                  className="text-xs text-brand hover:text-brand-hover font-medium flex items-center gap-1"
                >
                  <span>Service</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="pt-3">
                <div className="font-semibold text-xs text-text-primary">
                  {customerTicket.id} · {customerTicket.title}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                    {customerTicket.status}
                  </span>
                  <span className="text-warn-text font-medium text-[11px]">
                    SLA เหลือ {customerTicket.slaFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: เครดิต */}
            <div className="bg-white rounded-card border border-border p-4 shadow-card">
              <div className="flex items-center justify-between pb-2.5 border-b border-divider">
                <span className="text-xs font-bold text-text-primary">เครดิต</span>
                <GradeBadge grade={customer.creditGrade} size="sm" />
              </div>

              <div className="pt-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">วงเงิน</span>
                  <span className="font-mono font-bold text-text-primary">
                    ฿{customer.creditLimit.toLocaleString()}
                  </span>
                </div>
                <ProgressBar
                  value={(customer.creditUsed / customer.creditLimit) * 100}
                  max={100}
                  color="brand"
                  height="sm"
                />
                <div className="flex items-center justify-between text-[11px] text-text-secondary">
                  <span>ใช้ไป {Math.round((customer.creditUsed / customer.creditLimit) * 100)}%</span>
                  <span className="text-emerald-700 font-medium">เกินกำหนด ฿{customer.creditOverdue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Next best action (Warn Theme) */}
            <div className="bg-warn-bg border border-warn-border rounded-card p-4 text-warn-text shadow-card space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Next best action</span>
              </div>

              <p className="text-xs text-[#5C3D00] leading-relaxed">
                {customer.nextBestAction.description}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span>Churn risk: <strong className="font-semibold text-emerald-700">{customer.churnRisk}</strong></span>
              </div>

              <button
                onClick={() => setIsCreditTaskModalOpen(true)}
                className="w-full py-2 bg-white hover:bg-amber-50/80 border border-warn-border text-warn-text rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>{customer.nextBestAction.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal: + ลูกค้าใหม่ */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="เพิ่มข้อมูลลูกค้าใหม่ใน CDP"
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setIsNewCustomerModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateCustomer}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              บันทึกข้อมูล
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-text-secondary font-medium mb-1">
              ชื่อ-นามสกุล / ชื่อองค์กร *
            </label>
            <input
              type="text"
              required
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
              placeholder="เช่น บจก. นวัตกรรมสยาม"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">เบอร์โทรศัพท์ *</label>
              <input
                type="text"
                required
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                placeholder="081-xxx-xxxx"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">อีเมล</label>
              <input
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">ระดับสมาชิก (Tier)</label>
              <select
                value={newCustomerForm.tier}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, tier: e.target.value as TierType })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
                <option value="PLATINUM">PLATINUM</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">เกรดสินเชื่อ (Credit Grade)</label>
              <select
                value={newCustomerForm.creditGrade}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditGrade: e.target.value as CreditGrade })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:border-brand bg-white"
              >
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: สร้าง Task ให้ทีมสินเชื่อ */}
      <Modal
        isOpen={isCreditTaskModalOpen}
        onClose={() => setIsCreditTaskModalOpen(false)}
        title="สร้าง Task พิจารณาเพิ่มวงเงินให้ทีมสินเชื่อ"
        footer={
          <>
            <button
              onClick={() => setIsCreditTaskModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCreateCreditTask}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              ยืนยันสร้าง Task
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary">
            ระบบจะส่งคำขอและสร้าง Ticket ในโมดูล Credit Sales & Service เพื่อให้ผู้รับผิดชอบ (ประเทือง ว.) ตรวจสอบประวัติการชำระและปรับวงเงิน
          </p>
          <div className="bg-bg-subtle p-3 rounded-lg border border-border space-y-1.5 font-mono">
            <div>ลูกค้า: <strong>{customer.name}</strong> ({customer.id})</div>
            <div>วงเงินปัจจุบัน: <strong>฿{customer.creditLimit.toLocaleString()}</strong></div>
            <div>วงเงินที่เสนอใหม่: <strong className="text-emerald-700">฿400,000</strong></div>
            <div>ประวัติชำระตรงเวลา: <strong className="text-emerald-700">100%</strong></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
