const analyticsService = require('../services/analyticsService');
const Item = require('../models/Item');
const Order = require('../models/Order');
const csv = require('csv-writer').createObjectCsvStringifier;

exports.getOverview = async (req, res, next) => {
  try {
    const items = await Item.find();
    const orders = await Order.find();
    const overview = {
      activeOrders: orders.filter(o => o.status === 'Active').length,
      stageWip: analyticsService.calculateWIP(items),
      delayedItems: analyticsService.calculateDelays(items),
      rejectionCount: items.filter(i => i.status === 'Rejected').length,
      avgCycleTime: analyticsService.calculateAvgCycleTime(items)
    };
    res.json(overview);
  } catch (err) {
    next(err);
  }
};

exports.getDetailedReport = async (req, res, next) => {
  try {
    const { order_id, product, client } = req.query;
    let filter = {};
    if (order_id) filter.order_id = order_id;
    // Add more filters as needed
    const items = await Item.find(filter);
    const report = analyticsService.generateDetailedReport(items);
    res.json(report);
  } catch (err) {
    next(err);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const items = await Item.find();
    const csvStringifier = csv({
      header: [
        { id: 'item_id', title: 'Item ID' },
        { id: 'order_id', title: 'Order ID' },
        { id: 'current_stage', title: 'Current Stage' },
        { id: 'status', title: 'Status' }
        // Add more fields
      ]
    });
    const header = csvStringifier.getHeaderString();
    const records = csvStringifier.stringifyRecords(items);
    res.header('Content-Type', 'text/csv');
    res.attachment('report.csv');
    res.send(header + records);
  } catch (err) {
    next(err);
  }
};