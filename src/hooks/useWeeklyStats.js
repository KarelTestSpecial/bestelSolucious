import { useAppContext } from '../context/AppContext';
import { getAbsoluteWeek } from '../utils/weekUtils';

export const useWeeklyStats = () => {
    const { activeData, getRelativeWeekId } = useAppContext();

    const getStatsForWeek = (weekId) => {
        const targetAbs = getAbsoluteWeek(weekId);

        // 3.a Bestellingen van deze week
        const orders = activeData.orders.filter(o => o.weekId === weekId);
        const orderTotal = orders.reduce((sum, o) => sum + (o.price * o.qty), 0);

        // 3.b.1 Leveringen van deze week
        const deliveries = activeData.deliveries.filter(d => d.weekId === weekId);
        const deliveryTotal = deliveries.reduce((sum, d) => sum + (d.price * d.qty), 0);

        // Effective consumption is now based on all deliveries that are in stock and "active" for the current week
        const consumptionBySource = activeData.consumption
            .filter(c => c.completed && c.sourceId)
            .reduce((acc, c) => {
                acc[c.sourceId] = (acc[c.sourceId] || 0) + c.qty;
                return acc;
            }, {});

        const consumptionFromDeliveries = activeData.deliveries
            .map(d => {
                const stock = d.qty - (consumptionBySource[d.id] || 0);
                if (stock <= 0) return null;

                const startAbs = getAbsoluteWeek(d.weekId);
                const explicitConsumption = activeData.consumption.find(c => c.sourceId === d.id);

                const duration = (explicitConsumption && explicitConsumption.effDuration) ? explicitConsumption.effDuration : (d.estDuration || 1);
                const endAbs = startAbs + duration - 1;

                if (targetAbs < startAbs || targetAbs > endAbs) return null;

                const completed = explicitConsumption ? explicitConsumption.completed : false;
                if (completed) {
                    const completedEndAbs = startAbs + (explicitConsumption.effDuration || 1) - 1;
                    if (completedEndAbs < targetAbs) return null;
                }

                const cost = explicitConsumption ? explicitConsumption.cost : d.price * d.qty;
                const weeklyCost = cost / duration;
                const weeksSincePurchase = targetAbs - startAbs + 1;

                return {
                    id: explicitConsumption ? explicitConsumption.id : `implicit-${d.id}`,
                    displayName: d.name || 'Geleverd Item',
                    cost: cost,
                    qty: d.qty,
                    startDate: d.weekId,
                    estDuration: d.estDuration,
                    effDuration: explicitConsumption ? explicitConsumption.effDuration : null,
                    completed: completed,
                    weeklyCost: weeklyCost,
                    weeksSincePurchase: weeksSincePurchase,
                    duration: duration,
                    sourceId: d.id,
                };
            })
            .filter(Boolean);

        const consumptionFromOrders = activeData.orders
            .filter(o => !activeData.deliveries.some(d => d.orderId === o.id))
            .map(o => {
                const startAbs = getAbsoluteWeek(o.weekId);
                const duration = o.estDuration || 1;
                const endAbs = startAbs + duration - 1;

                if (targetAbs < startAbs || targetAbs > endAbs) return null;

                const cost = o.price * o.qty;
                const weeklyCost = cost / duration;
                const weeksSincePurchase = targetAbs - startAbs + 1;

                return {
                    id: `implicit-order-${o.id}`,
                    displayName: o.name || 'Besteld Item',
                    cost: cost,
                    qty: o.qty,
                    startDate: o.weekId,
                    estDuration: o.estDuration,
                    effDuration: null,
                    completed: false,
                    weeklyCost: weeklyCost,
                    weeksSincePurchase: weeksSincePurchase,
                    duration: duration,
                    sourceId: o.id,
                    isProjected: true
                };
            })
            .filter(Boolean);

        const consumptionInWeek = [...consumptionFromDeliveries, ...consumptionFromOrders];

        const totalConsumptionCost = consumptionInWeek.reduce((sum, c) => sum + c.weeklyCost, 0);

        // 3.c VOORRAAD EVOLUTIE (Stand aan einde van deze week)
        const inventoryAtEnd = activeData.products.map(product => {
            const deliveredUpTo = activeData.deliveries
                .filter(d => d.productId === product.id && getAbsoluteWeek(d.weekId) <= targetAbs)
                .reduce((sum, d) => sum + d.qty, 0);

            // Prospectie: Tel ook bestellingen mee die voor of in deze week gepland staan, 
            // maar die nog niet geleverd zijn.
            const pendingOrdersUpTo = activeData.orders
                .filter(o => 
                    o.productId === product.id && 
                    getAbsoluteWeek(o.weekId) <= targetAbs &&
                    !activeData.deliveries.some(d => d.orderId === o.id)
                )
                .reduce((sum, o) => sum + o.qty, 0);

            const totalInbound = deliveredUpTo + pendingOrdersUpTo;

            // Verbruik berekenen:
            // 1. Effectief verbruik (wat al als 'OP' is gemarkeerd)
            const completedConsumedUpTo = activeData.consumption
                .filter(c => {
                    if (!c.completed) return false;
                    const del = activeData.deliveries.find(d => d.id === c.sourceId);
                    if (!del || del.productId !== product.id) return false;
                    
                    const duration = c.effDuration || 1;
                    const endAbs = getAbsoluteWeek(c.startDate) + duration - 1;
                    return endAbs <= targetAbs;
                })
                .reduce((sum, c) => sum + c.qty, 0);

            // 2. Geprojecteerd verbruik van items die al geleverd zijn maar nog niet 'op' gemeld
            const projectedConsumedInUseUpTo = activeData.consumption
                .filter(c => {
                    if (c.completed) return false; // Zit al in punt 1
                    const del = activeData.deliveries.find(d => d.id === c.sourceId);
                    if (!del || del.productId !== product.id) return false;
                    
                    // Gebruik estDuration van de levering (of van de bestelling die de levering werd)
                    const duration = del.estDuration || c.estDuration || 1;
                    const endAbs = getAbsoluteWeek(c.startDate) + duration - 1;
                    return endAbs <= targetAbs;
                })
                .reduce((sum, c) => sum + c.qty, 0);

            // 3. Geprojecteerd verbruik van bestellingen die nog moeten komen
            const projectedConsumedOrdersUpTo = activeData.orders
                .filter(o => {
                    if (o.productId !== product.id) return false;
                    if (activeData.deliveries.some(d => d.orderId === o.id)) return false; // Al geleverd, zit in punt 1 of 2
                    
                    const endAbs = getAbsoluteWeek(o.weekId) + o.estDuration - 1;
                    return endAbs <= targetAbs;
                })
                .reduce((sum, o) => sum + o.qty, 0);

            return {
                name: product.name,
                stock: totalInbound - completedConsumedUpTo - projectedConsumedInUseUpTo - projectedConsumedOrdersUpTo
            };
        }).map(item => {
            // Verfijn de naam: als er een levering of bestelling is met een afwijkende (bewerkte) naam, gebruik die.
            const product = activeData.products.find(p => p.name === item.name);
            if (product) {
                const lastDelivery = [...activeData.deliveries].reverse().find(d => d.productId === product.id);
                if (lastDelivery && lastDelivery.name) return { ...item, name: lastDelivery.name };
                
                const lastOrder = [...activeData.orders].reverse().find(o => o.productId === product.id);
                if (lastOrder && lastOrder.name) return { ...item, name: lastOrder.name };
            }
            return item;
        }).filter(i => i.stock > 0);

        return {
            orders,
            orderTotal,
            deliveries,
            deliveryTotal,
            consumptionInWeek,
            totalConsumptionCost,
            inventoryAtEnd
        };
    };

    const getTimeline = () => {
        const timeline = [];
        let previousInventoryAtEnd = [];

        for (const offset of [0, 1, 2, 3, 4]) {
            const weekId = getRelativeWeekId(offset);
            const stats = getStatsForWeek(weekId);

            timeline.push({
                offset,
                weekId,
                stats: {
                    ...stats,
                    inventoryAtStart: previousInventoryAtEnd
                }
            });

            previousInventoryAtEnd = stats.inventoryAtEnd;
        }

        return timeline;
    };

    return { getTimeline, getStatsForWeek };
};
