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
            const res = await fetch('http://localhost:3000/api/full-data');
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
        await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        fetchData();
    };

    const confirmDelivery = async (delivery) => {
        pushToUndoStack();
        await fetch('http://localhost:3000/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delivery),
        });
        fetchData();
    };

    const confirmBatchDeliveries = async (deliveries) => {
        pushToUndoStack();
        for (const { delivery, consumption } of deliveries) {
            await fetch('http://localhost:3000/api/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delivery),
            });
            if (consumption) {
                await fetch('http://localhost:3000/api/consumption', {
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
        await fetch('http://localhost:3000/api/consumption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(consumptionItem),
        });
        fetchData();
    };

    const addAdhocDelivery = async (delivery, consumption) => {
        await fetch('http://localhost:3000/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delivery),
        });
        if (consumption) {
            await fetch('http://localhost:3000/api/consumption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(consumption),
            });
        }
        fetchData();
    };

    const updateItem = async (type, id, updates) => {
        const endpointMap = {
            consumption: `consumption/${id}`,
            delivery: `deliveries/${id}`,
            order: `orders/${id}`,
        };

        if (endpointMap[type]) {
            const endpoint = `http://localhost:3000/api/${endpointMap[type]}`;
            pushToUndoStack();
            await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            fetchData();
        }
    };

    const deleteItem = async (type, id) => {
        const endpointMap = {
            order: `orders/${id}`,
            delivery: `deliveries/${id}`,
            consumption: `consumption/${id}`,
        };

        if (endpointMap[type]) {
            const endpoint = `http://localhost:3000/api/${endpointMap[type]}`;
            pushToUndoStack();
            await fetch(endpoint, { method: 'DELETE' });
            fetchData();
        }
    };

    const addBatchOrders = async (weekId, orders) => {
        try {
            pushToUndoStack();
            await fetch('http://localhost:3000/api/orders/batch', {
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
            await fetch('http://localhost:3000/api/clear', { method: 'DELETE' });
            const res = await fetch('http://localhost:3000/api/restore', {
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
            const res = await fetch('http://localhost:3000/api/clear', { method: 'DELETE' });
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