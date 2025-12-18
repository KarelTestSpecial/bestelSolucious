import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};

export const AppProvider = ({ children }) => {
    // We gebruiken één groot object voor alle data om het simpel te houden
    const [activeData, setActiveData] = useState({
        products: [],
        orders: [],
        deliveries: [],
        consumption: [] // Dit verving 'stock' in de oude code
    });
    const [archive] = useState([]); // Voor later
    const [isLoading, setIsLoading] = useState(true);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // Helper to push current state to undo stack
    const pushToUndoStack = () => {
        // We limit the stack size to 20 for memory efficiency
        setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(activeData))]);
        setRedoStack([]); // Clear redo stack on new action
    };

    // Initial data fetch
    const fetchData = async () => {
        try {
            setIsLoading(true);
            // We halen alles in 1 keer op via ons nieuwe endpoint
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

    // --- Helpers ---
    const getCurrentWeekId = () => {
        const now = new Date();
        const onejan = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${week}`;
    };

    const getRelativeWeekId = (offset) => {
        const date = new Date();
        date.setDate(date.getDate() + (offset * 7));
        const onejan = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
        return `${date.getFullYear()}-W${week}`;
    };

    // --- Actions ---

    const addOrder = async (order) => {
        pushToUndoStack();
        await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        fetchData(); // Refresh data
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

    const confirmBulkDeliveries = async (deliveries) => {
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
        // Create delivery
        await fetch('/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delivery),
        });

        // Create consumption linked to it
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
        let endpoint = '';
        if (type === 'consumption') endpoint = `/api/consumption/${id}`;
        if (type === 'delivery') endpoint = `/api/deliveries/${id}`;
        if (type === 'order') endpoint = `/api/orders/${id}`;

        if (endpoint) {
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

    const addBulkOrders = async (weekId, orders) => {
        try {
            pushToUndoStack();
            await fetch('/api/orders/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId, orders }),
            });
            fetchData();
        } catch (error) {
            console.error("Bulk import failed", error);
            throw error; // Laat component error afhandelen
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
            
            // For restore, we first need to clear the current state to ensure a clean slate,
            // otherwise 'restore' (which uses upsert) won't remove deleted items.
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
        addBulkOrders,
        confirmDelivery,
        confirmBulkDeliveries,
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
