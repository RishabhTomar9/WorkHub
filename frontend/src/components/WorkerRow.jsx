import React, { useState, useEffect } from "react";
import { FaUser, FaSpinner } from "react-icons/fa";
import WorkerActionsMenu from "./WorkerActionsMenu";
import toast from "react-hot-toast";
import {motion, AnimatePresence } from "framer-motion";
import { FaLocationDot } from "react-icons/fa6";
import { IoCallSharp } from "react-icons/io5";

export default function WorkerRow({
  worker,
  onUpdate = () => {},
  onRemove = () => {},
  onOpen = null,
  stats,
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(worker);

  useEffect(() => {
    setForm(worker);
  }, [worker]);

  async function saveEdit() {
    const previousData = { ...worker };
    try {
      setLoading(true);
      setForm(prevForm => ({
        ...prevForm,
        ...form
      }));
      setEditing(false);
      await onUpdate(form);
      toast.success("Worker details updated successfully");
    } catch (error) {
      setForm(previousData);
      setEditing(true);
      toast.error(error.message || "Failed to update worker");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="worker-row bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-4 border border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-visible"
    >
      <AnimatePresence mode="wait">
        {editing ? (
        <div className="space-y-4 p-4 bg-gray-800/30 rounded-xl backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Worker Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
                placeholder="Enter worker name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="" className="bg-gray-800">Select Role</option>
                <option value="Labour (मज़दूर)" className="bg-gray-800">Labour (मज़दूर)</option>
                <option value="Mistri (मिस्त्री)" className="bg-gray-800">Mistri (मिस्त्री)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Daily Wage (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.wageRate}
                  onChange={(e) => setForm({ ...form, wageRate: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 text-white pl-8 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
                  placeholder="Enter daily wage"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={form.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setForm({ ...form, phone: value });
                    }
                  }}
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  className="w-full bg-white/10 border border-white/20 text-white pl-8 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
                  placeholder="Enter 10-digit number"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IoCallSharp /></span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Address</label>
            <div className="relative">
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white pl-8 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
                placeholder="Enter worker's address"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FaLocationDot /></span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20 hover:shadow-green-900/40"
              onClick={saveEdit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin w-5 h-5" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
              onClick={() => setEditing(false)}
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100/10 rounded-xl backdrop-blur-sm border border-blue-500/20">
                <FaUser className="text-blue-400 w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white text-xl mb-1">{worker.name}</div>
                <div className="text-base text-blue-200 mb-2">
                  <span className="bg-blue-500/20 px-2 py-1 rounded-md mr-2">{worker.role}</span>
                  <span className="text-green-300">₹{worker.wageRate}/day</span>
                </div>
                <div className="space-y-1">
                  {worker.phone && (
                    <div className="text-sm text-gray-300 flex items-center gap-2">
                      <IoCallSharp /> {worker.phone}
                    </div>
                  )}
                  {worker.address && (
                    <div className="text-sm text-gray-300 flex items-center gap-2">
                      <FaLocationDot /> {worker.address}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <WorkerActionsMenu
                  worker={worker}
                  onDelete={onRemove}
                  onEdit={() => setEditing(true)}
                  onViewAttendance={onOpen}
                  isDeleting={false}
                  isEditing={editing}
                />
              </div>
            </div>

            {stats && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 backdrop-blur-md"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 -mr-6 -mt-6 bg-green-500/10 rounded-full blur-2xl"></div>
                  <div className="text-sm text-gray-300 mb-2">Total Earned</div>
                  <div className="text-xl font-bold text-green-400 flex items-center gap-1 mb-1">
                    ₹{stats.earnedAmount?.toLocaleString('en-IN') || 0}
                  </div>
                  {stats.daysWorked && (
                    <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full inline-block">
                      {stats.daysWorked} days worked
                    </div>
                  )}
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 backdrop-blur-md"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 -mr-6 -mt-6 bg-blue-500/10 rounded-full blur-2xl"></div>
                  <div className="text-sm text-gray-300 mb-2">Total Paid</div>
                  <div className="text-xl font-bold text-blue-400 flex items-center gap-1 mb-1">
                    ₹{stats.totalPaid?.toLocaleString('en-IN') || 0}
                  </div>
                  {stats.lastPaid && (
                    <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full inline-block">
                      Last: {new Date(stats.lastPaid).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`relative overflow-hidden p-4 rounded-xl backdrop-blur-md ${
                    (stats.remainingAmount || 0) > 0 
                      ? "bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20"
                      : "bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20"
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 -mr-6 -mt-6 rounded-full blur-2xl ${
                    (stats.remainingAmount || 0) > 0 
                      ? "bg-yellow-500/10"
                      : "bg-gray-500/10"
                  }`}></div>
                  <div className="text-sm text-gray-300 mb-2">Balance</div>
                  <div className={`text-xl font-bold flex items-center gap-1 mb-1 ${
                    (stats.remainingAmount || 0) > 0 ? "text-yellow-400" : "text-gray-400"
                  }`}>
                    ₹{stats.remainingAmount?.toLocaleString('en-IN') || 0}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                    (stats.remainingAmount || 0) > 0 
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-gray-500/20 text-gray-300"
                  }`}>
                    {(stats.remainingAmount || 0) > 0 ? 'Payment Pending' : 'All Cleared'}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
