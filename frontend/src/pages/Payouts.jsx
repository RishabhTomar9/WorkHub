import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { setAuthToken } from "../api/api";
import { auth } from "../firebase";
import ShareMenu from "../components/ShareMenu"; 
import { motion, AnimatePresence } from "framer-motion";
import { FaMoneyBillWave, FaCalendarAlt, FaBuilding, FaUser, FaPrint, FaDownload, FaSpinner, FaExclamationTriangle, FaSave, FaWhatsapp, FaCheckCircle, FaClock, FaTimes, FaImage } from "react-icons/fa";

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

  // Compute stats for sites (stable identity via useCallback)
  const fetchSiteStats = useCallback(async (sitesData) => {
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
                // Defensive: some attendance records may have a null `worker` (orphaned entries)
                const attendance = attendanceRes.data.find(a => a && a.worker && a.worker._id === worker._id);
                
                if (attendance) {
                  const earned = attendance.status === 'present' ? worker.wageRate : 
                               attendance.status === 'halfday' ? worker.wageRate / 2 : 0;
                  totalEarned += earned;
                }
              } catch (err) {
                console.debug('attendance fetch error', err);
              }
            }
            
            // Get payments for this worker
            try {
              const paymentsRes = await api.get(`/payments/worker/${worker._id}?startDate=${from}&endDate=${to}`);
              const payments = paymentsRes.data;
              totalPaid += payments.reduce((sum, p) => sum + p.amount, 0);
            } catch (err) {
              console.debug('payments fetch error', err);
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
  }, [from, to]);

  // Set default date range to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setFrom(firstDay.toISOString().slice(0, 10));
    setTo(today.toISOString().slice(0, 10));
  }, [fetchSiteStats]);
  useEffect(() => {
    let mounted = true;

    const loadSites = async () => {
      try {
        // Try cache first (fast)
        const cache = await import('../utils/cache');
        const cached = cache.getCached('sites');
        if (cached && mounted) {
          setSites(cached);
          // still refresh in background
        }

        // Ensure token and fetch fresh sites
        const token = await auth.currentUser.getIdToken();
        setAuthToken(token);
        const res = await api.get("/sites");
        if (mounted) setSites(res.data);
        // store fresh data in cache for next load
        cache.setCached('sites', res.data, 1000 * 60 * 10); // 10m
        await fetchSiteStats(res.data);
      } catch (err) {
        setError("Failed to fetch sites");
        console.error(err);
      }
    };

    // fast path: listen for App-level cached sites event
    function onCachedSites(e) {
      if (e?.detail) setSites(e.detail);
    }
    window.addEventListener('workhub:sites', onCachedSites);

    loadSites();

    return () => { mounted = false; window.removeEventListener('workhub:sites', onCachedSites); };
  }, [fetchSiteStats]);

  

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
      // Compute site-level totals for UI
      if (res.data && res.data.results) {
        const totalEarned = res.data.results.reduce((sum, w) => sum + (w.totalPayout || 0), 0);
        // totalPaid isn't returned from this endpoint; infer from siteStats if available
        const totalPaid = (siteStats[selectedSite] && siteStats[selectedSite].totalPaid) || 0;
        const totalRemaining = totalEarned - totalPaid;
        setSiteStats(prev => ({ ...prev, [selectedSite]: { ...(prev[selectedSite] || {}), totalEarned, totalPaid, remainingAmount: totalRemaining } }));
      }
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

  const generateWhatsAppMessage = (slip) => {
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('en-IN');
    };

    const formatCurrency = (amount) => {
      return `₹${amount.toFixed(0)}`;
    };

    let message = `🧾 *Salary Slip*\n\n`;
    message += `👤 *Worker:* ${slip.workerName}\n`;
    message += `🏢 *Site:* ${slip.site}\n`;
    message += `📅 *Period:* ${formatDate(slip.from)} - ${formatDate(slip.to)}\n\n`;
    
    message += `📊 *Attendance Summary:*\n`;
    message += `• Days Present: ${slip.daysPresent}\n`;
    message += `• Half Days: ${slip.daysHalf || 0}\n`;
    message += `• Total Hours: ${slip.totalHours}\n`;
    message += `• Daily Wage: ${formatCurrency(slip.wageRate)}\n\n`;
    
    message += `💰 *Payment Summary:*\n`;
    message += `• Total Earned: ${formatCurrency(slip.totalEarned)}\n`;
    message += `• Total Paid: ${formatCurrency(slip.totalPaid)}\n`;
    message += `• Remaining: ${formatCurrency(slip.remainingAmount)}\n\n`;
    
    if (slip.payments && slip.payments.length > 0) {
      message += `💳 *Payment Details:*\n`;
      slip.payments.forEach((payment) => {
        message += `• ${formatDate(payment.date)} - ${formatCurrency(payment.amount)} (${payment.paymentType})\n`;
        if (payment.notes) {
          message += `   Note: ${payment.notes}\n`;
        }
      });
      message += `\n`;
    }
    
    message += `Generated on: ${new Date().toLocaleDateString('en-IN')}\n`;
    message += `Generated by: Work Hub Management System`;
    
    return encodeURIComponent(message);
  };

  const captureSalarySlipImage = async () => {
    try {
      // Create a simplified version of the salary slip for image capture
      const simplifiedElement = document.createElement('div');
      simplifiedElement.style.cssText = `
        background: #1e293b;
        color: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        width: 800px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      `;

      // Get the worker slip data
      const slip = workerSlip;
      if (!slip) return null;

      // Create HTML content for the simplified slip
      const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');
      const formatCurrency = (amount) => `₹${amount?.toFixed(0) || 0}`;

      simplifiedElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🧾 Salary Slip</h1>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <!-- Worker Details -->
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
            <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Worker Details</h3>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Name:</strong> ${slip.workerName}</p>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Role:</strong> ${slip.workerRole || 'Worker'}</p>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Site:</strong> ${slip.site}</p>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Period:</strong> ${formatDate(slip.from)} → ${formatDate(slip.to)}</p>
          </div>
          
          <!-- Attendance Details -->
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
            <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Attendance Details</h3>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Days Present:</strong> ${slip.daysPresent}</p>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Half Days:</strong> ${slip.daysHalf || 0}</p>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Total Days:</strong> ${slip.totalDays}</p>
            <p style="margin: 5px 0; color: #bfdbfe;"><strong style="color: white;">Wage Rate:</strong> ${formatCurrency(slip.wageRate)}/${slip.wageType || 'day'}</p>
          </div>
          
          <!-- Payment Summary -->
          <div style="background: rgba(34, 197, 94, 0.2); padding: 15px; border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.3);">
            <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Payment Summary</h3>
            <p style="margin: 5px 0; color: #bbf7d0;"><strong style="color: white;">Total Earned:</strong> ${formatCurrency(slip.totalEarned)}</p>
            <p style="margin: 5px 0; color: #bbf7d0;"><strong style="color: white;">Total Paid:</strong> ${formatCurrency(slip.totalPaid)}</p>
            <p style="margin: 5px 0; color: #bbf7d0;"><strong style="color: white;">Remaining:</strong> <span style="color: ${slip.remainingAmount > 0 ? '#facc15' : '#4ade80'};">${formatCurrency(slip.remainingAmount)}</span></p>
          </div>
        </div>
        
        ${slip.payments && slip.payments.length > 0 ? `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
          <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Payment History</h3>
          <div style="max-height: 200px; overflow-y: auto;">
            ${slip.payments.map((payment) => `
              <div style="background: rgba(255, 255, 255, 0.05); padding: 10px; margin: 5px 0; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: white; font-weight: bold;">${formatCurrency(payment.amount)}</span>
                  <span style="color: #bfdbfe; font-size: 14px;">${formatDate(payment.date)}</span>
                </div>
                <div style="color: #bfdbfe; font-size: 14px; text-transform: capitalize;">${payment.paymentType}</div>
                ${payment.notes ? `<div style="color: #9ca3af; font-size: 12px; font-style: italic; margin-top: 5px;">${payment.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          Generated on: ${new Date().toLocaleDateString('en-IN')} | Work Hub Management System
        </div>
      `;

      // Temporarily add to DOM
      document.body.appendChild(simplifiedElement);

      // Use html2canvas on the simplified element
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(simplifiedElement, {
        backgroundColor: '#1e293b',
        scale: 2,
        width: 800,
        height: simplifiedElement.scrollHeight
      });

      // Remove from DOM
      document.body.removeChild(simplifiedElement);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    }
  };

  const shareOnWhatsApp = async (slip) => {
    const message = generateWhatsAppMessage(slip);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareImageOnWhatsApp = async (slip) => {
    try {
      // Capture the image using the simplified method
      const imageDataUrl = await captureSalarySlipImage();
      if (!imageDataUrl) {
        // Fallback: Open print dialog for PDF generation
        setError('Image capture failed. Opening print dialog for PDF generation...');
        setTimeout(() => {
          window.print();
        }, 1000);
        return;
      }

      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Create a temporary link to download the image
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-slip-${slip.workerName}-${slip.from}-${slip.to}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      setError(null);
      alert('Salary slip image saved! You can now share it on WhatsApp.');
      
    } catch (error) {
      console.error('Error sharing image:', error);
      setError('Failed to capture image. Opening print dialog for PDF generation...');
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  };

  const generatePDFForSharing = () => {
    // Create a print-optimized version
    const printWindow = window.open('', '_blank');
    const slip = workerSlip;
    
    if (!slip) return;

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');
    const formatCurrency = (amount) => `₹${amount?.toFixed(0) || 0}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Slip - ${slip.workerName}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: black; 
            color: black;
          }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .card { 
            border: 1px solid #e5e7eb; 
            padding: 15px; 
            border-radius: 8px; 
            background: #f9fafb;
          }
          .card h3 { color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }
          .payment-card { 
            background: #f0fdf4; 
            border: 1px solid #22c55e; 
          }
          .payment-card h3 { color: #15803d; }
          .payment-item { margin: 5px 0; }
          .payment-item strong { color: #1f2937; }
          .remaining { color: #d97706; font-weight: bold; }
          .paid { color: #16a34a; font-weight: bold; }
          .payment-history { 
            border: 1px solid #e5e7eb; 
            padding: 15px; 
            border-radius: 8px; 
            background: #f9fafb;
            margin-top: 20px;
          }
          .payment-entry { 
            border: 1px solid #e5e7eb; 
            padding: 10px; 
            margin: 5px 0; 
            border-radius: 5px; 
            background: white;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          @media print {
            body { margin: 0; padding: 15px; }
            .grid { grid-template-columns: 1fr 1fr 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧾 Salary Slip</h1>
        </div>
        
        <div class="grid">
          <div class="card">
            <h3>Worker Details</h3>
            <div class="payment-item"><strong>Name:</strong> ${slip.workerName}</div>
            <div class="payment-item"><strong>Role:</strong> ${slip.workerRole || 'Worker'}</div>
            <div class="payment-item"><strong>Site:</strong> ${slip.site}</div>
            <div class="payment-item"><strong>Period:</strong> ${formatDate(slip.from)} → ${formatDate(slip.to)}</div>
          </div>
          
          <div class="card">
            <h3>Attendance Details</h3>
            <div class="payment-item"><strong>Days Present:</strong> ${slip.daysPresent}</div>
            <div class="payment-item"><strong>Half Days:</strong> ${slip.daysHalf || 0}</div>
            <div class="payment-item"><strong>Total Days:</strong> ${slip.totalDays}</div>
            <div class="payment-item"><strong>Wage Rate:</strong> ${formatCurrency(slip.wageRate)}/${slip.wageType || 'day'}</div>
          </div>
          
          <div class="card payment-card">
            <h3>Payment Summary</h3>
            <div class="payment-item"><strong>Total Earned:</strong> ${formatCurrency(slip.totalEarned)}</div>
            <div class="payment-item"><strong>Total Paid:</strong> ${formatCurrency(slip.totalPaid)}</div>
            <div class="payment-item"><strong>Remaining:</strong> <span class="${slip.remainingAmount > 0 ? 'remaining' : 'paid'}">${formatCurrency(slip.remainingAmount)}</span></div>
          </div>
        </div>
        
        ${slip.payments && slip.payments.length > 0 ? `
        <div class="payment-history">
          <h3>Payment History</h3>
          ${slip.payments.map((payment) => `
            <div class="payment-entry">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${formatCurrency(payment.amount)}</strong>
                <span style="color: #6b7280; font-size: 14px;">${formatDate(payment.date)}</span>
              </div>
              <div style="color: #6b7280; font-size: 14px; text-transform: capitalize;">${payment.paymentType}</div>
              ${payment.notes ? `<div style="color: #9ca3af; font-size: 12px; font-style: italic; margin-top: 5px;">${payment.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <div class="footer">
          Generated on: ${new Date().toLocaleDateString('en-IN')} | Work Hub Management System
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:border-black { border-color: black !important; }
          body { background: white !important; }
          .min-h-screen { min-height: auto !important; }
          .px-4 { padding-left: 0 !important; padding-right: 0 !important; }
          .py-6 { padding-top: 0 !important; padding-bottom: 0 !important; }
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-3">💰 Payout Manager</h1>
          <p className="text-blue-200 text-lg">Track worker payments and remaining amounts</p>
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
            <div className="col-span-1">
              <label className="block text-white font-medium mb-2 text-base sm:text-lg">Select Site</label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-lg " />
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
                {loading ? <FaSpinner className="animate-spin text-xl" /> : <FaMoneyBillWave className=" text-2xl" />}
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
              <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 mr-2">
                    <FaBuilding className="text-blue-600 text-5xl" />
                  </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                   {results.site}
                </h3>
                <p className="text-blue-200 text-sm sm:text-base">
                  Period: {results.from} → {results.to}
                </p>
              </div>
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
                        <FaUser className="text-blue-600 text-5xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white text-xl truncate">{w.name}</h4>
                        <p className="text-lg text-blue-200">
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
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 salary-slip-container relative"
          >
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Left: Title */}
              <h3 className="text-3xl font-bold text-white">🧾 Salary Slip</h3>

              {/* Right: Share + Close */}
              <div className="flex items-center gap-3">
                <ShareMenu
                  workerSlip={workerSlip}
                  shareImageOnWhatsApp={shareImageOnWhatsApp}
                  shareOnWhatsApp={shareOnWhatsApp}
                  generatePDFForSharing={generatePDFForSharing}
                />

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setWorkerSlip(null)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors print:hidden"
                >
                  <FaTimes className="text-lg" />
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Worker Details & Attendance */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 text-lg">Worker Details</h4>
                  <div className="space-y-2 text-blue-200 text-base">
                    <p><strong className="text-white">Name:</strong> {workerSlip.workerName}</p>
                    <p><strong className="text-white">Role:</strong> {workerSlip.workerRole || 'Worker'}</p>
                    <p><strong className="text-white">Site:</strong> {workerSlip.site}</p>
                    <p><strong className="text-white">Period:</strong> {new Date(workerSlip.from).toLocaleDateString('en-IN')} → {new Date(workerSlip.to).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 text-lg">Attendance Details</h4>
                  <div className="space-y-2 text-blue-200 text-base">
                    <p><strong className="text-white">Days Present:</strong> {workerSlip.daysPresent}</p>
                    <p><strong className="text-white">Half Days:</strong> {workerSlip.daysHalf || 0}</p>
                    <p><strong className="text-white">Total Days:</strong> {workerSlip.totalDays}</p>
                    <p><strong className="text-white">Wage Rate:</strong> ₹{workerSlip.wageRate}/{workerSlip.wageType || 'day'}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-6 border border-green-500/30">
                  <h4 className="text-white font-semibold mb-4 text-lg">Payment Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-200">Total Earned:</span>
                      <span className="text-green-400 font-bold text-lg">₹{workerSlip.totalEarned?.toFixed(0) || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-200">Total Paid:</span>
                      <span className="text-green-400 font-bold text-lg">₹{workerSlip.totalPaid?.toFixed(0) || 0}</span>
                    </div>
                    <div className="border-t border-green-400/30 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">Remaining:</span>
                        <span className={`font-bold text-xl ${workerSlip.remainingAmount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                          ₹{workerSlip.remainingAmount?.toFixed(0) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Type Breakdown */}
                {workerSlip.paymentTypeTotals && Object.keys(workerSlip.paymentTypeTotals).length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3 text-lg">Payment Breakdown</h4>
                    <div className="space-y-2 text-blue-200 text-base">
                      {Object.entries(workerSlip.paymentTypeTotals).map(([type, amount]) => (
                        <div key={type} className="flex justify-between">
                          <span className="capitalize">{type}:</span>
                          <span>₹{amount.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 text-lg">Payment History</h4>
                  {workerSlip.payments && workerSlip.payments.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {workerSlip.payments.map((payment, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-400 text-sm" />
                              <span className="text-white font-medium">₹{payment.amount.toFixed(0)}</span>
                            </div>
                            <span className="text-blue-200 text-sm">
                              {new Date(payment.date).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="text-blue-200 text-sm capitalize">
                            {payment.paymentType}
                          </div>
                          {payment.notes && (
                            <div className="text-gray-300 text-xs mt-1 italic">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaClock className="text-gray-400 text-2xl mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No payments recorded for this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
      )}
      </div>
    </div>
  );
}
