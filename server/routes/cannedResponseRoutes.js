import { Router } from 'express';
import {
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from '../controllers/cannedResponseController.js';

const router = Router();

router.get('/', getCannedResponses);
router.post('/', createCannedResponse);
router.put('/:id', updateCannedResponse);
router.delete('/:id', deleteCannedResponse);

export default router;
