import React from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Edit3,
  PanelRightClose,
  PanelRightOpen,
  User,
} from 'lucide-react';
import { Conversation } from '../../types';

interface InboxChatHeaderProps {
  conversation: Conversation;
  isRightPanelOpen: boolean;
  onBackToList: () => void;
  onOpenLineIdModal: () => void;
  onOpenMobileCustomerDetail: () => void;
  onToggleDesktopRightPanel: () => void;
  onTransfer: () => void;
  onPending: () => void;
  onResolve: () => void;
}

export const InboxChatHeader: React.FC<InboxChatHeaderProps> = ({
  conversation,
  isRightPanelOpen,
  onBackToList,
  onOpenLineIdModal,
  onOpenMobileCustomerDetail,
  onToggleDesktopRightPanel,
  onTransfer,
  onPending,
  onResolve,
}) => {
  return (
    <div className="h-[58px] sm:h-[62px] bg-white border-b border-border px-3.5 sm:px-5 flex items-center justify-between flex-shrink-0 gap-3">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBackToList}
          aria-label="กลับไปที่รายการแชท"
          className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none select-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] text-text-primary truncate">
              {conversation.customerName}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 flex-shrink-0">
              {conversation.channel} · {conversation.channelAccount}
            </span>
            {conversation.channel === 'LINE' &&
              (conversation.lineUserId ? (
                <button
                  type="button"
                  onClick={onOpenLineIdModal}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer select-none"
                  title={`LINE User ID: ${conversation.lineUserId} (คลิกเพื่อแก้ไข)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>LINE ผูกแล้ว</span>
                  <Edit3 className="w-2.5 h-2.5 opacity-60" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLineIdModal}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer select-none"
                  title="ห้องนี้ยังไม่มี LINE User ID คลิกเพื่อผูก ID ทดสอบส่งข้อความ"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>ยังไม่ผูก LINE ID</span>
                </button>
              ))}
          </div>

          <div className="text-xs text-text-secondary mt-0.5 truncate">
            มอบหมาย: <span className="font-medium text-text-body2">{conversation.assignedTo}</span> · ทีม {conversation.team} ·{' '}
            <span className="font-mono text-[11px]">#{conversation.id}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 select-none">
        <button
          type="button"
          onClick={onOpenMobileCustomerDetail}
          aria-label="ดูข้อมูลลูกค้า CDP"
          className="xl:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-border"
          title="ข้อมูลลูกค้า (CDP)"
        >
          <User className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onTransfer}
          className="hidden sm:inline-flex px-3 py-1.5 border border-border hover:bg-bg-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
        >
          โอนแชท
        </button>
        <button
          type="button"
          onClick={onPending}
          className="hidden sm:inline-flex px-3 py-1.5 border border-border hover:bg-bg-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
        >
          Pending
        </button>
        <button
          type="button"
          onClick={onResolve}
          className="px-3 sm:px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Resolve</span>
        </button>

        {/* Desktop Right Context Panel Toggle */}
        <button
          type="button"
          onClick={onToggleDesktopRightPanel}
          title={isRightPanelOpen ? 'พับเก็บแผงข้อมูลลูกค้าด้านขวา' : 'เปิดแผงข้อมูลลูกค้าด้านขวา (CDP)'}
          aria-label={isRightPanelOpen ? 'พับเก็บแผงข้อมูลลูกค้าด้านขวา' : 'เปิดแผงข้อมูลลูกค้าด้านขวา'}
          className={`hidden xl:inline-flex p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isRightPanelOpen
              ? 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
              : 'border-brand/30 bg-brand-tint/60 text-brand hover:bg-brand-tint'
          }`}
        >
          {isRightPanelOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
