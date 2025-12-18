import { useAppContext } from '../context/AppContext';
import { isWeekInRange, parseWeekId } from '../utils/weekUtils';

export const useWeeklyStats = () => {
    const { activeData, getRelativeWeekId, getCurrentWeekId } = useAppContext();

    const getStatsForWeek = (weekId) => {
        // 3.a Bestellingen van deze week
        const orders = activeData.orders.filter(o => o.weekId === weekId);
        const orderTotal = orders.reduce((sum, o) => sum + (o.price * o.qty), 0);

        // 3.b.1 Leveringen van deze week
        const deliveries = activeData.deliveries.filter(d => d.weekId === weekId);
        const deliveryTotal = deliveries.reduce((sum, d) => sum + (d.price * d.qty), 0);

        const currentWeekId = getCurrentWeekId();
        const { year: curY, week: curW } = parseWeekId(currentWeekId);
        const currentAbs = curY * 53 + curW;

        // Enrich and filter consumption
        const consumptionInWeek = activeData.consumption.map(c => {
            let name = c.name || 'Onbekend';
            if (c.sourceType === 'delivery') {
                const delivery = activeData.deliveries.find(d => d.id === c.sourceId);
                const product = delivery ? activeData.products.find(p => p.id === delivery.productId) : null;
                name = product ? product.name : (delivery ? delivery.name : 'Geleverd Item');
            }

            let duration;
            if (c.completed && c.effDuration) {
                duration = c.effDuration;
            } else {
                const { year: stY, week: stW } = parseWeekId(c.startDate);
                const startAbs = stY * 53 + stW;
                // Duur groeit elke week zolang niet voltooid (start bij 1)
                duration = Math.max(1, currentAbs - startAbs + 1);
            }

            const weeklyCost = c.cost / duration;
            return { ...c, displayName: name, weeklyCost, duration };
        }).filter(c => isWeekInRange(weekId, c.startDate, c.duration));

        const totalConsumptionCost = consumptionInWeek.reduce((sum, c) => sum + c.weeklyCost, 0);

        return {
            orders,
            orderTotal,
            deliveries,
            deliveryTotal,
            consumptionInWeek,
            totalConsumptionCost
        };
    };

    const getTimeline = () => {
        return [-1, 0, 1, 2, 3, 4].map(offset => {
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
