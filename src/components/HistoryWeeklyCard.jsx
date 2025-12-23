import React from 'react';
import { Calendar, ChevronsRight } from 'lucide-react';

const HistoryWeeklyCard = ({ weekId, weekData, viewType }) => {
    const { items, total } = weekData;

    const renderItemRow = (item) => {
        const title = item.name || 'Onbekend Product';
        const date = new Date(item.createdAt).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' });

        let details = '';
        let value = '';

        switch(viewType) {
            case 'orders':
            case 'deliveries':
                details = `${item.qty} x €${(item.price || 0).toFixed(2)}`;
                value = `€${(item.qty * (item.price || 0)).toFixed(2)}`;
                break;
            case 'verbruik':
                details = `Kost per week: €${(item.weeklyCost || 0).toFixed(2)}`;
                value = `€${(item.cost || 0).toFixed(2)}`;
                break;
            default:
                break;
        }

        return (
            <div key={item.id} className="history-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{date} </span>
                    <strong style={{ flex: 1, marginLeft: '1rem' }}>{title} </strong>
                    <span style={{ color: 'var(--text-muted)'}}>{details} </span>
                    <strong style={{ marginLeft: '1rem', minWidth: '80px', textAlign: 'right' }}>{value}</strong>
                </div>
            </div>
        );
    };

    return (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ChevronsRight size={20} color="var(--accent-color)" />
                    Week {weekId}
                </h3>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Week Totaal:</span>
                    <strong style={{ display: 'block', fontSize: '1.2rem' }}>€{total.toFixed(2)}</strong>
                </div>
            </header>
            <div className="history-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map(renderItemRow)}
            </div>
        </div>
    );
};

export default HistoryWeeklyCard;
