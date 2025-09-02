import { v4 as uuidv4 } from 'uuid';
import Worker from '../models/Worker.js';
import Site from '../models/Site.js';

export const addWorker = async (req, res) => {
  try {
    const { name, role, siteId, wageRate, wageType, phone, address } = req.body;

    if (!name || !siteId)
      return res.status(400).json({ error: 'Name and siteId required' });

    const site = await Site.findById(siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });

    if (site.createdBy !== req.user.uid)
      return res.status(403).json({ error: 'Forbidden' });

    const worker = new Worker({
      workerId: uuidv4(), // ✅ unique ID
      name,
      role: role || 'Worker',
      site: site._id,
      wageRate: wageRate || 0,
      wageType: wageType || 'day',
      phone: phone || '',
      address: address || '',
      createdBy: req.user.uid
    });

    await worker.save();
    res.status(201).json(worker);
  } catch (err) {
    console.error('Add Worker Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

export const getWorkersBySite = async (req, res) => {
  const { siteId } = req.params;
  if (!siteId) return res.status(400).json({ error: "siteId is required" });

  try {
    const workers = await Worker.find({ site: siteId }).sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, wageRate, wageType, phone, address } = req.body;

    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const site = await Site.findById(worker.site);
    if (!site || site.createdBy !== req.user.uid)
      return res.status(403).json({ error: 'Forbidden' });

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      { name, role, wageRate, wageType, phone, address },
      { new: true }
    );

    res.json(updatedWorker);
  } catch (err) {
    console.error('Update Worker Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const site = await Site.findById(worker.site);
    if (!site || site.createdBy !== req.user.uid)
      return res.status(403).json({ error: 'Forbidden' });

    await Worker.findByIdAndDelete(id);
    res.json({ message: 'Worker deleted successfully' });
  } catch (err) {
    console.error('Delete Worker Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
