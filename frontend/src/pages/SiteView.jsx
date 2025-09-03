import React, { useEffect, useState } from "react";
import api from "../api/api";
import { gsap } from "gsap";
import { getAuth } from "firebase/auth";
import WorkerRow from "../components/WorkerRow";
import AttendanceModal from "../components/AttendanceModal";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Archive, Trash2, RotateCcw, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function SiteView() {
  const { siteId } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [savingBulk, setSavingBulk] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: "", role: "", wageRate: 0, phone: "", address: "" });
  const [confirmAction, setConfirmAction] = useState(null);
  const [workerStats, setWorkerStats] = useState({});

  // Fetch site info
  async function fetchSite() {
    try {
      const r = await api.get(`/sites/${siteId}`);
      setSite(r.data);
    } catch (e) {
      toast.error("❌ Failed to fetch site");
    }
  }

  useEffect(() => {
    if (siteId) fetchSite();
  }, [siteId]);

  // Fetch workers
  useEffect(() => {
    fetchWorkers();
  }, [siteId]);

  async function fetchWorkers() {
    try {
      setLoading(true);
      const r = await api.get(`/workers/site/${siteId}`);
      setWorkers(r.data);
      await fetchWorkerStats(r.data);
      setLoading(false);

      // Animate rows
      setTimeout(() => {
        gsap.from(".worker-row", {
          y: 12,
          opacity: 0,
          stagger: 0.05,
          duration: 0.4,
          ease: "power2.out",
        });
      }, 50);
    } catch (e) {
      setLoading(false);
      toast.error("❌ Failed to fetch workers");
    }
  }

  async function fetchWorkerStats(workersData) {
    try {
      const stats = {};
      for (const worker of workersData) {
        try {
          // Get attendance for this worker
          const attendanceRes = await api.get(`/attendance/site/${siteId}?date=${date}`);
          const attendance = attendanceRes.data.find(a => a.worker._id === worker._id);
          
          let earnedAmount = 0;
          if (attendance) {
            earnedAmount = attendance.status === 'present' ? worker.wageRate : 
                         attendance.status === 'halfday' ? worker.wageRate / 2 : 0;
          }
          
          // Get payments for this worker
          let totalPaid = 0;
          try {
            const paymentsRes = await api.get(`/payments/worker/${worker._id}`);
            const payments = paymentsRes.data;
            totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          } catch (err) {
            // No payments yet
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
  }

  // Fetch attendance
  useEffect(() => {
    if (!workers.length) return;
    fetchAttendance();
  }, [date, workers]);

  async function fetchAttendance() {
    try {
      const r = await api.get(`/attendance/site/${siteId}`, { params: { date } });
      const map = {};
      r.data.forEach((a) => {
        map[a.worker._id] = a;
      });
      setAttendanceMap(map);
    } catch (e) {
      toast.error("❌ Failed to fetch attendance");
    }
  }

  // Bulk actions
  function markAll(status) {
    if (!workers.length) return;
    const updated = { ...attendanceMap };
    workers.forEach((w) => {
      const current = updated[w._id] || { worker: w._id, status: "absent", hoursWorked: 0 };
      updated[w._id] = { ...current, status };
    });
    setAttendanceMap(updated);
  }

  async function saveAll() {
    try {
      setSavingBulk(true);
      const records = workers.map((w) => {
        const a = attendanceMap[w._id] || { status: "absent", hoursWorked: 0 };
        return {
          workerId: w._id,
          status: a.status || "absent",
          hoursWorked: typeof a.hoursWorked === "number" ? a.hoursWorked : 0,
        };
      });
      await api.post(`/attendance/bulk`, { siteId, date, records });
      toast.success("✅ Attendance saved for all workers");
      fetchAttendance();
    } catch (e) {
      toast.error("❌ Failed to save attendance");
    } finally {
      setSavingBulk(false);
    }
  }

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
      setNewWorker({ name: "", role: "", wageRate: 0, phone: "", address: "" });
      fetchWorkers();
      toast.success("👷 Worker added successfully!");
    } catch (e) {
      console.error(e.response?.data || e.message);
      toast.error("❌ Failed to add worker.");
    }
  }

  // Site actions
  async function handleDeleteSite() {
    try {
      await api.delete(`/sites/${siteId}`);
      toast.success("🗑 Site deleted");
      navigate("/dashboard");
    } catch (e) {
      toast.error("❌ Failed to delete site.");
    }
  }
  async function handleArchiveSite() {
    try {
      await api.patch(`/sites/${siteId}/archive`);
      fetchSite();
      toast("Site archived", { icon: "📦", style: { background: "#111", color: "#fff" } });
    } catch (e) {
      toast.error("❌ Failed to archive site.");
    }
  }
  async function handleRestoreSite() {
    try {
      await api.patch(`/sites/${siteId}/restore`);
      fetchSite();
      toast("Site restored", { icon: "♻", style: { background: "#111", color: "#fff" } });
    } catch (e) {
      toast.error("❌ Failed to restore site.");
    }
  }

  return (
    <div className="min-h-screen text-white px-4 py-6">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl shadow-lg relative"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-md">{site?.name || "Site"}</h1>
          <p className="text-blue-100 text-lg">{site?.location}</p>
          {site?.deleted ? (
            <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-yellow-600 text-white rounded-full">
              Archived
            </span>
          ) : (
            <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-green-600 text-white rounded-full">
              Active
            </span>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-white/20 transition" onClick={() => setShowMenu((prev) => !prev)}>
            <MoreVertical className="w-6 h-6 text-white" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden"
              >
                {!site?.deleted ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setConfirmAction({ text: "Archive this site?", action: handleArchiveSite });
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-yellow-400 hover:bg-yellow-500/20"
                  >
                    <Archive size={16} /> Archive Site
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleRestoreSite();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-green-400 hover:bg-green-500/20"
                  >
                    <RotateCcw size={16} /> Restore Site
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setConfirmAction({ text: "Delete this site permanently?", action: handleDeleteSite });
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 size={16} /> Delete Site
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 w-full px-4 py-2 text-gray-200 hover:bg-gray-700"
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Date Picker */}
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
{/*           
          <div className="flex gap-2">
            <button
              className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-base font-medium"
              onClick={() => markAll("present")}
            >
              Mark All Present
            </button>
            <button
              className="px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-base font-medium"
              onClick={() => markAll("absent")}
            >
              Mark All Absent
            </button>
            <button
              className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-medium disabled:opacity-60"
              onClick={saveAll}
              disabled={savingBulk || !workers.length}
            >
              {savingBulk ? "Saving..." : "Save All"}
            </button>
          </div> */}
        </div>
      </div>

      {/* Workers Section */}
      <div className="bg-gray-800/70 rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">👷 Workers</h2>
          {!site?.deleted && (
            <button
              className="px-4 py-2 rounded-lg text-base font-medium bg-blue-600 hover:bg-blue-700 transition text-white"
              onClick={() => setShowAddWorker(true)}
            >
              + Add Worker
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400 italic text-base">Loading workers...</p>
        ) : workers.length === 0 ? (
          <p className="text-gray-400 italic text-base">No workers yet. Add one to get started.</p>
        ) : (
          workers.map((w) => {
            const attendance = attendanceMap[w._id] || { status: "absent" };
            return (
              <WorkerRow 
                key={w._id} 
                worker={{ ...w, attendance }} 
                onOpen={() => openAttendance(w)}
                stats={workerStats[w._id]}
              />
            );
          })
        )}
      </div>

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
                <input
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Role"
                  value={newWorker.role}
                  onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                />
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
                  <button type="submit" className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-base">
                    Save
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
