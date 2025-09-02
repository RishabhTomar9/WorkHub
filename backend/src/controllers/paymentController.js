import Payment from '../models/Payment.js';
import Worker from '../models/Worker.js';
import Site from '../models/Site.js';
import { calculateWorkerSummary } from '../utils/calculations.js';

// Add a payment for a worker
export const addPayment = async (req, res) => {
  try {
    const { workerId, siteId, amount, date, paymentType, notes } = req.body;

    // Validate required fields
    if (!workerId || !siteId || !amount || !date) {
      return res.status(400).json({ error: 'workerId, siteId, amount, and date are required' });
    }

    // Validate amount is positive number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    // Verify site ownership
    const site = await Site.findById(siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    // Verify worker exists and belongs to site
    const worker = await Worker.findOne({ _id: workerId, site: siteId });
    if (!worker) return res.status(404).json({ error: 'Worker not found for this site' });

    const payment = new Payment({
      worker: workerId,
      site: siteId,
      amount: numericAmount,
      date,
      paymentType: paymentType || 'wage',
      notes,
      createdBy: req.user.uid
    });

    await payment.save();
    await payment.populate('worker', 'name role wageRate');

    res.status(201).json(payment);
  } catch (err) {
    console.error('Add Payment Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get payments for a worker
export const getWorkerPayments = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!workerId) return res.status(400).json({ error: 'workerId is required' });

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Verify site ownership
    const site = await Site.findById(worker.site);
    if (!site || site.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let query = { worker: workerId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const payments = await Payment.find(query)
      .sort({ date: -1, createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get Worker Payments Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get payments for a site
export const getSitePayments = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate, workerId } = req.query;

    if (!siteId) return res.status(400).json({ error: 'siteId is required' });

    const site = await Site.findById(siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    let query = { site: siteId };
    
    if (workerId) query.worker = workerId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const payments = await Payment.find(query)
      .populate('worker', 'name role')
      .sort({ date: -1, createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get Site Payments Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update a payment
export const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, date, paymentType, notes } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Verify site ownership
    const site = await Site.findById(payment.site);
    if (!site || site.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      { 
        amount: amount ? Number(amount) : payment.amount,
        date: date || payment.date,
        paymentType: paymentType || payment.paymentType,
        notes: notes !== undefined ? notes : payment.notes
      },
      { new: true }
    ).populate('worker', 'name role');

    res.json(updatedPayment);
  } catch (err) {
    console.error('Update Payment Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete a payment
export const deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Verify site ownership
    const site = await Site.findById(payment.site);
    if (!site || site.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Payment.findByIdAndDelete(paymentId);
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Delete Payment Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get worker summary with attendance and payments
export const getWorkerSummary = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!workerId) return res.status(400).json({ error: 'workerId is required' });

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Verify site ownership
    const site = await Site.findById(worker.site);
    if (!site || site.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get attendance records
    const Attendance = (await import('../models/Attendance.js')).default;
    let attendanceQuery = { worker: workerId };
    if (startDate && endDate) {
      attendanceQuery.date = { $gte: startDate, $lte: endDate };
    }
    const attendance = await Attendance.find(attendanceQuery);

    // Get payments
    let paymentQuery = { worker: workerId };
    if (startDate && endDate) {
      paymentQuery.date = { $gte: startDate, $lte: endDate };
    }
    const payments = await Payment.find(paymentQuery);

    // Calculate summary using utility function
    const summary = calculateWorkerSummary(worker, attendance, payments);

    res.json({
      worker,
      attendance,
      payments,
      summary
    });
  } catch (err) {
    console.error('Get Worker Summary Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
