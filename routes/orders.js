const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.protect); // All routes protected

router.post('/', authMiddleware.adminOnly, orderController.createOrder);
router.get('/', authMiddleware.adminOrSupervisor, orderController.getOrders);
router.get('/:id', authMiddleware.adminOrSupervisor, orderController.getOrderById);

module.exports = router;