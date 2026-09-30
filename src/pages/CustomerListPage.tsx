import React, { useState, useMemo } from 'react';
import { Plus, Users, Award, DollarSign } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { CustomerFilters } from '../components/customer-list/CustomerFilters';
import { CustomerTable } from '../components/customer-list/CustomerTable';
import { NewCustomerModal } from '../components/customer-list/NewCustomerModal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { Customer, TierType, CreditGrade } from '../types';

export const CustomerListPage: React.FC = () => {
  const { customers, setSelectedCustomerId, addCustomer } = useCustomer();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());

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

  // Summary Metrics
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
      {/* Top Header */}
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13px]">
            <span>CDP</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[14px]">
              รายการลูกค้าทั้งหมด
            </span>
          </div>
        }
        actionButton={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ลูกค้าใหม่</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 space-y-4 max-w-[1600px] w-full mx-auto">
        {/* KPI Mini-Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-border rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-text-secondary font-medium">ลูกค้าในระบบทั้งหมด</div>
              <div className="text-lg font-bold text-text-primary">{customers.length} <span className="text-xs font-normal text-slate-500">ราย</span></div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-text-secondary font-medium">กลุ่ม VIP (Platinum & Gold)</div>
              <div className="text-lg font-bold text-text-primary">{vipCount} <span className="text-xs font-normal text-slate-500">ราย</span></div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-3 sm:p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-text-secondary font-medium">ยอด LTV สะสมรวม</div>
              <div className="text-lg font-bold text-text-primary">฿{(totalLTV / 1000000).toFixed(2)}M</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <CustomerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          selectedGrade={selectedGrade}
          onGradeChange={setSelectedGrade}
          totalCount={customers.length}
          filteredCount={filteredCustomers.length}
          onReset={handleResetFilters}
        />

        {/* Customer Data Table */}
        <CustomerTable
          customers={filteredCustomers}
          onSelectCustomer={(c: Customer) => setSelectedCustomerId(c.id)}
        />
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </div>
  );
};
export default CustomerListPage;
