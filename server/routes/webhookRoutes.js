import { Router } from 'express';
import { handleLineWebhook, handleMetaGet } from '../controllers/webhookController.js';
import { verifyLineSignature } from '../middlewares/verifyLineSignature.js';

const router = Router();

// LINE Webhooks (Secured with HMAC-SHA256 signature verification)
router.post('/line/:channelId', verifyLineSignature, handleLineWebhook);
router.post('/line', verifyLineSignature, handleLineWebhook);
router.get('/line/:channelId', (req, res) => res.status(200).send('LINE Webhook Endpoint is Active'));
router.get('/line', (req, res) => res.status(200).send('LINE Webhook Endpoint is Active'));

// Meta Webhooks
router.get('/meta/:pageId', handleMetaGet);
router.get('/meta', handleMetaGet);

export default router;
