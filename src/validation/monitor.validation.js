import { z } from 'zod';
export const createLogSchema = z.object({
  feedRecord: z
    .string({ required_error: 'Feed record ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),

  larvaeGrowth: z.object({
    currentWeight: z.coerce.number().min(0),
    growthStage: z.enum(
      ['egg', 'young_larvae', 'mature_larvae', 'prepupae'],
      { errorMap: () => ({ message: 'Invalid growth stage' }) }
    ),
    mortality: z.coerce.number().min(0).max(100).optional(),
  }),

  environment: z.object({
    temperature: z.coerce.number().min(0).optional(),
    humidity: z.coerce.number().min(0).max(100).optional(),
    pH: z.coerce.number().min(0).max(14).optional(),
  }).optional(),

  dailyInput: z.coerce.number().min(0).optional(),
  dailyOutput: z.coerce.number().min(0).optional(),

  logDate: z.coerce.date().optional(),

  remarks: z.string().trim().optional(),
}).strict();