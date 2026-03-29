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
import { validateObjectId } from '../middlewares/validateObjectId.js';
import { createFeedSchema, updateFeedSchema } from '../validation/feed.validation.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/feed:
 *   get:
 *     summary: Get all feed records for logged-in farmer
 *     tags: [Feed Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ongoing, completed, failed]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Feed records retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     summary: Create a new feed record
 *     tags: [Feed Records]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedRecordInput'
 *     responses:
 *       201:
 *         description: Feed record created successfully
 *       400:
 *         description: Validation failed
 */
router.route('/')
  .get(getFeedRecords)
  .post(validate(createFeedSchema), createFeedRecord);

/**
 * @swagger
 * /api/feed/{id}:
 *   get:
 *     summary: Get a single feed record by ID
 *     tags: [Feed Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feed record retrieved
 *       404:
 *         description: Feed record not found
 *   put:
 *     summary: Update a feed record
 *     tags: [Feed Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedRecordInput'
 *     responses:
 *       200:
 *         description: Feed record updated
 *       404:
 *         description: Feed record not found
 *   delete:
 *     summary: Delete a feed record
 *     tags: [Feed Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feed record deleted
 *       404:
 *         description: Feed record not found
 */
router.route('/:id')
  .get(validateObjectId('id'),                             getFeedRecord)
  .put(validateObjectId('id'), validate(updateFeedSchema), updateFeedRecord)
  .delete(validateObjectId('id'),                          deleteFeedRecord);

export default router;