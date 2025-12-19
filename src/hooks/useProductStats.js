import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from './useWeeklyStats';
import { getAbsoluteWeek } from '../utils/weekUtils';

// Helper to get the current week ID, moved here to be self-contained if needed
const getCurrentWeekId = () => {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};


export const useProductStats = () => {
    const { activeData } = useAppContext();
    const { getStatsForWeek } = useWeeklyStats();

    const getStats = () => {
        // --- Defensive Programming ---
        // Ensure activeData and its properties are valid arrays before proceeding.
        // This prevents crashes if data is loading or malformed.
        const products = activeData?.products || [];
        const consumption = activeData?.consumption || [];
        const deliveries = activeData?.deliveries || [];
        const orders = activeData?.orders || [];

        if (products.length === 0) {
            return [];
        }

        const currentWeekId = getCurrentWeekId();

        return products.map(product => {
            const statsCurrentWeek = getStatsForWeek(currentWeekId);
            const inventoryItem = statsCurrentWeek.inventoryAtEnd.find(item => item.name === product.name);
            const currentStock = inventoryItem ? inventoryItem.stock : 0;

            // Filter consumptions related to this product safely
            const completedConsumptions = consumption.filter(c => {
                const delivery = deliveries.find(d => d.id === c.sourceId);
                return c.completed && c.effDuration && delivery && delivery.productId === product.id;
            });

            const avgDuration = completedConsumptions.length > 0
                ? completedConsumptions.reduce((sum, c) => sum + c.effDuration, 0) / completedConsumptions.length
                : product.avgDuration || 1;

            const weeksOfSupply = Math.floor(currentStock * avgDuration);

            let status = 'Out of Stock';
            if (currentStock > 0) {
                status = weeksOfSupply < 2 ? 'Low Stock' : 'In Stock';
            }

            const currentAbsoluteWeek = getAbsoluteWeek(currentWeekId);

            // Safely filter future deliveries and orders
            const futureDeliveries = deliveries.filter(d => d.productId === product.id && getAbsoluteWeek(d.weekId) > currentAbsoluteWeek);
            const futureOrders = orders.filter(o => o.productId === product.id && getAbsoluteWeek(o.weekId) > currentAbsoluteWeek && !deliveries.some(d => d.orderId === o.id));

            const nextDelivery = [...futureDeliveries, ...futureOrders].sort((a, b) => getAbsoluteWeek(a.weekId) - getAbsoluteWeek(b.weekId))[0];
            const nextDeliveryDate = nextDelivery ? nextDelivery.weekId : null;

            return {
                ...product,
                currentStock,
                weeksOfSupply,
                status,
                nextDeliveryDate,
            };
        });
    };

    return { getStats };
};
