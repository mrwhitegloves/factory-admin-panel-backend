const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/rsbController');
const auth    = require('../middlewares/authMiddleware');

// ── PUBLIC routes — no auth (QR scan from shop floor) ──────────────
router.get('/scan/:component_id',  ctrl.getComponentForScan);
router.post('/scan/:component_id', ctrl.recordComponentScan);

// ── Protected routes — require login ───────────────────────────────
router.use(auth.protect);

router.post('/orders',         auth.adminOnly,          ctrl.createRSBOrder);
router.get('/orders',          auth.adminOrSupervisor,   ctrl.getRSBOrders);
router.get('/orders/:id',      auth.adminOrSupervisor,   ctrl.getRSBOrderById);
router.get('/units/:unit_id',  auth.adminOrSupervisor,   ctrl.getUnitDetails);
router.get('/stats',            auth.adminOrSupervisor,   ctrl.getRSBStats);
router.get('/export/csv',       auth.adminOrSupervisor,   ctrl.exportRSBCsv);
router.get('/stage-counts',     auth.adminOrSupervisor,   ctrl.getStageCounts);
router.get('/stage-components', auth.adminOrSupervisor,   ctrl.getComponentsByStage);

module.exports = router;
