import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import DataManager from './components/DataManager';
import HistoryView from './components/HistoryView';
import './index.css';
import { LayoutDashboard, Archive, Settings, History } from 'lucide-react';

function AppContent() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <>
            <nav className="glass-panel" style={{ margin: '0.1rem', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LayoutDashboard size={18} /> Dashboard
                </button>
                <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Archive size={18} /> Productenlijst
                </button>
                <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} /> Historiek
                </button>
                <button onClick={() => setActiveTab('data')} className={activeTab === 'data' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} /> Beheer
                </button>
            </nav>

            <main className="container animate-fade-in">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'inventory' && <ProductList />}
                {activeTab === 'history' && <HistoryView />}
                {activeTab === 'data' && <DataManager />}
            </main>
        </>
    );
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
