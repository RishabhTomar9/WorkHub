import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaSave, 
  FaCalendarAlt, 
  FaUserPlus,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSpinner
} from "react-icons/fa";
import { siteService, workerService, attendanceService, paymentService } from "../api/attendanceService";

const AttendanceManager = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workerPayments, setWorkerPayments] = useState({});
  
  // UI States
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [newWorker, setNewWorker] = useState({ name: '', role: 'Worker', wageRate: 0, phone: '', address: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', date: selectedDate, paymentType: 'wage', notes: '' });

  // Load sites on component mount
  useEffect(() => {
    loadSites();
  }, []);

  // Load workers when site changes
  useEffect(() => {
    if (selectedSite) {
      loadWorkers();
      loadAttendance();
    }
  }, [selectedSite, selectedDate]);

  const loadSites = async () => {
    try {
      setLoading(true);
      const sitesData = await siteService.getSites();
      setSites(sitesData);
      if (sitesData.length > 0) {
        setSelectedSite(sitesData[0]);
      }
    } catch (err) {
      setError('Failed to load sites');
      console.error('Error loading sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const workersData = await workerService.getWorkersBySite(selectedSite._id);
      setWorkers(workersData);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading workers:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      const attendanceData = await attendanceService.getAttendanceBySite(selectedSite._id, selectedDate);
      setAttendanceRecords(attendanceData);
      await loadWorkerPayments();
    } catch (err) {
      setError('Failed to load attendance');
      console.error('Error loading attendance:', err);
    }
  };

  const loadWorkerPayments = async () => {
    try {
      const payments = {};
      for (const worker of workers) {
        try {
          const workerPayments = await paymentService.getWorkerPayments(worker._id);
          payments[worker._id] = workerPayments;
        } catch (err) {
          payments[worker._id] = [];
        }
      }
      setWorkerPayments(payments);
    } catch (err) {
      console.error('Error loading worker payments:', err);
    }
  };

  const markAttendance = async (workerId, status) => {
    try {
      await attendanceService.markAttendance({
        workerId,
        siteId: selectedSite._id,
        date: selectedDate,
        status
      });
      loadAttendance();
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
  };

  const addWorker = async () => {
    try {
      await workerService.addWorker({
        ...newWorker,
        siteId: selectedSite._id,
        wageRate: Number(newWorker.wageRate)
      });
      setNewWorker({ name: '', role: 'Worker', wageRate: 0, phone: '', address: '' });
      setShowAddWorker(false);
      loadWorkers();
    } catch (err) {
      setError('Failed to add worker');
      console.error('Error adding worker:', err);
    }
  };

  const addPayment = async (workerId) => {
    try {
      await paymentService.addPayment({
        workerId,
        siteId: selectedSite._id,
        amount: Number(paymentData.amount),
        date: paymentData.date,
        paymentType: paymentData.paymentType,
        notes: paymentData.notes
      });
      setPaymentData({ amount: '', date: selectedDate, paymentType: 'wage', notes: '' });
      setShowAddPayment(null);
      loadAttendance(); // Refresh to get updated payment data
    } catch (err) {
      setError('Failed to add payment');
      console.error('Error adding payment:', err);
    }
  };

  const getWorkerAttendance = (workerId) => {
    return attendanceRecords.find(record => record.worker._id === workerId);
  };

  const getWorkerPayments = async (workerId) => {
    try {
      const payments = await paymentService.getWorkerPayments(workerId);
      return payments;
    } catch (err) {
      console.error('Error loading payments:', err);
      return [];
    }
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present': return <FaCheckCircle className="text-green-500" />;
      case 'halfday': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'absent': return <FaTimesCircle className="text-red-500" />;
      default: return <FaClock className="text-gray-400" />;
    }
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 border-green-300';
      case 'halfday': return 'bg-yellow-100 border-yellow-300';
      case 'absent': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const calculateWorkerStats = (worker) => {
    const attendance = getWorkerAttendance(worker._id);
    const payments = workerPayments[worker._id] || [];
    
    let earnedAmount = 0;
    if (attendance) {
      earnedAmount = attendance.status === 'present' ? worker.wageRate : 
                   attendance.status === 'halfday' ? worker.wageRate / 2 : 0;
    }
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = earnedAmount - totalPaid;
    
    return {
      earnedAmount,
      totalPaid,
      remainingAmount
    };
  };

  if (loading && sites.length === 0) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <FaSpinner className="text-4xl text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-3">WorkHub Attendance</h1>
          <p className="text-blue-200 text-lg sm:text-xl">Manage worker attendance and payments</p>
        </motion.div>

                 {/* Controls */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 mb-6 border border-white/20"
         >
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Site Selection */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-white font-medium mb-2 text-base sm:text-lg">Select Site</label>
              <select
                value={selectedSite?._id || ''}
                onChange={(e) => setSelectedSite(sites.find(s => s._id === e.target.value))}
                className="w-full p-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base sm:text-lg min-h-[52px]"
              >
                {sites.map(site => (
                  <option key={site._id} value={site._id} className="bg-gray-800">
                    {site.name}
                  </option>
                ))}
              </select>
      </div>

            {/* Date Selection */}
            <div>
              <label className="block text-white font-medium mb-2 text-base sm:text-lg">Select Date</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-sm sm:text-base" />
        <input
          type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 p-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base sm:text-lg min-h-[52px]"
        />
      </div>
            </div>

            {/* Add Worker Button */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddWorker(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-base sm:text-lg min-h-[52px]"
              >
                <FaUserPlus className="text-sm sm:text-base" />
                <span className="hidden sm:inline">Add Worker</span>
                <span className="sm:hidden">Add</span>
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
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6"
            >
              {error}
                  <button
                onClick={() => setError(null)}
                className="float-right text-red-300 hover:text-red-100"
                  >
                ×
                  </button>
            </motion.div>
          )}
        </AnimatePresence>

                 {/* Workers Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {workers.map((worker, index) => {
            const attendance = getWorkerAttendance(worker._id);
            const stats = calculateWorkerStats(worker);
            return (
              <motion.div
                key={worker._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 transition-all duration-300 hover:bg-white/15 ${
                  attendance ? getAttendanceColor(attendance.status) : 'border-white/20'
                }`}
              >
                                {/* Worker Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{worker.name}</h3>
                    <p className="text-blue-200 text-base sm:text-lg">{worker.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-white font-medium text-base sm:text-lg">₹{worker.wageRate}/day</div>
                </div>
              </div>

                                {/* Stats Display */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 p-2 sm:p-3 bg-white/5 rounded-lg">
                                    <div className="text-center">
                    <div className="text-sm text-gray-300 mb-1">Earned</div>
                    <div className="text-sm sm:text-base font-semibold text-green-400">
                      ₹{stats.earnedAmount.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-300 mb-1">Paid</div>
                    <div className="text-sm sm:text-base font-semibold text-blue-400">
                      ₹{stats.totalPaid.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-300 mb-1">Remaining</div>
                    <div className={`text-sm sm:text-base font-semibold ${stats.remainingAmount > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ₹{stats.remainingAmount.toFixed(0)}
                    </div>
              </div>
              </div>

                {/* Attendance Status */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getAttendanceIcon(attendance?.status)}
                    <span className="text-white font-medium text-base sm:text-lg">
                      {attendance?.status || 'Not marked'}
                    </span>
              </div>
              </div>

                                {/* Attendance Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => markAttendance(worker._id, 'present')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-3 sm:py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px]"
                  >
                    <span>Present</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => markAttendance(worker._id, 'halfday')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-3 sm:py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px]"
                  >
                    <span>Half Day</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => markAttendance(worker._id, 'absent')}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-3 sm:py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px]"
                  >
                    <span>Absent</span>
                  </motion.button>
              </div>

              {/* Payment Section */}
                <div className="border-t border-white/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-base sm:text-lg">Payments</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddPayment(worker._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg text-sm sm:text-base flex items-center gap-1 transition-colors min-h-[36px] sm:min-h-[40px]"
                    >
                      <FaMoneyBillWave className="text-sm sm:text-base" />
                      <span>Add Payment</span>
                    </motion.button>
              </div>

                  {/* Payment Input */}
                  <AnimatePresence>
                    {showAddPayment === worker._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mb-3"
                      >
                        <input
                          type="number"
                          placeholder="Amount"
                          value={paymentData.amount}
                          onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                          className="w-full p-3 sm:p-4 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-base sm:text-lg min-h-[44px] sm:min-h-[48px]"
                        />
                        <input
                          type="date"
                          value={paymentData.date}
                          onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                          className="w-full p-3 sm:p-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 text-base sm:text-lg min-h-[44px] sm:min-h-[48px]"
                        />
                        <select
                          value={paymentData.paymentType}
                          onChange={(e) => setPaymentData({...paymentData, paymentType: e.target.value})}
                          className="w-full p-3 sm:p-4 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400 text-base sm:text-lg min-h-[44px] sm:min-h-[48px]"
                        >
                          <option value="wage" className="bg-gray-800">Wage</option>
                          <option value="bonus" className="bg-gray-800">Bonus</option>
                          <option value="advance" className="bg-gray-800">Advance</option>
                          <option value="other" className="bg-gray-800">Other</option>
                        </select>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addPayment(worker._id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-3 sm:py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px]"
                          >
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddPayment(null)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-3 sm:py-3 rounded-lg text-sm sm:text-base transition-colors min-h-[44px] sm:min-h-[48px]"
                          >
                            Cancel
                          </motion.button>
                    </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
        </div>

        {/* Add Worker Modal */}
        <AnimatePresence>
          {showAddWorker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-white/20"
              >
                <h3 className="text-2xl font-semibold text-white mb-6">Add New Worker</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Worker Name"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={newWorker.role}
                    onChange={(e) => setNewWorker({...newWorker, role: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                  />
                  <input
                    type="number"
                    placeholder="Daily Wage"
                    value={newWorker.wageRate}
                    onChange={(e) => setNewWorker({...newWorker, wageRate: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({...newWorker, phone: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newWorker.address}
                    onChange={(e) => setNewWorker({...newWorker, address: e.target.value})}
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-400 text-base"
                  />

                    <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addWorker}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors text-base font-medium"
                    >
                      Add Worker
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddWorker(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors text-base font-medium"
                    >
                      Cancel
                    </motion.button>
                  </div>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceManager;