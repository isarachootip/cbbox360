import React from 'react';
import { X } from 'lucide-react';
import { useLayout } from '../context/LayoutContext';
import { CustomerSideCard } from '../components/common/CustomerSideCard';
import { ChatMessageItem } from '../components/inbox/ChatMessageItem';
import { LineUserIdModal } from '../components/inbox/LineUserIdModal';
import { ConversationListPane } from '../components/inbox/ConversationListPane';
import { InboxChatHeader } from '../components/inbox/InboxChatHeader';
import { InboxComposer } from '../components/inbox/InboxComposer';
import { useInboxWorkspace } from '../hooks/useInboxWorkspace';

export const InboxPage: React.FC = () => {
  const { toggleMobileSidebar, isInboxRightPanelOpen, toggleInboxRightPanel } = useLayout();
  const ws = useInboxWorkspace();

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white">
      <ConversationListPane
        conversations={ws.filteredConversations}
        allConversations={ws.conversations}
        selectedConvId={ws.selectedConv.id}
        mobileView={ws.mobileView}
        statusFilter={ws.statusFilter}
        tabFilter={ws.tabFilter}
        searchQuery={ws.searchQuery}
        onStatusFilterChange={ws.setStatusFilter}
        onTabFilterChange={ws.setTabFilter}
        onSearchChange={ws.setSearchQuery}
        onSelectConversation={(id) => {
          ws.setSelectedConvId(id);
          ws.setMobileView('chat');
        }}
        onOpenMobileSidebar={toggleMobileSidebar}
      />

      {/* Chat Stream + Composer */}
      <div
        className={`${
          ws.mobileView === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full bg-bg-app min-w-0`}
      >
        <InboxChatHeader
          conversation={ws.selectedConv}
          isRightPanelOpen={isInboxRightPanelOpen}
          onBackToList={() => ws.setMobileView('list')}
          onOpenLineIdModal={() => ws.setIsLineIdModalOpen(true)}
          onOpenMobileCustomerDetail={() => ws.setIsCustomerDetailOpen(true)}
          onToggleDesktopRightPanel={toggleInboxRightPanel}
          onTransfer={() => ws.showToast('เปิดหน้าต่างโอนสาย/โอนแชทให้ทีมงาน', 'info')}
          onPending={() => {
            ws.updateConversationStatus(ws.selectedConv.id, 'Pending');
            ws.showToast('เปลี่ยนสถานะเป็น Pending (รอดำเนินการ)', 'info');
          }}
          onResolve={() => {
            ws.updateConversationStatus(ws.selectedConv.id, 'Resolved');
            ws.showToast(`ปิดการสนทนา (#${ws.selectedConv.id}) เรียบร้อยแล้ว`, 'success');
          }}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-center my-1 select-none">
            <span className="px-3 py-0.5 rounded-full bg-white border border-border text-xs text-text-secondary font-medium shadow-2xs">
              วันนี้
            </span>
          </div>
          {ws.selectedConv.messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              msg={msg}
              onRetry={(mid, text) => {
                ws.retrySendMessage(ws.selectedConv.id, mid, text);
                ws.showToast('กำลังลองส่งข้อความใหม่...', 'info');
              }}
              onUpdateTaskStatus={(mid, st) => {
                ws.updateTaskStatus(ws.selectedConv.id, mid, st);
                ws.showToast(
                  st === 'Completed' ? 'งานเสร็จสมบูรณ์เรียบร้อยแล้ว' : 'อัปเดตสถานะ Task เป็น In Progress',
                  st === 'Completed' ? 'success' : 'info'
                );
              }}
            />
          ))}
        </div>

        <InboxComposer
          conversation={ws.selectedConv}
          customer={ws.currentCustomer}
          composerMode={ws.composerMode}
          onComposerModeChange={ws.setComposerMode}
          inputText={ws.inputText}
          onInputChange={ws.handleInputChange}
          onSendMessage={ws.handleSendMessage}
          onAttachFile={() => ws.showToast('แนบไฟล์หรือรูปภาพสินค้า', 'info')}
          onToggleBot={async (next) => {
            await ws.toggleBotStatus(ws.selectedConv.id, next);
            ws.showToast(
              next ? 'เปิดการทำงานของ Bot ในห้องแชทนี้แล้ว' : 'หยุดการทำงานของ Bot ในห้องแชทนี้แล้ว',
              'info'
            );
          }}
          textareaRef={ws.textareaRef}
          selectedCannedGroup={ws.selectedCannedGroup}
          onSelectCannedGroup={ws.setSelectedCannedGroup}
          chipCannedResponses={ws.chipCanned}
          slashFilteredResponses={ws.slashFiltered}
          slashSearchQuery={ws.slashSearchQuery}
          isSlashMenuOpen={ws.isSlashMenuOpen}
          onCloseSlashMenu={() => ws.setIsSlashMenuOpen(false)}
          onApplyCannedResponse={ws.applyCannedResponse}
          onSelectAiReply={(text, logId) => {
            ws.setInputText(text);
            ws.setActiveAiSelection({ logId, originalText: text });
            ws.textareaRef.current?.focus();
          }}
          taskForm={ws.taskForm}
          onTaskFormChange={ws.setTaskForm}
          onCreateTaskSubmit={ws.handleCreateTaskSubmit}
        />
      </div>

      {/* Collapsible Desktop CDP Right Panel */}
      {isInboxRightPanelOpen && (
        <div className="hidden xl:block h-full">
          <CustomerSideCard
            customer={ws.currentCustomer}
            conversationId={ws.selectedConv?.id}
            messages={ws.selectedConv?.messages}
            onOpenTask={() => ws.setComposerMode('task')}
          />
        </div>
      )}

      {/* Mobile / Tablet CDP Drawer */}
      {isCustomerDetailOpenDrawer(ws)}

      {ws.selectedConv && (
        <LineUserIdModal
          isOpen={ws.isLineIdModalOpen}
          onClose={() => ws.setIsLineIdModalOpen(false)}
          conversationId={ws.selectedConv.id}
          customerName={ws.selectedConv.customerName}
          currentLineUserId={ws.selectedConv.lineUserId}
          onSave={async (newId) => {
            const ok = await ws.updateConversationLineUserId(ws.selectedConv.id, newId);
            ws.showToast(
              ok ? 'บันทึกและผูก LINE User ID สำเร็จ' : 'เกิดข้อผิดพลาดในการบันทึก LINE User ID',
              ok ? 'success' : 'error'
            );
            return ok;
          }}
        />
      )}
    </div>
  );
};

function isCustomerDetailOpenDrawer(ws: ReturnType<typeof useInboxWorkspace>) {
  if (!ws.isCustomerDetailOpen) return null;
  return (
    <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs"
        onClick={() => ws.setIsCustomerDetailOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-[324px] sm:w-[360px] h-full bg-white shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between select-none">
          <span className="font-bold text-sm text-text-primary">ข้อมูลลูกค้า (CDP)</span>
          <button
            type="button"
            onClick={() => ws.setIsCustomerDetailOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CustomerSideCard
            customer={ws.currentCustomer}
            conversationId={ws.selectedConv?.id}
            messages={ws.selectedConv?.messages}
            onOpenTask={() => {
              ws.setComposerMode('task');
              ws.setIsCustomerDetailOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
