import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getWeekIdFromDate } from '../utils/weekUtils';
import * as dbLogic from '../logic/db';
import { setupAuthListeners, loginAnonymously } from '../logic/auth';
import Login from '../components/Login';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
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

    const fetchData = async (userId) => {
        if (!userId) return;
        try {
            setIsLoading(true);
            const data = await dbLogic.getFullData(userId);
            setActiveData(data);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = setupAuthListeners(
            (user) => {
                setUser(user);
                if (user) {
                    fetchData(user.uid);
                }
            },
            () => {
                setUser(null);
                setActiveData({ products: [], orders: [], deliveries: [], consumption: [] });
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    if (!user) {
        return <Login />;
    }

    // --- Helpers ---
    
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
        if (!user) return;
        pushToUndoStack();
        await dbLogic.addOrder(user.uid, order);
        fetchData(user.uid);
    };

    const confirmDelivery = async (delivery) => {
        if (!user) return;
        pushToUndoStack();
        await dbLogic.addDelivery(user.uid, delivery);
        fetchData(user.uid);
    };

    const confirmBatchDeliveries = async (deliveries) => {
        if (!user) return;
        pushToUndoStack();
        for (const { delivery, consumption } of deliveries) {
            await dbLogic.addDelivery(user.uid, delivery);
            if (consumption) {
                await dbLogic.addConsumption(user.uid, consumption);
            }
        }
        fetchData(user.uid);
    };

    const registerConsumption = async (consumptionItem) => {
        if (!user) return;
        pushToUndoStack();
        await dbLogic.addConsumption(user.uid, consumptionItem);
        fetchData(user.uid);
    };

    const addAdhocDelivery = async (delivery, consumption) => {
        if (!user) return;
        await dbLogic.addDelivery(user.uid, delivery);
        if (consumption) {
            await dbLogic.addConsumption(user.uid, consumption);
        }
        fetchData(user.uid);
    };

    const updateItem = async (type, id, updates) => {
        if (!user) return;
        
        // Special logic for implicit items (from old version)
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
                await dbLogic.addConsumption(user.uid, {
                    sourceId: source.id,
                    sourceType: sourceType,
                    name: source.name,
                    qty: source.qty,
                    cost: source.price * source.qty,
                    startDate: source.weekId,
                    estDuration: source.estDuration,
                    completed: false,
                    ...updates
                });
                fetchData(user.uid);
                return;
            }
        }

        pushToUndoStack();
        try {
            await dbLogic.updateItem(user.uid, type, id, updates);
            fetchData(user.uid);
        } catch (error) {
            console.error(`Error updating ${type}:`, error);
            fetchData(user.uid);
        }
    };

    const deleteItem = async (type, id) => {
        if (!user) return;
        pushToUndoStack();
        await dbLogic.deleteItem(user.uid, type, id);
        fetchData(user.uid);
    };

    const addBatchOrders = async (weekId, orders) => {
        if (!user) return;
        try {
            pushToUndoStack();
            await dbLogic.addBatchOrders(user.uid, weekId, orders);
            fetchData(user.uid);
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
        if (!user) return false;
        try {
            if (!skipUndo) pushToUndoStack();
            await dbLogic.restoreData(user.uid, jsonData);
            fetchData(user.uid);
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
        setUndoStack(prev => prev.slice(0, -1));
        await importData(prevState, true);
    };

    const redo = async () => {
        // Redo functionality removed for simplicity in this port, 
        // can be re-implemented if needed.
    };

    const clearDatabase = async () => {
        if (!user) return false;
        try {
            pushToUndoStack();
            await dbLogic.clearAllData(user.uid);
            fetchData(user.uid);
            return true;
        } catch (error) {
            console.error("Clear failed:", error);
            alert("Wissen mislukt: " + error.message);
            return false;
        }
    };

    const value = {
        user,
        activeData,
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