import { Router } from 'express';
import {
  postSuggestReply,
  postAiSummary,
  patchAiUsageLog,
  getAiUsageMetrics,
} from '../controllers/aiController.js';

const router = Router();

router.post('/suggest-reply', postSuggestReply);
router.post('/summary', postAiSummary);
router.patch('/logs/:id', patchAiUsageLog);
router.get('/metrics', getAiUsageMetrics);

export default router;
