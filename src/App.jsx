import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import DataManager from './components/DataManager';
import HistoryView from './components/HistoryView';
import './index.css';

function AppContent() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <>
            <nav className="glass-panel" style={{ margin: '0.1rem', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 Dashboard
                </button>
                <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📦 Productenlijst
                </button>
                <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🕒 Historiek
                </button>
                <button onClick={() => setActiveTab('data')} className={activeTab === 'data' ? '' : 'badge-warning'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚙️ Beheer
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
