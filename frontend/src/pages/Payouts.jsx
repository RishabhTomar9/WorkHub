import React, { useEffect, useState } from "react";
import api from "../api/api";
import { setAuthToken } from "../api/api";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FaMoneyBillWave, FaCalendarAlt, FaBuilding, FaUsers, FaPrint, FaDownload, FaSpinner, FaExclamationTriangle } from "react-icons/fa";

export default function Payouts() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState(null);
  const [workerSlip, setWorkerSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [siteStats, setSiteStats] = useState({});

  // Set default date range to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFrom(firstDay.toISOString().slice(0, 10));
    setTo(today.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      try {
      const token = await auth.currentUser.getIdToken();
      setAuthToken(token);
      const res = await api.get("/sites");
      setSites(res.data);
        await fetchSiteStats(res.data);
      } catch (err) {
        setError("Failed to fetch sites");
        console.error(err);
      }
    };
    fetchSites();
  }, []);

  const fetchSiteStats = async (sitesData) => {
    try {
      const stats = {};
      for (const site of sitesData) {
        try {
          const workersRes = await api.get(`/workers/site/${site._id}`);
          const workers = workersRes.data;
          
          let totalEarned = 0;
          let totalPaid = 0;
          
          for (const worker of workers) {
            // Get attendance for the date range
            if (from && to) {
              try {
                const attendanceRes = await api.get(`/attendance/site/${site._id}?date=${from}`);
                const attendance = attendanceRes.data.find(a => a.worker._id === worker._id);
                
                if (attendance) {
                  const earned = attendance.status === 'present' ? worker.wageRate : 
                               attendance.status === 'halfday' ? worker.wageRate / 2 : 0;
                  totalEarned += earned;
                }
              } catch (err) {
                // No attendance data
              }
            }
            
            // Get payments for this worker
            try {
              const paymentsRes = await api.get(`/payments/worker/${worker._id}?startDate=${from}&endDate=${to}`);
              const payments = paymentsRes.data;
              totalPaid += payments.reduce((sum, p) => sum + p.amount, 0);
            } catch (err) {
              // No payments yet
            }
          }
          
          stats[site._id] = {
            totalWorkers: workers.length,
            totalEarned,
            totalPaid,
            remainingAmount: totalEarned - totalPaid
          };
        } catch (err) {
          console.error(`Error fetching stats for site ${site._id}:`, err);
          stats[site._id] = {
            totalWorkers: 0,
            totalEarned: 0,
            totalPaid: 0,
            remainingAmount: 0
          };
        }
      }
      setSiteStats(stats);
    } catch (err) {
      console.error('Error fetching site stats:', err);
    }
  };

  const fetchSitePayouts = async () => {
    if (!selectedSite || !from || !to) {
      setError("Please select a site and date range");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/payouts/site/${selectedSite}`, {
        params: { from, to },
      });
      setResults(res.data);
      setWorkerSlip(null); // reset single worker slip
    } catch (err) {
      setError("Failed to fetch payouts");
      console.error(err);
    }
    setLoading(false);
  };

  const fetchWorkerSlip = async (workerId) => {
    if (!from || !to) {
      setError("Please select a date range");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/payouts/worker/${workerId}`, {
        params: { from, to },
      });
      setWorkerSlip(res.data);
    } catch (err) {
      setError("Failed to fetch worker slip");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-3">💰 Payout Manager</h1>
          <p className="text-blue-200 text-lg sm:text-xl">Track worker payments and remaining amounts</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 mb-6 border border-white/20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Site Selection */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-white font-medium mb-2 text-base sm:text-lg">Select Site</label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-sm sm:text-base" />
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 sm:py-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base sm:text-lg min-h-[52px]"
        >
                  <option value="" className="bg-gray-800">Select Site</option>
          {sites.map((s) => (
                    <option key={s._id} value={s._id} className="bg-gray-800">
              {s.name}
            </option>
          ))}
        </select>
              </div>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-white font-medium mb-2 text-base sm:text-lg">From Date</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-sm sm:text-base" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 sm:py-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base sm:text-lg min-h-[52px]"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-white font-medium mb-2 text-base sm:text-lg">To Date</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-sm sm:text-base" />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 sm:py-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base sm:text-lg min-h-[52px]"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
          onClick={fetchSitePayouts}
          disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-base sm:text-lg min-h-[52px]"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaMoneyBillWave />}
                <span>{loading ? "Loading..." : "Generate Payouts"}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3"
            >
              <FaExclamationTriangle />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-300 hover:text-red-100"
              >
                ×
        </button>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Site-wide Results */}
      {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 mb-6 border border-white/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                  📍 {results.site}
          </h3>
                <p className="text-blue-200 text-sm sm:text-base">
                  Period: {results.from} → {results.to}
                </p>
              </div>
              {siteStats[selectedSite] && (
                <div className="text-center sm:text-right flex-shrink-0">
                  <div className="text-white text-xs sm:text-sm">Total Remaining</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    ₹{siteStats[selectedSite].remainingAmount.toFixed(0)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {results.results.map((w, index) => (
                <motion.div
                  key={w.workerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[160px] sm:min-h-[180px]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <FaUsers className="text-blue-600 text-sm sm:text-base" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white text-base sm:text-lg truncate">{w.name}</h4>
                        <p className="text-sm sm:text-base text-blue-200">
                          {w.daysPresent} days | ₹{w.dailyWage}/day
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm sm:text-base text-gray-300 mb-1">Total Payout</div>
                    <div className="text-lg sm:text-xl font-bold text-green-400">
                      ₹{w.totalPayout || 0}
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchWorkerSlip(w.workerId)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px]"
                  >
                    <span>View Detailed Slip</span>
                  </motion.button>
                </motion.div>
              ))}
        </div>
          </motion.div>
      )}

      {/* Worker Salary Slip */}
      {workerSlip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-white">🧾 Salary Slip</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.print()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors text-base font-medium"
              >
                <FaPrint />
            Print / Save PDF
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 text-lg">Worker Details</h4>
                  <div className="space-y-2 text-blue-200 text-base">
                    <p><strong className="text-white">Name:</strong> {workerSlip.workerName}</p>
                    <p><strong className="text-white">Site:</strong> {workerSlip.site}</p>
                    <p><strong className="text-white">Period:</strong> {workerSlip.from} → {workerSlip.to}</p>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 text-lg">Attendance Details</h4>
                  <div className="space-y-2 text-blue-200 text-base">
                    <p><strong className="text-white">Days Present:</strong> {workerSlip.daysPresent}</p>
                    <p><strong className="text-white">Total Hours:</strong> {workerSlip.totalHours}</p>
                    <p><strong className="text-white">Daily Wage:</strong> ₹{workerSlip.dailyWage}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-6 border border-green-500/30">
                  <h4 className="text-white font-semibold mb-4 text-lg">Payment Summary</h4>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      ₹{workerSlip.totalPayout}
                    </div>
                    <div className="text-green-200 text-lg">Total Amount</div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 text-lg">Breakdown</h4>
                  <div className="space-y-2 text-blue-200 text-base">
                    <div className="flex justify-between">
                      <span>Base Pay:</span>
                      <span>₹{workerSlip.daysPresent * workerSlip.dailyWage}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/20 pt-2">
                      <span className="font-semibold text-white">Total:</span>
                      <span className="font-semibold text-white">₹{workerSlip.totalPayout}</span>
                    </div>
                  </div>
                </div>
              </div>
        </div>
          </motion.div>
      )}
      </div>
    </div>
  );
}
