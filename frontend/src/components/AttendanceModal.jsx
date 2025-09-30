import React, { useState } from "react";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaSave, FaSpinner, FaCalendarAlt, FaClock, FaUser,FaCheckCircle,FaExclamationTriangle,FaTimesCircle } from "react-icons/fa";

export default function AttendanceModal({ worker, siteId, date, onClose, onSaved }) {
  const [status, setStatus] = useState(worker.attendance?.status || "absent");
  const [hours, setHours] = useState(worker.attendance?.hoursWorked || 0);
  const [saving, setSaving] = useState(false);

  async function saveAttendance() {
    try {
      setSaving(true);
      const numericHours = Math.max(0, parseFloat(hours) || 0);
      await api.post(`/attendance/mark`, {
        siteId: siteId,
        workerId: worker._id,
        date,
        status,
        hoursWorked: numericHours,
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert("❌ Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-white/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUser className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Mark Attendance</h2>
                <p className="text-blue-200 text-base">{worker.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Date Display */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <FaCalendarAlt className="text-blue-400" />
              <span className="text-white font-medium text-base">{date}</span>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-white font-medium mb-3 text-lg">Attendance Status</label>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatus("present")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === "present"
                      ? "bg-green-600 border-green-500 text-white"
                      : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <div className="text-center">
                    <FaCheckCircle className="text-2xl mb-1 text-green-100 mx-auto" />
                    <div className="text-base font-medium">Present</div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatus("halfday")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === "halfday"
                      ? "bg-yellow-600 border-yellow-500 text-white"
                      : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <div className="text-center">
                    <FaExclamationTriangle className="text-2xl mb-1 text-yellow-200 mx-auto" />
                    <div className="text-base font-medium">Half Day</div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatus("absent")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    status === "absent"
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <div className="text-center">
                    <FaTimesCircle className="text-2xl mb-1 text-red-200 mx-auto" />
                    <div className="text-base font-medium">Absent</div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Hours Worked */}
            <div>
              <label className="block text-white font-medium mb-3 text-lg">Hours Worked</label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base"
                  placeholder="Enter hours worked"
                  min="0"
                  max="24"
                  step="0.5"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-4 py-3 rounded-lg transition-colors text-base font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveAttendance}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-base font-medium"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Attendance
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
