import React from 'react';
import { getDateOfTuesday } from '../utils/weekUtils';
import PropTypes from 'prop-types';

const HistoryWeeklyCard = ({ weekId, weekData, onOpenModal }) => {
    const { orders, deliveries, verbruik, totals } = weekData;

    const consumptionFromDelivery = verbruik.filter(c => c.weeksSincePurchase <= 1);
    const consumptionFromStock = verbruik.filter(c => c.weeksSincePurchase > 1);

    const deliveryConsumptionTotal = consumptionFromDelivery.reduce((acc, c) => acc + (c.weeklyCost || 0), 0);
    const stockConsumptionTotal = consumptionFromStock.reduce((acc, c) => acc + (c.weeklyCost || 0), 0);

    return (
        <div className="glass-panel" style={{ marginBottom: '0.6rem', padding: '0.6rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>
                        📅 {getDateOfTuesday(weekId)}
                    </h3>
                    <span className="badge badge-warning" style={{ opacity: 0.8, fontSize: '0.55rem' }}>{weekId}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div className="stat-value" style={{ color: 'var(--accent-warning)', fontSize: '0.85rem', fontWeight: '700' }}>€{totals.orders.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.55rem' }}>Besteld</div>
                    </div>
                    <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.8rem' }}>
                        <div className="stat-value" style={{ color: 'var(--accent-success)', fontSize: '0.85rem', fontWeight: '700' }}>€{totals.deliveries.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.55rem' }}>Geleverd</div>
                    </div>
                    <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.8rem' }}>
                        <div className="stat-value" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '700' }}>€{totals.verbruik.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.55rem' }}>Verbruik</div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.8rem' }}>
                {/* 1. Bestellingen */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)', padding: '0.4rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                        🛒 Bestellingen
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th style={{ textAlign: 'center' }}>Q</th>
                                <th style={{ textAlign: 'right' }}>Sub</th>
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
                
                {/* 2. Effectieve Leveringen */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)', padding: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-success)', margin: 0, fontSize: '0.8rem' }}>
                            🚚 Leveringen
                        </h4>
                        <button 
                            onClick={() => onOpenModal('delivery', weekId)} 
                            style={{ background: 'var(--success-color)', padding: '1px 6px', fontSize: '0.7rem', borderRadius: '4px' }}
                        >
                            Bevestig
                        </button>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th style={{ textAlign: 'center' }}>Q</th>
                                <th style={{ textAlign: 'right' }}>Sub</th>
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

                {/* 3. Verbruik Totaal */}
                <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)', padding: '0.4rem', gridColumn: 'span 2' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                        📈 Verbruik Details
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Aankoop</th>
                                <th style={{ textAlign: 'right' }}>Kost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...consumptionFromDelivery, ...consumptionFromStock].length > 0 ? 
                                [...consumptionFromDelivery, ...consumptionFromStock].map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: '600' }}>{c.displayName}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {c.weeksSincePurchase} / {c.duration} w
                                    </td>
                                    <td style={{ textAlign: 'right' }}>€{(c.cost || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                        €{(c.weeklyCost || 0).toFixed(2)}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="4" className="empty-text">Geen verbruik</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

HistoryWeeklyCard.propTypes = {
    weekId: PropTypes.string.isRequired,
    weekData: PropTypes.object.isRequired,
    onOpenModal: PropTypes.func.isRequired,
};

export default HistoryWeeklyCard;
