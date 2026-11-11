import React from 'react';
import { Search, Menu } from 'lucide-react';
import { Conversation } from '../../types';
import { TierBadge } from '../common/TierBadge';

export type InboxStatusFilter = Conversation['status'];
export type InboxTabFilter = 'Mine' | 'Unassigned' | 'All';

interface ConversationListPaneProps {
  conversations: Conversation[];
  allConversations: Conversation[];
  selectedConvId: string;
  mobileView: 'list' | 'chat';
  statusFilter: InboxStatusFilter;
  tabFilter: InboxTabFilter;
  searchQuery: string;
  onStatusFilterChange: (status: InboxStatusFilter) => void;
  onTabFilterChange: (tab: InboxTabFilter) => void;
  onSearchChange: (q: string) => void;
  onSelectConversation: (convId: string) => void;
  onOpenMobileSidebar: () => void;
}

const STATUS_OPTIONS: InboxStatusFilter[] = ['Open', 'Pending', 'Snoozed', 'Resolved'];

export const ConversationListPane: React.FC<ConversationListPaneProps> = ({
  conversations,
  allConversations,
  selectedConvId,
  mobileView,
  statusFilter,
  tabFilter,
  searchQuery,
  onStatusFilterChange,
  onTabFilterChange,
  onSearchChange,
  onSelectConversation,
  onOpenMobileSidebar,
}) => {
  const mineCount = allConversations.filter(
    (c) => c.tabGroup === 'Mine' && c.status === statusFilter
  ).length;
  const unassignedCount = allConversations.filter(
    (c) => c.tabGroup === 'Unassigned' && c.status === statusFilter
  ).length;
  const allCount = allConversations.filter((c) => c.status === statusFilter).length;

  return (
    <div
      className={`${
        mobileView === 'list' ? 'flex' : 'hidden'
      } md:flex w-full md:w-[316px] lg:w-[336px] flex-shrink-0 border-r border-border bg-white flex-col h-full`}
    >
      {/* Top Controls */}
      <div className="p-3.5 border-b border-border space-y-3 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="เปิดเมนูการนำทาง"
              className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[17px] font-bold text-text-primary tracking-tight">Inbox</h2>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              const next = STATUS_OPTIONS.find((s) => s === e.target.value);
              if (next) onStatusFilterChange(next);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 bg-bg-subtle border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            <option value="Open">● Open</option>
            <option value="Pending">● Pending</option>
            <option value="Snoozed">● Snoozed</option>
            <option value="Resolved">● Resolved</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า หรือข้อความ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all"
          />
        </div>

        {/* Segmented Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-bg-muted rounded-lg text-xs font-semibold text-center">
          {(
            [
              { id: 'Mine', label: 'Mine', count: mineCount },
              { id: 'Unassigned', label: 'Unassigned', count: unassignedCount },
              { id: 'All', label: 'All', count: allCount },
            ] as const
          ).map((tab) => {
            const active = tabFilter === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => onTabFilterChange(tab.id)}
                className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                  active
                    ? 'bg-white text-brand shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] font-bold tabular-nums opacity-85">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-divider">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-text-secondary">
            ไม่พบรายการสนทนาในหมวดนี้
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`px-3.5 py-3 cursor-pointer transition-colors flex gap-3 relative ${
                  isSelected
                    ? 'bg-brand-selected border-l-[3px] border-brand'
                    : 'hover:bg-bg-subtle border-l-[3px] border-transparent'
                }`}
              >
                {/* Avatar + Channel Badge */}
                <div className="relative flex-shrink-0 pt-0.5 select-none">
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

                {/* Conversation Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-[14px] text-text-primary truncate">
                      {conv.customerName}
                    </span>
                    <span className="text-[11px] text-text-secondary font-mono tabular-nums flex-shrink-0">
                      {conv.time}
                    </span>
                  </div>

                  <p className="text-[13px] text-text-secondary truncate mt-0.5 leading-snug">
                    {conv.lastMessagePreview}
                  </p>

                  <div className="flex items-center justify-between mt-2 select-none">
                    <div className="flex items-center gap-1.5">
                      <TierBadge tier={conv.customerTier} size="sm" />
                      {conv.label && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {conv.label}
                        </span>
                      )}
                    </div>
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white font-mono font-bold text-[10px] tabular-nums flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
