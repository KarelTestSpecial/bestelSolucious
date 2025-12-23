import { getWeekIdFromDate } from './weekUtils';

export const groupDataByWeek = (items) => {
  if (!items || items.length === 0) {
    return {};
  }

  const grouped = items.reduce((acc, item) => {
    // Use `createdAt` to ensure consistent week grouping for all historical items.
    const weekId = getWeekIdFromDate(new Date(item.createdAt));

    if (!acc[weekId]) {
      acc[weekId] = {
        items: [],
        total: 0,
      };
    }

    acc[weekId].items.push(item);

    // Calculate total based on the item's value (cost, or price * qty)
    const itemValue = item.cost || (item.price * item.qty) || 0;
    acc[weekId].total += itemValue;

    return acc;
  }, {});

  // Sort the weeks descending (most recent first)
  const sortedGrouped = Object.keys(grouped)
    .sort()
    .reverse()
    .reduce((obj, key) => {
      obj[key] = grouped[key];
      // Sort items within the week by date, most recent first
      obj[key].items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return obj;
    }, {});

  return sortedGrouped;
};
