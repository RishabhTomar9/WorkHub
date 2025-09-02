import express from 'express';
import firebaseAuth from '../middleware/firebaseAuth.js';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// All routes require authentication
router.use(firebaseAuth);

// Payment CRUD operations
router.post('/', paymentController.addPayment);
router.get('/worker/:workerId', paymentController.getWorkerPayments);
router.get('/site/:siteId', paymentController.getSitePayments);
router.put('/:paymentId', paymentController.updatePayment);
router.delete('/:paymentId', paymentController.deletePayment);

// Worker summary with attendance and payments
router.get('/summary/:workerId', paymentController.getWorkerSummary);

export default router;
