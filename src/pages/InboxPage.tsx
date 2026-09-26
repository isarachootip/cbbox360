import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { TierBadge } from '../components/common/TierBadge';
import { CustomerSideCard } from '../components/common/CustomerSideCard';

export const InboxPage: React.FC = () => {
  const { showToast } = useToast();
  const {
    conversations,
    customers,
    updateConversationStatus,
    addMessageToConversation,
  } = useCustomer();

  // State
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [statusFilter, setStatusFilter] = useState<'Open' | 'Pending' | 'Snoozed' | 'Resolved'>('Open');
  const [tabFilter, setTabFilter] = useState<'Mine' | 'Unassigned' | 'All'>('Mine');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Composer state
  const [composerMode, setComposerMode] = useState<'reply' | 'note'>('reply');
  const [inputText, setInputText] = useState('');

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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const isPrivate = composerMode === 'note';
    addMessageToConversation(selectedConv.id, inputText.trim(), isPrivate);
    showToast(isPrivate ? 'บันทึก Private note สำเร็จ' : 'ส่งข้อความตอบกลับแล้ว', 'success');
    setInputText('');
  };

  const handleApplyCannedResponse = (text: string) => {
    setInputText(text);
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
      <div className="w-[340px] flex-shrink-0 border-r border-border bg-white flex flex-col h-full">
        {/* Top Header */}
        <div className="p-3.5 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-text-primary">Inbox</h2>
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
                onClick={() => setSelectedConvId(conv.id)}
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
      <div className="flex-1 flex flex-col h-full bg-bg-app">
        {/* Top Header */}
        <div className="h-[60px] bg-white border-b border-border px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-text-primary">
                  {selectedConv.customerName}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                  {selectedConv.channel} · {selectedConv.channelAccount}
                </span>
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                มอบหมาย: {selectedConv.assignedTo} · ทีม {selectedConv.team} · #{selectedConv.id}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTransfer}
              className="px-3 py-1.5 border border-border hover:bg-bg-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
            >
              โอนแชท
            </button>
            <button
              onClick={handlePending}
              className="px-3 py-1.5 border border-border hover:bg-bg-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
            >
              Pending
            </button>
            <button
              onClick={handleResolve}
              className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
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

          {selectedConv.messages.map((msg) => {
            if (msg.isPrivateNote) {
              return (
                <div
                  key={msg.id}
                  className="w-full bg-warn-bg border border-dashed border-warn-border rounded-lg p-3 text-warn-text shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wide">
                    <span className="flex items-center gap-1 text-amber-800">
                      <Lock className="w-3 h-3" />
                      <span>PRIVATE NOTE · ลูกค้าไม่เห็น</span>
                    </span>
                    <span className="font-mono text-amber-700">{msg.time} · {msg.authorName}</span>
                  </div>
                  <p className="text-xs text-[#633E00] mt-1 font-medium leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              );
            }

            const isCustomer = msg.sender === 'customer';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isCustomer
                      ? 'bg-white border border-border text-text-primary rounded-tl-sm'
                      : 'bg-brand text-white rounded-tr-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.trackingNumber && (
                    <div className="mt-2 pt-2 border-t border-white/20 font-mono text-[11px] bg-black/10 px-2 py-1 rounded">
                      📦 Track: {msg.trackingNumber}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-text-secondary mt-1 px-1 font-mono">
                  {msg.time} {msg.authorName ? `· ${msg.authorName}` : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Composer Area */}
        <div className="p-4 bg-white border-t border-border flex-shrink-0 space-y-2.5">
          {/* Mode Switch Tabs */}
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
            </div>
            <span className="text-[11px] text-text-secondary">
              พิมพ์ <kbd className="font-mono bg-bg-app px-1 py-0.5 rounded border border-border">/</kbd> เพื่อใช้ข้อความสำเร็จรูป
            </span>
          </div>

          {/* Quick canned responses chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyCannedResponse('/ส่งเลขพัสดุ SO-10482 กำลังนำส่งรอบบ่าย')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-subtle hover:bg-bg-app border border-border text-brand font-medium transition-colors"
            >
              /ส่งเลขพัสดุ
            </button>
            <button
              onClick={() => handleApplyCannedResponse('/ส่งช่องทางชำระ โอนเข้า บจก. CusBox ธ.กสิกรไทย เลขที่ 012-3-45678-9')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-subtle hover:bg-bg-app border border-border text-brand font-medium transition-colors"
            >
              /ส่งช่องทางชำระ
            </button>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                composerMode === 'reply'
                  ? 'พิมพ์ข้อความตอบกลับลูกค้า...'
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
        </div>
      </div>

      {/* ================= COLUMN 3: CDP CUSTOMER SIDE CARD (320px) ================= */}
      <CustomerSideCard customer={currentCustomer} />
    </div>
  );
};
