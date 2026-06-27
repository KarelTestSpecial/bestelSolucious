import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { useWeeklyStats } from './hooks/useWeeklyStats';
import { downloadOrdersMarkdown } from './utils/exportOrders';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import DataManager from './components/DataManager';
import HistoryView from './components/HistoryView';
import './index.css';

function AppContent() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { undo, redo, canUndo, canRedo } = useAppContext();
    const { getTimeline } = useWeeklyStats();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;

            // Laat de native tekst-undo met rust terwijl een veld bewerkt wordt.
            const el = document.activeElement;
            const isEditing = el && (
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.tagName === 'SELECT' ||
                el.isContentEditable
            );
            if (isEditing) return;

            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) undo();
            } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
                e.preventDefault();
                if (canRedo) redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    return (
        <div id="root">
            <header className="container" style={{ paddingBottom: 0 }}>
                <nav className="glass-panel" style={{ margin: '0.2rem 0', borderRadius: '10px', padding: '0.2rem 0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', background: 'linear-gradient(135deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Bestel Solucious
                        </span>
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="secondary"
                            style={{ padding: '2px 8px', fontSize: '0.7rem', opacity: canUndo ? 1 : 0.3, borderRadius: '6px' }}
                            title="Ongedaan maken (Ctrl+Z)"
                        >
                            ↩️ Undo
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className="secondary"
                            style={{ padding: '2px 8px', fontSize: '0.7rem', opacity: canRedo ? 1 : 0.3, borderRadius: '6px' }}
                            title="Opnieuw uitvoeren (Ctrl+Y)"
                        >
                            ↪️ Redo
                        </button>
                        {activeTab === 'dashboard' && (
                            <button
                                onClick={() => downloadOrdersMarkdown(getTimeline())}
                                className="secondary"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px' }}
                                title="Download de bestellingen (week N t/m N+4) als markdown"
                            >
                                ⬇️ Bestellingen (.md)
                            </button>
                        )}
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
                &copy; 2026 Bestel Solucious • Premium Cloud Edition
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
