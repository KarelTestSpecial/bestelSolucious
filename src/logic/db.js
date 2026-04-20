import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';

// --- Generic Helpers ---

async function getCollection(userId, collectionName, orderField = 'createdAt') {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'users', userId, collectionName),
      orderBy(orderField, 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

async function saveDocument(userId, collectionName, id, data) {
  if (!userId) return;
  try {
    await setDoc(doc(db, 'users', userId, collectionName, id), {
      ...data,
      id,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
}

// --- Specific Operations ---

export async function getFullData(userId) {
  if (!userId) return { products: [], orders: [], deliveries: [], consumption: [] };
  
  const [products, orders, deliveries, consumption] = await Promise.all([
    getCollection(userId, 'products', 'name'),
    getCollection(userId, 'orders'),
    getCollection(userId, 'deliveries'),
    getCollection(userId, 'consumption')
  ]);

  return { products, orders, deliveries, consumption };
}

export async function addOrder(userId, order) {
  const id = crypto.randomUUID();
  const data = {
    ...order,
    createdAt: new Date().toISOString()
  };
  await saveDocument(userId, 'orders', id, data);
  
  // Ensure product exists
  const productSnap = await getDoc(doc(db, 'users', userId, 'products', order.productId || order.name));
  if (!productSnap.exists()) {
    await saveDocument(userId, 'products', order.productId || order.name, {
      name: order.name,
      stock: 0
    });
  }
  
  return { id, ...data };
}

export async function addBatchOrders(userId, weekId, orders) {
  if (!userId) return;
  const batch = writeBatch(db);
  
  for (const item of orders) {
    const orderId = crypto.randomUUID();
    const productId = item.productId || item.name;
    const createdAt = new Date().toISOString();
    
    const orderRef = doc(db, 'users', userId, 'orders', orderId);
    batch.set(orderRef, {
      ...item,
      id: orderId,
      productId,
      weekId,
      createdAt
    });
    
    const productRef = doc(db, 'users', userId, 'products', productId);
    batch.set(productRef, { name: item.name, stock: 0 }, { merge: true });
  }
  
  await batch.commit();
}

export async function addDelivery(userId, delivery) {
  const id = crypto.randomUUID();
  const data = {
    ...delivery,
    createdAt: new Date().toISOString()
  };
  await saveDocument(userId, 'deliveries', id, data);
  return { id, ...data };
}

export async function addConsumption(userId, consumption) {
  const id = crypto.randomUUID();
  const data = {
    ...consumption,
    createdAt: new Date().toISOString()
  };
  await saveDocument(userId, 'consumption', id, data);
  return { id, ...data };
}

export async function updateItem(userId, type, id, updates) {
  if (!userId) return;
  const collectionMap = {
    'order': 'orders',
    'delivery': 'deliveries',
    'consumption': 'consumption',
    'product': 'products'
  };
  const collectionName = collectionMap[type];
  if (!collectionName) return;

  try {
    const docRef = doc(db, 'users', userId, collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    throw error;
  }
}

export async function deleteItem(userId, type, id) {
  if (!userId) return;
  const collectionMap = {
    'order': 'orders',
    'delivery': 'deliveries',
    'consumption': 'consumption',
    'product': 'products'
  };
  const collectionName = collectionMap[type];
  if (!collectionName) return;

  try {
    await deleteDoc(doc(db, 'users', userId, collectionName, id));
    
    // Cascading deletes for deliveries -> consumption
    if (type === 'delivery') {
      const consumptionQ = query(
        collection(db, 'users', userId, 'consumption'),
        where('sourceId', '==', id)
      );
      const snap = await getDocs(consumptionQ);
      const batch = writeBatch(db);
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    throw error;
  }
}

export async function clearAllData(userId) {
  if (!userId) return;
  const collections = ['products', 'orders', 'deliveries', 'consumption'];
  for (const col of collections) {
    const snap = await getDocs(collection(db, 'users', userId, col));
    const batch = writeBatch(db);
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function restoreData(userId, data) {
  if (!userId) return;
  await clearAllData(userId);
  
  const batch = writeBatch(db);
  
  if (data.products) {
    data.products.forEach(p => {
      batch.set(doc(db, 'users', userId, 'products', p.id), p);
    });
  }
  if (data.orders) {
    data.orders.forEach(o => {
      batch.set(doc(db, 'users', userId, 'orders', o.id), o);
    });
  }
  if (data.deliveries) {
    data.deliveries.forEach(d => {
      batch.set(doc(db, 'users', userId, 'deliveries', d.id), d);
    });
  }
  if (data.consumption) {
    data.consumption.forEach(c => {
      batch.set(doc(db, 'users', userId, 'consumption', c.id), c);
    });
  }
  
  await batch.commit();
}
