import { Router } from 'express';
import {
  createLog,
  getLogs,
  getDashboard,
} from '../controllers/monitor.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { validateObjectId } from '../middlewares/validateObjectId.js';
import { createLogSchema } from '../validation/monitor.validation.js';

const router = Router();

router.use(protect);

router.post('/', validate(createLogSchema), createLog);

// 🔥 FIXED ORDER
router.get('/dashboard', getDashboard);
router.get('/:feedRecordId', validateObjectId('feedRecordId'), getLogs);

export default router;