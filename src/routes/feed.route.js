import { Router } from 'express';
import {
  createFeedRecord,
  getFeedRecords,
  getFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
} from '../controllers/feed.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { validateObjectId } from '../middlewares/validateobjectID.js';
import { createFeedSchema, updateFeedSchema } from '../validation/feed.validation.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(getFeedRecords)
  .post(validate(createFeedSchema), createFeedRecord);

router.route('/:id')
  .get(validateObjectId('id'), getFeedRecord)
  .put(
    validateObjectId('id'),
    validate(updateFeedSchema),
    updateFeedRecord
  )
  .delete(validateObjectId('id'), deleteFeedRecord);

export default router;