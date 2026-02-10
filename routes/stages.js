const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.protect);
router.use(authMiddleware.adminOnly); // Admin only

router.get('/', stageController.getStages);
router.post('/', stageController.addStage);
router.delete('/:name', stageController.removeStage);
router.put('/reorder', stageController.reorderStages);

module.exports = router;