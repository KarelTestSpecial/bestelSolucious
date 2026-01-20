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
                    name: name,
                    price: d.price,
                    estDuration: d.estDuration || 1,
                    lastWeekId: d.weekId
                });
            } else {
                const existing = productsMap.get(name);
                // Update naar de meest recente prijs/duur indien nodig
                if (getAbsoluteWeek(d.weekId) > getAbsoluteWeek(existing.lastWeekId)) {
                    productsMap.set(name, {
                        ...existing,
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
                    name: name,
                    price: o.price,
                    estDuration: o.estDuration || 1,
                    lastWeekId: o.weekId
                });
            } else {
                const existing = productsMap.get(name);
                if (getAbsoluteWeek(o.weekId) > getAbsoluteWeek(existing.lastWeekId)) {
                    productsMap.set(name, {
                        ...existing,
                        price: o.price,
                        estDuration: o.estDuration || 1,
                        lastWeekId: o.weekId
                    });
                }
            }
        });

        return Array.from(productsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    };

    return { getProductList };
};
