import React, { useState, useMemo } from 'react';
import { Plus, Users, Award, DollarSign } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { CustomerFilters } from '../components/customer-list/CustomerFilters';
import { CustomerTable } from '../components/customer-list/CustomerTable';
import { NewCustomerModal } from '../components/customer-list/NewCustomerModal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { TierType, CreditGrade } from '../types';

export const CustomerListPage: React.FC = () => {
  const { customers, setSelectedCustomerId, addCustomer } = useCustomer();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(q);

      const matchesTier = selectedTier === 'all' || c.tier === selectedTier;
      const matchesGrade = selectedGrade === 'all' || c.creditGrade === selectedGrade;

      return matchesSearch && matchesTier && matchesGrade;
    });
  }, [customers, searchQuery, selectedTier, selectedGrade]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTier('all');
    setSelectedGrade('all');
  };

  const handleCreateCustomer = (data: {
    name: string;
    phone: string;
    email: string;
    tier: TierType;
    creditGrade: CreditGrade;
    creditLimit?: number;
  }) => {
    const created = addCustomer(data);
    showToast(`เพิ่มลูกค้า "${created.name}" เรียบร้อยแล้ว (${created.id})`, 'success');
    return created;
  };

  const totalLTV = useMemo(
    () => customers.reduce((sum, c) => sum + c.lifetimeValue, 0),
    [customers]
  );
  const vipCount = useMemo(
    () => customers.filter((c) => c.tier === 'PLATINUM' || c.tier === 'GOLD').length,
    [customers]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13.5px]">
            <span>CDP</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[15px]">
              รายการลูกค้าทั้งหมด
            </span>
          </div>
        }
        actionButton={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ลูกค้าใหม่</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 max-w-[1640px] w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-tint text-brand flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-secondary font-medium">ลูกค้าในระบบทั้งหมด</div>
              <div className="text-xl font-bold font-mono tabular-nums text-text-primary">
                {customers.length} <span className="text-xs font-sans font-normal text-slate-500">ราย</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-secondary font-medium">กลุ่ม VIP (Gold / Platinum)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-text-primary">
                {vipCount} <span className="text-xs font-sans font-normal text-slate-500">ราย</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-card p-4 shadow-card flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-secondary font-medium">มูลค่าซื้อสะสมรวม (Total LTV)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-text-primary">
                ฿{(totalLTV / 1_000_000).toFixed(2)}M
              </div>
            </div>
          </div>
        </div>

        <CustomerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          selectedGrade={selectedGrade}
          onGradeChange={setSelectedGrade}
          onReset={handleResetFilters}
          filteredCount={filteredCustomers.length}
          totalCount={customers.length}
        />

        <CustomerTable
          customers={filteredCustomers}
          onSelectCustomer={(customer) => setSelectedCustomerId(customer.id)}
        />
      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </div>
  );
};
