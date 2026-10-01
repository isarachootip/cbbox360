import { Router } from 'express';
import {
  getConversations,
  sendMessage,
  toggleBotStatus,
  updateLineUserId,
} from '../controllers/conversationController.js';

const router = Router();

router.get('/', getConversations);
router.post('/:id/messages', sendMessage);
router.patch('/:id/bot-status', toggleBotStatus);
router.patch('/:id/line-user', updateLineUserId);

export default router;
