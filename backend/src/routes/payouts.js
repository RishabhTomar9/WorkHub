import express from 'express';
import Attendance from '../models/Attendance.js';
import Worker from '../models/Worker.js';
import Site from '../models/Site.js';
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

    const attendances = await Attendance.find({
      worker: req.params.workerId,
      date: { $gte: from, $lte: to }
    });

    let daysPresent = 0;
    let totalHours = 0;
    let totalPayout = 0;

    attendances.forEach(a => {
      const hours = a.hoursWorked || 0;
      if (a.status === 'present') {
        daysPresent++;
        if (worker.wageType === 'hour') {
          totalPayout += (worker.wageRate || 0) * hours;
        } else if (worker.wageType === 'day') {
          totalPayout += worker.wageRate || 0;
        } else if (worker.wageType === 'month') {
          const assumedWorkingDays = 26;
          totalPayout += (worker.wageRate || 0) / assumedWorkingDays;
        }
      }
      totalHours += hours;
    });

    res.json({
      workerId: worker._id,
      workerName: worker.name,
      site: site.name,
      from,
      to,
      dailyWage: worker.wageRate,
      daysPresent,
      totalHours,
      totalPayout
    });
  } catch (err) {
    next(err);
  }
});

export default router;
