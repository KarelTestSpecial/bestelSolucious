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

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
