import { Router } from 'express';
import { defaultCustomerController } from '../controllers/customerController.js';

const router = Router();

router.get('/', defaultCustomerController.listCustomers);
router.post('/', defaultCustomerController.createCustomer);
router.put('/:customerId', defaultCustomerController.updateCustomer);

export default router;
