const Order = require('../models/Order');
const Item = require('../models/Item');
const Stage = require('../models/Stage');
const qrUtils = require('../utils/qrUtils');
const crypto = require('crypto');

// Generate Engenx-style batch ID: ENGENX-YYYYMMDD-XXXX
const generateBatchId = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ENGENX-${datePart}-${rand}`;
};

exports.createOrder = async (req, res, next) => {
  try {
    const { client_name, product_name, quantity, plant_name, sop_reference, part_category } = req.body;
    const order_id = crypto.randomUUID();
    const batch_id = generateBatchId();

    const order = await Order.create({
      order_id,
      client_name,
      product_name,
      quantity,
      plant_name: plant_name || 'Main Plant',
      batch_id,
      sop_reference: sop_reference || ''
    });

    // Generate items with QR codes and traceability fields
    const stages = await Stage.find().sort('order');
    const firstStage = stages[0].name;
    const items = [];

    for (let i = 0; i < quantity; i++) {
      const item_id = crypto.randomUUID();
      const qr_code = await qrUtils.generateQR(item_id);
      const itemIndex = String(i + 1).padStart(4, '0');

      const item = await Item.create({
        item_id,
        order_id: order.order_id,
        current_stage: firstStage,
        stage_history: [],
        qr_code,
        batch_number: batch_id,          // Link item to batch
        metal_tag_id: `TAG-${itemIndex}`, // Physical metal tag reference
        part_category: part_category || 'General',
        validation_status: 'Pending'
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