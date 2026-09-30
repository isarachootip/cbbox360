import { Router } from 'express';
import { handleLineWebhook, handleMetaGet } from '../controllers/webhookController.js';

const router = Router();

// LINE Webhooks
router.post('/line/:channelId', handleLineWebhook);
router.post('/line', handleLineWebhook);
router.get('/line/:channelId', (req, res) => res.status(200).send('LINE Webhook Endpoint is Active'));
router.get('/line', (req, res) => res.status(200).send('LINE Webhook Endpoint is Active'));

// Meta Webhooks
router.get('/meta/:pageId', handleMetaGet);
router.get('/meta', handleMetaGet);

export default router;
