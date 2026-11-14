import { Router } from 'express';
import { createUserController } from '../controllers/userController.js';
import { createSyncOperatorsHandler } from '../controllers/syncOperatorsController.js';
import { userManagementService, requireRole } from '../services/authContainer.js';
import { ensureUserAgentColumns } from '../services/dbInitService.js';
import { ensureOperatorAccounts } from '../services/userSeedService.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/cryptoUtils.js';
import { writeAuditLog } from '../services/auditService.js';

const router = Router();

const ctrl = createUserController({
  userManagementService,
  audit: writeAuditLog,
});

const syncOperators = createSyncOperatorsHandler({
  ensureColumns: ensureUserAgentColumns,
  seedOperators: () => ensureOperatorAccounts({ userRepo: userRepository, hashPassword }),
  listUsers: () => userManagementService.listUsers(),
  audit: writeAuditLog,
});

const canView = requireRole('sysadmin', 'admin', 'supervisor');
const canManage = requireRole('sysadmin', 'admin');

router.get('/', canView, ctrl.listUsers);
router.post('/sync-operators', canManage, syncOperators);
router.post('/', canManage, ctrl.createUser);
router.put('/:id', canManage, ctrl.updateUser);
router.post('/:id/reset-password', canManage, ctrl.resetPassword);
router.patch('/:id/status', canManage, ctrl.setStatus);
router.put('/:id/totp', canManage, ctrl.configureTotp);
router.delete('/:id', canManage, ctrl.deleteUser);

export default router;
