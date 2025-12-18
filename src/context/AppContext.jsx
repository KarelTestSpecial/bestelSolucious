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
        await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        fetchData(); // Refresh data
    };

    const confirmDelivery = async (delivery) => {
        await fetch('/api/deliveries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(delivery),
        });
        fetchData();
    };

    // DEZE ONTBRAK IN JOUW CODE:
    const registerConsumption = async (consumptionItem) => {
        await fetch('/api/consumption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(consumptionItem),
        });
        fetchData();
    };

    const updateItem = async (type, id, updates) => {
        // Simpele update logica voor nu, voornamelijk voor consumption status
        if(type === 'consumption') {
            await fetch(`/api/consumption/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            fetchData();
        }
    };

    const value = {
        activeData,
        archive,
        isLoading,
        addOrder,
        confirmDelivery,
        registerConsumption,
        updateItem,
        getCurrentWeekId,
        getRelativeWeekId,
        // Mock functions for export/import to prevent crashes
        exportData: () => console.log("Export not implemented yet"),
        importData: () => console.log("Import not implemented yet"),
        addBulkData: () => console.log("Bulk not implemented yet")
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

AppProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
