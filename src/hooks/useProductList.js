import { useAppContext } from '../context/AppContext';
import { getAbsoluteWeek } from '../utils/weekUtils';

export const useProductList = () => {
    const { activeData } = useAppContext();

    const getProductList = () => {
        if (!activeData || !activeData.products) {
            return [];
        }

        // Step 1: Create a map of all product variants, grouped by a canonical lowercase name.
        const productsByName = {};
        activeData.products.forEach(product => {
            // Determine the most current display name for a product, as it might have been edited.
            const productDeliveries = activeData.deliveries.filter(d => d.productId === product.id);
            const productOrders = activeData.orders.filter(o => o.productId === product.id);
            let displayName = product.name;
            const lastDeliveryWithCustomName = [...productDeliveries].reverse().find(d => d.name);
            if (lastDeliveryWithCustomName) {
                displayName = lastDeliveryWithCustomName.name;
            } else {
                 const lastOrderWithCustomName = [...productOrders].reverse().find(o => o.name);
                 if (lastOrderWithCustomName) {
                     displayName = lastOrderWithCustomName.name;
                 }
            }
            const lowerCaseName = displayName.toLowerCase();

            if (!productsByName[lowerCaseName]) {
                productsByName[lowerCaseName] = [];
            }
            productsByName[lowerCaseName].push(product.id);
        });

        // Step 2: Iterate over each group of products, aggregate their data, and calculate stats.
        const aggregatedProducts = Object.keys(productsByName).map(name => {
            const productIds = productsByName[name];

            // Aggregate all related data for the products in this group
            const allDeliveries = activeData.deliveries.filter(d => productIds.includes(d.productId));
            const allOrders = activeData.orders.filter(o => productIds.includes(o.productId));
            const allConsumptions = activeData.consumption.filter(c => {
                if (c.sourceType !== 'delivery' && c.sourceType !== 'adhoc') return false;
                const sourceDelivery = activeData.deliveries.find(d => d.id === c.sourceId);
                return sourceDelivery && productIds.includes(sourceDelivery.productId);
            });

            // Calculate aggregated stock
            const totalDelivered = allDeliveries.reduce((sum, d) => sum + d.qty, 0);
            const totalConsumed = allConsumptions
                .filter(c => c.completed)
                .reduce((sum, c) => sum + c.qty, 0);
            const currentStock = totalDelivered - totalConsumed;

            // Find the most recent price from all aggregated deliveries and orders
            const lastDelivery = [...allDeliveries].sort((a, b) => getAbsoluteWeek(b.weekId) - getAbsoluteWeek(a.weekId))[0];
            const lastOrder = [...allOrders].sort((a, b) => getAbsoluteWeek(b.weekId) - getAbsoluteWeek(a.weekId))[0];

            let recentPrice = 0;
            if (lastDelivery && lastOrder) {
                recentPrice = getAbsoluteWeek(lastDelivery.weekId) >= getAbsoluteWeek(lastOrder.weekId) ? lastDelivery.price : lastOrder.price;
            } else if (lastDelivery) {
                recentPrice = lastDelivery.price;
            } else if (lastOrder) {
                recentPrice = lastOrder.price;
            }
            recentPrice = recentPrice || 0;

            // Calculate aggregated weeks of supply
            let weeksOfSupply = Infinity;
            if (activeData.settings && activeData.settings.currentWeek) {
                const currentAbsWeek = getAbsoluteWeek(activeData.settings.currentWeek);
                const historySpan = 8;
                const recentConsumptions = allConsumptions
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
