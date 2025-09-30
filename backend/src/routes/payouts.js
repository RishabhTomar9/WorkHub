import express from 'express';
import Attendance from '../models/Attendance.js';
import Worker from '../models/Worker.js';
import Site from '../models/Site.js';
import Payment from '../models/Payment.js';
import firebaseAuth from '../middleware/firebaseAuth.js';

const router = express.Router();

// 📌 Site-wide payouts (all workers in site between dates)
router.get('/site/:siteId', firebaseAuth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to (YYYY-MM-DD) required' });

    const site = await Site.findById(req.params.siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    const attendances = await Attendance.find({
      site: req.params.siteId,
      date: { $gte: from, $lte: to }
    }).populate('worker');

    const agg = {};
    for (const a of attendances) {
      // Defensive: attendance entries may reference a deleted worker
      // (a.worker can be null). Skip those records to avoid runtime errors.
      if (!a.worker) {
        console.warn(`Orphaned attendance record ${a._id} for site ${req.params.siteId}`);
        continue;
      }

      const wid = String(a.worker._id);
      const name = a.worker.name;
      const wageRate = a.worker.wageRate || 0;
      const wageType = a.worker.wageType || 'day';

      if (!agg[wid]) {
        agg[wid] = { workerId: wid, name, totalHours: 0, wageRate, wageType, dailyWage: wageRate, totalPayout: 0, daysPresent: 0 };
      }

      const hours = a.hoursWorked || 0;
      if (a.status === 'present') {
        agg[wid].daysPresent += 1;
        if (wageType === 'hour') {
          agg[wid].totalPayout += hours * wageRate;
        } else if (wageType === 'day') {
          agg[wid].totalPayout += wageRate;
        } else if (wageType === 'month') {
          const assumedWorkingDays = 26;
          agg[wid].totalPayout += (wageRate / assumedWorkingDays);
        }
      }

      agg[wid].totalHours += hours;
    }

    const results = Object.values(agg).sort((a, b) => b.totalPayout - a.totalPayout);
    res.json({ from, to, site: site.name, results });
  } catch (err) {
    next(err);
  }
});

// 📌 Worker-specific payouts (salary slip)
router.get('/worker/:workerId', firebaseAuth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to (YYYY-MM-DD) required' });

    const worker = await Worker.findById(req.params.workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const site = await Site.findById(worker.site);
    if (!site || site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    // Get attendance records
    const attendances = await Attendance.find({
      worker: req.params.workerId,
      date: { $gte: from, $lte: to }
    }).sort({ date: 1 });

    // Get payment records
    const payments = await Payment.find({
      worker: req.params.workerId,
      date: { $gte: from, $lte: to }
    }).sort({ date: 1 });

    // Calculate earnings from attendance
    let daysPresent = 0;
    let daysHalf = 0;
    let totalHours = 0;
    let totalEarned = 0;

    attendances.forEach(a => {
      const hours = a.hoursWorked || 0;
      totalHours += hours;
      
      if (a.status === 'present') {
        daysPresent++;
        if (worker.wageType === 'hour') {
          totalEarned += (worker.wageRate || 0) * hours;
        } else if (worker.wageType === 'day') {
          totalEarned += worker.wageRate || 0;
        } else if (worker.wageType === 'month') {
          const assumedWorkingDays = 26;
          totalEarned += (worker.wageRate || 0) / assumedWorkingDays;
        }
      } else if (a.status === 'halfday') {
        daysHalf++;
        if (worker.wageType === 'hour') {
          totalEarned += (worker.wageRate || 0) * hours * 0.5;
        } else if (worker.wageType === 'day') {
          totalEarned += (worker.wageRate || 0) * 0.5;
        } else if (worker.wageType === 'month') {
          const assumedWorkingDays = 26;
          totalEarned += ((worker.wageRate || 0) / assumedWorkingDays) * 0.5;
        }
      }
    });

    // Calculate total paid amount
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = Math.max(0, totalEarned - totalPaid);

    // Group payments by type
    const paymentsByType = payments.reduce((acc, payment) => {
      if (!acc[payment.paymentType]) {
        acc[payment.paymentType] = [];
      }
      acc[payment.paymentType].push(payment);
      return acc;
    }, {});

    // Calculate totals by payment type
    const paymentTypeTotals = {};
    Object.keys(paymentsByType).forEach(type => {
      paymentTypeTotals[type] = paymentsByType[type].reduce((sum, p) => sum + p.amount, 0);
    });

    res.json({
      workerId: worker._id,
      workerName: worker.name,
      workerRole: worker.role,
      site: site.name,
      siteId: site._id,
      from,
      to,
      wageRate: worker.wageRate,
      wageType: worker.wageType,
      daysPresent,
      daysHalf,
      totalDays: daysPresent + daysHalf,
      totalHours,
      totalEarned,
      totalPaid,
      remainingAmount,
      payments: payments,
      paymentsByType: paymentsByType,
      paymentTypeTotals: paymentTypeTotals,
      attendance: attendances,
      // Legacy fields for backward compatibility
      dailyWage: worker.wageRate,
      totalPayout: totalEarned
    });
  } catch (err) {
    next(err);
  }
});

export default router;
