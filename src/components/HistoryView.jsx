import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Calendar } from 'lucide-react';

const HistoryView = () => {
    const { activeData } = useAppContext();
    const [view, setView] = useState('deliveries'); // 'deliveries' or 'orders'
    const [searchTerm, setSearchTerm] = useState('');

    // Filter logica
    const filterData = (data) => {
        return data.filter(item => {
            const matchName = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
            // Week ID search (bv. "2025-W01")
            const matchDate = item.weekId?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchName || matchDate;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const displayData = view === 'orders'
        ? filterData(activeData.orders)
        : filterData(activeData.deliveries);

    return (
        <div className="history-view">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Historiek & Archief</h1>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {/* Tabs */}
                    <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setView('deliveries')}
                            className={view === 'deliveries' ? '' : 'badge-warning'}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                            Leveringen
                        </button>
                        <button
                            onClick={() => setView('orders')}
                            className={view === 'orders' ? '' : 'badge-warning'}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                        >
                            Bestellingen
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="glass-panel" style={{ padding: '0.5rem', flexGrow: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Zoek op naam of weeknummer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                        />
                    </div>
                </div>
            </header>

            <div className="glass-panel table-container">
                <table className="formal-table">
                    <thead>
                        <tr>
                            <th>Datum / Week</th>
                            <th>Product</th>
                            <th>Aantal</th>
                            <th>Prijs (p/u)</th>
                            <th>Totaal</th>
                            {view === 'deliveries' && <th>Variant</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    Geen {view === 'orders' ? 'bestellingen' : 'leveringen'} gevonden.
                                </td>
                            </tr>
                        ) : (
                            displayData.map((item) => (
                                <tr key={item.id}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="var(--accent-color)" />
                                        {item.weekId}
                                    </td>
                                    <td><strong>{item.name}</strong></td>
                                    <td>
                                        <span className="badge badge-success">
                                            {item.qty}
                                        </span>
                                    </td>
                                    <td>€{item.price.toFixed(2)}</td>
                                    <td><strong>€{(item.qty * item.price).toFixed(2)}</strong></td>
                                    {view === 'deliveries' && (
                                        <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            {item.variant || '-'}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryView;
