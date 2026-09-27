import React, { createContext, useContext, useState } from 'react';
import { Customer, Deal, Ticket, Conversation, CreditLimitRequest, Segment, TimelineEvent, TaskDetails } from '../types';
import { mockCustomers } from '../data/customers';
import { mockDeals } from '../data/deals';
import { mockTickets } from '../data/tickets';
import { mockConversations } from '../data/conversations';
import { mockCreditLimitRequests } from '../data/credit';
import { mockSegments } from '../data/segments';
import { mockTimelineEvents } from '../data/timeline';

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
  updateDealStage: (dealId: string, newStage: Deal['stage'], lostReason?: string) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'createdDate'>) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'activityLogs'>) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  addTicketLog: (ticketId: string, text: string, author?: string) => void;
  updateConversationStatus: (convId: string, status: Conversation['status']) => void;
  addMessageToConversation: (convId: string, text: string, isPrivate?: boolean) => void;
  addTaskToConversation: (
    convId: string,
    taskData: {
      title: string;
      assignee: string;
      dueDate: string;
      priority: 'ปกติ' | 'ด่วน' | 'ด่วนที่สุด';
      note?: string;
    }
  ) => void;
  updateTaskStatus: (convId: string, messageId: string, status: TaskDetails['status']) => void;
  approveCreditLimit: (requestId: string) => void;
  rejectCreditLimit: (requestId: string) => void;
  toggleSegmentWebhook: (segmentId: string) => void;
  updateSegmentRules: (segmentId: string, rules: Segment['rules']) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('C00123');
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [creditRequests, setCreditRequests] = useState<CreditLimitRequest[]>(mockCreditLimitRequests);
  const [segments, setSegments] = useState<Segment[]>(mockSegments);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedCustomer = customers.find(c => c.id.toLowerCase() === selectedCustomerId.toLowerCase()) || customers[0];

  const updateDealStage = (dealId: string, newStage: Deal['stage'], lostReason?: string) => {
    setDeals(prev =>
      prev.map(d => {
        if (d.id === dealId) {
          let prob = 10;
          if (newStage === 'Lead') prob = 10;
          else if (newStage === 'Qualified') prob = 25;
          else if (newStage === 'Proposal') prob = 50;
          else if (newStage === 'Negotiation') prob = 75;
          else if (newStage === 'Closed Won') prob = 100;
          else if (newStage === 'Closed Lost') prob = 0;

          return {
            ...d,
            stage: newStage,
            probability: prob,
            lostReason: lostReason || (newStage === 'Closed Lost' ? d.lostReason || 'ราคา' : undefined),
            daysInStage: 0,
          };
        }
        return d;
      })
    );
  };

  const addDeal = (dealData: Omit<Deal, 'id' | 'createdDate'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: `D-${Math.floor(100 + Math.random() * 900)}`,
      createdDate: 'วันนี้',
    };
    setDeals(prev => [newDeal, ...prev]);
  };

  const addTicket = (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'activityLogs'>) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: `TK-${Math.floor(2320 + Math.random() * 100)}`,
      createdAt: 'วันนี้',
      activityLogs: [
        {
          time: 'เพิ่งสร้าง',
          author: 'ระบบ',
          text: `สร้าง Ticket ใหม่: ${ticketData.title}`,
          type: 'system',
        },
      ],
    };
    setTickets(prev => [newTicket, ...prev]);
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status } : t))
    );
  };

  const addTicketLog = (ticketId: string, text: string, author: string = 'วิภา ส.') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            activityLogs: [
              ...t.activityLogs,
              {
                time: timeStr,
                author,
                text,
                type: 'agent',
              },
            ],
          };
        }
        return t;
      })
    );
  };

  const updateConversationStatus = (convId: string, status: Conversation['status']) => {
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, status } : c))
    );
  };

  // Live sync with Backend Server (LINE Webhook messages)
  React.useEffect(() => {
    const fetchLiveConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            setConversations(json.data);
          }
        }
      } catch (err) {
        // Fallback to local mock data
      }
    };

    fetchLiveConversations();
    const interval = setInterval(fetchLiveConversations, 2500);
    return () => clearInterval(interval);
  }, []);

  const addMessageToConversation = async (convId: string, text: string, isPrivate: boolean = false) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Optimistic local update
    setConversations(prev =>
      prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessagePreview: isPrivate ? c.lastMessagePreview : text,
            time: timeStr,
            messages: [
              ...c.messages,
              {
                id: `m-${Date.now()}`,
                sender: isPrivate ? 'note' : 'agent',
                authorName: 'วิภา ส.',
                text,
                time: timeStr,
                isPrivateNote: isPrivate,
              },
            ],
          };
        }
        return c;
      })
    );

    // Send to backend API (which also sends real LINE Push message to customer)
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isPrivate, authorName: 'วิภา ส.' }),
      });
    } catch (err) {
      console.error('Failed to send message to backend API', err);
    }
  };

  const addTaskToConversation = async (
    convId: string,
    taskData: {
      title: string;
      assignee: string;
      dueDate: string;
      priority: 'ปกติ' | 'ด่วน' | 'ด่วนที่สุด';
      note?: string;
    }
  ) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const taskId = `TSK-${Date.now().toString().slice(-4)}`;

    const taskDetails: TaskDetails = {
      id: taskId,
      title: taskData.title,
      assignee: taskData.assignee,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: 'Pending',
      createdAt: timeStr,
      note: taskData.note,
    };

    const taskText = `📋 สร้าง Task: ${taskData.title} (มอบหมาย: ${taskData.assignee})`;

    setConversations(prev =>
      prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessagePreview: `[Task] ${taskData.title}`,
            time: timeStr,
            messages: [
              ...c.messages,
              {
                id: `m-${Date.now()}`,
                sender: 'system',
                authorName: 'วิภา ส.',
                text: taskText,
                time: timeStr,
                isPrivateNote: true,
                task: taskDetails,
              },
            ],
          };
        }
        return c;
      })
    );

    // Also add to Timeline for the customer
    const targetConv = conversations.find(c => c.id === convId);
    if (targetConv) {
      const newTimelineEvent: TimelineEvent = {
        id: `tl-task-${Date.now()}`,
        customerId: targetConv.customerId,
        type: 'Task',
        iconCode: 'TS',
        title: `มอบหมาย Task: ${taskData.title}`,
        time: `วันนี้ ${timeStr}`,
        detail: `มอบหมายให้ ${taskData.assignee} · กำหนดเสร็จ ${taskData.dueDate} · ความสำคัญ: ${taskData.priority}${taskData.note ? ` (${taskData.note})` : ''}`,
        meta: [`สถานะ: Pending`, `ผู้สร้าง: วิภา ส.`],
        linkText: 'เปิดใน Inbox',
        linkRoute: '/inbox',
        colorScheme: 'purple',
      };
      setTimelineEvents(prev => [newTimelineEvent, ...prev]);
    }

    // Persist to backend as internal note
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: taskText,
          isPrivate: true,
          authorName: 'วิภา ส.',
        }),
      });
    } catch (err) {
      console.error('Failed to sync task with backend API', err);
    }
  };

  const updateTaskStatus = (convId: string, messageId: string, status: TaskDetails['status']) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            messages: c.messages.map(m => {
              if (m.id === messageId && m.task) {
                return {
                  ...m,
                  task: {
                    ...m.task,
                    status,
                  },
                };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  const approveCreditLimit = (requestId: string) => {
    const req = creditRequests.find(r => r.id === requestId);
    if (!req) return;

    setCreditRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );

    // Update customer credit limit
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === req.customerId) {
          return {
            ...c,
            creditLimit: req.requestedLimit,
          };
        }
        return c;
      })
    );
  };

  const rejectCreditLimit = (requestId: string) => {
    setCreditRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  };

  const toggleSegmentWebhook = (segmentId: string) => {
    setSegments(prev =>
      prev.map(s => (s.id === segmentId ? { ...s, webhookEnabled: !s.webhookEnabled } : s))
    );
  };

  const updateSegmentRules = (segmentId: string, rules: Segment['rules']) => {
    setSegments(prev =>
      prev.map(s => (s.id === segmentId ? { ...s, rules } : s))
    );
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        selectedCustomer,
        deals,
        tickets,
        conversations,
        creditRequests,
        segments,
        timelineEvents,
        updateDealStage,
        addDeal,
        addTicket,
        updateTicketStatus,
        addTicketLog,
        updateConversationStatus,
        addMessageToConversation,
        addTaskToConversation,
        updateTaskStatus,
        approveCreditLimit,
        rejectCreditLimit,
        toggleSegmentWebhook,
        updateSegmentRules,
        searchQuery,
        setSearchQuery,
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
