import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { CustomerFilters } from '../components/customer-list/CustomerFilters';
import { CustomerTable } from '../components/customer-list/CustomerTable';
import { CustomerKpiRow } from '../components/customer-list/CustomerKpiRow';
import { NewCustomerModal } from '../components/customer-list/NewCustomerModal';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { CreateCustomerInput } from '../types';
import { matchesCustomerSearch } from '../domain/customer/customerSearch';
import { useLabel } from '../../core/client/hooks/useLabel';
import { useEntitlement } from '../../core/client/hooks/useEntitlement';
import { useContactListCustomFields } from '../../core/client/hooks/useContactListCustomFields';

export const CustomerListPage: React.FC = () => {
  const { customers, tickets, setSelectedCustomerId, addCustomer } = useCustomer();
  const { showToast } = useToast();
  const { t, contactLabel, contactPluralLabel, caseLabel } = useLabel();
  const { isEntitled } = useEntitlement();
  const isCommercialB2B = isEntitled('module:credit-sales');

  const customerIds = useMemo(() => customers.map((c) => c.id), [customers]);
  const cfBatch = useContactListCustomFields(customerIds);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const listFieldDefs = useMemo(
    () => cfBatch.definitions.filter((d) => d.ui?.showInList !== false).slice(0, 5),
    [cfBatch.definitions]
  );

  const primaryUniqueDef = useMemo(
    () => cfBatch.definitions.find((d) => d.validation?.unique),
    [cfBatch.definitions]
  );
  const dynamicSelectDef = useMemo(
    () => cfBatch.definitions.find((d) => d.type === 'select'),
    [cfBatch.definitions]
  );

  const matchesCustomFieldQuery = (customerId: string, q: string): boolean => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return true;
    const vals = cfBatch.records[customerId]?.values;
    if (!vals) return false;
    return Object.values(vals).some((v) =>
      Array.isArray(v)
        ? v.some((item) => String(item).toLowerCase().includes(trimmed))
        : String(v ?? '').toLowerCase().includes(trimmed)
    );
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        matchesCustomerSearch(c, searchQuery) || matchesCustomFieldQuery(c.id, searchQuery);
      const matchesTier = selectedTier === 'all' || c.tier === selectedTier;
      const matchesSecondary =
        selectedSecondaryFilter === 'all'
          ? true
          : isCommercialB2B
            ? c.creditGrade === selectedSecondaryFilter
            : dynamicSelectDef
              ? String(cfBatch.records[c.id]?.values?.[dynamicSelectDef.key] || '') ===
                selectedSecondaryFilter
              : true;

      return matchesSearch && matchesTier && matchesSecondary;
    });
  }, [
    customers,
    searchQuery,
    selectedTier,
    selectedSecondaryFilter,
    isCommercialB2B,
    dynamicSelectDef,
    cfBatch.records,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTier('all');
    setSelectedSecondaryFilter('all');
  };

  const handleCreateCustomer = (data: CreateCustomerInput) => {
    const created = addCustomer(data);
    handleResetFilters();
    showToast(`บันทึกข้อมูล${contactLabel} "${created.name}" เรียบร้อยแล้ว (${created.id})`, 'success');
    return created;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13.5px]">
            <span>CDP</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[15px]">{contactPluralLabel}</span>
          </div>
        }
        actionButton={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('contact.create_button', `${contactLabel}ใหม่`)}</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 max-w-[1640px] w-full mx-auto">
        <CustomerKpiRow
          customers={customers}
          tickets={tickets}
          contactLabel={contactLabel}
          caseLabel={caseLabel}
          isCommercialB2B={isCommercialB2B}
          definitions={cfBatch.definitions}
          records={cfBatch.records}
        />

        <CustomerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          selectedSecondaryFilter={selectedSecondaryFilter}
          onSecondaryFilterChange={setSelectedSecondaryFilter}
          contactLabel={contactLabel}
          isCommercialB2B={isCommercialB2B}
          primaryUniqueLabel={primaryUniqueDef?.label}
          dynamicSelectField={dynamicSelectDef}
          totalCount={customers.length}
          filteredCount={filteredCustomers.length}
          onReset={handleResetFilters}
        />

        <CustomerTable
          customers={filteredCustomers}
          contactLabel={contactLabel}
          isCommercialB2B={isCommercialB2B}
          listFieldDefs={listFieldDefs}
          customFieldRecords={cfBatch.records}
          onSelectCustomer={(c) => setSelectedCustomerId(c.id)}
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
