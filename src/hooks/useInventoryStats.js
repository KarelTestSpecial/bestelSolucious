
import { useAppContext } from '../context/AppContext';
import { getAbsoluteWeek } from '../utils/weekUtils';

export const useInventoryStats = () => {
    const { activeData, getCurrentWeekId } = useAppContext();

    const getInventory = () => {
        const currentWeekId = getCurrentWeekId();
        const currentAbsWeek = getAbsoluteWeek(currentWeekId);

        if (!activeData || !activeData.products) {
            return [];
        }

        // 1. Calculate consumption per delivery source, only for completed items from a delivery
        const consumptionBySource = activeData.consumption
            .filter(c => c.completed && c.sourceId && (c.sourceType === 'delivery' || c.sourceType === 'adhoc'))
            .reduce((acc, c) => {
                acc[c.sourceId] = (acc[c.sourceId] || 0) + c.qty;
                return acc;
            }, {});

        // 2. Map products to their inventory details
        const inventory = activeData.products.map(product => {
            const productDeliveries = activeData.deliveries.filter(d => d.productId === product.id);

            // Calculate total stock for the product (matching logic from Dashboard/Inventory)
            const totalDelivered = productDeliveries.reduce((sum, d) => sum + d.qty, 0);

            const totalConsumed = activeData.consumption
                .filter(c => {
                    if (!c.completed) return false;
                    if (c.sourceType === 'delivery' || c.sourceType === 'adhoc') {
                        const del = activeData.deliveries.find(d => d.id === c.sourceId);
                        return del && del.productId === product.id;
                    }
                    return false;
                })
                .reduce((sum, c) => sum + c.qty, 0);

            const stock = totalDelivered - totalConsumed;

            if (stock <= 0) {
                return null;
            }

            // Find the oldest delivery with items still in stock
            const inStockDeliveries = productDeliveries
                .map(d => ({
                    ...d,
                    stock: d.qty - (consumptionBySource[d.id] || 0)
                }))
                .filter(d => d.stock > 0)
                .sort((a, b) => getAbsoluteWeek(a.weekId) - getAbsoluteWeek(b.weekId));

            let weeksSincePurchase = null;
            let estDuration = null;

            if (inStockDeliveries.length > 0) {
                const oldestDelivery = inStockDeliveries[0];
                const deliveryAbsWeek = getAbsoluteWeek(oldestDelivery.weekId);
                weeksSincePurchase = currentAbsWeek - deliveryAbsWeek + 1;
                estDuration = oldestDelivery.estDuration;
            }

            // Get the most recent name, as user might have edited it
            let displayName = product.name;
            const lastDeliveryWithCustomName = [...productDeliveries].reverse().find(d => d.name);
            if (lastDeliveryWithCustomName) {
                displayName = lastDeliveryWithCustomName.name;
            } else {
                 const lastOrderWithCustomName = [...activeData.orders].reverse().find(o => o.productId === product.id && o.name);
                 if (lastOrderWithCustomName) {
                     displayName = lastOrderWithCustomName.name;
                 }
            }


            return {
                id: product.id,
                name: displayName,
                stock,
                delivered: totalDelivered,
                consumed: totalConsumed,
                weeksSincePurchase,
                estDuration,
            };

        }).filter(Boolean); // Filter out nulls for products with no stock

        return inventory;
    };

    return { getInventory };
};
