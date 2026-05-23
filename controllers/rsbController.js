const crypto = require('crypto');
const RSBOrder     = require('../models/RSBOrder');
const RSBUnit      = require('../models/RSBUnit');
const RSBComponent = require('../models/RSBComponent');
const qrUtils      = require('../utils/qrUtils');
const { STAGE_DEFINITIONS, COMPONENT_DISPLAY_NAMES } = require('../utils/rsbStages');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Helper: format today as YYMMDD
const getDatePart = () => {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

// Helper: build one component
const buildComponent = async ({ componentId, componentType, orderId, unitId, unitIndex }) => {
  const stages  = STAGE_DEFINITIONS[componentType];
  const qrUrl   = `${FRONTEND_URL}/scan/${componentId}`;
  const qrImage = await qrUtils.generateQR(qrUrl);

  return RSBComponent.create({
    component_id:        componentId,
    component_type:      componentType,
    display_name:        COMPONENT_DISPLAY_NAMES[componentType],
    order_id:            orderId,
    unit_id:             unitId,
    unit_index:          unitIndex,
    current_stage_index: 0,
    status:              'in_sub_assembly',
    qr_code:             qrImage,
    qr_url:              qrUrl,
    stage_history: [{
      stage_name:  stages[0],
      stage_index: 0,
      scanned_at:  new Date(),
    }],
  });
};

// ─────────────────────────────────────────────────────────
// POST /api/rsb/orders  (admin only)
// ─────────────────────────────────────────────────────────
exports.createRSBOrder = async (req, res, next) => {
  try {
    const { client_name, quantity } = req.body;

    if (!client_name || !quantity || Number(quantity) < 1) {
      return res.status(400).json({ message: 'client_name and quantity (≥ 1) are required.' });
    }

    const qty      = Number(quantity);
    const datePart = getDatePart();
    const order_id = `RSB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const order = await RSBOrder.create({
      order_id,
      client_name,
      quantity: qty,
      product_name: 'Under Carriage / Track Frame',
      status: 'Active',
    });

    const units = [];

    for (let i = 1; i <= qty; i++) {
      const pad       = String(i).padStart(4, '0');
      const unit_id   = `UNIT-${order_id}-${pad}`;
      const cbId      = `CB-${datePart}-${pad}`;
      const lsfId     = `LSF-${datePart}-${pad}`;
      const rsfId     = `RSF-${datePart}-${pad}`;

      const unit = await RSBUnit.create({
        unit_id,
        order_id,
        unit_index:  i,
        car_body_id: cbId,
        lsf_id:      lsfId,
        rsf_id:      rsfId,
        status:      'in_progress',
      });

      const [carBody, leftSideFrame, rightSideFrame] = await Promise.all([
        buildComponent({ componentId: cbId,   componentType: 'CAR_BODY',         orderId: order_id, unitId: unit_id, unitIndex: i }),
        buildComponent({ componentId: lsfId,  componentType: 'LEFT_SIDE_FRAME',  orderId: order_id, unitId: unit_id, unitIndex: i }),
        buildComponent({ componentId: rsfId,  componentType: 'RIGHT_SIDE_FRAME', orderId: order_id, unitId: unit_id, unitIndex: i }),
      ]);

      units.push({ unit, components: { car_body: carBody, left_side_frame: leftSideFrame, right_side_frame: rightSideFrame } });
    }

    res.status(201).json({ order, units });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/orders  (admin / supervisor)
// ─────────────────────────────────────────────────────────
exports.getRSBOrders = async (req, res, next) => {
  try {
    const orders = await RSBOrder.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/orders/:id  (admin / supervisor)
// ─────────────────────────────────────────────────────────
exports.getRSBOrderById = async (req, res, next) => {
  try {
    const order = await RSBOrder.findOne({ order_id: req.params.id });
    if (!order) return res.status(404).json({ message: 'RSB Order not found.' });

    const rawUnits = await RSBUnit.find({ order_id: order.order_id }).sort({ unit_index: 1 });

    const units = await Promise.all(rawUnits.map(async (unit) => {
      const components = await RSBComponent.find({ unit_id: unit.unit_id });
      return {
        unit,
        components: {
          car_body:         components.find(c => c.component_type === 'CAR_BODY'),
          left_side_frame:  components.find(c => c.component_type === 'LEFT_SIDE_FRAME'),
          right_side_frame: components.find(c => c.component_type === 'RIGHT_SIDE_FRAME'),
        },
      };
    }));

    res.json({ order, units });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/units/:unit_id  (admin / supervisor)
// ─────────────────────────────────────────────────────────
exports.getUnitDetails = async (req, res, next) => {
  try {
    const unit = await RSBUnit.findOne({ unit_id: req.params.unit_id });
    if (!unit) return res.status(404).json({ message: 'Unit not found.' });

    const components = await RSBComponent.find({ unit_id: unit.unit_id });
    res.json({
      unit,
      components: {
        car_body:         components.find(c => c.component_type === 'CAR_BODY'),
        left_side_frame:  components.find(c => c.component_type === 'LEFT_SIDE_FRAME'),
        right_side_frame: components.find(c => c.component_type === 'RIGHT_SIDE_FRAME'),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/scan/:component_id  (PUBLIC — no auth)
// Returns component state + next stage for the scan page
// ─────────────────────────────────────────────────────────
exports.getComponentForScan = async (req, res, next) => {
  try {
    const component = await RSBComponent.findOne({ component_id: req.params.component_id });
    if (!component) return res.status(404).json({ message: 'Component not found. Check the QR code.' });

    const stages      = STAGE_DEFINITIONS[component.component_type];
    const totalStages = stages.length;
    const doneIndex   = component.current_stage_index;
    const isCompleted = doneIndex >= totalStages - 1;
    const nextIndex   = isCompleted ? null : doneIndex + 1;

    // For Car Body, also fetch linked side frames for Master QR view
    let linkedComponents = null;
    if (component.component_type === 'CAR_BODY') {
      const unit = await RSBUnit.findOne({ unit_id: component.unit_id });
      if (unit) {
        const [lsf, rsf] = await Promise.all([
          RSBComponent.findOne({ component_id: unit.lsf_id }),
          RSBComponent.findOne({ component_id: unit.rsf_id }),
        ]);
        linkedComponents = { left_side_frame: lsf, right_side_frame: rsf };
      }
    }

    res.json({
      component_id:        component.component_id,
      component_type:      component.component_type,
      display_name:        component.display_name,
      status:              component.status,
      order_id:            component.order_id,
      unit_id:             component.unit_id,
      unit_index:          component.unit_index,
      current_stage_index: doneIndex,
      current_stage_name:  stages[doneIndex],
      next_stage_index:    nextIndex,
      next_stage_name:     nextIndex !== null ? stages[nextIndex] : null,
      is_completed:        isCompleted,
      total_stages:        totalStages,
      all_stages:          stages,
      stage_history:       component.stage_history,
      linked_components:   linkedComponents,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/rsb/scan/:component_id  (PUBLIC — no auth)
// Records the NEXT stage in the serial flow
// ─────────────────────────────────────────────────────────
exports.recordComponentScan = async (req, res, next) => {
  try {
    const component = await RSBComponent.findOne({ component_id: req.params.component_id });
    if (!component) return res.status(404).json({ message: 'Component not found.' });

    const stages      = STAGE_DEFINITIONS[component.component_type];
    const totalStages = stages.length;
    const doneIndex   = component.current_stage_index;

    // Already fully complete?
    if (doneIndex >= totalStages - 1) {
      return res.status(400).json({
        message: 'All stages are already completed for this component.',
        is_completed: true,
      });
    }

    // ── Serial flow validation ──────────────────────────────
    // The stage at doneIndex must exist in stage_history before we advance
    const prevInHistory = component.stage_history.find(h => h.stage_index === doneIndex);
    if (!prevInHistory) {
      return res.status(400).json({
        message: `Stage flow error: "${stages[doneIndex]}" must be completed before proceeding.`,
      });
    }

    const nextIndex     = doneIndex + 1;
    const nextStageName = stages[nextIndex];

    // Record new stage
    component.stage_history.push({
      stage_name:  nextStageName,
      stage_index: nextIndex,
      scanned_at:  new Date(),
    });
    component.current_stage_index = nextIndex;

    // Update status
    if (nextIndex === 1) component.status = 'in_progress';
    if (nextIndex >= totalStages - 1) component.status = 'completed';

    await component.save();

    // If Car Body reaches final dispatch → mark unit & possibly order complete
    if (component.component_type === 'CAR_BODY' && nextIndex === totalStages - 1) {
      await RSBUnit.updateOne({ unit_id: component.unit_id }, { status: 'completed' });

      const completedCount = await RSBUnit.countDocuments({ order_id: component.order_id, status: 'completed' });
      const order = await RSBOrder.findOne({ order_id: component.order_id });
      if (order) {
        order.completed_units = completedCount;
        if (completedCount >= order.quantity) order.status = 'Completed';
        await order.save();
      }
    }

    // Real-time push to admin/supervisor rooms
    if (global.io) {
      global.io.to('admin').emit('rsbComponentUpdate', {
        component_id: component.component_id,
        order_id:     component.order_id,
        stage_name:   nextStageName,
      });
      global.io.to('supervisor').emit('rsbComponentUpdate', {
        component_id: component.component_id,
        order_id:     component.order_id,
        stage_name:   nextStageName,
      });
    }

    const isNowCompleted  = nextIndex >= totalStages - 1;
    const furtherNextName = isNowCompleted ? null : stages[nextIndex + 1];

    res.json({
      success:              true,
      component_id:         component.component_id,
      recorded_stage:       nextStageName,
      recorded_stage_index: nextIndex,
      next_stage_name:      furtherNextName,
      next_stage_index:     isNowCompleted ? null : nextIndex + 1,
      is_completed:         isNowCompleted,
      status:               component.status,
      stage_history:        component.stage_history,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/stats  (admin / supervisor)
// Dashboard summary: orders, units, components, today's activity
// ─────────────────────────────────────────────────────────
exports.getRSBStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      totalUnits,
      completedUnits,
      totalComponents,
      completedComponents,
      inProgressComponents,
    ] = await Promise.all([
      RSBOrder.countDocuments(),
      RSBOrder.countDocuments({ status: 'Active' }),
      RSBOrder.countDocuments({ status: 'Completed' }),
      RSBUnit.countDocuments(),
      RSBUnit.countDocuments({ status: 'completed' }),
      RSBComponent.countDocuments(),
      RSBComponent.countDocuments({ status: 'completed' }),
      RSBComponent.countDocuments({ status: 'in_progress' }),
    ]);

    // Today's scan activity — count stage_history entries scanned today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayScans = await RSBComponent.aggregate([
      { $unwind: '$stage_history' },
      { $match: { 'stage_history.scanned_at': { $gte: todayStart } } },
      { $count: 'total' },
    ]);

    // Recent activity — last 10 scans across all components
    const recentActivity = await RSBComponent.aggregate([
      { $unwind: '$stage_history' },
      { $sort:  { 'stage_history.scanned_at': -1 } },
      { $limit: 10 },
      {
        $project: {
          _id:            0,
          component_id:   1,
          component_type: 1,
          display_name:   1,
          order_id:       1,
          stage_name:     '$stage_history.stage_name',
          scanned_at:     '$stage_history.scanned_at',
        },
      },
    ]);

    res.json({
      orders: { total: totalOrders, active: activeOrders, completed: completedOrders },
      units:  { total: totalUnits,  completed: completedUnits },
      components: {
        total:       totalComponents,
        completed:   completedComponents,
        in_progress: inProgressComponents,
        pending:     totalComponents - completedComponents - inProgressComponents,
      },
      today_scans:     todayScans[0]?.total ?? 0,
      recent_activity: recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/export/csv  (admin / supervisor)
// Flat CSV of all RSB components with stage history summary
// ─────────────────────────────────────────────────────────
exports.exportRSBCsv = async (req, res, next) => {
  try {
    const components = await RSBComponent.find().sort({ order_id: 1, unit_index: 1, component_type: 1 });

    const header = [
      'Order ID', 'Unit Index', 'Component ID', 'Component Type',
      'Status', 'Stages Completed', 'Last Stage', 'Last Scanned At',
    ].join(',');

    const rows = components.map((c) => {
      const lastEntry = c.stage_history[c.stage_history.length - 1];
      return [
        c.order_id,
        c.unit_index,
        c.component_id,
        c.component_type,
        c.status,
        c.stage_history.length,
        lastEntry ? `"${lastEntry.stage_name}"` : '',
        lastEntry ? new Date(lastEntry.scanned_at).toISOString() : '',
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rsb_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/stage-counts  (admin / supervisor)
// Returns count of components per stage, optionally filtered by order_id
// ─────────────────────────────────────────────────────────
exports.getStageCounts = async (req, res, next) => {
  try {
    const { order_id } = req.query;
    const match = {};
    if (order_id) {
      match.order_id = order_id;
    }

    const counts = await RSBComponent.aggregate([
      { $match: match },
      { $unwind: '$stage_history' },
      {
        $group: {
          _id: '$stage_history.stage_name',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    counts.forEach(item => {
      result[item._id] = item.count;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rsb/stage-components  (admin / supervisor)
// Returns list of components that have completed a specific stage, sorted by completion date
// ─────────────────────────────────────────────────────────
exports.getComponentsByStage = async (req, res, next) => {
  try {
    const { stage_name, order_id } = req.query;
    if (!stage_name) {
      return res.status(400).json({ message: 'stage_name query parameter is required.' });
    }

    const query = { 'stage_history.stage_name': stage_name };
    if (order_id) {
      query.order_id = order_id;
    }

    const components = await RSBComponent.find(query).sort({ 'stage_history.scanned_at': -1 });

    const data = components.map(c => {
      const stageEntry = c.stage_history.find(h => h.stage_name === stage_name);
      return {
        component_id: c.component_id,
        component_type: c.component_type,
        display_name: c.display_name,
        order_id: c.order_id,
        unit_index: c.unit_index,
        status: c.status,
        completed_at: stageEntry ? stageEntry.scanned_at : null,
        stage_history: c.stage_history
      };
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};



