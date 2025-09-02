import Site from '../models/Site.js';

// Create site
export const createSite = async (req, res) => {
  try {
    const { name, location, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const site = new Site({
      name,
      location,
      notes,
      createdBy: req.user.uid
    });

    await site.save();
    res.status(201).json(site);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get active sites
export const getSites = async (req, res) => {
  try {
    const sites = await Site.find({ createdBy: req.user.uid, deleted: false }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get archived sites
export const getArchivedSites = async (req, res) => {
  try {
    const sites = await Site.find({ createdBy: req.user.uid, deleted: true }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get site by ID
export const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update site
export const updateSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    const { name, location, notes } = req.body;
    if (name) site.name = name;
    if (location) site.location = location;
    if (notes) site.notes = notes;

    await site.save();
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Archive site
export const archiveSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    site.deleted = true;
    await site.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Restore site
export const restoreSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    site.deleted = false;
    await site.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Hard delete site
export const deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    if (site.createdBy !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });

    await site.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
