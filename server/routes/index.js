import { Router } from 'express';
import { query } from '../../db.js';
import webhookRoutes from './webhookRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import botRoutes from './botRoutes.js';
import cannedResponseRoutes from './cannedResponseRoutes.js';

const router = Router();

// Health Check
router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// Domain Routes
router.use('/webhooks', webhookRoutes);
router.use('/conversations', conversationRoutes);
router.use('/canned-responses', cannedResponseRoutes);
router.use('/', botRoutes);

export default router;
