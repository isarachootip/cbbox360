import { Router } from 'express';
import { query } from '../../db.js';
import webhookRoutes from './webhookRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import botRoutes from './botRoutes.js';
import cannedResponseRoutes from './cannedResponseRoutes.js';
import connectorRoutes from './connectorRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import aiRoutes from './aiRoutes.js';
import authRoutes from './authRoutes.js';
import industryProfileRoutes from './industryProfileRoutes.js';
import { requireAuth, requireRole } from '../services/authContainer.js';
import { bindActor } from '../middlewares/bindActor.js';

const router = Router();

// Health Check (public; no internal error details)
router.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Public: login flow, and LINE/Meta webhooks (authenticated by signature, not session)
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);

// Everything below requires a logged-in session
router.use('/conversations', requireAuth, conversationRoutes);
router.use('/canned-responses', requireAuth, cannedResponseRoutes);
router.use('/connectors', requireAuth, requireRole('sysadmin', 'admin'), connectorRoutes);
router.use('/audit-logs', requireAuth, bindActor, auditLogRoutes);
router.use('/ai', requireAuth, bindActor, aiRoutes);
router.use('/customers', requireAuth, industryProfileRoutes);
router.use('/', requireAuth, botRoutes);

export default router;
