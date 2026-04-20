import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import DataManager from './components/DataManager';
import HistoryView from './components/HistoryView';
import './index.css';

function AppContent() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { undo, canUndo } = useAppContext();

    return (
        <div id="root">
            <header className="container" style={{ paddingBottom: 0 }}>
                <nav className="glass-panel" style={{ margin: 0, borderRadius: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Bestel Tracker
                        </span>
                        <button 
                            onClick={undo} 
                            disabled={!canUndo}
                            className="secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: canUndo ? 1 : 0.3, borderRadius: '10px' }}
                            title="Ongedaan maken"
                        >
                            ↩️ Undo
                        </button>
                    </div>
                    <div className="nav-links">
                        <button 
                            onClick={() => setActiveTab('dashboard')} 
                            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        >
                            📊 Dashboard
                        </button>
                        <button 
                            onClick={() => setActiveTab('inventory')} 
                            className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                        >
                            📦 Producten
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')} 
                            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
                        >
                            🕒 Historiek
                        </button>
                        <button 
                            onClick={() => setActiveTab('data')} 
                            className={`nav-btn ${activeTab === 'data' ? 'active' : ''}`}
                        >
                            ⚙️ Beheer
                        </button>
                    </div>
                </nav>
            </header>

            <main className="container animate-slide-up">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'inventory' && <ProductList />}
                {activeTab === 'history' && <HistoryView />}
                {activeTab === 'data' && <DataManager />}
            </main>

            <footer style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                &copy; 2026 Bestel Solucious Tracker • Premium Cloud Edition
            </footer>
        </div>
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
