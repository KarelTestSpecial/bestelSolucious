import { useAppContext } from '../context/AppContext';
import { getAbsoluteWeek } from '../utils/weekUtils';

export const useProductList = () => {
    const { activeData } = useAppContext();

    const getProductList = () => {
        if (!activeData || !activeData.products) {
            return [];
        }

        const allProducts = activeData.products.map(product => {
            // 1. Get related data for the current product
            const productDeliveries = activeData.deliveries.filter(d => d.productId === product.id);
            const productOrders = activeData.orders.filter(o => o.productId === product.id);

            const productConsumptions = activeData.consumption.filter(c => {
                if (c.sourceType !== 'delivery' && c.sourceType !== 'adhoc') return false;
                const sourceDelivery = activeData.deliveries.find(d => d.id === c.sourceId);
                return sourceDelivery && sourceDelivery.productId === product.id;
            });

            // 2. Calculate current stock
            const totalDelivered = productDeliveries.reduce((sum, d) => sum + d.qty, 0);
            const totalConsumed = productConsumptions
                .filter(c => c.completed)
                .reduce((sum, c) => sum + c.qty, 0);
            const currentStock = totalDelivered - totalConsumed;

            // 3. Find the most recent price from the latest delivery or order
            const lastDelivery = [...productDeliveries].sort((a, b) => getAbsoluteWeek(b.weekId) - getAbsoluteWeek(a.weekId))[0];
            const lastOrder = [...productOrders].sort((a, b) => getAbsoluteWeek(b.weekId) - getAbsoluteWeek(a.weekId))[0];

            let recentPrice = 0;
            if (lastDelivery && lastOrder) {
                recentPrice = getAbsoluteWeek(lastDelivery.weekId) >= getAbsoluteWeek(lastOrder.weekId) ? lastDelivery.price : lastOrder.price;
            } else if (lastDelivery) {
                recentPrice = lastDelivery.price;
            } else if (lastOrder) {
                recentPrice = lastOrder.price;
            }
            recentPrice = recentPrice || 0;

            // 4. Calculate average weekly consumption and weeks of supply
            let weeksOfSupply = Infinity;
            if (activeData.settings && activeData.settings.currentWeek) {
                const currentAbsWeek = getAbsoluteWeek(activeData.settings.currentWeek);
                const historySpan = 8; // Look back 8 weeks for consumption average
                const recentConsumptions = productConsumptions
                    .filter(c => c.completed && getAbsoluteWeek(c.weekId) > currentAbsWeek - historySpan && getAbsoluteWeek(c.weekId) <= currentAbsWeek);

                const totalRecentConsumption = recentConsumptions.reduce((sum, c) => sum + c.qty, 0);
                const avgWeeklyConsumption = totalRecentConsumption / historySpan;

                weeksOfSupply = avgWeeklyConsumption > 0 ? Math.round((currentStock / avgWeeklyConsumption) * 10) / 10 : Infinity;
            }

            // 6. Get the most recent name for the product
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

            return {
                id: product.id,
                name: displayName,
                stock: currentStock,
                price: recentPrice,
                weeksOfSupply: weeksOfSupply
            };
        });

        return allProducts.sort((a, b) => a.name.localeCompare(b.name));
    };

    return { getProductList };
};
