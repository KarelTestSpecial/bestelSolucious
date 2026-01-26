import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getWeekIdFromDate } from '../utils/weekUtils'; // AANGEPAST: Importeer de centrale logica

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};

export const AppProvider = ({ children }) => {
    const [activeData, setActiveData] = useState({
        products: [],
        orders: [],
        deliveries: [],
        consumption: []
    });
    const [archive] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const pushToUndoStack = () => {
        setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(activeData))]);
        setRedoStack([]);
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/full-data');
            const data = await res.json();
            setActiveData(data);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Helpers (AANGEPAST: Nu via weekUtils voor consistentie rondom jaarwisseling) ---
    
    const getCurrentWeekId = () => {
        return getWeekIdFromDate(new Date());
    };

    const getRelativeWeekId = (offset) => {
        const date = new Date();
        date.setDate(date.getDate() + (offset * 7));
        return getWeekIdFromDate(date);
    };

    // --- Actions ---

    const addOrder = async (order) => {
        pushToUndoStack();
        await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        fetchData();
    };

    const confirmDelivery = async (delivery) => {
        pushToUndoStack();
        await fetch('/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delivery),
        });
        fetchData();
    };

    const confirmBatchDeliveries = async (deliveries) => {
        pushToUndoStack();
        for (const { delivery, consumption } of deliveries) {
            await fetch('/api/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delivery),
            });
            if (consumption) {
                await fetch('/api/consumption', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(consumption),
                });
            }
        }
        fetchData();
    };

    const registerConsumption = async (consumptionItem) => {
        pushToUndoStack();
        await fetch('/api/consumption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(consumptionItem),
        });
        fetchData();
    };

    const addAdhocDelivery = async (delivery, consumption) => {
        await fetch('/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delivery),
        });
        if (consumption) {
            await fetch('/api/consumption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(consumption),
            });
        }
        fetchData();
    };

    const updateItem = async (type, id, updates) => {
        // Speciale afhandeling voor virtuele/impliciete verbruiksitems
        if (type === 'consumption' && id.toString().startsWith('implicit-')) {
            let source = null;
            let sourceType = 'delivery';
            
            if (id.startsWith('implicit-order-')) {
                const orderId = id.replace('implicit-order-', '');
                source = activeData.orders.find(o => o.id === orderId);
            } else {
                const deliveryId = id.replace('implicit-', '');
                source = activeData.deliveries.find(d => d.id === deliveryId);
            }

            if (source) {
                pushToUndoStack();
                await fetch('/api/consumption', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourceId: source.id,
                        sourceType: sourceType,
                        name: source.name,
                        qty: source.qty,
                        cost: source.price * source.qty,
                        startDate: source.weekId,
                        estDuration: source.estDuration,
                        completed: false,
                        ...updates
                    }),
                });
                fetchData();
                return;
            }
        }

        let endpoint = '';
        if (type === 'consumption') endpoint = `/api/consumption/${id}`;
        if (type === 'delivery') endpoint = `/api/deliveries/${id}`;
        if (type === 'order') endpoint = `/api/orders/${id}`;

        if (endpoint) {
            pushToUndoStack();
            try {
                const res = await fetch(endpoint, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Update failed');
                }
                fetchData();
            } catch (error) {
                console.error(`Error updating ${type}:`, error);
                // We herladen data om de UI weer in sync te brengen bij falen
                fetchData();
            }
        }
    };

    const deleteItem = async (type, id) => {
        let endpoint = '';
        if (type === 'order') endpoint = `/api/orders/${id}`;
        if (type === 'delivery') endpoint = `/api/deliveries/${id}`;
        if (type === 'consumption') endpoint = `/api/consumption/${id}`;

        if (endpoint) {
            pushToUndoStack();
            await fetch(endpoint, { method: 'DELETE' });
            fetchData();
        }
    };

    const addBatchOrders = async (weekId, orders) => {
        try {
            pushToUndoStack();
            await fetch('/api/orders/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId, orders }),
            });
            fetchData();
        } catch (error) {
            console.error("Batch import failed", error);
            throw error;
        }
    };

    const exportData = () => {
        const dataStr = JSON.stringify(activeData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `bestel-backup-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const importData = async (jsonData, skipUndo = false) => {
        try {
            if (!skipUndo) pushToUndoStack();
            await fetch('/api/clear', { method: 'DELETE' });
            const res = await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData),
            });
            const result = await res.json();
            if (result.success) {
                fetchData();
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Import failed:", error);
            alert("Herstel mislukt: " + error.message);
            return false;
        }
    };

    const undo = async () => {
        if (undoStack.length === 0) return;
        const prevState = undoStack[undoStack.length - 1];
        const currentState = JSON.parse(JSON.stringify(activeData));
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, currentState]);
        await importData(prevState, true);
    };

    const redo = async () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        const currentState = JSON.parse(JSON.stringify(activeData));
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, currentState]);
        await importData(nextState, true);
    };

    const clearDatabase = async () => {
        try {
            pushToUndoStack();
            const res = await fetch('/api/clear', { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                fetchData();
                return true;
            }
            throw new Error(result.error);
        } catch (error) {
            console.error("Clear failed:", error);
            alert("Wissen mislukt: " + error.message);
            return false;
        }
    };

    const value = {
        activeData,
        archive,
        isLoading,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo,
        addOrder,
        addBatchOrders,
        confirmDelivery,
        confirmBatchDeliveries,
        registerConsumption,
        addAdhocDelivery,
        updateItem,
        deleteItem,
        getCurrentWeekId,
        getRelativeWeekId,
        exportData,
        importData,
        clearDatabase,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

AppProvider.propTypes = {
    children: PropTypes.node.isRequired,
};