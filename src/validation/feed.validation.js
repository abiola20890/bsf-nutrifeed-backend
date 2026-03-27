import { z } from 'zod';

const baseFeedSchema = z.object({
  batchId: z
    .string({ required_error: 'Batch ID is required' })
    .trim()
    .toUpperCase(),

  inputs: z.object({
    organicWaste: z.coerce.number().min(0),
    waterUsed: z.coerce.number().min(0).optional(),
    additives: z.string().trim().optional(),
  }),

  outputs: z.object({
    feedProduced: z.coerce.number().min(0).optional(),
    larvaeHarvested: z.coerce.number().min(0).optional(),
    compostGenerated: z.coerce.number().min(0).optional(),
  }).optional(),

  status: z.enum(['ongoing', 'completed', 'failed']).optional(),

  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),

  notes: z.string().trim().optional(),
}).strict();

export const createFeedSchema = baseFeedSchema.refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const updateFeedSchema = baseFeedSchema
  .partial()
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate > data.startDate;
      }
      return true; // ✅ if only endDate is sent, skip check — handled in controller
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );