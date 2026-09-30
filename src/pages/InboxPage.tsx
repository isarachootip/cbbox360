import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Send,
  Paperclip,
  CheckCircle,
  Clock,
  UserCheck,
  ChevronDown,
  Lock,
  Tag,
  MessageSquare,
  Sparkles,
  Bot,
  Zap,
  ExternalLink,
  Settings,
  HelpCircle,
  Check,
  CheckSquare,
  User,
  Menu,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useCannedResponses, CATEGORIES_CONFIG } from '../context/CannedResponseContext';
import { useBot } from '../context/BotContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../context/LayoutContext';
import { TierBadge } from '../components/common/TierBadge';
import { CustomerSideCard } from '../components/common/CustomerSideCard';
import { BotStatusToggle } from '../components/inbox/BotStatusToggle';
import { ChatMessageItem } from '../components/inbox/ChatMessageItem';
import { CannedResponse, CannedResponseCategory } from '../types';

export const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { settings: botSettings } = useBot();
  const {
    conversations,
    customers,
    updateConversationStatus,
    addMessageToConversation,
    toggleBotStatus,
    retrySendMessage,
    addTaskToConversation,
    updateTaskStatus,
  } = useCustomer();

  const {
    cannedResponses,
    replaceVariables,
    incrementUsage,
  } = useCannedResponses();

  const { toggleMobileSidebar } = useLayout();

  // State
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Open' | 'Pending' | 'Snoozed' | 'Resolved'>('Open');
  const [tabFilter, setTabFilter] = useState<'Mine' | 'Unassigned' | 'All'>('Mine');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Composer state
  const [composerMode, setComposerMode] = useState<'reply' | 'note' | 'task'>('reply');
  const [inputText, setInputText] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    assignee: 'วิภา ส. (Customer Care)',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'ด่วน' as 'ปกติ' | 'ด่วน' | 'ด่วนที่สุด',
    note: '',
  });
  const [selectedCannedGroup, setSelectedCannedGroup] = useState<string>('all');
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState<boolean>(false);
  const [slashSearchQuery, setSlashSearchQuery] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Selected conversation
  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  // Selected customer data from CDP
  const currentCustomer = customers.find((c) => c.id === selectedConv.customerId) || customers[0];

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (tabFilter === 'Mine' && c.tabGroup !== 'Mine') return false;
    if (tabFilter === 'Unassigned' && c.tabGroup !== 'Unassigned') return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter active canned responses
  const activeCannedResponses = cannedResponses.filter((c) => c.isActive);

  // Canned responses filtered for chip bar
  const chipCannedResponses = activeCannedResponses.filter((c) => {
    if (selectedCannedGroup === 'all') return true;
    return c.category === selectedCannedGroup;
  });

  // Canned responses for slash menu
  const slashFilteredResponses = activeCannedResponses.filter((c) => {
    if (!slashSearchQuery) return true;
    const q = slashSearchQuery.toLowerCase();
    return (
      c.shortcut.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q)
    );
  });

  // Watch for '/' trigger in textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.startsWith('/')) {
      setIsSlashMenuOpen(true);
      setSlashSearchQuery(val.slice(1).trim());
    } else {
      setIsSlashMenuOpen(false);
      setSlashSearchQuery('');
    }
  };

  const applyCannedResponse = (response: CannedResponse) => {
    const customizedText = replaceVariables(response.content, {
      customer_name: selectedConv.customerName,
      order_code: currentCustomer?.lastOrderCode || 'SO-10482',
      tracking_no: 'TH2609-88412',
      agent_name: selectedConv.assignedTo || 'วิภา ส.',
      company_name: 'บจก. CusBox360',
      phone: currentCustomer?.fullPhone || '081-892-5678',
    });

    setInputText(customizedText);
    setIsSlashMenuOpen(false);
    setSlashSearchQuery('');
    incrementUsage(response.id);
    showToast(`ใช้ข้อความ "${response.shortcut}" เรียบร้อยแล้ว`, 'info');

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const isPrivate = composerMode === 'note';
    setInputText('');
    setIsSlashMenuOpen(false);

    const res = await addMessageToConversation(selectedConv.id, textToSend, isPrivate);
    if (isPrivate) {
      showToast('บันทึก Private note สำเร็จ', 'success');
    } else if (res?.lineDelivery && !res.lineDelivery.success) {
      showToast(`ส่งเข้า LINE ไม่สำเร็จ: ${res.lineDelivery.error || 'LINE Push Error'}`, 'error');
    } else {
      showToast('ส่งข้อความตอบกลับแล้ว', 'success');
    }
  };

  const handleToggleBot = async (nextState: boolean) => {
    await toggleBotStatus(selectedConv.id, nextState);
    showToast(
      nextState
        ? 'เปิดการทำงานของ Bot ในห้องแชทนี้แล้ว'
        : 'หยุดการทำงานของ Bot ในห้องแชทนี้แล้ว (แอดมินดูแล)',
      'info'
    );
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

    showToast(`สร้าง Task "${taskForm.title.trim()}" สำเร็จ (มอบหมาย: ${taskForm.assignee})`, 'success');
    setTaskForm({
      title: '',
      assignee: 'วิภา ส. (Customer Care)',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'ด่วน',
      note: '',
    });
    setComposerMode('reply');
  };

  const handleResolve = () => {
    updateConversationStatus(selectedConv.id, 'Resolved');
    showToast(`ปิดการสนทนา (#${selectedConv.id}) เรียบร้อยแล้ว`, 'success');
  };

  const handlePending = () => {
    updateConversationStatus(selectedConv.id, 'Pending');
    showToast('เปลี่ยนสถานะเป็น Pending (รอดำเนินการ)', 'info');
  };

  const handleTransfer = () => {
    showToast('เปิดหน้าต่างโอนสาย/โอนแชทให้ทีมงาน', 'info');
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white select-none">
      
      {/* ================= COLUMN 1: CONVERSATION LIST (340px) ================= */}
      <div
        className={`${
          mobileView === 'list' ? 'flex' : 'hidden'
        } md:flex w-full md:w-[320px] lg:w-[340px] flex-shrink-0 border-r border-border bg-white flex-col h-full`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMobileSidebar}
                aria-label="เปิดเมนูการนำทาง"
                className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-[17px] font-bold text-text-primary">Inbox</h2>
            </div>
            {/* Status dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-semibold px-2.5 py-1 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="Open">สถานะ: Open ▾</option>
                <option value="Pending">สถานะ: Pending ▾</option>
                <option value="Snoozed">สถานะ: Snoozed ▾</option>
                <option value="Resolved">สถานะ: Resolved ▾</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="ค้นหาข้อความ / ชื่อลูกค้า"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>

          {/* Tabs Mine / Unassigned / All */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-bg-app rounded-lg text-xs font-semibold text-center">
            <button
              onClick={() => setTabFilter('Mine')}
              className={`py-1 rounded-md transition-all ${
                tabFilter === 'Mine'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Mine <span className="font-mono text-[11px] font-bold">8</span>
            </button>
            <button
              onClick={() => setTabFilter('Unassigned')}
              className={`py-1 rounded-md transition-all ${
                tabFilter === 'Unassigned'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Unassigned <span className="font-mono text-[11px] font-bold">3</span>
            </button>
            <button
              onClick={() => setTabFilter('All')}
              className={`py-1 rounded-md transition-all ${
                tabFilter === 'All'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All <span className="font-mono text-[11px] font-bold">24</span>
            </button>
          </div>
        </div>

        {/* Conversation Rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-divider">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedConv.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedConvId(conv.id);
                  setMobileView('chat');
                }}
                className={`p-3 cursor-pointer transition-all flex gap-3 relative ${
                  isSelected
                    ? 'bg-brand-selected border-l-[3px] border-brand'
                    : 'hover:bg-bg-subtle border-l-[3px] border-transparent'
                }`}
              >
                {/* Avatar + Channel Dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-brand-tint text-brand-deep font-bold flex items-center justify-center text-xs">
                    {conv.customerName.slice(0, 2)}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white ${
                      conv.channel === 'LINE' ? 'bg-[#06A94A]' : 'bg-[#0866FF]'
                    }`}
                  >
                    {conv.channel === 'LINE' ? 'L' : 'f'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-text-primary truncate">
                      {conv.customerName}
                    </span>
                    <span className="text-[11px] text-text-secondary font-mono flex-shrink-0">
                      {conv.time}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {conv.lastMessagePreview}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <TierBadge tier={conv.customerTier} size="sm" />
                      {conv.label && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {conv.label}
                        </span>
                      )}
                    </div>
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-brand text-white font-bold text-[10px] flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= COLUMN 2: CHAT PANE (FLEX) ================= */}
      <div
        className={`${
          mobileView === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full bg-bg-app min-w-0`}
      >
        {/* Top Header */}
        <div className="h-[56px] sm:h-[60px] bg-white border-b border-border px-3.5 sm:px-5 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back button on mobile to return to conversation list */}
            <button
              type="button"
              onClick={() => setMobileView('list')}
              aria-label="กลับไปที่รายการแชท"
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-[14px] sm:text-[15px] text-text-primary truncate">
                  {selectedConv.customerName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 flex-shrink-0">
                  {selectedConv.channel} · {selectedConv.channelAccount}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5 truncate">
                มอบหมาย: {selectedConv.assignedTo} · ทีม {selectedConv.team} · #{selectedConv.id}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* View CDP Customer details button on mobile / tablet */}
            <button
              type="button"
              onClick={() => setIsCustomerDetailOpen(true)}
              aria-label="ดูข้อมูลลูกค้า CDP"
              className="xl:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-border"
              title="ข้อมูลลูกค้า (CDP)"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={handleTransfer}
              className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 border border-border hover:bg-bg-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
            >
              โอนแชท
            </button>
            <button
              onClick={handlePending}
              className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 border border-border hover:bg-bg-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
            >
              Pending
            </button>
            <button
              onClick={handleResolve}
              className="px-2.5 sm:px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 shadow-sm transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>✓ Resolve</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Date separator */}
          <div className="flex items-center justify-center my-2">
            <span className="px-3 py-0.5 rounded-full bg-white border border-border text-[11px] text-text-secondary font-medium shadow-xs">
              วันนี้
            </span>
          </div>

          {selectedConv.messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              msg={msg}
              onRetry={(messageId, text) => {
                retrySendMessage(selectedConv.id, messageId, text);
                showToast('กำลังลองส่งข้อความใหม่...', 'info');
              }}
              onUpdateTaskStatus={(messageId, status) => {
                updateTaskStatus(selectedConv.id, messageId, status);
                showToast(
                  status === 'Completed'
                    ? 'งานเสร็จสมบูรณ์เรียบร้อยแล้ว'
                    : 'อัปเดตสถานะ Task เป็น In Progress',
                  status === 'Completed' ? 'success' : 'info'
                );
              }}
            />
          ))}
        </div>

        {/* Composer Area */}
        <div className="p-4 bg-white border-t border-border flex-shrink-0 space-y-2.5 relative">
          
          {/* Mode Switch Tabs & Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-semibold">
              <button
                onClick={() => setComposerMode('reply')}
                className={`pb-1 border-b-2 transition-all ${
                  composerMode === 'reply'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                ตอบกลับ
              </button>
              <button
                onClick={() => setComposerMode('note')}
                className={`pb-1 border-b-2 flex items-center gap-1 transition-all ${
                  composerMode === 'note'
                    ? 'border-amber-600 text-amber-700 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Private note</span>
              </button>
              <button
                onClick={() => setComposerMode('task')}
                className={`pb-1 border-b-2 flex items-center gap-1 transition-all ${
                  composerMode === 'task'
                    ? 'border-indigo-600 text-indigo-700 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>สร้าง Task</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Per-Conversation Bot Auto-Reply Status & Toggle */}
              <BotStatusToggle
                isBotActive={selectedConv.isBotActive !== false}
                onToggle={handleToggleBot}
              />

              <span className="text-[11px] text-text-secondary hidden md:inline">
                พิมพ์ <kbd className="font-mono bg-bg-app px-1 py-0.5 rounded border border-border">/</kbd> เพื่อค้นหา
              </span>

              <button
                type="button"
                onClick={() => navigate('/canned-responses')}
                className="text-[11px] text-brand hover:text-brand-hover hover:underline flex items-center gap-0.5 font-medium"
                title="เปิดหน้าจัดการข้อความอัตโนมัติ"
              >
                <Settings className="w-3 h-3" />
                <span>จัดการข้อความ</span>
              </button>
            </div>
          </div>

          {composerMode === 'task' ? (
            <div className="bg-slate-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-divider pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>มอบหมายงานติดตามลูกค้า (Task Assignment)</span>
                </div>
                <span className="text-[11px] text-text-secondary font-medium">
                  เฉพาะทีมงานภายใน · ไม่แสดงให้ลูกค้าเห็น
                </span>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  ชื่องาน / รายละเอียดที่ต้องทำ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTaskSubmit();
                    }
                  }}
                  placeholder="เช่น ติดตามฝ่ายคลังเรื่องเลขพัสดุ SO-10482, โทรติดต่อลูกค้านัดหมายส่งสินค้า..."
                  className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Assignee, Due Date, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    ผู้รับผิดชอบ (Assignee)
                  </label>
                  <select
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="วิภา ส. (Customer Care)">วิภา ส. (Customer Care)</option>
                    <option value="สมหญิง ร. (Supervisor)">สมหญิง ร. (Supervisor)</option>
                    <option value="ธนพล ก. (Sales Manager)">ธนพล ก. (Sales Manager)</option>
                    <option value="ประเทือง ว. (Credit Officer)">ประเทือง ว. (Credit Officer)</option>
                    <option value="ทีมคลังสินค้า & ขนส่ง">ทีมคลังสินค้า & ขนส่ง</option>
                    <option value="ทีมช่างเทคนิค">ทีมช่างเทคนิค</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    กำหนดเสร็จ (Due Date)
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-primary mb-1">
                    ระดับความสำคัญ (Priority)
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="ปกติ">● ปกติ</option>
                    <option value="ด่วน">● ด่วน</option>
                    <option value="ด่วนที่สุด">● ด่วนที่สุด (Urgent)</option>
                  </select>
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-[11px] font-semibold text-text-primary mb-1">
                  โน้ตเพิ่มเติม / ข้อมูลอ้างอิง
                </label>
                <textarea
                  rows={2}
                  value={taskForm.note}
                  onChange={(e) => setTaskForm({ ...taskForm, note: e.target.value })}
                  placeholder="ระบุข้อความอ้างอิง ข้อมูลที่ลูกค้าต้องการ หรือคำแนะนำแก่ผู้รับมอบหมาย..."
                  className="w-full p-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setComposerMode('reply')}
                  className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 transition-colors"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleCreateTaskSubmit}
                  disabled={!taskForm.title.trim()}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    taskForm.title.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>สร้างและมอบหมาย Task</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Canned Response Category Group Filter Tabs */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar pt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedCannedGroup('all')}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      selectedCannedGroup === 'all'
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-bg-app text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setSelectedCannedGroup('greeting')}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 ${
                      selectedCannedGroup === 'greeting'
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-white text-purple-700 hover:bg-bg-subtle border border-border'
                    }`}
                  >
                    <span>👋</span>
                    <span>Greeting (ทักทาย)</span>
                  </button>
                  <button
                    onClick={() => setSelectedCannedGroup('question')}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 ${
                      selectedCannedGroup === 'question'
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-white text-amber-700 hover:bg-bg-subtle border border-border'
                    }`}
                  >
                    <span>❓</span>
                    <span>Question (คำถาม)</span>
                  </button>
                  <button
                    onClick={() => setSelectedCannedGroup('answer')}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 ${
                      selectedCannedGroup === 'answer'
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-white text-emerald-700 hover:bg-bg-subtle border border-border'
                    }`}
                  >
                    <span>💡</span>
                    <span>Answer (คำตอบ)</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate('/canned-responses')}
                  className="text-[10px] text-text-secondary hover:text-brand flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-app"
                >
                  <span>+ เพิ่มเทมเพลต</span>
                </button>
              </div>

              {/* Quick response clickable chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {chipCannedResponses.slice(0, 8).map((item) => {
                  const isGreeting = item.category === 'greeting';
                  const isQuestion = item.category === 'question';
                  const isAnswer = item.category === 'answer';

                  let chipStyle = 'border-border text-brand bg-bg-subtle hover:bg-bg-app';
                  if (isGreeting) chipStyle = 'border-purple-200 text-purple-700 bg-purple-50/70 hover:bg-purple-100';
                  if (isQuestion) chipStyle = 'border-amber-200 text-amber-800 bg-amber-50/70 hover:bg-amber-100';
                  if (isAnswer) chipStyle = 'border-emerald-200 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100';

                  return (
                    <button
                      key={item.id}
                      onClick={() => applyCannedResponse(item)}
                      title={`${item.title}\n\n${item.content}`}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono font-semibold flex-shrink-0 flex items-center gap-1 transition-all shadow-2xs ${chipStyle}`}
                    >
                      <span>{item.shortcut}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Slash Command Suggestions Popover */}
              {isSlashMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl border border-border shadow-xl z-40 max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-divider text-[11px] font-bold text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-brand" />
                      <span>เลือกข้อความตอบกลับอัตโนมัติ (พิมพ์ค้นหาได้เลย)</span>
                    </div>
                    <button
                      onClick={() => setIsSlashMenuOpen(false)}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      ✕
                    </button>
                  </div>

                  {slashFilteredResponses.length === 0 ? (
                    <div className="p-3 text-center text-xs text-text-secondary">
                      ไม่พบ shortcut ที่ตรงกับ &quot;/{slashSearchQuery}&quot;
                    </div>
                  ) : (
                    slashFilteredResponses.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => applyCannedResponse(item)}
                        className="w-full text-left p-2 rounded-lg hover:bg-bg-subtle transition-colors flex items-start justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-brand group-hover:underline">
                              {item.shortcut}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 text-slate-700">
                              {item.category === 'greeting'
                                ? '👋 Greeting'
                                : item.category === 'question'
                                ? '❓ Question'
                                : '💡 Answer'}
                            </span>
                            <span className="text-xs font-bold text-text-primary truncate">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {item.content}
                          </p>
                        </div>

                        <span className="text-[10px] text-text-secondary font-mono flex-shrink-0 pt-0.5">
                          ใช้ {item.usageCount || 0} ครั้ง
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Input Box */}
              <form onSubmit={handleSendMessage} className="relative">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      // If slash menu is open with results, pick first result on Enter
                      if (isSlashMenuOpen && slashFilteredResponses.length > 0) {
                        e.preventDefault();
                        applyCannedResponse(slashFilteredResponses[0]);
                        return;
                      }
                      e.preventDefault();
                      handleSendMessage();
                    } else if (e.key === 'Escape') {
                      setIsSlashMenuOpen(false);
                    }
                  }}
                  placeholder={
                    composerMode === 'reply'
                      ? 'พิมพ์ข้อความตอบกลับลูกค้า หรือพิมพ์ / เพื่อเลือกข้อความสำเร็จรูป...'
                      : 'เขียนโน้ตส่วนตัว (Private note สำหรับทีมภายใน)...'
                  }
                  className={`w-full p-2.5 text-xs rounded-lg border focus:outline-none transition-all resize-none ${
                    composerMode === 'note'
                      ? 'bg-warn-bg/50 border-warn-border focus:border-amber-600 text-warn-text'
                      : 'bg-bg-app/50 border-border focus:border-brand text-text-primary focus:bg-white'
                  }`}
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('แนบไฟล์หรือรูปภาพสินค้า', 'info')}
                    className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle transition-colors"
                    aria-label="Attach File"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                      inputText.trim()
                        ? composerMode === 'note'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-brand hover:bg-brand-hover text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{composerMode === 'note' ? 'บันทึกโน้ต' : 'ส่ง'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ================= COLUMN 3: CDP CUSTOMER SIDE CARD (320px) ================= */}
      <div className="hidden xl:block h-full">
        <CustomerSideCard customer={currentCustomer} onOpenTask={() => setComposerMode('task')} />
      </div>

      {/* Mobile & Tablet Drawer for CDP Info */}
      {isCustomerDetailOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCustomerDetailOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[320px] sm:w-[360px] h-full bg-white shadow-2xl flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-bold text-sm text-text-primary">ข้อมูลลูกค้า (CDP)</span>
              <button
                type="button"
                onClick={() => setIsCustomerDetailOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CustomerSideCard
                customer={currentCustomer}
                onOpenTask={() => {
                  setComposerMode('task');
                  setIsCustomerDetailOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
