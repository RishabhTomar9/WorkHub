import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getWorkers, addWorker } from "../../services/workerServices";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function WorkersList() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sites from Firestore
  useEffect(() => {
    async function fetchSites() {
      const snapshot = await getDocs(collection(db, "sites"));
      const siteList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSites(siteList);
      if (siteList.length > 0) setSelectedSite(siteList[0].id);
    }
    fetchSites();
  }, []);

  // Fetch workers when site changes
  useEffect(() => {
    if (!selectedSite) return;

    async function fetchWorkers() {
      try {
        setLoading(true);
        const list = await getWorkers(selectedSite);
        setWorkers(list);
      } catch (err) {
        console.error("Error fetching workers:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkers();
  }, [selectedSite]);

  // Add worker
  async function handleAddWorker() {
    if (!selectedSite) return;
    const newWorker = {
      name: "New Worker",
      workerId: "W" + Math.floor(Math.random() * 1000),
      role: "Labor",
      wageRate: 500,
      wageType: "perDay",
    };
    const saved = await addWorker(selectedSite, newWorker);
    setWorkers((prev) => [...prev, saved]);
  }

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Workers</h1>

        {/* Site Selector */}
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleAddWorker}
          className="px-4 py-2 rounded bg-primary text-white"
        >
          Add Worker
        </button>
      </div>

      <div className="bg-white shadow rounded">
        {workers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No workers found for this site.</div>
        ) : (
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Worker ID</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Wage</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <motion.tr key={w.id} whileHover={{ scale: 1.01 }} className="border-t">
                  <td className="p-3">{w.name}</td>
                  <td className="p-3">{w.workerId}</td>
                  <td className="p-3">{w.role}</td>
                  <td className="p-3">
                    {w.wageRate} / {w.wageType}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
