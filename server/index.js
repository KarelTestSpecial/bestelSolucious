// server/index.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto'; // TOEGEVOEGD: Nodig voor UUID generatie

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.json());

// --- GET Endpoints (Data ophalen) ---

app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

app.get('/api/orders', async (req, res) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(orders);
});

app.get('/api/deliveries', async (req, res) => {
  const deliveries = await prisma.delivery.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(deliveries);
});

app.get('/api/consumption', async (req, res) => {
  const consumption = await prisma.consumption.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(consumption);
});

// Een gecombineerd endpoint voor alle data (om requests te besparen)
app.get('/api/full-data', async (req, res) => {
  try {
    const [products, orders, deliveries, consumption] = await Promise.all([
      prisma.product.findMany(),
      prisma.order.findMany(),
      prisma.delivery.findMany(),
      prisma.consumption.findMany()
    ]);
    res.json({ products, orders, deliveries, consumption });
  } catch (error) {
    console.error("Error fetching full data:", error);
    res.status(500).json({ error: "Ophalen data mislukt" });
  }
});

// --- Week Utility Functions (copied from src/utils/weekUtils.js for server-side use) ---
const getWeekIdFromDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Monday is day 1, Sunday is day 0 in JS
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

// --- HISTORY Endpoints ---

const handleHistoryRequest = async (req, res, modelName) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where = {};
    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: new Date(startDate), lte: endOfDay };
    }

    const model = prisma[modelName];
    const [items, total] = await prisma.$transaction([
      model.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      model.count({ where }),
    ]);

    res.json({ items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(`Error fetching history for ${modelName}:`, error);
    res.status(500).json({ error: `Ophalen ${modelName} historie mislukt` });
  }
};

app.get('/api/history/orders', (req, res) => handleHistoryRequest(req, res, 'order'));
app.get('/api/history/deliveries', (req, res) => handleHistoryRequest(req, res, 'delivery'));

app.get('/api/history/verbruik', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const skip = (page - 1) * limit;

        const dateFilter = {};
        if (startDate && endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            dateFilter.gte = new Date(startDate);
            dateFilter.lte = endOfDay;
        }

        const allDeliveries = await prisma.delivery.findMany({ where: { createdAt: dateFilter } });
        const allConsumption = await prisma.consumption.findMany({ where: { createdAt: dateFilter } });

        const consumptionBySource = allConsumption.reduce((acc, c) => {
            acc[c.sourceId] = c;
            return acc;
        }, {});

        const effectiveConsumptionItems = allDeliveries.map(d => {
            const explicitConsumption = consumptionBySource[d.id];
            const duration = explicitConsumption?.effDuration || d.estDuration || 1;
            const cost = explicitConsumption?.cost || (d.price * d.qty);

            return {
                id: explicitConsumption?.id || `implicit-${d.id}`,
                name: d.name,
                qty: d.qty,
                cost: cost,
                weeklyCost: cost / duration,
                estDuration: d.estDuration,
                effDuration: explicitConsumption?.effDuration,
                createdAt: d.createdAt,
                weekId: getWeekIdFromDate(new Date(d.createdAt)),
                sourceId: d.id,
            };
        });

        const total = effectiveConsumptionItems.length;
        const paginatedItems = effectiveConsumptionItems.slice(skip, skip + limit);

        res.json({
            items: paginatedItems,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error(`Error fetching verbruik history:`, error);
        res.status(500).json({ error: `Ophalen verbruik historie mislukt` });
    }
});

// --- POST Endpoints (Data opslaan) ---

app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body;
    let product = await prisma.product.findFirst({ where: { name: data.name } });
    
    if (!product) {
      product = await prisma.product.create({ 
        data: { name: data.name, id: data.productId || crypto.randomUUID() } 
      });
    }

    const newOrder = await prisma.order.create({
      data: {
        name: data.name,
        price: parseFloat(data.price),
        qty: parseFloat(data.qty), // AANGEPAST: parseFloat i.p.v. parseInt
        weekId: data.weekId,
        estDuration: parseFloat(data.estDuration || 1),
        productId: product.id,
      }
    });
    res.json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/batch', async (req, res) => {
  // TOEGEVOEGD: Try/Catch blok om crashes te voorkomen
  try {
    const { orders, weekId } = req.body; 
    const results = [];

    for (const item of orders) {
      // Gebruik backend crypto als fallback als frontend geen ID stuurt
      const productId = item.productId || crypto.randomUUID(); 
      
      // 1. Zoek of maak product
      let product = await prisma.product.findFirst({ where: { name: item.name } });
      if (!product) {
        product = await prisma.product.create({ 
          data: { name: item.name, id: productId } 
        });
      }

      // 2. Maak bestelling
      const order = await prisma.order.create({
        data: {
          productId: product.id,
          name: product.name,
          price: parseFloat(item.price || 0),
          qty: parseFloat(item.qty || 1), // AANGEPAST: parseFloat zodat 0.5 niet 0 wordt
          estDuration: parseFloat(item.estDuration || 1),
          weekId: weekId
        }
      });
      results.push(order);
    }

    res.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Batch import error:", error); // Dit toont de echte fout in Terminal 1
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/deliveries', async (req, res) => {
  try {
    const data = req.body;
    const newDelivery = await prisma.delivery.create({ 
      data: {
        ...data,
        estDuration: parseFloat(data.estDuration || 1)
      } 
    });
    res.json(newDelivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/consumption', async (req, res) => {
  try {
    const data = req.body;
    const newConsumption = await prisma.consumption.create({ data });
    res.json(newConsumption);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PATCH Endpoints (Updates) ---

app.patch('/api/consumption/:id', async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.consumption.update({
    where: { id },
    data: req.body
  });
  res.json(updated);
});

app.patch('/api/deliveries/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: updates
  });

  if (updates.price !== undefined || updates.qty !== undefined || updates.name !== undefined || updates.estDuration !== undefined) {
    const consumption = await prisma.consumption.findFirst({
      where: { sourceId: id }
    });

    if (consumption) {
      await prisma.consumption.update({
        where: { id: consumption.id },
        data: {
          name: updates.name !== undefined ? updates.name : undefined,
          qty: updates.qty !== undefined ? parseFloat(updates.qty) : undefined,
          estDuration: updates.estDuration !== undefined ? parseFloat(updates.estDuration) : undefined,
          cost: (updatedDelivery.price * updatedDelivery.qty)
        }
      });
    }
  }
  res.json(updatedDelivery);
});

app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.order.update({
    where: { id },
    data: req.body
  });
  res.json(updated);
});

// --- DELETE Endpoints ---

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.order.delete({ where: { id } });
  res.json({ success: true });
});

app.delete('/api/deliveries/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.consumption.deleteMany({ where: { sourceId: id } });
  await prisma.delivery.delete({ where: { id } });
  res.json({ success: true });
});

app.delete('/api/consumption/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.consumption.delete({ where: { id } });
  res.json({ success: true });
});

// --- CLEAR Endpoint ---
app.delete('/api/clear', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.consumption.deleteMany(),
      prisma.delivery.deleteMany(),
      prisma.order.deleteMany(),
      prisma.product.deleteMany(),
    ]);
    res.json({ success: true, message: "Database volledig gewist." });
  } catch (error) {
    console.error("Clear failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- RESTORE Endpoint ---
app.post('/api/restore', async (req, res) => {
  const { products, orders, deliveries, consumption } = req.body;
  try {
    const transaction = [];

    if (products?.length) {
      for (const p of products) {
        transaction.push(prisma.product.upsert({
          where: { id: p.id },
          update: { name: p.name, stock: parseFloat(p.stock || 0) },
          create: { id: p.id, name: p.name, stock: parseFloat(p.stock || 0) }
        }));
      }
    }

    if (orders?.length) {
      for (const o of orders) {
        transaction.push(prisma.order.upsert({
          where: { id: o.id },
          update: { 
            name: o.name, productId: o.productId, price: parseFloat(o.price), qty: parseFloat(o.qty), estDuration: parseFloat(o.estDuration || 1), weekId: o.weekId 
          },
          create: { 
            id: o.id, name: o.name, productId: o.productId, price: parseFloat(o.price), qty: parseFloat(o.qty), estDuration: parseFloat(o.estDuration || 1), weekId: o.weekId, createdAt: o.createdAt 
          }
        }));
      }
    }

    if (deliveries?.length) {
      for (const d of deliveries) {
          transaction.push(prisma.delivery.upsert({
              where: { id: d.id },
              update: { name: d.name, productId: d.productId, orderId: d.orderId, price: parseFloat(d.price), qty: parseFloat(d.qty), estDuration: parseFloat(d.estDuration || 1), weekId: d.weekId },
              create: { id: d.id, name: d.name, productId: d.productId, orderId: d.orderId, price: parseFloat(d.price), qty: parseFloat(d.qty), estDuration: parseFloat(d.estDuration || 1), weekId: d.weekId, createdAt: d.createdAt }
          }));
      }
    }

    if (consumption?.length) {
      for (const c of consumption) {
        transaction.push(prisma.consumption.upsert({
          where: { id: c.id },
          update: { 
            name: c.name, qty: parseFloat(c.qty), cost: parseFloat(c.cost), startDate: c.startDate, estDuration: parseFloat(c.estDuration), effDuration: c.effDuration ? parseFloat(c.effDuration) : null, completed: c.completed
          },
          create: { 
            id: c.id, sourceId: c.sourceId, sourceType: c.sourceType, name: c.name, qty: parseFloat(c.qty), cost: parseFloat(c.cost), startDate: c.startDate, estDuration: parseFloat(c.estDuration), effDuration: c.effDuration ? parseFloat(c.effDuration) : null, completed: c.completed, createdAt: c.createdAt
          }
        }));
      }
    }

    await prisma.$transaction(transaction);
    res.json({ success: true, message: "Data succesvol samengevoegd." });
  } catch (error) {
    console.error("Restore failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});