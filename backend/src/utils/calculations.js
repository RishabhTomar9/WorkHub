/**
 * Utility functions for calculating worker payments and remaining amounts
 */

/**
 * Calculate worker earnings based on attendance
 * @param {Object} worker - Worker object with wageRate
 * @param {Array} attendance - Array of attendance records
 * @returns {Object} - { earnedAmount, presentDays, halfDays }
 */
export const calculateWorkerEarnings = (worker, attendance = []) => {
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const halfDays = attendance.filter(a => a.status === 'halfday').length;
  
  let earnedAmount = 0;
  earnedAmount += presentDays * (worker.wageRate || 0);
  earnedAmount += halfDays * ((worker.wageRate || 0) / 2);
  
  // Ensure non-negative values
  earnedAmount = Math.max(0, earnedAmount);
  
  return {
    earnedAmount,
    presentDays,
    halfDays
  };
};

/**
 * Calculate total payments for a worker
 * @param {Array} payments - Array of payment records
 * @returns {number} - Total amount paid
 */
export const calculateTotalPayments = (payments = []) => {
  return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

/**
 * Calculate remaining amount to be paid
 * @param {Object} worker - Worker object
 * @param {Array} attendance - Array of attendance records
 * @param {Array} payments - Array of payment records
 * @returns {Object} - Complete calculation summary
 */
export const calculateWorkerSummary = (worker, attendance = [], payments = []) => {
  const { earnedAmount, presentDays, halfDays } = calculateWorkerEarnings(worker, attendance);
  const totalPaid = calculateTotalPayments(payments);
  const remainingAmount = Math.max(0, earnedAmount - totalPaid);
  
  return {
    earnedAmount,
    totalPaid,
    remainingAmount,
    presentDays,
    halfDays,
    totalDays: presentDays + halfDays
  };
};

/**
 * Calculate site-wide statistics
 * @param {Array} workers - Array of worker objects
 * @param {Object} attendanceMap - Map of worker ID to attendance records
 * @param {Object} paymentsMap - Map of worker ID to payment records
 * @returns {Object} - Site-wide summary
 */
export const calculateSiteSummary = (workers = [], attendanceMap = {}, paymentsMap = {}) => {
  let totalEarned = 0;
  let totalPaid = 0;
  let totalWorkers = workers.length;
  
  workers.forEach(worker => {
    const attendance = attendanceMap[worker._id] || [];
    const payments = paymentsMap[worker._id] || [];
    const summary = calculateWorkerSummary(worker, attendance, payments);
    
    totalEarned += summary.earnedAmount;
    totalPaid += summary.totalPaid;
  });
  
  const totalRemaining = Math.max(0, totalEarned - totalPaid);
  
  return {
    totalWorkers,
    totalEarned,
    totalPaid,
    totalRemaining
  };
};

/**
 * Validate and sanitize numeric values
 * @param {*} value - Value to validate
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Validated number
 */
export const sanitizeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) || num < 0 ? defaultValue : num;
};
