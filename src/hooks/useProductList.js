import { useAppContext } from '../context/AppContext';
import { getAbsoluteWeek } from '../utils/weekUtils';

export const useProductList = () => {
    const { activeData } = useAppContext();

    const getProductList = () => {
        if (!activeData) return [];

        const { products = [], deliveries = [], orders = [], consumption = [] } = activeData;

        // Helper function to determine the canonical lowercase name for a given delivery or order record.
        // A record's own `name` property takes precedence over the name in the central `products` table.
        const getRecordName = (record) => {
            if (record.name) return record.name.toLowerCase();
            const product = products.find(p => p.id === record.productId);
            return product ? product.name.toLowerCase() : null;
        };

        // Step 1: Collect all unique product names from all possible sources to define our product list.
        const uniqueProductNames = new Set();
        products.forEach(p => uniqueProductNames.add(p.name.toLowerCase()));
        deliveries.forEach(d => {
            const name = getRecordName(d);
            if (name) uniqueProductNames.add(name);
        });
        orders.forEach(o => {
            const name = getRecordName(o);
            if (name) uniqueProductNames.add(name);
        });

        // Step 2: For each unique name, find all associated records and aggregate their data.
        const aggregatedProducts = Array.from(uniqueProductNames).map(name => {

            // Filter all records from all tables that match the canonical name.
            const matchingDeliveries = deliveries.filter(d => getRecordName(d) === name);
            const matchingOrders = orders.filter(o => getRecordName(o) === name);
            const matchingConsumptions = consumption.filter(c => {
                if (c.sourceType !== 'delivery' && c.sourceType !== 'adhoc') return false;
                const sourceDelivery = deliveries.find(d => d.id === c.sourceId);
                return sourceDelivery && getRecordName(sourceDelivery) === name;
            });

            // Calculate aggregated stock from all matching deliveries and consumptions.
            const totalDelivered = matchingDeliveries.reduce((sum, d) => sum + d.qty, 0);
            const totalConsumed = matchingConsumptions
                .filter(c => c.completed)
                .reduce((sum, c) => sum + c.qty, 0);
            const currentStock = totalDelivered - totalConsumed;

            // Find the most recent price from all matching deliveries and orders.
            const lastDelivery = [...matchingDeliveries].sort((a, b) => getAbsoluteWeek(b.weekId) - getAbsoluteWeek(a.weekId))[0];
            const lastOrder = [...matchingOrders].sort((a, b) => getAbsoluteWeek(b.weekId) - getAbsoluteWeek(a.weekId))[0];

            let recentPrice = 0;
            if (lastDelivery && lastOrder) {
                recentPrice = getAbsoluteWeek(lastDelivery.weekId) >= getAbsoluteWeek(lastOrder.weekId) ? lastDelivery.price : lastOrder.price;
            } else if (lastDelivery) {
                recentPrice = lastDelivery.price;
            } else if (lastOrder) {
                recentPrice = lastOrder.price;
            }
            recentPrice = recentPrice || 0;

            // Calculate aggregated weeks of supply.
            let weeksOfSupply = Infinity;
            if (activeData.settings && activeData.settings.currentWeek) {
                const currentAbsWeek = getAbsoluteWeek(activeData.settings.currentWeek);
                const historySpan = 8;
                const recentConsumptions = matchingConsumptions
                    .filter(c => c.completed && getAbsoluteWeek(c.weekId) > currentAbsWeek - historySpan && getAbsoluteWeek(c.weekId) <= currentAbsWeek);

                const totalRecentConsumption = recentConsumptions.reduce((sum, c) => sum + c.qty, 0);
                const avgWeeklyConsumption = totalRecentConsumption / historySpan;

                weeksOfSupply = avgWeeklyConsumption > 0 ? Math.round((currentStock / avgWeeklyConsumption) * 10) / 10 : Infinity;
            }

            return {
                id: name, // Use the unique name as the key
                name: name,
                stock: currentStock,
                price: recentPrice,
                weeksOfSupply: weeksOfSupply
            };
        });

        return aggregatedProducts.sort((a, b) => a.name.localeCompare(b.name));
    };

    return { getProductList };
};
