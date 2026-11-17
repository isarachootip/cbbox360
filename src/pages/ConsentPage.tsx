import React, { useState } from 'react';
import { ShieldCheck, Users, FileCheck2, ScrollText, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useCustomer } from '../context/CustomerContext';
import { useConsentManagement } from '../hooks/useConsentManagement';
import { ConsentKpiRow } from '../components/consent/ConsentKpiRow';
import { ConsentRegistryTab } from '../components/consent/ConsentRegistryTab';
import { DsrRequestsTab } from '../components/consent/DsrRequestsTab';
import { PolicyAndAuditTab } from '../components/consent/PolicyAndAuditTab';
import { NewDsrModal } from '../components/consent/NewDsrModal';
import { NewPolicyModal } from '../components/consent/NewPolicyModal';

type ConsentTabKey = 'registry' | 'dsr' | 'policy_audit';

export const ConsentPage: React.FC = () => {
  const { setSelectedCustomerId } = useCustomer();
  const consent = useConsentManagement();

  const [activeTab, setActiveTab] = useState<ConsentTabKey>('registry');
  const [isNewDsrOpen, setIsNewDsrOpen] = useState(false);
  const [isNewPolicyOpen, setIsNewPolicyOpen] = useState(false);

  const tabs: { key: ConsentTabKey; label: string; badge?: number; icon: React.FC<{ className?: string }> }[] = [
    {
      key: 'registry',
      label: 'ทะเบียนความยินยอมลูกค้า',
      badge: consent.customers.length,
      icon: Users,
    },
    {
      key: 'dsr',
      label: 'คำขอใช้สิทธิ์ (DSR Queue)',
      badge: consent.kpis.pendingDsrCount,
      icon: FileCheck2,
    },
    {
      key: 'policy_audit',
      label: 'เวอร์ชันนโยบาย & ประวัติ Audit',
      icon: ScrollText,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-app">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-text-secondary text-[13.5px]">
            <span>CDP</span>
            <span>/</span>
            <span className="font-bold text-text-primary text-[15px] inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Consent & PDPA Governance</span>
            </span>
          </div>
        }
        actionButton={
          <button
            type="button"
            onClick={() => {
              setActiveTab('dsr');
              setIsNewDsrOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold shadow-card transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>รับคำขอใช้สิทธิ์ (DSR)</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 max-w-[1640px] w-full mx-auto">
        <ConsentKpiRow
          kpis={consent.kpis}
          activePolicyVersion={consent.activePolicy?.version || 'v2.1'}
        />

        <div className="border-b border-border bg-white rounded-t-card px-3 pt-2 flex flex-wrap items-center gap-1 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums ${
                      isActive ? 'bg-brand-tint text-brand-deep' : 'bg-bg-muted text-text-muted'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'registry' && (
          <ConsentRegistryTab
            customers={consent.customers}
            onSelectCustomerId={setSelectedCustomerId}
            onToggleConsent={consent.toggleCustomerConsentField}
            onExportCustomerJson={(cust) => consent.exportSingleCustomerData(cust, 'json')}
            onExportFilteredCsv={consent.exportFilteredConsentCsv}
          />
        )}

        {activeTab === 'dsr' && (
          <DsrRequestsTab
            dsrRequests={consent.dsrRequests}
            customers={consent.customers}
            onSelectCustomerId={setSelectedCustomerId}
            onOpenNewModal={() => setIsNewDsrOpen(true)}
            onAdvanceStatus={consent.advanceDsrStatus}
            onExportCustomerCsv={(cust) => consent.exportSingleCustomerData(cust, 'csv')}
          />
        )}

        {activeTab === 'policy_audit' && (
          <PolicyAndAuditTab
            policies={consent.policies}
            logs={consent.logs}
            onOpenNewPolicyModal={() => setIsNewPolicyOpen(true)}
            onExportAuditLogs={consent.exportAuditLogs}
          />
        )}
      </div>

      <NewDsrModal
        isOpen={isNewDsrOpen}
        onClose={() => setIsNewDsrOpen(false)}
        customers={consent.customers}
        onSubmit={consent.createDsrRequest}
      />

      <NewPolicyModal
        isOpen={isNewPolicyOpen}
        onClose={() => setIsNewPolicyOpen(false)}
        suggestedVersion="v2.2"
        onSubmit={consent.publishPolicyVersion}
      />
    </div>
  );
};
