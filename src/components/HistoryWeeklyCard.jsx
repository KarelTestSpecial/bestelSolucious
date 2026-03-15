import React from 'react';
import { ShoppingCart, Truck, TrendingUp, ArrowUpCircle } from 'lucide-react';
import { getDateOfTuesday, parseWeekId } from '../utils/weekUtils';
import PropTypes from 'prop-types';

const HistoryWeeklyCard = ({ weekId, weekData }) => {
    const { orders, deliveries, verbruik, totals } = weekData;

    const consumptionFromDelivery = verbruik.filter(c => c.weeksSincePurchase <= 1 && c.isOrdered);
    const consumptionFromStock = verbruik.filter(c => c.weeksSincePurchase > 1 || !c.isOrdered);

    const deliveryConsumptionTotal = consumptionFromDelivery.reduce((acc, c) => acc + (c.weeklyCost || 0), 0);
    const stockConsumptionTotal = consumptionFromStock.reduce((acc, c) => acc + (c.weeklyCost || 0), 0);

    return (
        <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                    Levering: {getDateOfTuesday(weekId)} &nbsp; <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({weekId})</span>
                </h3>
                <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Besteld: <span style={{ color: 'var(--warning-color)' }}>€{totals.orders.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Geleverd: <span style={{ color: 'var(--success-color)' }}>€{totals.deliveries.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Verbruik: <span style={{ color: 'var(--accent-color)' }}>€{totals.verbruik.toFixed(2)}</span>
                    </div>
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px', border: 'none', cursor: 'pointer' }}
                        title="Scroll naar boven"
                      >
                        <ArrowUpCircle size={22} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', flexWrap: 'nowrap' }}>
                {/* 1. Bestellingen */}
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', margin: 0 }}>
                            <ShoppingCart size={16} /> Bestellingen (€{totals.orders.toFixed(2)})
                        </h4>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Aantal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Prijs (p/u)</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Subtotaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? orders.map(o => (
                                <tr key={o.id}>
                                    <td>{o.name}</td>
                                    <td style={{ textAlign: 'center' }}>{o.qty}</td>
                                    <td style={{ textAlign: 'center' }}>€{(o.price || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}><strong>€{((o.qty || 0) * (o.price || 0)).toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="4" className="empty-text">Geen bestellingen</td></tr>}
                        </tbody>
                    </table>
                </section>
                
                {/* 2. Effectieve Leveringen */}
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', margin: 0 }}>
                            <Truck size={16} /> Leveringen (€{totals.deliveries.toFixed(2)})
                        </h4>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Aantal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Prijs (p/u)</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Subtotaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.length > 0 ? deliveries.map(d => (
                                <tr key={d.id}>
                                    <td>{d.name || 'Geleverd Item'}</td>
                                    <td style={{ textAlign: 'center' }}>{d.qty}</td>
                                    <td style={{ textAlign: 'center' }}>€{(d.price || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}><strong>€{((d.qty || 0) * (d.price || 0)).toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="4" className="empty-text">Geen leveringen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3a. Verbruik uit Levering */}
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0rem' }}>
                        <TrendingUp size={16} /> Verbruik Levering (€{deliveryConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Subtotaal (aankoop)</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Kost p/w</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionFromDelivery.length > 0 ? consumptionFromDelivery.map(c => (
                                <tr key={c.id}>
                                    <td>{c.displayName}</td>
                                    <td style={{ textAlign: 'center' }}>€{(c.cost || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}><strong>€{(c.weeklyCost || 0).toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="3" className="empty-text">Geen verbruik uit levering</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3b. Verbruik uit Stock */}
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0rem' }}>
                        <TrendingUp size={16} /> Verbruik Stock (€{stockConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Subtotaal (aankoop)</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Kost p/w</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionFromStock.length > 0 ? consumptionFromStock.map(c => (
                                <tr key={c.id}>
                                    <td>{c.displayName}</td>
                                    <td style={{ textAlign: 'center' }}>€{(c.cost || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}><strong>€{(c.weeklyCost || 0).toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="3" className="empty-text">Geen verbruik uit stock</td></tr>}
                        </tbody>
                    </table>
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
