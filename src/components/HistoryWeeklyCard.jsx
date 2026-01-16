import React from 'react';
import { ChevronsRight, ShoppingCart, Truck, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

const HistoryWeeklyCard = ({ weekId, weekData }) => {
    const { orders, deliveries, verbruik, totals } = weekData;

    const renderItemRow = (item, type) => {
        const title = item.name || 'Onbekend Product';
        const date = new Date(item.createdAt).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' });

        let details = '';
        let value = '';

        if (type === 'orders' || type === 'deliveries') {
            details = `${item.qty} x €${(item.price || 0).toFixed(2)}`;
            value = `€${(item.qty * (item.price || 0)).toFixed(2)}`;
        } else if (type === 'verbruik') {
            details = `Kost per week: €${(item.weeklyCost || 0).toFixed(2)}`;
            value = `€${(item.cost || 0).toFixed(2)}`;
        }

        return (
            <div key={`${type}-${item.id}`} className="history-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{date}</span>
                    <strong style={{ flex: 1, marginLeft: '0.5rem' }}>{title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{details}</span>
                    <strong style={{ marginLeft: '1rem', minWidth: '80px', textAlign: 'right', fontSize: '0.9rem' }}>{value}</strong>
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
                    <strong style={{ display: 'block', fontSize: '1.2rem' }}>€{totals.grandTotal.toFixed(2)}</strong>
                </div>
            </header>
            
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Bestellingen */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                        <ShoppingCart size={16} /> Bestellingen (€{totals.orders.toFixed(2)})
                    </h4>
                    <div className="history-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {orders && orders.length > 0 ? orders.map(item => renderItemRow(item, 'orders')) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem' }}>Geen bestellingen</div>
                        )}
                    </div>
                </section>
                
                {/* Leveringen */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', marginBottom: '0.8rem' }}>
                        <Truck size={16} /> Leveringen (€{totals.deliveries.toFixed(2)})
                    </h4>
                    <div className="history-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {deliveries && deliveries.length > 0 ? deliveries.map(item => renderItemRow(item, 'deliveries')) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem' }}>Geen leveringen</div>
                        )}
                    </div>
                </section>
                
                {/* Effectief Verbruik */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', marginBottom: '0.8rem' }}>
                        <TrendingUp size={16} /> Effectief Verbruik (€{totals.verbruik.toFixed(2)})
                    </h4>
                    <div className="history-items-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {verbruik && verbruik.length > 0 ? verbruik.map(item => renderItemRow(item, 'verbruik')) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem' }}>Geen verbruik</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

HistoryWeeklyCard.propTypes = {
    weekId: PropTypes.string.isRequired,
    weekData: PropTypes.shape({
        orders: PropTypes.array,
        deliveries: PropTypes.array,
        verbruik: PropTypes.array,
        totals: PropTypes.shape({
            orders: PropTypes.number.isRequired,
            deliveries: PropTypes.number.isRequired,
            verbruik: PropTypes.number.isRequired,
            grandTotal: PropTypes.number.isRequired
        }).isRequired
    }).isRequired
};

export default HistoryWeeklyCard;
