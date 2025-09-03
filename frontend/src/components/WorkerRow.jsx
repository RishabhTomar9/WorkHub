import React, { useState } from "react";
import { FaMoneyBillWave, FaEdit, FaTrash, FaCalendarAlt } from "react-icons/fa";

export default function WorkerRow({
  worker,
  onUpdate = () => {},   // ✅ safe default
  onRemove = () => {},   // ✅ safe default
  onOpen = null,         // ✅ only show if provided
  stats,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(worker);

  function saveEdit() {
    if (typeof onUpdate === "function") {
      onUpdate(form);   // ✅ call safely
    } else {
      console.warn("onUpdate is not a function");
    }
    setEditing(false);
  }

  return (
    <div className="worker-row bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-3 border border-white/10 hover:bg-white/10 transition-all duration-300">
      {editing ? (
        <div className="space-y-3">
          {/* --- Edit Mode --- */}
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/20 border border-white/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Worker Name"
            />
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="bg-white/20 border border-white/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Role"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.wageRate}
              onChange={(e) => setForm({ ...form, wageRate: e.target.value })}
              className="bg-white/20 border border-white/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Daily Wage"
            />
            <input
              type="tel"
              value={form.phone || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                if (value.length <= 10) {
                  setForm({ ...form, phone: value });
                }
              }}
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              className="bg-white/20 border border-white/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
              placeholder="Phone Number (10 digits)"
            />
          </div>
          <input
            type="text"
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="bg-white/20 border border-white/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
            placeholder="Address"
          />
          <div className="flex gap-2">
            <button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
              onClick={saveEdit}
            >
              Save
            </button>
            <button
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* --- Display Mode --- */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaMoneyBillWave className="text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-white text-xl">{worker.name}</div>
                <div className="text-base text-blue-200">
                  {worker.role} — ₹{worker.wageRate}/{worker.wageType}
                </div>
                {worker.phone && (
                  <div className="text-sm text-gray-300 mt-1">📞 {worker.phone}</div>
                )}
                {worker.address && (
                  <div className="text-sm text-gray-300 mt-1">📍 {worker.address}</div>
                )}
              </div>
            </div>

            {/* Stats Display */}
            {stats && (
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Earned</div>
                  <div className="text-base font-semibold text-green-400">
                    ₹{stats.earnedAmount?.toFixed(0) || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Paid</div>
                  <div className="text-base font-semibold text-blue-400">
                    ₹{stats.totalPaid?.toFixed(0) || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Remaining</div>
                  <div
                    className={`text-base font-semibold ${
                      (stats.remainingAmount || 0) > 0
                        ? "text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    ₹{stats.remainingAmount?.toFixed(0) || 0}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            {onOpen && (
              <button
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                onClick={onOpen}
                title="Mark Attendance"
              >
                <FaCalendarAlt />
              </button>
            )}
            <button
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => setEditing(true)}
              title="Edit Worker"
            >
              <FaEdit />
            </button>
            <button
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              onClick={() =>
                window.confirm("Delete worker?") && onRemove(worker._id)
              }
              title="Delete Worker"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
