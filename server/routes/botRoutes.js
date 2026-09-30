import { Router } from 'express';
import {
  getBotSettingsHandler,
  updateBotSettingsHandler,
  simulateBotReplyHandler,
} from '../controllers/botController.js';

const router = Router();

router.get('/bot-settings', getBotSettingsHandler);
router.post('/bot-settings', updateBotSettingsHandler);
router.post('/bot/simulate', simulateBotReplyHandler);

export default router;
