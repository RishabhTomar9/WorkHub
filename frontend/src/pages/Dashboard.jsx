import React, { useEffect, useState, useCallback, useMemo } from "react";
import api, { setAuthToken } from "../api/api";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaMapMarkerAlt, FaBuilding, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaEye, FaTrash, FaArchive, FaUndo, FaSearch } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";

export default function Dashboard() {
  const [sites, setSites] = useState([]);
  const [archivedSites, setArchivedSites] = useState([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [siteStats, setSiteStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // reference motion to satisfy linters that sometimes don't detect JSX usage
  useMemo(() => { void motion; }, []);

  // Filter sites based on search term
  const filteredSites = (showArchived ? archivedSites : sites).filter(site => {
    const matchesName = site.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = site.location && site.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Debug logging
    if (searchTerm) {
      console.log('Search term:', searchTerm);
      console.log('Site:', site.name, 'Name match:', matchesName, 'Location match:', matchesLocation);
    }
    
    return matchesName || matchesLocation;
  });

  // Debug logging for search state
  console.log('Search term state:', searchTerm);
  console.log('Total sites:', (showArchived ? archivedSites : sites).length);
  console.log('Filtered sites:', filteredSites.length);
  const fetchSiteStats = useCallback(async (sitesData) => {
    try {
      const stats = {};
      for (const site of sitesData) {
        try {
          // Get workers for this site
          const workersRes = await api.get(`/workers/site/${site._id}`);
          const workers = workersRes.data;
          
          // Get attendance for last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const today = new Date().toISOString().slice(0, 10);
          
          let totalEarned = 0;
          let totalPaid = 0;
          
          for (const worker of workers) {
            // Calculate earned amount based on attendance
            const attendanceRes = await api.get(`/attendance/site/${site._id}?date=${today}`);
            // Defensive: some attendance records may have a null worker reference
            const attendance = attendanceRes.data.find(a => a && a.worker && a.worker._id === worker._id);
            
            if (attendance) {
              const earned = attendance.status === 'present' ? worker.wageRate : 
                           attendance.status === 'halfday' ? worker.wageRate / 2 : 0;
              totalEarned += earned;
            }
            
            // Get payments for this worker
            try {
              const paymentsRes = await api.get(`/payments/worker/${worker._id}`);
              const payments = paymentsRes.data;
              totalPaid += payments.reduce((sum, p) => sum + p.amount, 0);
            } catch (err) {
              console.error(`payments fetch error for worker ${worker._id}:`, err?.response?.data || err?.message || err);
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
  }, []);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/sites");
      setSites(data);
      await fetchSiteStats(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch sites");
    }
    setLoading(false);
  }, [fetchSiteStats]);

  useEffect(() => {
    // Defer fetching protected resources until auth state is known.
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        try {
          const token = await u.getIdToken();
          setAuthToken(token);
        } catch (err) {
          console.error('Failed to set auth token', err);
        }
      } else {
        setUser(null);
        setAuthToken(null);
      }

      // Fetch sites after auth is settled (will be authenticated if token set)
      fetchSites();
    });
    return () => unsub();
  }, [fetchSites]);

  async function fetchArchivedSites() {
    setLoading(true);
    try {
      const { data } = await api.get("/sites/archived");
      setArchivedSites(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch archived sites");
    }
    setLoading(false);
  }

  async function addSite() {
    if (!name.trim()) return toast.warn("Site name required");
    try {
      const res = await api.post("/sites", { name, location });
      setSites([res.data, ...sites]);
      setName("");
      setLocation("");
      toast.success("Site created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create site");
    }
  }

  async function restoreSite(id) {
    try {
      await api.patch(`/sites/${id}/restore`);
      const restored = archivedSites.find((s) => s._id === id);
      setArchivedSites(archivedSites.filter((s) => s._id !== id));
      setSites([restored, ...sites]);
      toast.success("Site restored");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore site");
    }
  }

  async function deleteSite(id) {
    try {
      await api.delete(`/sites/${id}`);
      setArchivedSites(archivedSites.filter((s) => s._id !== id));
      toast.success("Site permanently deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete site");
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };
  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 70 } },
  };

  return (
    <motion.div
      className="min-h-screen px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-md">
            Welcome,{" "}
            <span className="text-indigo-400 font-extrabold">
              {user?.displayName || user?.email || "User"}
            </span>
          </h1>
          <p className="text-gray-300 mt-3 text-lg sm:text-xl">
            Manage your{" "}
            <span className="font-semibold text-indigo-300">sites</span>,{" "}
            <span className="font-semibold text-indigo-300">staff</span>, and{" "}
            <span className="font-semibold text-indigo-300">attendance</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 grid grid-cols-2 sm:flex sm:items-center gap-3 w-full">
        {/* Total Sites */}
        <div className="flex-1 text-center bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 px-5 py-4 rounded-xl border border-indigo-500/20 shadow-md">
          <div className="text-xs sm:text-sm text-gray-300">Total Sites</div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {sites.length}
          </div>
        </div>
      
        {/* Total Workers */}
        <div className="flex-1 text-center bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 px-5 py-4 rounded-xl border border-emerald-500/20 shadow-md">
          <div className="text-xs sm:text-sm text-gray-300">Total Workers</div>
          <div className="text-lg sm:text-2xl font-bold text-white">
            {Object.values(siteStats).reduce(
              (acc, s) => acc + (s.totalWorkers || 0),
              0
            )}
          </div>
        </div>
      </div>

      </motion.div>

      {/* Quick Actions */}
      <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full mb-6 sm:mb-8"
>
  {/* Attendance */}
  <motion.button
    onClick={() => navigate("/attendance")}
    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
      text-white px-4 sm:px-6 py-3 sm:py-5 rounded-xl shadow-lg transition-all duration-300 
      flex items-center justify-center gap-2 sm:gap-3 min-h-[60px] sm:min-h-[90px] w-full"
  >
    <FaCalendarAlt className="text-xl sm:text-2xl lg:text-3xl" />
    <span className="font-semibold text-sm sm:text-lg lg:text-xl">
      Manage Attendance
    </span>
  </motion.button>

  {/* Payouts */}
  <motion.button
    onClick={() => navigate("/payouts")}
    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
      text-white px-4 sm:px-6 py-3 sm:py-5 rounded-xl shadow-lg transition-all duration-300 
      flex items-center justify-center gap-2 sm:gap-3 min-h-[60px] sm:min-h-[90px] w-full"
  >
    <FaMoneyBillWave className="text-xl sm:text-2xl lg:text-3xl" />
    <span className="font-semibold text-sm sm:text-lg lg:text-xl">
      View Payouts
    </span>
  </motion.button>

  {/* Refresh */}
  <motion.button
    onClick={fetchSites}
    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
      text-white px-4 sm:px-6 py-3 sm:py-5 rounded-xl shadow-lg transition-all duration-300 
      flex items-center justify-center gap-2 sm:gap-3 min-h-[60px] sm:min-h-[90px] w-full"
  >
    <IoMdRefresh className="text-2xl sm:text-3xl lg:text-4xl" />
    <span className="font-semibold text-sm sm:text-lg lg:text-xl">
      Refresh Data
    </span>
  </motion.button>
</motion.div>


      {/* Create Site + Toggle */}
      <motion.div
        className="bg-white/90 shadow-md rounded-xl p-5 mb-6 border border-gray-200"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {showArchived ? "Archived Sites" : "Create New Site"}
          </h2>

          {/* Toggle Switch */}
          <div className="flex items-center gap-2">
            <span
              className={`text-base font-medium ${
                !showArchived ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Active Sites
            </span>
            <button
              onClick={() => {
                const newVal = !showArchived;
                setShowArchived(newVal);
                if (newVal) fetchArchivedSites();
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                showArchived ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  showArchived ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
            <span
              className={`text-base font-medium ${
                showArchived ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Archived Sites
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Search Sites
              {searchTerm && (
                <span className="text-indigo-600 ml-2">
                  ({filteredSites.length} of {(showArchived ? archivedSites : sites).length})
                </span>
              )}
            </label>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search sites by name or location..."
              value={searchTerm}
              onChange={(e) => {
                console.log('Search input changed:', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-10 py-3 border rounded-lg text-base outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-5 text-red-500 hover:text-red-600 transition-colors text-3xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {!showArchived && (
          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="flex-1 border rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="Site name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="flex-1 border rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-400 transition"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md transition text-base font-medium"
              onClick={addSite}
            >
              Add Site
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Sites List */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {loading && (
          <div className="col-span-full flex justify-center items-center py-6">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading &&
          filteredSites.length === 0 && (
            <div className="col-span-full text-center text-gray-400 italic py-6">
              {searchTerm ? (
                <div>
                  <FaSearch className="text-4xl mx-auto mb-2 text-gray-300" />
                  <p>No sites found matching "{searchTerm}"</p>
                </div>
              ) : showArchived ? (
                "No archived sites."
              ) : (
                "No sites found. Create one above!"
              )}
            </div>
          )}

        <AnimatePresence>
          {filteredSites.map((s) => (
            <motion.div
              key={s._id}
              variants={cardVariants}
              whileHover={{
                scale: 1.03,
                boxShadow: "0px 8px 30px rgba(99,102,241,0.25)",
              }}
              className="site-card bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl shadow-md p-4 sm:p-5 flex flex-col gap-3 transition min-h-[200px] sm:min-h-[220px]"
              layout
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                    <FaBuilding className="text-blue-600 text-4xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xl truncate">
                      {s.name}
                    </div>

                  <div className="flex items-center text-white/90 font-base truncate">
                    <FaMapMarkerAlt className="mr-1 text-red-400 flex-shrink-0" />
                    <span className="truncate">{s.location || "No location"}</span>
                  </div>

                  </div>
                </div>
                <div
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium flex-shrink-0 ${
                    showArchived
                      ? "bg-gray-200 text-gray-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {showArchived ? "Archived" : "Active"}
                </div>
                {siteStats[s._id] && siteStats[s._id].remainingAmount > 0 && (
                  <div className="ml-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                    Recent
                  </div>
                )}
              </div>

              {/* Site Stats */}
              {!showArchived && siteStats[s._id] && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600">
                      <FaUsers className="text-3xl" />
                      <span className="text-xl font-medium">Workers</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {siteStats[s._id].totalWorkers}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <FaMoneyBillWave className="text-3xl" />
                      <span className="text-xl font-medium">Remaining</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      ₹{siteStats[s._id].remainingAmount.toFixed(0)}
                    </div>
                  </div>
                </div>
              )}

              {showArchived ? (
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => restoreSite(s._id)}
                    className="px-4 sm:px-5 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors text-base sm:text-lg min-h-[48px]"
                  >
                    <FaUndo className="text-sm" />
                    <span className="hidden sm:inline">Restore</span>
                    <span className="sm:hidden">Restore</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteSite(s._id)}
                    className="px-4 sm:px-5 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 flex items-center justify-center gap-2 transition-colors text-base sm:text-lg min-h-[48px]"
                  >
                    <FaTrash className="text-sm" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Delete</span>
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate(`/site/${s._id}`)}
                    className="px-4 sm:px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors text-base sm:text-lg min-h-[48px] w-full"
                  >
                    <FaEye className="text-xl" />
                    <span className="inline text-lg">Open Site</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/payouts')}
                    className="px-4 sm:px-5 py-3 bg-green-700 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors text-base sm:text-lg min-h-[48px] w-full"
                  >
                    <FaMoneyBillWave className="text-xl" />
                    <span className="inline text-lg">Payouts</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
