import express from "express";
import { getAttendanceBySite, createOrUpdateAttendance, bulkUpsertAttendance } from "../controllers/attendanceController.js";
import firebaseAuth from "../middleware/firebaseAuth.js";

const router = express.Router();

// Public: get attendance by site + date
router.get("/site/:id", getAttendanceBySite);

// Authenticated: create/update attendance
router.post("/", firebaseAuth, createOrUpdateAttendance);
// Alias for legacy frontend
router.post("/mark", firebaseAuth, createOrUpdateAttendance);
// Bulk upsert
router.post("/bulk", firebaseAuth, bulkUpsertAttendance);

export default router;
