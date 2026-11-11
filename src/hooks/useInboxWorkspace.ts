import React, { useState, useRef } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { useCannedResponses } from '../context/CannedResponseContext';
import { useToast } from '../context/ToastContext';
import { CannedResponse } from '../types';
import { InboxStatusFilter, InboxTabFilter } from '../components/inbox/ConversationListPane';
import { ComposerMode } from '../components/inbox/InboxComposer';
import { TaskComposerDraft } from '../components/inbox/InboxTaskComposerForm';
import { useInboxAutoReply } from './useInboxAutoReply';
import { updateAiUsageLog } from '../services/aiAssistantApi';

const createInitialTaskDraft = (): TaskComposerDraft => ({
  title: '',
  assignee: 'วิภา ส. (Customer Care)',
  dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  priority: 'ด่วน',
  note: '',
});

export function useInboxWorkspace() {
  const { showToast } = useToast();
  const {
    conversations,
    customers,
    updateConversationStatus,
    addMessageToConversation,
    toggleBotStatus,
    updateConversationLineUserId,
    retrySendMessage,
    addTaskToConversation,
    updateTaskStatus,
  } = useCustomer();
  const { cannedResponses, replaceVariables, incrementUsage } = useCannedResponses();

  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [isLineIdModalOpen, setIsLineIdModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>('Open');
  const [tabFilter, setTabFilter] = useState<InboxTabFilter>('Mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [composerMode, setComposerMode] = useState<ComposerMode>('reply');
  const [inputText, setInputText] = useState('');
  const [taskForm, setTaskForm] = useState<TaskComposerDraft>(createInitialTaskDraft);
  const [selectedCannedGroup, setSelectedCannedGroup] = useState<string>('all');
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState<boolean>(false);
  const [slashSearchQuery, setSlashSearchQuery] = useState<string>('');
  const [activeAiSelection, setActiveAiSelection] = useState<{ logId?: string; originalText: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const currentCustomer = customers.find((c) => c.id === selectedConv.customerId) || customers[0];

  const { cancelTimer } = useInboxAutoReply({
    conversations,
    selectedConv,
    currentCustomer,
    cannedResponses,
    addMessageToConversation,
  });

  const filteredConversations = conversations.filter((c) => {
    if (tabFilter === 'Mine' && c.tabGroup !== 'Mine') return false;
    if (tabFilter === 'Unassigned' && c.tabGroup !== 'Unassigned') return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.customerName.toLowerCase().includes(q) || c.lastMessagePreview.toLowerCase().includes(q);
  });

  const activeCanned = cannedResponses.filter((c) => c.isActive);
  const chipCanned = activeCanned.filter((c) => selectedCannedGroup === 'all' || c.category === selectedCannedGroup);
  const slashFiltered = activeCanned.filter((c) => {
    if (!slashSearchQuery) return true;
    const q = slashSearchQuery.toLowerCase();
    return c.shortcut.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    setIsSlashMenuOpen(val.startsWith('/'));
    setSlashSearchQuery(val.startsWith('/') ? val.slice(1).trim() : '');
  };

  const applyCannedResponse = (response: CannedResponse) => {
    const text = replaceVariables(response.content, {
      customer_name: selectedConv.customerName,
      order_code: currentCustomer?.lastOrderCode || 'SO-10482',
      tracking_no: 'TH2609-88412',
      agent_name: selectedConv.assignedTo || 'วิภา ส.',
      phone: currentCustomer?.fullPhone || '081-892-5678',
    });
    setInputText(text);
    setIsSlashMenuOpen(false);
    setSlashSearchQuery('');
    incrementUsage(response.id);
    showToast(`ใช้ข้อความ "${response.shortcut}" เรียบร้อยแล้ว`, 'info');
    textareaRef.current?.focus();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    cancelTimer();
    const textToSend = inputText.trim();
    const isPrivate = composerMode === 'note';

    if (!isPrivate && activeAiSelection?.logId) {
      updateAiUsageLog(activeAiSelection.logId, {
        finalSentText: textToSend,
        wasEdited: textToSend !== activeAiSelection.originalText.trim(),
      });
    }
    setActiveAiSelection(null);
    setInputText('');
    setIsSlashMenuOpen(false);

    const res = await addMessageToConversation(selectedConv.id, textToSend, isPrivate);
    if (isPrivate) showToast('บันทึก Private note สำเร็จ', 'success');
    else if (res?.lineDelivery && !res.lineDelivery.success) {
      showToast(`ส่งเข้า LINE ไม่สำเร็จ: ${res.lineDelivery.error || 'LINE Push Error'}`, 'error');
    } else showToast('ส่งข้อความตอบกลับแล้ว', 'success');
  };

  const handleCreateTaskSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskForm.title.trim()) {
      showToast('กรุณาระบุชื่องานที่ต้องทำ', 'warning');
      return;
    }
    addTaskToConversation(selectedConv.id, {
      title: taskForm.title.trim(),
      assignee: taskForm.assignee,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      note: taskForm.note.trim() || undefined,
    });
    showToast(`สร้าง Task "${taskForm.title.trim()}" สำเร็จ`, 'success');
    setTaskForm(createInitialTaskDraft());
    setComposerMode('reply');
  };

  return {
    conversations,
    selectedConv,
    currentCustomer,
    filteredConversations,
    mobileView,
    setMobileView,
    isCustomerDetailOpen,
    setIsCustomerDetailOpen,
    isLineIdModalOpen,
    setIsLineIdModalOpen,
    statusFilter,
    setStatusFilter,
    tabFilter,
    setTabFilter,
    searchQuery,
    setSearchQuery,
    composerMode,
    setComposerMode,
    inputText,
    setInputText,
    taskForm,
    setTaskForm,
    selectedCannedGroup,
    setSelectedCannedGroup,
    isSlashMenuOpen,
    setIsSlashMenuOpen,
    slashSearchQuery,
    chipCanned,
    slashFiltered,
    textareaRef,
    setSelectedConvId,
    setActiveAiSelection,
    handleInputChange,
    applyCannedResponse,
    handleSendMessage,
    handleCreateTaskSubmit,
    updateConversationStatus,
    toggleBotStatus,
    updateConversationLineUserId,
    retrySendMessage,
    updateTaskStatus,
    showToast,
  };
}
