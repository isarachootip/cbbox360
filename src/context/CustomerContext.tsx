import React, { createContext, useContext } from 'react';
import type {
  ContactPerson,
  Conversation,
  CreateCustomerInput,
  CreditLimitRequest,
  Customer,
  CustomerAddress,
  CustomerConsentFlags,
  Deal,
  Segment,
  TaskDetails,
  Ticket,
  TimelineEvent,
  UpdateCustomerInput,
} from '../types';
import { useCustomerDirectoryState } from '../hooks/useCustomerDirectoryState';
import { useDealsAndTicketsState } from '../hooks/useDealsAndTicketsState';
import type { CasePatchInput } from '../services/caseApi';
import { useInboxConversationsState } from '../hooks/useInboxConversationsState';
import {
  TaskComposerPayload,
  useConversationTasksAndCreditState,
} from '../hooks/useConversationTasksAndCreditState';

interface CustomerContextType {
  customers: Customer[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  selectedCustomer: Customer;
  deals: Deal[];
  tickets: Ticket[];
  conversations: Conversation[];
  creditRequests: CreditLimitRequest[];
  segments: Segment[];
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (event: TimelineEvent) => void;
  updateDealStage: (dealId: string, newStage: Deal['stage'], lostReason?: string) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'createdDate'>) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'activityLogs'>) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  updateTicketDetails: (ticketId: string, patch: CasePatchInput) => void;
  addTicketLog: (ticketId: string, text: string, author?: string) => void;
  updateConversationStatus: (convId: string, status: Conversation['status']) => void;
  addMessageToConversation: (
    convId: string,
    text: string,
    isPrivate?: boolean
  ) => Promise<{ success: boolean; lineDelivery?: { success: boolean; error?: string } }>;
  toggleBotStatus: (convId: string, isBotActive: boolean) => Promise<void>;
  updateConversationLineUserId: (convId: string, lineUserId: string) => Promise<boolean>;
  retrySendMessage: (convId: string, messageId: string, text: string) => Promise<void>;
  addTaskToConversation: (convId: string, taskData: TaskComposerPayload) => void;
  updateTaskStatus: (convId: string, messageId: string, status: TaskDetails['status']) => void;
  approveCreditLimit: (requestId: string) => void;
  rejectCreditLimit: (requestId: string) => void;
  toggleSegmentWebhook: (segmentId: string) => void;
  updateSegmentRules: (segmentId: string, rules: Segment['rules']) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addCustomer: (customerData: CreateCustomerInput) => Customer;
  updateCustomer: (customerId: string, updates: UpdateCustomerInput) => Customer | undefined;
  updateCustomerConsent: (
    customerId: string,
    patch: Partial<CustomerConsentFlags>,
    extraFields?: { email?: string; nickname?: string }
  ) => Customer | undefined;
  addContact: (customerId: string, contact: Omit<ContactPerson, 'id'>) => void;
  updateContact: (customerId: string, contact: ContactPerson) => void;
  deleteContact: (customerId: string, contactId: string) => void;
  addAddress: (customerId: string, address: Omit<CustomerAddress, 'id'>) => void;
  updateAddress: (customerId: string, address: CustomerAddress) => void;
  deleteAddress: (customerId: string, addressId: string) => void;
  setDefaultAddress: (customerId: string, addressId: string, type: 'billing' | 'shipping') => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dealsAndTickets = useDealsAndTicketsState();
  const inbox = useInboxConversationsState();

  const handleCustomerRenamed = (customerId: string, newName: string) => {
    dealsAndTickets.cascadeCustomerNameToDealsAndTickets(customerId, newName);
    inbox.setConversations((prev) =>
      prev.map((conv) => (conv.customerId === customerId ? { ...conv, customerName: newName } : conv))
    );
    tasksAndCredit.cascadeCustomerNameToCredit(customerId, newName);
  };

  const directory = useCustomerDirectoryState(handleCustomerRenamed);
  const tasksAndCredit = useConversationTasksAndCreditState({
    conversations: inbox.conversations,
    setConversations: inbox.setConversations,
    addTimelineEvent: dealsAndTickets.addTimelineEvent,
    onApproveCustomerCreditLimit: directory.updateCustomerCreditLimit,
  });

  return (
    <CustomerContext.Provider
      value={{
        customers: directory.customers,
        selectedCustomerId: directory.selectedCustomerId,
        setSelectedCustomerId: directory.setSelectedCustomerId,
        selectedCustomer: directory.selectedCustomer,
        deals: dealsAndTickets.deals,
        tickets: dealsAndTickets.tickets,
        conversations: inbox.conversations,
        creditRequests: tasksAndCredit.creditRequests,
        segments: tasksAndCredit.segments,
        timelineEvents: dealsAndTickets.timelineEvents,
        addTimelineEvent: dealsAndTickets.addTimelineEvent,
        updateDealStage: dealsAndTickets.updateDealStage,
        addDeal: dealsAndTickets.addDeal,
        addTicket: dealsAndTickets.addTicket,
        updateTicketStatus: dealsAndTickets.updateTicketStatus,
        updateTicketDetails: dealsAndTickets.updateTicketDetails,
        addTicketLog: dealsAndTickets.addTicketLog,
        updateConversationStatus: inbox.updateConversationStatus,
        addMessageToConversation: inbox.addMessageToConversation,
        toggleBotStatus: inbox.toggleBotStatus,
        updateConversationLineUserId: inbox.updateConversationLineUserId,
        retrySendMessage: inbox.retrySendMessage,
        addTaskToConversation: tasksAndCredit.addTaskToConversation,
        updateTaskStatus: tasksAndCredit.updateTaskStatus,
        approveCreditLimit: tasksAndCredit.approveCreditLimit,
        rejectCreditLimit: tasksAndCredit.rejectCreditLimit,
        toggleSegmentWebhook: tasksAndCredit.toggleSegmentWebhook,
        updateSegmentRules: tasksAndCredit.updateSegmentRules,
        searchQuery: directory.searchQuery,
        setSearchQuery: directory.setSearchQuery,
        addCustomer: directory.addCustomer,
        updateCustomer: directory.updateCustomer,
        updateCustomerConsent: directory.updateCustomerConsent,
        addContact: directory.addContact,
        updateContact: directory.updateContact,
        deleteContact: directory.deleteContact,
        addAddress: directory.addAddress,
        updateAddress: directory.updateAddress,
        deleteAddress: directory.deleteAddress,
        setDefaultAddress: directory.setDefaultAddress,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
