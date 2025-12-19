import React from 'react';
import { useProductStats } from '../hooks/useProductStats';
import { Package, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

const Inventory = () => {
    const { getStats } = useProductStats();
    const products = getStats();

    const getStatusIndicator = (status) => {
        switch (status) {
            case 'In Stock': return <span className="badge badge-success">{status}</span>;
            case 'Low Stock': return <span className="badge badge-warning">{status}</span>;
            case 'Out of Stock': return <span className="badge badge-danger">{status}</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="inventory-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Package size={28} /> Productvoorraad Overzicht
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {products.length > 0 ? products.map(p => (
                    <div key={p.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{p.name}</h3>
                            {getStatusIndicator(p.status)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                            <div className="stat-item">
                                <span className="stat-label"><TrendingUp size={14} /> Huidige Stock</span>
                                <span className="stat-value">{p.currentStock.toFixed(1)} stuks</span>
                            </div>
                             <div className="stat-item">
                                <span className="stat-label"><AlertTriangle size={14} /> Weken Voorraad</span>
                                <span className="stat-value">{p.weeksOfSupply} weken</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label"><Calendar size={14} /> Volgende Levering</span>
                                <span className="stat-value">{p.nextDeliveryDate || 'Geen'}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="glass-panel empty-text" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                        Geen producten gevonden. Voeg producten en bestellingen toe om het overzicht te zien.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
