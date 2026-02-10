const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.protect);

router.post('/scan', itemController.scanItem); // For operators: start/complete/reject
router.get('/current/:stage', authMiddleware.operatorOnly, itemController.getItemsInStage);
router.get('/:id', authMiddleware.adminOrSupervisor, itemController.getItemById);

module.exports = router;