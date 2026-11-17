import { Router } from 'express';
import { defaultConsentController } from '../controllers/consentController.js';

const router = Router();

router.get('/', defaultConsentController.getOverview);
router.post('/dsr', defaultConsentController.upsertDsr);
router.post('/policies', defaultConsentController.upsertPolicy);

export default router;
