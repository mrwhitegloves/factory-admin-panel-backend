const Item = require('../models/Item');
const Stage = require('../models/Stage');
const timeUtils = require('../utils/timeUtils');
const Order = require('../models/Order');

exports.scanItem = async (req, res, next) => {
  try {
    const { item_id, action, remark, operator } = req.body; // action: start, complete, reject, hold
    const item = await Item.findOne({ item_id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const stages = await Stage.find().sort('order');
    const currentIndex = stages.findIndex(s => s.name === item.current_stage);

    switch (action) {
      case 'start':
        item.stage_history.push({
          stage_name: item.current_stage,
          entry_time: new Date(),
          operator,
          remarks: remark
        });
        break;
      case 'complete':
        if (item.stage_history.length === 0 || !item.stage_history[item.stage_history.length - 1].entry_time) {
          return res.status(400).json({ message: 'Stage not started' });
        }
        item.stage_history[item.stage_history.length - 1].exit_time = new Date();
        if (currentIndex < stages.length - 1) {
          item.current_stage = stages[currentIndex + 1].name;
        } else {
          item.status = 'Completed';
        }
        break;
      case 'reject':
        item.status = 'Rejected';
        item.stage_history[item.stage_history.length - 1].remarks = remark || 'Rejected';
        break;
      case 'hold':
        item.status = 'On Hold';
        item.stage_history[item.stage_history.length - 1].remarks = remark || 'On Hold';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await item.save();

    // Prevent stage skipping: Ensured by index check
    // Emit real-time update
    global.io.to('supervisor').emit('itemUpdate', { updatedItem: item });
    global.io.to('admin').emit('itemUpdate', { updatedItem: item });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.getItemsInStage = async (req, res, next) => {
  try {
    const items = await Item.find({ current_stage: req.params.stage, status: 'In Progress' });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    const item = await Item.findOne({ item_id: req.params.id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.getItemsByOrder = async (req, res, next) => {
  try {
    const { order_id } = req.query;
    const items = await Order.find({ order_id });
    res.json(items);
  } catch (err) {
    console.log("error in getItemByOrder: ".err)
    next(err);
  }
};