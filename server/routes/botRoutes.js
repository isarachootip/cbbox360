import { Router } from 'express';
import {
  getBotSettingsHandler,
  updateBotSettingsHandler,
  simulateBotReplyHandler,
} from '../controllers/botController.js';
import { requireRole } from '../services/authContainer.js';

const router = Router();

router.get('/bot-settings', getBotSettingsHandler);
router.post('/bot-settings', requireRole('sysadmin', 'admin'), updateBotSettingsHandler);
router.post('/bot/simulate', simulateBotReplyHandler);

export default router;
