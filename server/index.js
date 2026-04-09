// server/index.js
import express from 'express';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';

const db = new Database('prisma/dev.db');
const app = express();
const PORT = 3000;

app.use(express.json());

// --- GET Endpoints (Data ophalen) ---

app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM Product').all();
  res.json(products);
});

app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM "Order" ORDER BY createdAt DESC').all();
  res.json(orders);
});

app.get('/api/deliveries', (req, res) => {
  const deliveries = db.prepare('SELECT * FROM Delivery ORDER BY createdAt DESC').all();
  res.json(deliveries);
});

app.get('/api/consumption', (req, res) => {
  const consumption = db.prepare('SELECT * FROM Consumption ORDER BY createdAt DESC').all()
    .map(c => ({ ...c, completed: !!c.completed }));
  res.json(consumption);
});

// Een gecombineerd endpoint voor alle data (om requests te besparen)
app.get('/api/full-data', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM Product').all();
    const orders = db.prepare('SELECT * FROM "Order"').all();
    const deliveries = db.prepare('SELECT * FROM Delivery').all();
    const consumption = db.prepare('SELECT * FROM Consumption').all()
      .map(c => ({ ...c, completed: !!c.completed }));
    res.json({ products, orders, deliveries, consumption });
  } catch (error) {
    console.error("Error fetching full data:", error);
    res.status(500).json({ error: "Ophalen data mislukt" });
  }
});

// --- Week Utility Functions (copied from src/utils/weekUtils.js for server-side use) ---
const getWeekIdFromDate = (dateInput) => {
    const date = new Date(dateInput);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

// --- HISTORY Endpoints ---

const handleHistoryRequest = (req, res, tableName) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM "${tableName}"`;
    let countQuery = `SELECT COUNT(*) as total FROM "${tableName}"`;
    const params = [];

    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query += ` WHERE createdAt >= ? AND createdAt <= ?`;
      countQuery += ` WHERE createdAt >= ? AND createdAt <= ?`;
      params.push(new Date(startDate).toISOString(), endOfDay.toISOString());
    }

    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const items = db.prepare(query).all(...params, limit, offset);
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult ? totalResult.total : 0;

    res.json({ items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(`Error fetching history for ${tableName}:`, error);
    res.status(500).json({ error: `Ophalen ${tableName} historie mislukt` });
  }
};

app.get('/api/history/orders', (req, res) => handleHistoryRequest(req, res, 'Order'));
app.get('/api/history/deliveries', (req, res) => handleHistoryRequest(req, res, 'Delivery'));

app.get('/api/history/verbruik', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM Consumption`;
        let countQuery = `SELECT COUNT(*) as total FROM Consumption`;
        const params = [];

        if (startDate && endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            query += ` WHERE createdAt >= ? AND createdAt <= ?`;
            countQuery += ` WHERE createdAt >= ? AND createdAt <= ?`;
            params.push(new Date(startDate).toISOString(), endOfDay.toISOString());
        }

        query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        const consumptionItems = db.prepare(query).all(...params, limit, offset);
        const totalResult = db.prepare(countQuery).get(...params);
        const total = totalResult ? totalResult.total : 0;

        const items = consumptionItems.map(c => ({
            ...c,
            completed: !!c.completed,
            weekId: c.startDate, // In de app is startDate de weekId voor consumptie
            weeklyCost: c.cost / (c.effDuration || c.estDuration || 1)
        }));

        res.json({
            items,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error(`Error fetching verbruik history:`, error);
        res.status(500).json({ error: `Ophalen verbruik historie mislukt` });
    }
});

// --- POST Endpoints (Data opslaan) ---

app.post('/api/orders', (req, res) => {
  try {
    const data = req.body;
    let product = db.prepare('SELECT * FROM Product WHERE name = ?').get(data.name);
    
    if (!product) {
      const id = data.productId || crypto.randomUUID();
      db.prepare('INSERT INTO Product (id, name, stock) VALUES (?, ?, ?)').run(id, data.name, 0);
      product = { id, name: data.name, stock: 0 };
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO "Order" (id, productId, name, price, qty, estDuration, weekId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, product.id, data.name, parseFloat(data.price), parseFloat(data.qty), parseFloat(data.estDuration || 1), data.weekId, createdAt);
    
    const newOrder = db.prepare('SELECT * FROM "Order" WHERE id = ?').get(id);
    res.json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/batch', (req, res) => {
  try {
    const { orders, weekId } = req.body; 
    const results = [];

    const insertProduct = db.prepare('INSERT INTO Product (id, name, stock) VALUES (?, ?, ?)');
    const insertOrder = db.prepare('INSERT INTO "Order" (id, productId, name, price, qty, estDuration, weekId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const getProduct = db.prepare('SELECT * FROM Product WHERE name = ?');

    const transaction = db.transaction((orders, weekId) => {
      for (const item of orders) {
        let product = getProduct.get(item.name);
        if (!product) {
          const productId = item.productId || crypto.randomUUID();
          insertProduct.run(productId, item.name, 0);
          product = { id: productId, name: item.name };
        }

        const orderId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        insertOrder.run(
          orderId,
          product.id,
          product.name,
          parseFloat(item.price || 0),
          parseFloat(item.qty || 1),
          parseFloat(item.estDuration || 1),
          weekId,
          createdAt
        );
        results.push({ id: orderId });
      }
    });

    transaction(orders, weekId);
    res.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Batch import error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/deliveries', (req, res) => {
  try {
    const data = req.body;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO Delivery (id, orderId, productId, name, price, qty, estDuration, weekId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        id,
        data.orderId || null,
        data.productId,
        data.name,
        parseFloat(data.price),
        parseFloat(data.qty),
        parseFloat(data.estDuration || 1),
        data.weekId,
        createdAt
      );
    const newDelivery = db.prepare('SELECT * FROM Delivery WHERE id = ?').get(id);
    res.json(newDelivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/consumption', (req, res) => {
  try {
    const data = req.body;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO Consumption (id, sourceId, sourceType, name, qty, cost, startDate, estDuration, effDuration, completed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        id,
        data.sourceId,
        data.sourceType,
        data.name,
        parseFloat(data.qty),
        parseFloat(data.cost),
        data.startDate,
        parseFloat(data.estDuration),
        data.effDuration ? parseFloat(data.effDuration) : null,
        data.completed ? 1 : 0,
        createdAt
      );
    const newConsumption = db.prepare('SELECT * FROM Consumption WHERE id = ?').get(id);
    res.json(newConsumption);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PATCH Endpoints (Updates) ---

app.patch('/api/consumption/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map(key => `"${key}" = ?`).join(', ');
    const values = Object.values(updates).map(val => typeof val === 'boolean' ? (val ? 1 : 0) : val);
    
    db.prepare(`UPDATE Consumption SET ${fields} WHERE id = ?`).run(...values, id);
    
    const updated = db.prepare('SELECT * FROM Consumption WHERE id = ?').get(id);
    res.json({ ...updated, completed: !!updated.completed });
  } catch (error) {
    console.error("Error updating consumption:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/deliveries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).map(key => `"${key}" = ?`).join(', ');
    const values = Object.values(updates);
    
    db.prepare(`UPDATE Delivery SET ${fields} WHERE id = ?`).run(...values, id);
    const updatedDelivery = db.prepare('SELECT * FROM Delivery WHERE id = ?').get(id);

    if (updates.price !== undefined || updates.qty !== undefined || updates.name !== undefined || updates.estDuration !== undefined) {
      const consumption = db.prepare('SELECT * FROM Consumption WHERE sourceId = ?').get(id);

      if (consumption) {
        const newName = updates.name !== undefined ? updates.name : consumption.name;
        const newQty = updates.qty !== undefined ? updates.qty : consumption.qty;
        const newPrice = updates.price !== undefined ? updates.price : updatedDelivery.price;
        const newCost = newPrice * newQty;
        const newEstDuration = updates.estDuration !== undefined ? updates.estDuration : consumption.estDuration;

        db.prepare('UPDATE Consumption SET name = ?, qty = ?, cost = ?, estDuration = ? WHERE id = ?')
          .run(newName, newQty, newCost, newEstDuration, consumption.id);
      }
    }

    res.json(updatedDelivery);
  } catch (error) {
    console.error("Error updating delivery:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map(key => `"${key}" = ?`).join(', ');
    const values = Object.values(updates);
    
    db.prepare(`UPDATE "Order" SET ${fields} WHERE id = ?`).run(...values, id);
    
    const updated = db.prepare('SELECT * FROM "Order" WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- DELETE Endpoints ---

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM "Order" WHERE id = ?').run(id);
  res.json({ success: true });
});

app.delete('/api/deliveries/:id', (req, res) => {
  const { id } = req.params;
  db.transaction(() => {
    db.prepare('DELETE FROM Consumption WHERE sourceId = ?').run(id);
    db.prepare('DELETE FROM Delivery WHERE id = ?').run(id);
  })();
  res.json({ success: true });
});

app.delete('/api/consumption/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM Consumption WHERE id = ?').run(id);
  res.json({ success: true });
});

// --- CLEAR Endpoint ---
app.delete('/api/clear', (req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM Consumption').run();
      db.prepare('DELETE FROM Delivery').run();
      db.prepare('DELETE FROM "Order"').run();
      db.prepare('DELETE FROM Product').run();
    })();
    res.json({ success: true, message: "Database volledig gewist." });
  } catch (error) {
    console.error("Clear failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- RESTORE Endpoint ---
app.post('/api/restore', (req, res) => {
  const { products, orders, deliveries, consumption } = req.body;
  try {
    db.transaction(() => {
      if (products?.length) {
        const upsertProduct = db.prepare(`
          INSERT INTO Product (id, name, stock) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, stock=excluded.stock
        `);
        for (const p of products) {
          upsertProduct.run(p.id, p.name, parseFloat(p.stock || 0));
        }
      }

      if (orders?.length) {
        const upsertOrder = db.prepare(`
          INSERT INTO "Order" (id, productId, name, price, qty, estDuration, weekId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            name=excluded.name, productId=excluded.productId, price=excluded.price, 
            qty=excluded.qty, estDuration=excluded.estDuration, weekId=excluded.weekId
        `);
        for (const o of orders) {
          upsertOrder.run(
            o.id, o.productId, o.name, parseFloat(o.price), parseFloat(o.qty), 
            parseFloat(o.estDuration || 1), o.weekId, o.createdAt || new Date().toISOString()
          );
        }
      }

      if (deliveries?.length) {
        const upsertDelivery = db.prepare(`
          INSERT INTO Delivery (id, orderId, productId, name, price, qty, estDuration, weekId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            name=excluded.name, productId=excluded.productId, orderId=excluded.orderId, 
            price=excluded.price, qty=excluded.qty, estDuration=excluded.estDuration, weekId=excluded.weekId
        `);
        for (const d of deliveries) {
          upsertDelivery.run(
            d.id, d.orderId || null, d.productId, d.name, parseFloat(d.price), 
            parseFloat(d.qty), parseFloat(d.estDuration || 1), d.weekId, d.createdAt || new Date().toISOString()
          );
        }
      }

      if (consumption?.length) {
        const upsertConsumption = db.prepare(`
          INSERT INTO Consumption (id, sourceId, sourceType, name, qty, cost, startDate, estDuration, effDuration, completed, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            name=excluded.name, qty=excluded.qty, cost=excluded.cost, startDate=excluded.startDate, 
            estDuration=excluded.estDuration, effDuration=excluded.effDuration, completed=excluded.completed
        `);
        for (const c of consumption) {
          upsertConsumption.run(
            c.id, c.sourceId, c.sourceType, c.name, parseFloat(c.qty), parseFloat(c.cost), 
            c.startDate, parseFloat(c.estDuration), c.effDuration ? parseFloat(c.effDuration) : null, 
            c.completed ? 1 : 0, c.createdAt || new Date().toISOString()
          );
        }
      }
    })();
    res.json({ success: true, message: "Data succesvol samengevoegd." });
  } catch (error) {
    console.error("Restore failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
