
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

        // Helper function to calculate delivery stock with duration-based depletion
        const calculateDeliveryStock = (delivery, currentAbsWeek, consumptionBySource) => {
            const deliveryAbsWeek = getAbsoluteWeek(delivery.weekId);
            const depletionAbsWeek = deliveryAbsWeek + (delivery.estDuration || 1) - 1;
            
            // Check if current week is beyond depletion week (auto-depletion)
            if (currentAbsWeek > depletionAbsWeek) {
                return {
                    stock: 0,
                    status: 'DEPLETED_DURATION',
                    weeksSincePurchase: currentAbsWeek - deliveryAbsWeek + 1,
                    depletionWeek: deliveryAbsWeek + (delivery.estDuration || 1) - 1
                };
            }
            
            // Calculate explicit consumption
            const explicitConsumption = consumptionBySource[delivery.id] || 0;
            const remainingStock = Math.max(0, delivery.qty - explicitConsumption);
            
            return {
                stock: remainingStock,
                status: remainingStock === 0 ? 'CONSUMED' : 'ACTIVE',
                weeksSincePurchase: currentAbsWeek - deliveryAbsWeek + 1,
                depletionWeek: depletionAbsWeek
            };
        };

        // 2. Map products to their inventory details with delivery-level tracking
        const inventory = activeData.products.map(product => {
            const productDeliveries = activeData.deliveries.filter(d => d.productId === product.id);

            // Calculate stock for each delivery
            const deliveryStocks = productDeliveries.map(delivery => 
                calculateDeliveryStock(delivery, currentAbsWeek, consumptionBySource)
            );

            // Calculate totals
            const totalDelivered = productDeliveries.reduce((sum, d) => sum + d.qty, 0);
            
            // Calculate total consumed: explicit consumption + duration-based depletion
            const explicitConsumed = activeData.consumption
                .filter(c => {
                    if (!c.completed) return false;
                    if (c.sourceType === 'delivery' || c.sourceType === 'adhoc') {
                        const del = activeData.deliveries.find(d => d.id === c.sourceId);
                        return del && del.productId === product.id;
                    }
                    return false;
                })
                .reduce((sum, c) => sum + c.qty, 0);

            // Add duration-based depletion
            const durationBasedDepleted = deliveryStocks
                .filter(ds => ds.status === 'DEPLETED_DURATION')
                .reduce((sum, ds, index) => {
                    const delivery = productDeliveries[index];
                    const explicitConsumption = consumptionBySource[delivery.id] || 0;
                    return sum + (delivery.qty - explicitConsumption);
                }, 0);

            const totalConsumed = explicitConsumed + durationBasedDepleted;
            const totalStock = totalDelivered - totalConsumed;

            // Filter out products with no stock
            if (totalStock <= 0) {
                return null;
            }

            // Find the oldest delivery for display purposes
            const oldestDelivery = deliveryStocks
                .filter((ds, index) => ds.stock > 0 || ds.weeksSincePurchase <= 4)
                .sort((a, b) => a.weeksSincePurchase - b.weeksSincePurchase)[0];

            const oldestDeliveryInfo = oldestDelivery ? 
                productDeliveries[deliveryStocks.indexOf(oldestDelivery)] : 
                productDeliveries[0];

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
                stock: totalStock,
                delivered: totalDelivered,
                consumed: totalConsumed,
                deliveryWeek: oldestDeliveryInfo ? oldestDeliveryInfo.weekId : 'N/A',
                weeksSincePurchase: oldestDelivery ? oldestDelivery.weeksSincePurchase : 0,
                estDuration: oldestDeliveryInfo ? (oldestDeliveryInfo.estDuration || 1) : 1,
                deliveryDetails: deliveryStocks.map((ds, index) => ({
                    ...ds,
                    delivery: productDeliveries[index]
                }))
            };

        }).filter(Boolean); // Filter out nulls for products with no stock

        return inventory;
    };

    return { getInventory };
};
