import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getWeekIdFromDate } from '../utils/weekUtils';
import * as storage from '../utils/storage';

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
            const data = await storage.getData();
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

    const getCurrentWeekId = () => getWeekIdFromDate(new Date());

    const getRelativeWeekId = (offset) => {
        const date = new Date();
        date.setDate(date.getDate() + (offset * 7));
        return getWeekIdFromDate(date);
    };

    const addOrder = async (order) => {
        pushToUndoStack();
        await storage.addItem('orders', order);
        fetchData();
    };

    const confirmDelivery = async (delivery) => {
        pushToUndoStack();
        await storage.addItem('deliveries', delivery);
        fetchData();
    };

    const confirmBatchDeliveries = async (deliveries) => {
        pushToUndoStack();
        for (const { delivery, consumption } of deliveries) {
            await storage.addItem('deliveries', delivery);
            if (consumption) {
                await storage.addItem('consumption', consumption);
            }
        }
        fetchData();
    };

    const registerConsumption = async (consumptionItem) => {
        pushToUndoStack();
        await storage.addItem('consumption', consumptionItem);
        fetchData();
    };

    const addAdhocDelivery = async (delivery, consumption) => {
        pushToUndoStack();
        await storage.addItem('deliveries', delivery);
        if (consumption) {
            await storage.addItem('consumption', consumption);
        }
        fetchData();
    };

    const updateItem = async (type, id, updates) => {
        pushToUndoStack();
        await storage.updateItem(type, id, updates);
        fetchData();
    };

    const deleteItem = async (type, id) => {
        pushToUndoStack();
        await storage.deleteItem(type, id);
        fetchData();
    };

    const addBatchOrders = async (weekId, orders) => {
        pushToUndoStack();
        const ordersWithWeekId = orders.map(o => ({ ...o, weekId }));
        await storage.addBatch('orders', ordersWithWeekId);
        fetchData();
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
            await storage.importData(jsonData);
            fetchData();
            return true;
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
            await storage.clearAllData();
            fetchData();
            return true;
        } catch (error) {
            console.error("Clear failed:", error);
            alert("Wissen mislukt: " + error.message);
            return false;
        }
    };

    const value = {
        activeData,
        archive: [], // Archive is niet meer in gebruik
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
