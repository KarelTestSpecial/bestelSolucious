// server/index.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

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

// Een gecombineerd endpoint voor alle data (om requests te besparen op je Chromebook)
app.get('/api/full-data', async (req, res) => {
  const [products, orders, deliveries, consumption] = await Promise.all([
    prisma.product.findMany(),
    prisma.order.findMany(),
    prisma.delivery.findMany(),
    prisma.consumption.findMany()
  ]);
  res.json({ products, orders, deliveries, consumption });
});

// --- POST Endpoints (Data opslaan) ---

app.post('/api/orders', async (req, res) => {
  const data = req.body;

  // Check of product bestaat, zo niet, maak aan
  let product = await prisma.product.findFirst({ where: { name: data.name } });
  if (!product) {
    product = await prisma.product.create({ data: { name: data.name, id: data.productId } });
  }

  const newOrder = await prisma.order.create({
    data: {
      ...data,
      estDuration: parseFloat(data.estDuration || 1)
    }
  });
  res.json(newOrder);
});

app.post('/api/orders/bulk', async (req, res) => {
  const { orders, weekId } = req.body; // orders is een array van { name, qty, price }
  
  const results = [];

  // We verwerken ze 1 voor 1 (zou met createMany kunnen als we zeker weten dat producten bestaan)
  // Om complexiteit te vermijden gebruiken we een simpele loop die producten aanmaakt indien nodig.
  for (const item of orders) {
    const productId = item.productId || crypto.randomUUID(); // Gebruik front-end ID of genereer een nieuwe
    
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
        qty: parseInt(item.qty || 1),
        estDuration: parseFloat(item.estDuration || 1),
        weekId: weekId
      }
    });
    results.push(order);
  }

  res.json({ success: true, count: results.length });
});

app.post('/api/deliveries', async (req, res) => {
  const data = req.body;
  const newDelivery = await prisma.delivery.create({ 
    data: {
      ...data,
      estDuration: parseFloat(data.estDuration || 1)
    } 
  });
  res.json(newDelivery);
});

app.post('/api/consumption', async (req, res) => {
  const data = req.body;
  const newConsumption = await prisma.consumption.create({ data });
  res.json(newConsumption);
});

// --- PATCH Endpoints (Updates) ---

// Voorbeeld: Update verbruik (als iets op is)
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

  // 1. Update de levering
  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: updates
  });

  // 2. Als prijs, aantal, naam of duur is gewijzigd, update ook het verbruik
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

// --- DELETE Endpoints (Verwijderen) ---

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.order.delete({ where: { id } });
  res.json({ success: true });
});

app.delete('/api/deliveries/:id', async (req, res) => {
  const { id } = req.params;
  
  // Verwijder ook het bijbehorende verbruik
  await prisma.consumption.deleteMany({
    where: { sourceId: id }
  });

  await prisma.delivery.delete({ where: { id } });
  res.json({ success: true });
});

app.delete('/api/consumption/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.consumption.delete({ where: { id } });
  res.json({ success: true });
});

// --- CLEAR Endpoint (Alles wissen) ---
app.delete('/api/clear', async (req, res) => {
  try {
    // Volgorde is belangrijk ivm foreign keys (als die er zouden zijn, maar SQLite prisma is vaak laks)
    // Maar we verwijderen best in omgekeerde volgorde van afhankelijkheid.
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

// --- RESTORE Endpoint (Smart Merge) ---
app.post('/api/restore', async (req, res) => {
  const { products, orders, deliveries, consumption } = req.body;

  try {
    // We bouwen een enorme transactie array om alles atomair uit te voeren
    // We gebruiken 'upsert': als ID bestaat -> update, anders -> create.
    const transaction = [];

    // 1. Products
    if (products && Array.isArray(products)) {
      for (const p of products) {
        transaction.push(prisma.product.upsert({
          where: { id: p.id },
          update: { name: p.name, stock: parseFloat(p.stock || 0) },
          create: { id: p.id, name: p.name, stock: parseFloat(p.stock || 0) }
        }));
      }
    }

    // 2. Orders
    if (orders && Array.isArray(orders)) {
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

    // 3. Deliveries
    if (deliveries && Array.isArray(deliveries)) {
                  for (const d of deliveries) {
                      transaction.push(prisma.delivery.upsert({
                          where: { id: d.id },
                          update: { name: d.name, productId: d.productId, orderId: d.orderId, price: parseFloat(d.price), qty: parseFloat(d.qty), estDuration: parseFloat(d.estDuration || 1), weekId: d.weekId },
                          create: { id: d.id, name: d.name, productId: d.productId, orderId: d.orderId, price: parseFloat(d.price), qty: parseFloat(d.qty), estDuration: parseFloat(d.estDuration || 1), weekId: d.weekId, createdAt: d.createdAt }
                      }));
                  }
    }

    // 4. Consumption
    if (consumption && Array.isArray(consumption)) {
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

    // Voer alles uit
    await prisma.$transaction(transaction);

    res.json({ success: true, message: "Data succesvol samengevoegd (merged)." });
  } catch (error) {
    console.error("Restore (Merge) failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
