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
import userRoutes from './userRoutes.js';
import customerRoutes from './customerRoutes.js';
import consentRoutes from './consentRoutes.js';
import industryProfileRoutes from './industryProfileRoutes.js';
import { requireAuth, requireRole } from '../services/authContainer.js';
import { bindActor } from '../middlewares/bindActor.js';
import { createTenantBootstrapRouter } from '../../core/server/tenancy/tenantBootstrapRoutes.js';
import { createCustomFieldRouter } from '../../core/server/custom-fields/customFieldRoutes.js';
import { createServerModuleRegistry } from '../../core/server/registry/serverModuleRegistry.js';

export const serverModuleRegistry = createServerModuleRegistry({ requireAuth });

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

// Public: login flow, runtime white-label branding, and LINE/Meta webhooks
router.use('/', createTenantBootstrapRouter({ requireAuth }));
router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);

// Core dynamic custom fields & pluggable module registry routes
router.use('/', createCustomFieldRouter({ requireAuth }));
router.use('/', serverModuleRegistry.buildApiRouter());

// Everything below requires a logged-in session
router.use('/users', requireAuth, userRoutes);
router.use('/conversations', requireAuth, conversationRoutes);
router.use('/canned-responses', requireAuth, cannedResponseRoutes);
router.use('/connectors', requireAuth, requireRole('sysadmin', 'admin'), connectorRoutes);
router.use('/audit-logs', requireAuth, bindActor, auditLogRoutes);
router.use('/ai', requireAuth, bindActor, aiRoutes);
router.use('/customers', requireAuth, customerRoutes);
router.use('/customers', requireAuth, industryProfileRoutes);
router.use('/consent', requireAuth, consentRoutes);
router.use('/', requireAuth, botRoutes);

export default router;
