const timeUtils = require('../utils/timeUtils');

exports.calculateWIP = (items) => {
  const wip = {};
  items.forEach(item => {
    if (item.status === 'In Progress') {
      wip[item.current_stage] = (wip[item.current_stage] || 0) + 1;
    }
  });
  return wip;
};

exports.calculateDelays = (items, threshold = 7200000) => { // 2 hours in ms
  return items.filter(item => {
    const lastHistory = item.stage_history[item.stage_history.length - 1];
    if (lastHistory && lastHistory.entry_time && !lastHistory.exit_time) {
      return Date.now() - new Date(lastHistory.entry_time) > threshold;
    }
    return false;
  }).length;
};

exports.calculateAvgCycleTime = (items) => {
  const times = {};
  items.forEach(item => {
    item.stage_history.forEach(h => {
      if (h.entry_time && h.exit_time) {
        const duration = new Date(h.exit_time) - new Date(h.entry_time);
        times[h.stage_name] = (times[h.stage_name] || []).concat(duration);
      }
    });
  });
  Object.keys(times).forEach(stage => {
    times[stage] = times[stage].reduce((a, b) => a + b, 0) / times[stage].length;
  });
  return times;
};

exports.generateDetailedReport = (items) => {
  // Bottleneck: stage with highest avg time
  const avgTimes = this.calculateAvgCycleTime(items);
  const bottleneck = Object.keys(avgTimes).reduce((a, b) => avgTimes[a] > avgTimes[b] ? a : b);
  const rejectionPct = (items.filter(i => i.status === 'Rejected').length / items.length) * 100;
  // Add more
  return { avgTimes, bottleneck, rejectionPct };
};