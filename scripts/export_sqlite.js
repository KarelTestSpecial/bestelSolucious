import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma/dev.db');
const db = new Database(dbPath);

function exportData() {
    const data = {
        products: db.prepare('SELECT * FROM Product').all().map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock || 0,
            estDuration: p.estDuration || 1
        })),
        orders: db.prepare('SELECT * FROM "Order"').all().map(o => ({
            id: o.id,
            productId: o.productId,
            name: o.name,
            price: o.price,
            qty: o.qty,
            estDuration: o.estDuration,
            weekId: o.weekId,
            createdAt: o.createdAt
        })),
        deliveries: db.prepare('SELECT * FROM Delivery').all().map(d => ({
            id: d.id,
            orderId: d.orderId,
            productId: d.productId,
            name: d.name,
            price: d.price,
            qty: d.qty,
            estDuration: d.estDuration,
            weekId: d.weekId,
            createdAt: d.createdAt
        })),
        consumption: db.prepare('SELECT * FROM Consumption').all().map(c => ({
            id: c.id,
            sourceId: c.sourceId,
            sourceType: c.sourceType,
            name: c.name,
            qty: c.qty,
            cost: c.cost,
            startDate: c.startDate,
            estDuration: c.estDuration,
            effDuration: c.effDuration,
            completed: Boolean(c.completed)
        }))
    };

    const outputPath = path.join(process.cwd(), 'sqlite_export.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Data exported to ${outputPath}`);
}

try {
    exportData();
} catch (error) {
    console.error('Export failed:', error);
}
