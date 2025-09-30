import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/api";
import cache from '../utils/cache';
import { getAuth } from "firebase/auth";
import WorkerRow from "../components/WorkerRow";
import AttendanceModal from "../components/AttendanceModal";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMoreVertical, FiArchive, FiTrash2, FiRotateCcw, FiArrowLeft, FiUsers } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

export default function SiteView() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: "", role: "", wageRate: "", phone: "", address: "" });
  const [addingWorker, setAddingWorker] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [workerStats, setWorkerStats] = useState({});
  const [query, setQuery] = useState("");

  const presentCount = useMemo(() => Object.values(attendanceMap).filter(a => a.status === 'present').length, [attendanceMap]);
  const absentCount = useMemo(() => Math.max(0, workers.length - presentCount), [workers.length, presentCount]);
  // reference motion to satisfy some linters that don't detect JSX usage
  useMemo(() => { void motion; }, []);

  // Fetch site info
  const fetchSite = useCallback(async () => {
    try {
      // Try cache first
      const cacheKey = `site:${siteId}`;
      const cached = cache.getCached(cacheKey);
      if (cached) setSite(cached);

      const r = await api.get(`/sites/${siteId}`);
      setSite(r.data);
      cache.setCached(cacheKey, r.data, 1000 * 60 * 10); // 10 minutes
    } catch (err) {
      console.error('fetchSite error', err);
      toast.error("❌ Failed to fetch site");
    }
  }, [siteId]);

  useEffect(() => {
    if (siteId) fetchSite();
  }, [siteId, fetchSite]);

  const fetchWorkerStats = useCallback(async (workersData) => {
    try {
      const stats = {};
      for (const worker of workersData) {
        try {
          // Get attendance for this worker
          const attendanceRes = await api.get(`/attendance/site/${siteId}?date=${date}`);
          // Defensive: some attendance records may have a null worker reference (deleted/missing).
          const attendance = attendanceRes.data.find(a => a && a.worker && a.worker._id === worker._id);
          
          let earnedAmount = 0;
          if (attendance) {
            earnedAmount = attendance.status === 'present' ? worker.wageRate : 
                         attendance.status === 'halfday' ? worker.wageRate / 2 : 0;
          }
          
          // Get payments for this worker
          let totalPaid = 0;
          try {
            const paymentsKey = `payments:worker:${worker._id}`;
            const cachedPayments = cache.getCached(paymentsKey);
            let payments;
            if (cachedPayments) {
              payments = cachedPayments;
            } else {
              const paymentsRes = await api.get(`/payments/worker/${worker._id}`);
              payments = paymentsRes.data;
              cache.setCached(paymentsKey, payments, 1000 * 60 * 10);
            }
            totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          } catch (err) {
            // No payments yet
            console.info('payments fetch error for worker', worker._id, err?.message || err);
          }
          
          stats[worker._id] = {
            earnedAmount,
            totalPaid,
            remainingAmount: earnedAmount - totalPaid
          };
          } catch (err) {
          console.error(`Error fetching stats for worker ${worker._id}:`, err);
          stats[worker._id] = {
            earnedAmount: 0,
            totalPaid: 0,
            remainingAmount: 0
          };
        }
      }
      setWorkerStats(stats);
    } catch (err) {
      console.error('Error fetching worker stats:', err);
    }
  }, [siteId, date]);

  // Fetch workers
  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const workersKey = `workers:site:${siteId}`;
      const cached = cache.getCached(workersKey);
      if (cached) setWorkers(cached);

      const r = await api.get(`/workers/site/${siteId}`);
      setWorkers(r.data);
      cache.setCached(workersKey, r.data, 1000 * 60 * 10);
      await fetchWorkerStats(r.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('fetchWorkers error', err);
      toast.error("❌ Failed to fetch workers");
    }
  }, [siteId, fetchWorkerStats]);

  useEffect(() => {
    if (siteId) fetchWorkers();
  }, [siteId, fetchWorkers]);

  // Update worker details
  async function handleUpdateWorker(updatedWorker) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();

      const body = {
        name: updatedWorker.name,
        role: updatedWorker.role,
        wageRate: Number(updatedWorker.wageRate || 0),
        phone: updatedWorker.phone,
        address: updatedWorker.address,
      };

  // Backend expects PUT /api/workers/:id (see server routes)
  const idToUse = updatedWorker._id || updatedWorker.id;
  if (!idToUse) throw new Error('Worker id missing');
  await api.put(`/workers/${idToUse}`, body, { headers: { Authorization: `Bearer ${token}` } });
      setWorkers((prev) => prev.map((w) => (w._id === updatedWorker._id ? { ...w, ...body } : w)));
  // Invalidate workers cache so other pages fetch fresh data
  try { cache.clearCache(`workers:site:${siteId}`); } catch (e) { console.debug('cache clear failed', e); }
  // refresh stats for this worker - pass the latest workers list
  fetchWorkerStats(workers);
      return true;
    } catch (err) {
      console.error('Failed to update worker', err?.response?.data || err?.message || err);
      // rethrow so child can show error
      throw err;
    }
  }

  // Delete worker (shows confirmation modal)
  function handleDeleteWorker(worker) {
    setConfirmAction({
      text: `Delete ${worker.name} permanently?`,
      action: async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) throw new Error('Not logged in');
          const token = await user.getIdToken();
          await api.delete(`/workers/${worker._id}`, { headers: { Authorization: `Bearer ${token}` } });
          setWorkers((prev) => prev.filter((w) => w._id !== worker._id));
          // Invalidate workers list cache and today's attendance for this site
          try { cache.clearCache(`workers:site:${siteId}`); } catch (e) { console.debug('cache clear failed', e); }
          try { cache.clearCache(`attendance:site:${siteId}:date:${date}`); } catch (e) { console.debug('cache clear failed', e); }
          toast.success('Worker deleted');
        } catch (err) {
          console.error('Failed to delete worker', err);
          toast.error('❌ Failed to delete worker');
        }
      }
    });
  }

  // Fetch attendance
  const fetchAttendance = useCallback(async () => {
    try {
      const attendanceKey = `attendance:site:${siteId}:date:${date}`;
      const cached = cache.getCached(attendanceKey);
      if (cached) {
        setAttendanceMap(cached.reduce((m, a) => { if (a && a.worker && a.worker._id) m[a.worker._id] = a; return m; }, {}));
      }

      const r = await api.get(`/attendance/site/${siteId}`, { params: { date } });
      const map = {};
      // Defensive: skip attendance entries with null worker
      r.data.forEach((a) => {
        if (a && a.worker && a.worker._id) {
          map[a.worker._id] = a;
        }
      });
      setAttendanceMap(map);
      cache.setCached(attendanceKey, r.data, 1000 * 60 * 5);
    } catch (err) {
      console.error('fetchAttendance error', err);
      toast.error("❌ Failed to fetch attendance");
    }
  }, [siteId, date]);

  useEffect(() => {
    if (!workers.length) return;
    fetchAttendance();
  }, [date, workers, fetchAttendance]);

  // Bulk actions (disabled for now - per-row attendance preferred)

  // Attendance modal
  function openAttendance(worker) {
    setSelectedWorker(worker);
    setShowModal(true);
  }
  function onAttendanceSaved() {
    setShowModal(false);
    fetchAttendance();
  }

  // Add worker
  async function handleAddWorker(e) {
    e.preventDefault();
    
    // Validate Indian mobile number
    if (newWorker.phone && !/^[6-9]\d{9}$/.test(newWorker.phone)) {
      toast.error("❌ Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9");
      return;
    }
    
    try {
      setAddingWorker(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      await api.post(
        "/workers",
        { 
          name: newWorker.name, 
          role: newWorker.role, 
          siteId,
          wageRate: Number(newWorker.wageRate),
          phone: newWorker.phone,
          address: newWorker.address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowAddWorker(false);
      setNewWorker({ name: "", role: "", wageRate: "", phone: "", address: "" });
  // clear workers cache so fetchWorkers gets fresh data
  try { cache.clearCache(`workers:site:${siteId}`); } catch (e) { console.debug('cache clear failed', e); }
  // clear today's attendance too; adding a worker shouldn't affect past records but makes UI consistent
  try { cache.clearCache(`attendance:site:${siteId}:date:${date}`); } catch (e) { console.debug('cache clear failed', e); }
  fetchWorkers();
      toast.success("👷 Worker added successfully!");
    } catch (err) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("❌ Failed to add worker.");
    } finally {
      setAddingWorker(false);
    }
  }

  // Site actions
  async function handleDeleteSite() {
    try {
      await api.delete(`/sites/${siteId}`);
      toast.success("🗑 Site deleted");
      navigate("/dashboard");
    } catch (err) {
      console.error('delete site error', err);
      toast.error("❌ Failed to delete site.");
    }
  }
  async function handleArchiveSite() {
    try {
      await api.patch(`/sites/${siteId}/archive`);
      fetchSite();
      toast("Site archived", { icon: "📦", style: { background: "#111", color: "#fff" } });
    } catch (err) {
      console.error('archive site error', err);
      toast.error("❌ Failed to archive site.");
    }
  }
  async function handleRestoreSite() {
    try {
      await api.patch(`/sites/${siteId}/restore`);
      fetchSite();
      toast("Site restored", { icon: "♻", style: { background: "#111", color: "#fff" } });
    } catch (err) {
      console.error('restore site error', err);
      toast.error("❌ Failed to restore site.");
    }
  }

  return (
    <div className="min-h-screen text-white px-4 py-6">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl shadow-lg relative gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-row justify-between w-full">
            {/* Title + Location */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-md truncate">
                {site?.name || "Site"}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base truncate">
                {site?.location}
              </p>
            </div>
          
            {/* Status Badge */}
           <div className="flex flex-row items-center justify-between gap-3">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-full shadow 
                ${site?.deleted ? "bg-yellow-600 text-white" : "bg-green-600 text-white"}`}
            >
              {site?.deleted ? "Archived" : "Active"}
            </span>
          
            {/* 3-dot menu */}
            <div className="relative flex items-center">
              <button
                className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition"
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="Open site menu"
              >
                <FiMoreVertical className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
          
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-52 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden"
                  >
                    {/* Archive / Restore */}
                    {!site?.deleted ? (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setConfirmAction({ text: "Archive this site?", action: handleArchiveSite });
                        }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-yellow-400 hover:bg-yellow-500/20 text-left"
                      >
                        <FiArchive size={16} /> Archive Site
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleRestoreSite();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-green-400 hover:bg-green-500/20 text-left"
                      >
                        <FiRotateCcw size={16} /> Restore Site
                      </button>
                    )}
          
                    {/* Delete */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmAction({ text: "Delete this site permanently?", action: handleDeleteSite });
                      }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-red-500/20 text-left"
                    >
                      <FiTrash2 size={16} /> Delete Site
                    </button>
          
                    {/* Back */}
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="flex items-center gap-2 w-full px-4 py-3 text-gray-200 hover:bg-gray-700 text-left"
                    >
                      <FiArrowLeft size={16} /> Back to Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
          
          {/* quick stats */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-white/8 px-3 py-1 rounded-full text-sm text-white/90">
              <FiUsers className="w-4 h-4 text-white/90" />
              <span>{loading ? 'Loading...' : `${workers.length} worker${workers.length !== 1 ? 's' : ''}`}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/8 px-3 py-1 rounded-full text-sm text-white/90">
              <span className="text-xs text-gray-100">Total Remaining</span>
              <span className="font-medium">₹{Object.values(workerStats).reduce((a,c)=>a+(c?.remainingAmount||0),0).toFixed(0)}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-blue-100">
              <div className="px-2 py-1 bg-white/6 rounded-full text-xs">Present: <span className="font-medium text-white/95">{loading ? '...' : presentCount}</span></div>
              <div className="px-2 py-1 bg-white/6 rounded-full text-xs">Absent: <span className="font-medium text-white/95">{loading ? '...' : absentCount}</span></div>
            </div>
            <div className="text-sm text-blue-100">Date: <span className="font-medium">{date}</span></div>
          </div>
        </div>
      </motion.div>

      {/* Date Picker + Search */}
      <div className="bg-gray-800/60 rounded-xl shadow-lg p-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="text-base font-medium text-gray-300 block mb-2">Select Date</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="sm:ml-4 sm:w-1/3">
            <label className="text-base font-medium text-gray-300 block mb-2">Search workers</label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role or phone"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
            />
          </div>
        </div>
      </div>

      {/* Workers Section */}
      <div className="bg-gray-800/70 rounded-xl shadow-lg p-4">
        <div className="flex flex-row justify-between items-center flex-wrap gap-4 mb-6">
          {/* Left side - Title & Results */}
          <div>
            <h2 className="font-bold text-2xl sm:text-3xl text-white flex items-center gap-2">
              👷 Workers
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-1">
              Showing{" "}
              <span className="font-semibold text-white">
                {
                  workers.filter((w) =>
                    `${w.name} ${w.role} ${w.phone}`
                      .toLowerCase()
                      .includes(query.toLowerCase())
                  ).length
                }
              </span>{" "}
              results
            </p>
          </div>
        
          {/* Right side - Add Worker button */}
          {!site?.deleted && (
            <button
              onClick={() => setShowAddWorker(true)}
              className="flex items-center justify-center px-5 py-2.5 rounded-lg text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 text-white"
            >
              + Add Worker
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-white/5 rounded-lg p-4 h-28 flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-white/6 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-white/6 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <p className="text-gray-400 italic text-base">No workers yet. Add one to get started.</p>
        ) : (
          <motion.div initial="hidden" animate="show" className="space-y-4"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
          >
            {workers.filter(w => `${w.name} ${w.role} ${w.phone}`.toLowerCase().includes(query.toLowerCase())).map((w) => {
              const attendance = attendanceMap[w._id] || { status: "absent" };
              return (
                <motion.div key={w._id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <WorkerRow 
                    worker={{ ...w, attendance }} 
                    onOpen={() => openAttendance(w)}
                    onUpdate={handleUpdateWorker}
                    onRemove={handleDeleteWorker}
                    stats={workerStats[w._id]}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Floating Add Worker FAB for mobile */}
      {!site?.deleted && (
        <button
          onClick={() => setShowAddWorker(true)}
          className="fixed bottom-6 right-6 sm:hidden bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50"
          aria-label="Add worker"
        >
          <span className="text-2xl">+</span>
        </button>
      )}

      {/* Attendance Modal */}
      <AnimatePresence>
        {showModal && <AttendanceModal worker={selectedWorker} siteId={siteId} date={date} onClose={() => setShowModal(false)} onSaved={onAttendanceSaved} />}
      </AnimatePresence>

      {/* Add Worker Modal */}
      <AnimatePresence>
        {showAddWorker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.3 }} className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-6">Add Worker</h2>
              <form onSubmit={handleAddWorker} className="space-y-4">
                <input
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Worker Name"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  required
                />
                <select
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 text-base"
                  value={newWorker.role}
                  onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                >
                  <option value="">Role</option>
                  <option value="Labour (मज़दूर)">Labour (मज़दूर)</option>
                  <option value="Mistri (मिस्त्री)">Mistri (मिस्त्री)</option>
                </select>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Daily Wage (₹)"
                  value={newWorker.wageRate}
                  onChange={(e) => setNewWorker({ ...newWorker, wageRate: e.target.value })}
                />
                <input
                  type="tel"
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Phone Number (10 digits)"
                  value={newWorker.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (value.length <= 10) {
                      setNewWorker({ ...newWorker, phone: value });
                    }
                  }}
                />
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Address (optional)"
                  value={newWorker.address}
                  onChange={(e) => setNewWorker({ ...newWorker, address: e.target.value })}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddWorker(false)} className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-base font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingWorker} className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
                    {addingWorker ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3 }} className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">{confirmAction.text}</h2>
              <div className="flex justify-center gap-4">
                <button onClick={() => setConfirmAction(null)} className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-base font-medium">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmAction.action();
                    setConfirmAction(null);
                  }}
                  className="px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-base"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
