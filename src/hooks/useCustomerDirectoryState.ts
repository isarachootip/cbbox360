import { useEffect, useRef, useState } from 'react';
import type {
  ContactPerson,
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  CustomerConsentFlags,
  UpdateCustomerInput,
} from '../types';
import { applyCustomerUpdate, buildNewCustomerRecord } from '../domain/customer/customerMutations';
import { computeNextCustomerId } from '../domain/customer/customerValidation';
import {
  CUSTOMERS_STORAGE_KEY,
  loadStoredCustomers,
  mergeRemoteCustomers,
  saveStoredCustomers,
} from '../domain/customer/customerStorage';
import {
  appendAddressToCustomer,
  appendContactToCustomer,
  EMPTY_TENANT_CONTACT,
  markDefaultAddressInCustomer,
  replaceAddressInCustomer,
  replaceContactInCustomer,
} from '../domain/customer/customerSubEntityOps';
import { mockCustomers } from '../data/customers';
import { isServerAuth } from '../config/authMode';
import { customerApi } from '../services/customerApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTenantRuntime } from '../../core/client/providers/TenantRuntimeContext';

const getBrowserStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);
const storageKeyForTenant = (tenantId: string) =>
  tenantId === 'default' ? CUSTOMERS_STORAGE_KEY : `${CUSTOMERS_STORAGE_KEY}__${tenantId}`;

export const useCustomerDirectoryState = (
  onCustomerRenamed?: (customerId: string, newName: string) => void
) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { tenantId, isLoaded } = useTenantRuntime();
  const isDefaultTenant = tenantId === 'default';

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStoredCustomers(getBrowserStorage(), mockCustomers, storageKeyForTenant('default'))
  );
  const customersRef = useRef<Customer[]>(customers);
  customersRef.current = customers;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('C00123');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const commitCustomers = (next: Customer[], tid: string = tenantId) => {
    customersRef.current = next;
    saveStoredCustomers(getBrowserStorage(), next, storageKeyForTenant(tid));
    setCustomers(next);
  };

  useEffect(() => {
    const seeds = isDefaultTenant ? mockCustomers : [];
    const local = loadStoredCustomers(getBrowserStorage(), seeds, storageKeyForTenant(tenantId));
    customersRef.current = local;
    setCustomers(local);
    if (local[0] && !local.some((c) => c.id.toLowerCase() === selectedCustomerId.toLowerCase())) {
      setSelectedCustomerId(local[0].id);
    }

    if (!isServerAuth || !currentUser) return;
    let cancelled = false;
    customerApi.list().then((res) => {
      if (cancelled || res.status !== 'ok') return;
      const merged = isDefaultTenant
        ? mergeRemoteCustomers(local, res.customers, mockCustomers)
        : res.customers;
      commitCustomers(merged, tenantId);
      if (merged[0] && !merged.some((c) => c.id.toLowerCase() === selectedCustomerId.toLowerCase())) {
        setSelectedCustomerId(merged[0].id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, tenantId, isLoaded]);

  const syncToServer = (mode: 'create' | 'update', record: Customer) => {
    if (!isServerAuth) return;
    const action = mode === 'create' ? customerApi.create(record) : customerApi.update(record);
    void action.then((res) => {
      if (res.status === 'error') {
        showToast('บันทึกในเบราว์เซอร์แล้ว แต่ซิงก์ฐานข้อมูลเซิร์ฟเวอร์ไม่สำเร็จ', 'error');
      }
    });
  };

  const mutateSingleCustomer = (
    customerId: string,
    transform: (target: Customer) => Customer
  ): Customer | undefined => {
    const target = customersRef.current.find((c) => c.id === customerId);
    if (!target) return undefined;
    const updated = transform(target);
    commitCustomers(customersRef.current.map((c) => (c.id === customerId ? updated : c)));
    syncToServer('update', updated);
    return updated;
  };

  const addCustomer = (customerData: CreateCustomerInput): Customer => {
    const newId = computeNextCustomerId(customersRef.current);
    const newCustomer = buildNewCustomerRecord(newId, customerData);
    commitCustomers([newCustomer, ...customersRef.current]);
    syncToServer('create', newCustomer);
    return newCustomer;
  };

  const updateCustomer = (
    customerId: string,
    updates: UpdateCustomerInput
  ): Customer | undefined => {
    const target = customersRef.current.find((c) => c.id === customerId);
    if (!target) return undefined;
    const updated = applyCustomerUpdate(target, updates);
    commitCustomers(customersRef.current.map((c) => (c.id === customerId ? updated : c)));
    syncToServer('update', updated);
    if (updated.name !== target.name && onCustomerRenamed) {
      onCustomerRenamed(customerId, updated.name);
    }
    return updated;
  };

  const selectedCustomer =
    customers.find((c) => c.id.toLowerCase() === selectedCustomerId.toLowerCase()) ||
    customers[0] ||
    EMPTY_TENANT_CONTACT;

  return {
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer,
    searchQuery,
    setSearchQuery,
    addCustomer,
    updateCustomer,
    updateCustomerConsent: (
      customerId: string,
      patch: Partial<CustomerConsentFlags>,
      extra?: { email?: string; nickname?: string }
    ) =>
      mutateSingleCustomer(customerId, (c) => ({
        ...c,
        ...(extra?.email !== undefined ? { email: extra.email } : {}),
        ...(extra && 'nickname' in extra ? { nickname: extra.nickname } : {}),
        consent: { ...c.consent, ...patch },
      })),
    updateCustomerCreditLimit: (customerId: string, nextLimit: number) =>
      mutateSingleCustomer(customerId, (c) => ({ ...c, creditLimit: nextLimit })),
    addContact: (cid: string, d: Omit<ContactPerson, 'id'>) =>
      mutateSingleCustomer(cid, (c) => appendContactToCustomer(c, d)),
    updateContact: (cid: string, u: ContactPerson) =>
      mutateSingleCustomer(cid, (c) => replaceContactInCustomer(c, u)),
    deleteContact: (cid: string, contactId: string) =>
      mutateSingleCustomer(cid, (c) => ({ ...c, contacts: (c.contacts || []).filter((x) => x.id !== contactId) })),
    addAddress: (cid: string, d: Omit<CustomerAddress, 'id'>) =>
      mutateSingleCustomer(cid, (c) => appendAddressToCustomer(c, d)),
    updateAddress: (cid: string, u: CustomerAddress) =>
      mutateSingleCustomer(cid, (c) => replaceAddressInCustomer(c, u)),
    deleteAddress: (cid: string, addressId: string) =>
      mutateSingleCustomer(cid, (c) => ({ ...c, addresses: (c.addresses || []).filter((x) => x.id !== addressId) })),
    setDefaultAddress: (cid: string, addressId: string, type: 'billing' | 'shipping') =>
      mutateSingleCustomer(cid, (c) => markDefaultAddressInCustomer(c, addressId, type)),
  };
};
