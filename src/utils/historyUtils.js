import { getWeekIdFromDate } from './weekUtils';

export const groupDataByWeek = (data) => {
  if (!data || (!data.orders && !data.deliveries && !data.verbruik)) {
    return {};
  }

  const allWeeks = new Set();
  
  // Collect all weekIds from all data types
  [...(data.orders || []), ...(data.deliveries || []), ...(data.verbruik || [])].forEach(item => {
    const weekId = getWeekIdFromDate(new Date(item.createdAt));
    allWeeks.add(weekId);
  });

  const grouped = {};
  
  // Initialize week structure
  allWeeks.forEach(weekId => {
    grouped[weekId] = {
      orders: [],
      deliveries: [],
      verbruik: [],
      totals: {
        orders: 0,
        deliveries: 0,
        verbruik: 0,
        grandTotal: 0
      }
    };
  });

  // Process orders
  (data.orders || []).forEach(item => {
    const weekId = getWeekIdFromDate(new Date(item.createdAt));
    if (grouped[weekId]) {
      grouped[weekId].orders.push(item);
      grouped[weekId].totals.orders += (item.price || 0) * (item.qty || 0);
    }
  });

  // Process deliveries
  (data.deliveries || []).forEach(item => {
    const weekId = getWeekIdFromDate(new Date(item.createdAt));
    if (grouped[weekId]) {
      grouped[weekId].deliveries.push(item);
      grouped[weekId].totals.deliveries += (item.price || 0) * (item.qty || 0);
    }
  });

  // Process verbruik
  (data.verbruik || []).forEach(item => {
    const weekId = getWeekIdFromDate(new Date(item.createdAt));
    if (grouped[weekId]) {
      grouped[weekId].verbruik.push(item);
      grouped[weekId].totals.verbruik += item.cost || 0;
    }
  });

  // Calculate grand totals for each week
  Object.keys(grouped).forEach(weekId => {
    const totals = grouped[weekId].totals;
    totals.grandTotal = totals.orders + totals.deliveries + totals.verbruik;
    
    // Sort items within each type by date, most recent first
    grouped[weekId].orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    grouped[weekId].deliveries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    grouped[weekId].verbruik.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });

  // Sort weeks descending (most recent first)
  const sortedGrouped = Object.keys(grouped)
    .sort()
    .reverse()
    .reduce((obj, key) => {
      obj[key] = grouped[key];
      return obj;
    }, {});

return sortedGrouped;
};
