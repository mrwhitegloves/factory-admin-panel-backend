const Order = require('../models/Order');
const Item = require('../models/Item');
const Stage = require('../models/Stage');
const qrUtils = require('../utils/qrUtils');
const crypto = require('crypto');

exports.createOrder = async (req, res, next) => {
  try {
    const { client_name, product_name, quantity } = req.body;
    const order_id = crypto.randomUUID();
    const order = await Order.create({ order_id, client_name, product_name, quantity });

    // Generate items and QR codes
    const stages = await Stage.find().sort('order');
    const firstStage = stages[0].name;
    const items = [];
    for (let i = 0; i < quantity; i++) {
      const item_id = crypto.randomUUID();
      const qr_code = await qrUtils.generateQR(item_id);
      const item = await Item.create({
        item_id,
        order_id: order.order_id,
        current_stage: firstStage,
        stage_history: [],
        qr_code
      });
      items.push(item);
    }

    // Emit real-time update
    global.io.to('supervisor').emit('orderUpdate', { newOrder: order });

    res.status(201).json({ order, items });
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ order_id: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};