import { useEffect, useRef, useState } from 'react';
import type {
  ContactPerson,
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  CustomerConsentFlags,
  UpdateCustomerInput,
} from '../types';
import {
  applyCustomerUpdate,
  buildNewCustomerRecord,
  normalizeContactInput,
} from '../domain/customer/customerMutations';
import { computeNextCustomerId } from '../domain/customer/customerValidation';
import {
  loadStoredCustomers,
  mergeRemoteCustomers,
  saveStoredCustomers,
} from '../domain/customer/customerStorage';
import { mockCustomers } from '../data/customers';
import { setDefaultAddress as setDefaultAddressHelper } from '../utils/customerHelpers';
import { isServerAuth } from '../config/authMode';
import { customerApi } from '../services/customerApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const getBrowserStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

export const useCustomerDirectoryState = (
  onCustomerRenamed?: (customerId: string, newName: string) => void
) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStoredCustomers(getBrowserStorage(), mockCustomers)
  );
  const customersRef = useRef<Customer[]>(customers);
  customersRef.current = customers;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('C00123');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const commitCustomers = (next: Customer[]) => {
    customersRef.current = next;
    saveStoredCustomers(getBrowserStorage(), next);
    setCustomers(next);
  };

  useEffect(() => {
    if (!isServerAuth || !currentUser) return;
    let cancelled = false;
    customerApi.list().then((res) => {
      if (!cancelled && res.status === 'ok') {
        const merged = mergeRemoteCustomers(customersRef.current, res.customers, mockCustomers);
        commitCustomers(merged);
      }
    });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

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

  const updateCustomerCreditLimit = (customerId: string, nextLimit: number) => {
    mutateSingleCustomer(customerId, (c) => ({ ...c, creditLimit: nextLimit }));
  };

  const updateCustomerConsent = (
    customerId: string,
    patch: Partial<CustomerConsentFlags>,
    extraFields?: { email?: string; nickname?: string }
  ): Customer | undefined =>
    mutateSingleCustomer(customerId, (c) => ({
      ...c,
      ...(extraFields?.email !== undefined ? { email: extraFields.email } : {}),
      ...(extraFields && 'nickname' in extraFields ? { nickname: extraFields.nickname } : {}),
      consent: { ...c.consent, ...patch },
    }));

  const addContact = (customerId: string, contactData: Omit<ContactPerson, 'id'>) => {
    const newContact: ContactPerson = {
      ...normalizeContactInput(contactData),
      id: `cnt-${Date.now()}`,
    };
    mutateSingleCustomer(customerId, (c) => {
      const existing = c.contacts || [];
      const updatedContacts = newContact.isPrimary
        ? existing.map((cnt) => ({ ...cnt, isPrimary: false })).concat(newContact)
        : [...existing, newContact];
      return { ...c, contacts: updatedContacts };
    });
  };

  const updateContact = (customerId: string, updatedContact: ContactPerson) => {
    const normalized: ContactPerson = {
      ...normalizeContactInput(updatedContact),
      id: updatedContact.id,
    };
    mutateSingleCustomer(customerId, (c) => ({
      ...c,
      contacts: (c.contacts || []).map((cnt) => {
        if (cnt.id === normalized.id) return normalized;
        if (normalized.isPrimary && cnt.isPrimary) return { ...cnt, isPrimary: false };
        return cnt;
      }),
    }));
  };

  const deleteContact = (customerId: string, contactId: string) => {
    mutateSingleCustomer(customerId, (c) => ({
      ...c,
      contacts: (c.contacts || []).filter((cnt) => cnt.id !== contactId),
    }));
  };

  const addAddress = (customerId: string, addressData: Omit<CustomerAddress, 'id'>) => {
    const newAddress: CustomerAddress = { ...addressData, id: `addr-${Date.now()}` };
    mutateSingleCustomer(customerId, (c) => {
      let updated = c.addresses || [];
      if (newAddress.isDefaultBilling) updated = updated.map((a) => ({ ...a, isDefaultBilling: false }));
      if (newAddress.isDefaultShipping) updated = updated.map((a) => ({ ...a, isDefaultShipping: false }));
      return { ...c, addresses: [...updated, newAddress] };
    });
  };

  const updateAddress = (customerId: string, updatedAddress: CustomerAddress) => {
    mutateSingleCustomer(customerId, (c) => ({
      ...c,
      addresses: (c.addresses || []).map((a) => {
        if (a.id === updatedAddress.id) return updatedAddress;
        const copy = { ...a };
        if (updatedAddress.isDefaultBilling && copy.isDefaultBilling) copy.isDefaultBilling = false;
        if (updatedAddress.isDefaultShipping && copy.isDefaultShipping) copy.isDefaultShipping = false;
        return copy;
      }),
    }));
  };

  const deleteAddress = (customerId: string, addressId: string) => {
    mutateSingleCustomer(customerId, (c) => ({
      ...c,
      addresses: (c.addresses || []).filter((a) => a.id !== addressId),
    }));
  };

  const setDefaultAddress = (customerId: string, addressId: string, type: 'billing' | 'shipping') => {
    mutateSingleCustomer(customerId, (c) => ({
      ...c,
      addresses: setDefaultAddressHelper(c.addresses || [], addressId, type),
    }));
  };

  const selectedCustomer =
    customers.find((c) => c.id.toLowerCase() === selectedCustomerId.toLowerCase()) || customers[0];

  return {
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomer,
    searchQuery,
    setSearchQuery,
    addCustomer,
    updateCustomer,
    updateCustomerConsent,
    updateCustomerCreditLimit,
    addContact,
    updateContact,
    deleteContact,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
};
