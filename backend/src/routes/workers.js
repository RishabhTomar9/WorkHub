import express from 'express';
import firebaseAuth from '../middleware/firebaseAuth.js';
import * as workerController from '../controllers/workerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', firebaseAuth, requireAuth, workerController.addWorker);
router.get('/site/:siteId', firebaseAuth, workerController.getWorkersBySite);
router.put('/:id', firebaseAuth, requireAuth, workerController.updateWorker);
router.delete('/:id', firebaseAuth, requireAuth, workerController.deleteWorker);

export default router;
