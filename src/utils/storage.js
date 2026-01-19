// src/utils/storage.js
import { v4 as uuidv4 } from 'uuid';

// Definieer de initiële datastructuur.
// Deze wordt gebruikt wanneer de extensie voor het eerst wordt geïnstalleerd.
const initialData = {
    products: [
        { id: "1", name: "Brood", stock: 0 },
        { id: "2", name: "Melk", stock: 0 },
        { id: "3", name: "Kaas", stock: 0 },
        { id: "4", name: "Eieren", stock: 0 },
        { id: "5", name: "Boter", stock: 0 },
    ],
    orders: [],
    deliveries: [],
    consumption: [],
};

/**
 * Haalt alle data op uit chrome.storage.local.
 * Als er geen data is, wordt de initiële data opgeslagen en teruggegeven.
 * @returns {Promise<object>} De volledige data-object.
 */
export const getData = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get('appData', (result) => {
            if (result.appData) {
                resolve(result.appData);
            } else {
                // Sla de initiële data op als er nog niets is.
                chrome.storage.local.set({ appData: initialData }, () => {
                    resolve(initialData);
                });
            }
        });
    });
};

/**
 * Slaat het volledige data-object op in chrome.storage.local.
 * @param {object} data - Het data-object om op te slaan.
 * @returns {Promise<void>}
 */
const setData = (data) => {
    return new Promise((resolve) => {
        chrome.storage.local.set({ appData: data }, resolve);
    });
};

/**
 * Voegt een nieuw item toe aan een specifieke "tabel" (array) in de data.
 * @param {string} type - Het type data (e.g., 'orders', 'deliveries').
 * @param {object} item - Het item om toe te voegen.
 * @returns {Promise<object>} Het toegevoegde item met een nieuwe ID.
 */
export const addItem = async (type, item) => {
    const data = await getData();
    const newItem = {
        ...item,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
    };
    data[type] = [...data[type], newItem];
    await setData(data);
    return newItem;
};

/**
 * Voegt meerdere items toe aan een specifieke "tabel".
 * @param {string} type - Het type data.
 * @param {Array<object>} items - De items om toe te voegen.
 * @returns {Promise<void>}
 */
export const addBatch = async (type, items) => {
    const data = await getData();
    const newItems = items.map(item => ({
        ...item,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
    }));
    data[type] = [...data[type], ...newItems];
    await setData(data);
};

/**
 * Werkt een bestaand item bij in een specifieke "tabel".
 * @param {string} type - Het type data.
 * @param {string} id - De ID van het item om bij te werken.
 * @param {object} updates - De velden om bij te werken.
 * @returns {Promise<void>}
 */
export const updateItem = async (type, id, updates) => {
    const data = await getData();
    data[type] = data[type].map(item =>
        item.id === id ? { ...item, ...updates } : item
    );
    await setData(data);
};

/**
 * Verwijdert een item uit een specifieke "tabel".
 * @param {string} type - Het type data.
 * @param {string} id - De ID van het item om te verwijderen.
 * @returns {Promise<void>}
 */
export const deleteItem = async (type, id) => {
    const data = await getData();
    data[type] = data[type].filter(item => item.id !== id);
    await setData(data);
};

/**
 * Verwijdert alle data en herstelt de initiële staat.
 * @returns {Promise<void>}
 */
export const clearAllData = async () => {
    await setData(initialData);
};

/**
 * Herstelt de data met een meegegeven JSON-object.
 * @param {object} importedData - De data om te importeren.
 * @returns {Promise<void>}
 */
export const importData = async (importedData) => {
    // Valideer of de geïmporteerde data de juiste structuur heeft.
    if (
        importedData &&
        Array.isArray(importedData.products) &&
        Array.isArray(importedData.orders) &&
        Array.isArray(importedData.deliveries) &&
        Array.isArray(importedData.consumption)
    ) {
        await setData(importedData);
    } else {
        throw new Error("Ongeldig dataformaat voor import.");
    }
};
