import { Router } from 'express';
import { caseController } from '../controllers/caseController.js';

const router = Router();

router.get('/', (req, res) => caseController.listCases(req, res));
router.post('/', (req, res) => caseController.createCase(req, res));
router.patch('/:id', (req, res) => caseController.updateCase(req, res));
router.post('/:id/logs', (req, res) => caseController.addCaseLog(req, res));

export default router;
