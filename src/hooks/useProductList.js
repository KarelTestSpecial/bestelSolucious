import { useAppContext } from '../context/AppContext';
import { getAbsoluteWeek } from '../utils/weekUtils';

export const useProductList = () => {
    const { activeData } = useAppContext();

    const getProductList = () => {
        if (!activeData) return [];

        const { deliveries = [], orders = [] } = activeData;

        // Kaart om producten bij te houden op basis van hun kleine-letter-naam
        const productsMap = new Map();

        // Verwerk leveringen
        deliveries.forEach(d => {
            const name = d.name.toLowerCase().trim();
            if (!productsMap.has(name)) {
                productsMap.set(name, {
                    name: d.name,
                    price: d.price,
                    estDuration: d.estDuration || 1,
                    lastWeekId: d.weekId
                });
            } else {
                const existing = productsMap.get(name);
                if (getAbsoluteWeek(d.weekId) > getAbsoluteWeek(existing.lastWeekId)) {
                    productsMap.set(name, {
                        ...existing,
                        name: d.name,
                        price: d.price,
                        estDuration: d.estDuration || 1,
                        lastWeekId: d.weekId
                    });
                }
            }
        });

        // Verwerk bestellingen
        orders.forEach(o => {
            const name = o.name.toLowerCase().trim();
            if (!productsMap.has(name)) {
                productsMap.set(name, {
                    name: o.name,
                    price: o.price,
                    estDuration: o.estDuration || 1,
                    lastWeekId: o.weekId
                });
            } else {
                const existing = productsMap.get(name);
                if (getAbsoluteWeek(o.weekId) > getAbsoluteWeek(existing.lastWeekId)) {
                    productsMap.set(name, {
                        ...existing,
                        name: o.name,
                        price: o.price,
                        estDuration: o.estDuration || 1,
                        lastWeekId: o.weekId
                    });
                }
            }
        });

        // Verwerk expliciete producten (deze kunnen handmatig ingestelde estDuration hebben)
        (activeData.products || []).forEach(p => {
            const name = p.name.toLowerCase().trim();
            if (!productsMap.has(name)) {
                productsMap.set(name, {
                    id: p.id,
                    name: p.name,
                    price: 0,
                    estDuration: p.estDuration || 1,
                    lastWeekId: '0000-W00'
                });
            } else {
                const existing = productsMap.get(name);
                productsMap.set(name, {
                    ...existing,
                    id: p.id,
                    estDuration: p.estDuration || existing.estDuration
                });
            }
        });

        return Array.from(productsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    };

    return { getProductList };
};
