const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.protect);
router.use(authMiddleware.adminOrSupervisor);

router.get('/overview', reportController.getOverview);
router.get('/detailed', reportController.getDetailedReport);
router.get('/export/csv', reportController.exportCSV);

module.exports = router;