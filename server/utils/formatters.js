/**
 * Helper & Data Mapping Utilities for Backend
 */

export const getThaiTime = (date = new Date()) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

/** Convert DB row (snake_case) → frontend object (camelCase) */
export const rowToConversation = (row, messages = []) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerAvatar: row.customer_avatar,
  customerTier: row.customer_tier,
  channel: row.channel,
  channelAccount: row.channel_account,
  time: row.time,
  lastMessagePreview: row.last_message_preview,
  label: row.label,
  unreadCount: row.unread_count,
  status: row.status,
  assignedTo: row.assigned_to,
  team: row.team,
  tabGroup: row.tab_group,
  lineUserId: row.line_user_id,
  messages,
});

export const rowToMessage = (row) => ({
  id: row.id,
  sender: row.sender,
  authorName: row.author_name,
  text: row.text,
  time: row.time,
  trackingNumber: row.tracking_number,
  isPrivateNote: row.is_private_note,
});
