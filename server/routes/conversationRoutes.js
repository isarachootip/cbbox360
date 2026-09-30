import { Router } from 'express';
import { getConversations, sendMessage, toggleBotStatus } from '../controllers/conversationController.js';

const router = Router();

router.get('/', getConversations);
router.post('/:id/messages', sendMessage);
router.patch('/:id/bot-status', toggleBotStatus);

export default router;
