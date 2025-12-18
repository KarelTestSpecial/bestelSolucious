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

  const newOrder = await prisma.order.create({ data });
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
        weekId: weekId
      }
    });
    results.push(order);
  }

  res.json({ success: true, count: results.length });
});

app.post('/api/deliveries', async (req, res) => {
  const data = req.body;
  const newDelivery = await prisma.delivery.create({ data });
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

// --- DELETE Endpoints (Verwijderen) ---

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.order.delete({ where: { id } });
  res.json({ success: true });
});

app.delete('/api/deliveries/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.delivery.delete({ where: { id } });
  res.json({ success: true });
});

app.delete('/api/consumption/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.consumption.delete({ where: { id } });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
