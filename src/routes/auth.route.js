import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validation/auth.validation.js';

const router = Router();

// Public
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected
router.get('/me', protect, getMe);

export default router;
