import { Router } from 'express';
import { createUserController } from '../controllers/userController.js';
import { userManagementService, requireRole } from '../services/authContainer.js';
import { writeAuditLog } from '../services/auditService.js';

const router = Router();

const ctrl = createUserController({
  userManagementService,
  audit: writeAuditLog,
});

const canView = requireRole('sysadmin', 'admin', 'supervisor');
const canManage = requireRole('sysadmin', 'admin');

router.get('/', canView, ctrl.listUsers);
router.post('/', canManage, ctrl.createUser);
router.put('/:id', canManage, ctrl.updateUser);
router.post('/:id/reset-password', canManage, ctrl.resetPassword);
router.patch('/:id/status', canManage, ctrl.setStatus);
router.put('/:id/totp', canManage, ctrl.configureTotp);
router.delete('/:id', canManage, ctrl.deleteUser);

export default router;
