export const parseSpreadsheetTSV = (tsvContent, mode = 'delivery') => {
    const lines = tsvContent.split('\n');
    const results = {
        orders: [],
        deliveries: [],
        consumption: [],
        products: []
    };

    let currentWeekId = null;
    let currentYear = new Date().getFullYear();

    lines.forEach(line => {
        if (!line.trim()) return;

        const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})/);
        if (dateMatch) {
            const [, day, month] = dateMatch;
            const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
            const onejan = new Date(currentYear, 0, 1);
            const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            currentWeekId = `${currentYear}-W${week}`;
            return;
        }

        const parts = line.trim().split('\t').filter(p => p.trim());
        if (parts.length >= 3 && currentWeekId) {
            const [name, qtyStr, priceStr] = parts;
            const qty = parseInt(qtyStr.replace(',', '.')) || 1;
            const price = parseFloat(priceStr.replace(',', '.')) || 0;

            const productId = crypto.randomUUID();
            results.products.push({ id: productId, name });

            if (mode === 'order') {
                results.orders.push({
                    id: crypto.randomUUID(),
                    productId,
                    name,
                    price,
                    qty,
                    weekId: currentWeekId
                });
            } else {
                const deliveryId = crypto.randomUUID();
                results.deliveries.push({
                    id: deliveryId,
                    orderId: 'IMPORTED',
                    productId,
                    name,
                    price,
                    qty,
                    weekId: currentWeekId
                });

                results.consumption.push({
                    id: crypto.randomUUID(),
                    sourceId: deliveryId,
                    sourceType: 'delivery',
                    qty,
                    cost: price * qty,
                    startDate: currentWeekId,
                    estDuration: 1,
                    completed: true,
                    effDuration: 1
                });
            }
        }
    });

    return results;
};
