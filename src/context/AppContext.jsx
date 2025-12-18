import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};

export const AppProvider = ({ children }) => {
    // Persistence Keys
    const STORAGE_KEY = 'solucious_tracker_data';
    const ARCHIVE_KEY = 'solucious_tracker_archive';

    // State
    const [activeData, setActiveData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {
            orders: [], // { id, productId, price, qty, weekId }
            deliveries: [], // { id, orderId, price, qty, weekId, variant }
            consumption: [], // { id, sourceId, sourceType, qty, cost, startDate, estDuration, effDuration, completed }
            products: [] // { id, name }
        };
    });

    const [archive, setArchive] = useState(() => {
        const saved = localStorage.getItem(ARCHIVE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // Sync with LocalStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeData));
    }, [activeData]);

    useEffect(() => {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
    }, [archive]);

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

    const addOrder = (order) => {
        setActiveData(prev => ({
            ...prev,
            orders: [...prev.orders, { ...order, id: crypto.randomUUID() }]
        }));
    };

    const confirmDelivery = (delivery) => {
        setActiveData(prev => {
            const newDelivery = { ...delivery, id: crypto.randomUUID() };
            return {
                ...prev,
                deliveries: [...prev.deliveries, newDelivery]
            };
        });
    };

    const registerConsumption = (item) => {
        setActiveData(prev => ({
            ...prev,
            consumption: [...prev.consumption, { ...item, id: crypto.randomUUID(), completed: false }]
        }));
    };

    const updateConsumption = (id, updates) => {
        setActiveData(prev => ({
            ...prev,
            consumption: prev.consumption.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    };

    // --- Archiving Logic ---

    const archiveCompletedData = () => {
        const currentWeek = getCurrentWeekId();
        // Logic: If consumption is completed AND was completed before currentWeek - 1, archive it.
        // For now, let's keep it simple: manual trigger or automatic check.
    };

    const exportData = () => {
        const fullData = { active: activeData, archive };
        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bestel-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const importData = (jsonData) => {
        try {
            const parsed = JSON.parse(jsonData);
            if (parsed.active) setActiveData(parsed.active);
            if (parsed.archive) setArchive(parsed.archive);
        } catch (e) {
            alert("Fout bij importeren van data.");
        }
    };

    const addBulkData = (data) => {
        setActiveData(prev => ({
            ...prev,
            products: [...prev.products, ...data.products],
            deliveries: [...prev.deliveries, ...data.deliveries],
            consumption: [...prev.consumption, ...data.consumption]
        }));
    };

    const updateItem = (type, id, updates) => {
        setActiveData(prev => {
            const listKey = type === 'order' ? 'orders' : type === 'delivery' ? 'deliveries' : 'consumption';
            return {
                ...prev,
                [listKey]: prev[listKey].map(item => item.id === id ? { ...item, ...updates } : item)
            };
        });
    };

    const value = {
        activeData,
        archive,
        addOrder,
        confirmDelivery,
        registerConsumption,
        updateConsumption,
        updateItem,
        addBulkData,
        getCurrentWeekId,
        getRelativeWeekId,
        exportData,
        importData
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
