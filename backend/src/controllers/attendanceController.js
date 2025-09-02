import Attendance from "../models/Attendance.js";
import Site from "../models/Site.js";
import Worker from "../models/Worker.js";

// Helper for date in YYYY-MM-DD
const toYMD = (dateObj) => (dateObj ? new Date(dateObj) : new Date()).toISOString().slice(0, 10);

// GET attendance records for a site by date
export const getAttendanceBySite = async (req, res) => {
  try {
    const { id } = req.params; // siteId
    const { date } = req.query;

    if (!id) return res.status(400).json({ message: "Site ID is required" });
    if (!date) return res.status(400).json({ message: "Date (YYYY-MM-DD) is required" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Invalid date format" });

    const site = await Site.findById(id);
    if (!site) return res.status(404).json({ message: "Site not found" });

    const records = await Attendance.find({ site: id, date })
      .populate("worker", "name role wageRate wageType");

    res.json(records);
  } catch (err) {
    console.error("❌ Error in getAttendanceBySite:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or update attendance (authenticated)
export const createOrUpdateAttendance = async (req, res) => {
  try {
    const { workerId, siteId, date, checkIn, checkOut, status, notes, hoursWorked } = req.body;
    if (!workerId || !siteId) return res.status(400).json({ error: "workerId and siteId required" });

    const site = await Site.findById(siteId);
    if (!site) return res.status(404).json({ error: "Site not found" });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: "Forbidden" });

    const worker = await Worker.findOne({ _id: workerId, site: siteId });
    if (!worker) return res.status(404).json({ error: "Worker not found for this site" });

    const day = date || toYMD();
    let attendance = await Attendance.findOne({ worker: workerId, site: siteId, date: day });

    if (!attendance) {
      attendance = new Attendance({
        worker: workerId,
        site: siteId,
        date: day,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        status: status || (checkIn ? "present" : "absent"),
        notes,
        hoursWorked: typeof hoursWorked === 'number' ? hoursWorked : undefined
      });
    } else {
      if (checkIn) attendance.checkIn = new Date(checkIn);
      if (checkOut) attendance.checkOut = new Date(checkOut);
      if (status) attendance.status = status;
      if (notes) attendance.notes = notes;
      if (typeof hoursWorked === 'number') attendance.hoursWorked = hoursWorked;
    }

    await attendance.save();
    await attendance.populate("worker");
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Bulk create/update attendance for many workers in a site and date
export const bulkUpsertAttendance = async (req, res) => {
  try {
    const { siteId, date, records } = req.body;
    if (!siteId || !Array.isArray(records)) {
      return res.status(400).json({ error: "siteId and records[] required" });
    }

    const site = await Site.findById(siteId);
    if (!site) return res.status(404).json({ error: "Site not found" });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: "Forbidden" });

    const day = date || toYMD();
    const results = [];
    for (const r of records) {
      const { workerId, status, hoursWorked, checkIn, checkOut, notes } = r;
      if (!workerId) continue;
      const worker = await Worker.findOne({ _id: workerId, site: siteId });
      if (!worker) continue;

      let attendance = await Attendance.findOne({ worker: workerId, site: siteId, date: day });
      if (!attendance) {
        attendance = new Attendance({
          worker: workerId,
          site: siteId,
          date: day,
          status: status || "absent",
          notes,
        });
      }
      if (status) attendance.status = status;
      if (typeof hoursWorked === 'number') attendance.hoursWorked = hoursWorked;
      if (checkIn) attendance.checkIn = new Date(checkIn);
      if (checkOut) attendance.checkOut = new Date(checkOut);

      await attendance.save();
      results.push(attendance);
    }

    res.json({ updated: results.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
