import { Router } from 'express';
import { getConversations, sendMessage } from '../controllers/conversationController.js';

const router = Router();

router.get('/', getConversations);
router.post('/:id/messages', sendMessage);

export default router;
