import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};

export const AppProvider = ({ children }) => {
    // State
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stock, setStock] = useState([]); // Represents all StockItems
    const [isLoading, setIsLoading] = useState(true);

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [productsRes, ordersRes, stockRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/orders'),
                    fetch('/api/stockitems')
                ]);

                const productsData = await productsRes.json();
                const ordersData = await ordersRes.json();
                const stockData = await stockRes.json();

                setProducts(productsData);
                setOrders(ordersData);
                setStock(stockData);

            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

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
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order),
            });
            const newOrder = await response.json();
            setOrders(prev => [newOrder, ...prev]);
        } catch (error) {
            console.error('Failed to add order:', error);
        }
    };

    const confirmDelivery = async (delivery) => {
        try {
            await fetch('/api/deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delivery),
            });
            // Re-fetch orders and stock to update status and inventory
            const [ordersRes, stockRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/stockitems')
            ]);
            const ordersData = await ordersRes.json();
            const stockData = await stockRes.json();
            setOrders(ordersData);
            setStock(stockData);
        } catch (error) {
            console.error('Failed to confirm delivery:', error);
        }
    };

    const consumeStockItem = async (stockItemId) => {
        try {
            await fetch(`/api/stockitems/${stockItemId}/consume`, {
                method: 'PATCH',
            });
            // Re-fetch stock to update inventory
            const stockRes = await fetch('/api/stockitems');
            const stockData = await stockRes.json();
            setStock(stockData);
        } catch (error) {
            console.error('Failed to consume item:', error);
        }
    };

    const value = {
        products,
        orders,
        stock,
        isLoading,
        addOrder,
        confirmDelivery,
        consumeStockItem,
        getCurrentWeekId,
        getRelativeWeekId,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

AppProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
