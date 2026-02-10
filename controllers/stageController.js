const Stage = require('../models/Stage');

exports.getStages = async (req, res, next) => {
  try {
    const stages = await Stage.find().sort('order');
    res.json(stages);
  } catch (err) {
    next(err);
  }
};

exports.addStage = async (req, res, next) => {
  try {
    const { name } = req.body;
    const maxOrder = await Stage.findOne().sort('-order').select('order');
    const newOrder = (maxOrder ? maxOrder.order : 0) + 1;
    const stage = await Stage.create({ name, order: newOrder });
    res.status(201).json(stage);
  } catch (err) {
    next(err);
  }
};

exports.removeStage = async (req, res, next) => {
  try {
    await Stage.deleteOne({ name: req.params.name });
    // Reorder remaining
    const stages = await Stage.find().sort('order');
    stages.forEach((s, i) => {
      s.order = i + 1;
      s.save();
    });
    res.json({ message: 'Stage removed' });
  } catch (err) {
    next(err);
  }
};

exports.reorderStages = async (req, res, next) => {
  try {
    const { newOrder } = req.body; // Array of stage names in new order
    newOrder.forEach(async (name, index) => {
      await Stage.updateOne({ name }, { order: index + 1 });
    });
    res.json({ message: 'Stages reordered' });
  } catch (err) {
    next(err);
  }
};