import { CannedResponse, Conversation, Customer } from '../types';
import { useBot } from '../context/BotContext';
import { useToast } from '../context/ToastContext';
import { useAutoReplyTimer } from './useAutoReplyTimer';
import { callGemini } from '../services/geminiService';

interface UseInboxAutoReplyParams {
  conversations: Conversation[];
  selectedConv: Conversation;
  currentCustomer: Customer;
  cannedResponses: CannedResponse[];
  addMessageToConversation: (
    convId: string,
    text: string,
    isPrivate?: boolean
  ) => Promise<{ lineDelivery?: { success: boolean; error?: string } } | void>;
}

export function useInboxAutoReply({
  conversations,
  selectedConv,
  currentCustomer,
  cannedResponses,
  addMessageToConversation,
}: UseInboxAutoReplyParams) {
  const { settings: botSettings, testMatch } = useBot();
  const { showToast } = useToast();

  const lastCustomerMessage = [...(selectedConv?.messages || [])]
    .reverse()
    .find((m) => m.sender === 'customer');

  const lastMessage = selectedConv?.messages?.[selectedConv.messages.length - 1];
  const isCustomerWaiting = lastMessage?.sender === 'customer';

  const handleAutoReplyTimeout = async () => {
    const currentConv = conversations.find((c) => c.id === selectedConv?.id);
    if (!currentConv) return;
    const currentLast = currentConv.messages[currentConv.messages.length - 1];
    if (currentLast?.sender !== 'customer' || currentConv.isBotActive === false) {
      return;
    }

    let replyText = '';
    const apiKey = botSettings.geminiApiKey || '';

    if (apiKey) {
      const aiRes = await callGemini({
        botName: botSettings.botName || 'CusBox AI Assistant',
        chatHistory: currentConv.messages,
        customer: currentCustomer,
        cannedResponses,
        companyProfile: botSettings.companyProfile,
        knowledgeItems: botSettings.knowledgeItems,
        apiKey,
      });
      if (aiRes.success && aiRes.text) {
        replyText = aiRes.text;
      }
    }

    if (!replyText) {
      const matched = testMatch(currentLast.text, {
        customer_name: currentConv.customerName,
        order_code: currentCustomer?.lastOrderCode || 'SO-10482',
        tracking_no: 'TH2609-88412',
      });
      if (matched.matched) {
        replyText = matched.replyText;
      }
    }

    if (!replyText) {
      replyText =
        botSettings.fallbackMessage ||
        'ขออภัยในความล่าช้าค่ะคุณลูกค้า 🙏 เจ้าหน้าที่ฝ่ายบริการลูกค้าได้รับข้อความแล้วและกำลังเร่งเข้ามาดูแลให้นะคะ มีเรื่องใดสอบถามเพิ่มเติมแจ้งไว้ได้เลยค่ะ';
    }

    await addMessageToConversation(currentConv.id, replyText, false);
    showToast('AI ตอบกลับอัตโนมัติเนื่องจากไม่มีการตอบกลับภายใน 30 วินาที', 'info');
  };

  return useAutoReplyTimer({
    conversationId: selectedConv?.id || '',
    lastCustomerMessageId: isCustomerWaiting ? lastCustomerMessage?.id || null : null,
    isBotActive: selectedConv?.isBotActive !== false,
    timeoutSeconds: botSettings.autoReplyTimeoutSeconds || 30,
    onTimeout: handleAutoReplyTimeout,
  });
}
