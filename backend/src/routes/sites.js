import express from 'express';
import firebaseAuth from '../middleware/firebaseAuth.js';
import * as siteController from '../controllers/siteController.js';

const router = express.Router();

router.post('/', firebaseAuth, siteController.createSite);
router.get('/', firebaseAuth, siteController.getSites);
router.get('/archived', firebaseAuth, siteController.getArchivedSites);
router.get('/:id', firebaseAuth, siteController.getSiteById);
router.put('/:id', firebaseAuth, siteController.updateSite);
router.patch('/:id/archive', firebaseAuth, siteController.archiveSite);
router.patch('/:id/restore', firebaseAuth, siteController.restoreSite);
router.delete('/:id', firebaseAuth, siteController.deleteSite);

export default router;
