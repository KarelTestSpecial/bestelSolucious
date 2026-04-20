import React from 'react';
import { getDateOfTuesday, parseWeekId } from '../utils/weekUtils';
import PropTypes from 'prop-types';

const HistoryWeeklyCard = ({ weekId, weekData, onOpenModal }) => {
    const { orders, deliveries, verbruik, totals } = weekData;

    const consumptionFromDelivery = verbruik.filter(c => c.weeksSincePurchase <= 1 && c.isOrdered);
    const consumptionFromStock = verbruik.filter(c => c.weeksSincePurchase > 1 || !c.isOrdered);

    const deliveryConsumptionTotal = consumptionFromDelivery.reduce((acc, c) => acc + (c.weeklyCost || 0), 0);
    const stockConsumptionTotal = consumptionFromStock.reduce((acc, c) => acc + (c.weeklyCost || 0), 0);

    return (
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>
                        📅 {getDateOfTuesday(weekId)}
                    </h3>
                    <span className="badge badge-warning" style={{ opacity: 0.8 }}>{weekId}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div className="stat-label">Totaal Besteld</div>
                        <div className="stat-value" style={{ color: 'var(--accent-warning)', fontSize: '1.2rem' }}>€{totals.orders.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="stat-label">Totaal Geleverd</div>
                        <div className="stat-value" style={{ color: 'var(--accent-success)', fontSize: '1.2rem' }}>€{totals.deliveries.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="stat-label">Totaal Verbruik</div>
                        <div className="stat-value" style={{ color: 'var(--accent-primary)', fontSize: '1.2rem' }}>€{totals.verbruik.toFixed(2)}</div>
                    </div>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="secondary"
                        style={{ padding: '0.6rem', borderRadius: '50%', width: '40px', height: '40px' }}
                        title="Scroll naar boven"
                    >
                        ⬆️
                    </button>
                </div>
            </header>

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* 1. Bestellingen */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        🛒 Bestellingen
                    </h4>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Naam</th>
                                    <th style={{ textAlign: 'center' }}>Aantal</th>
                                    <th style={{ textAlign: 'right' }}>Subtotaal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? orders.map(o => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: '500' }}>{o.name}</td>
                                        <td style={{ textAlign: 'center' }}>{o.qty}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '600' }}>€{((o.qty || 0) * (o.price || 0)).toFixed(2)}</td>
                                    </tr>
                                )) : <tr><td colSpan="3" className="empty-text">Geen bestellingen</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* 2. Effectieve Leveringen */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-success)', margin: 0 }}>
                            🚚 Leveringen
                        </h4>
                        <button 
                            onClick={() => onOpenModal('delivery')} 
                            style={{ background: 'var(--success-color)', padding: '4px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                        >
                            Bevestig Levering
                        </button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Naam</th>
                                    <th style={{ textAlign: 'center' }}>Aantal</th>
                                    <th style={{ textAlign: 'right' }}>Subtotaal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.length > 0 ? deliveries.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: '500' }}>{d.name || 'Geleverd Item'}</td>
                                        <td style={{ textAlign: 'center' }}>{d.qty}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '600' }}>€{((d.qty || 0) * (d.price || 0)).toFixed(2)}</td>
                                    </tr>
                                )) : <tr><td colSpan="3" className="empty-text">Geen leveringen</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Verbruik Totaal */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', gridColumn: 'span 2' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                        📈 Verbruik Details
                    </h4>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Bron</th>
                                    <th style={{ textAlign: 'right' }}>Aankoopwaarde</th>
                                    <th style={{ textAlign: 'right' }}>Kost deze week</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...consumptionFromDelivery, ...consumptionFromStock].length > 0 ? 
                                    [...consumptionFromDelivery, ...consumptionFromStock].map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: '600' }}>{c.displayName}</td>
                                        <td>
                                            <span className={`badge ${c.isOrdered ? 'badge-success' : 'badge-warning'}`}>
                                                {c.isOrdered ? 'Levering' : 'Stock'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>€{(c.cost || 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                            €{(c.weeklyCost || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="empty-text">Geen verbruik geregistreerd</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
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
