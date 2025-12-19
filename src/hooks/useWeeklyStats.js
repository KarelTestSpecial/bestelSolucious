import { useAppContext } from '../context/AppContext';
import { isWeekInRange, parseWeekId, getAbsoluteWeek } from '../utils/weekUtils';

export const useWeeklyStats = () => {
    const { activeData, getRelativeWeekId, getCurrentWeekId } = useAppContext();

    const getStatsForWeek = (weekId) => {
        const targetAbs = getAbsoluteWeek(weekId);

        // 3.a Bestellingen van deze week
        const orders = activeData.orders.filter(o => o.weekId === weekId);
        const orderTotal = orders.reduce((sum, o) => sum + (o.price * o.qty), 0);

        // 3.b.1 Leveringen van deze week
        const deliveries = activeData.deliveries.filter(d => d.weekId === weekId);
        const deliveryTotal = deliveries.reduce((sum, d) => sum + (d.price * d.qty), 0);

        const currentWeekId = getCurrentWeekId();
        const currentAbs = getAbsoluteWeek(currentWeekId);

        // Enrich and filter consumption
        const consumptionInWeek = activeData.consumption.map(c => {
            let name = c.name || 'Onbekend';
            if (c.sourceType === 'delivery' || c.sourceType === 'adhoc') {
                const delivery = activeData.deliveries.find(d => d.id === c.sourceId);
                // We prefer the delivery name if it exists, as it might have been edited by the user
                name = delivery ? delivery.name : (c.name || 'Item');
            }

            let duration;
            if (c.completed && c.effDuration) {
                duration = c.effDuration;
            } else {
                const startAbs = getAbsoluteWeek(c.startDate);
                // Duur groeit elke week zolang niet voltooid (start bij 1)
                duration = Math.max(1, currentAbs - startAbs + 1);
            }

            const weeklyCost = c.cost / duration;
            return { ...c, displayName: name, weeklyCost, duration };
        }).filter(c => isWeekInRange(weekId, c.startDate, c.duration));

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
        return [0, 1, 2, 3, 4].map(offset => {
            const weekId = getRelativeWeekId(offset);
            return {
                offset,
                weekId,
                stats: getStatsForWeek(weekId)
            };
        });
    };

    return { getTimeline, getStatsForWeek };
};
