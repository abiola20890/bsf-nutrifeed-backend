import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Please use a valid email address')
    .trim()
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100),

  role: z
    .enum(['farmer', 'admin'], {
      errorMap: () => ({ message: 'Role must be farmer or admin' }),
    })
    .optional()
    .default('farmer'),

  farmName: z.string().trim().optional(),
  location: z.string().trim().optional(),
}).strict();

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please use a valid email address')
    .trim()
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
}).strict();