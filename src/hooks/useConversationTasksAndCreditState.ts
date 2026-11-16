import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  Conversation,
  CreditLimitRequest,
  Segment,
  TaskDetails,
  TimelineEvent,
} from '../types';
import { mockCreditLimitRequests } from '../data/credit';
import { mockSegments } from '../data/segments';

export interface TaskComposerPayload {
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'ปกติ' | 'ด่วน' | 'ด่วนที่สุด';
  note?: string;
}

interface UseTasksCreditAndSegmentsParams {
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  addTimelineEvent: (event: TimelineEvent) => void;
  onApproveCustomerCreditLimit: (customerId: string, nextLimit: number) => void;
}

export const useConversationTasksAndCreditState = ({
  conversations,
  setConversations,
  addTimelineEvent,
  onApproveCustomerCreditLimit,
}: UseTasksCreditAndSegmentsParams) => {
  const [creditRequests, setCreditRequests] =
    useState<CreditLimitRequest[]>(mockCreditLimitRequests);
  const [segments, setSegments] = useState<Segment[]>(mockSegments);

  const addTaskToConversation = async (convId: string, taskData: TaskComposerPayload) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const taskDetails: TaskDetails = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: taskData.title,
      assignee: taskData.assignee,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      status: 'Pending',
      createdAt: timeStr,
      note: taskData.note,
    };
    const taskText = `📋 สร้าง Task: ${taskData.title} (มอบหมาย: ${taskData.assignee})`;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
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
            }
          : c
      )
    );

    const targetConv = conversations.find((c) => c.id === convId);
    if (targetConv) {
      addTimelineEvent({
        id: `tl-task-${Date.now()}`,
        customerId: targetConv.customerId,
        type: 'Task',
        iconCode: 'TS',
        title: `มอบหมาย Task: ${taskData.title}`,
        time: `วันนี้ ${timeStr}`,
        detail: `มอบหมายให้ ${taskData.assignee} · กำหนดเสร็จ ${taskData.dueDate} · ความสำคัญ: ${taskData.priority}${
          taskData.note ? ` (${taskData.note})` : ''
        }`,
        meta: ['สถานะ: Pending', 'ผู้สร้าง: วิภา ส.'],
        linkText: 'เปิดใน Inbox',
        linkRoute: '/inbox',
        colorScheme: 'purple',
      });
    }

    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskText, isPrivate: true, authorName: 'วิภา ส.' }),
      });
    } catch (err) {
      console.error('Failed to sync task with backend API', err);
    }
  };

  const updateTaskStatus = (
    convId: string,
    messageId: string,
    status: TaskDetails['status']
  ) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId && m.task ? { ...m, task: { ...m.task, status } } : m
              ),
            }
          : c
      )
    );
  };

  const approveCreditLimit = (requestId: string) => {
    const req = creditRequests.find((r) => r.id === requestId);
    if (!req) return;
    setCreditRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );
    onApproveCustomerCreditLimit(req.customerId, req.requestedLimit);
  };

  const rejectCreditLimit = (requestId: string) => {
    setCreditRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  };

  const toggleSegmentWebhook = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, webhookEnabled: !s.webhookEnabled } : s))
    );
  };

  const updateSegmentRules = (segmentId: string, rules: Segment['rules']) => {
    setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, rules } : s)));
  };

  const cascadeCustomerNameToCredit = (customerId: string, newName: string) => {
    setCreditRequests((prev) =>
      prev.map((req) => (req.customerId === customerId ? { ...req, customerName: newName } : req))
    );
  };

  return {
    creditRequests,
    segments,
    addTaskToConversation,
    updateTaskStatus,
    approveCreditLimit,
    rejectCreditLimit,
    toggleSegmentWebhook,
    updateSegmentRules,
    cascadeCustomerNameToCredit,
  };
};
