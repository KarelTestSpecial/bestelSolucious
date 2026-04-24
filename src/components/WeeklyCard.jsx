import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useProductList } from '../hooks/useProductList';
import { getDateOfTuesday } from '../utils/weekUtils';
import PropTypes from 'prop-types';

const EditableCell = ({ value, onSave, type = 'text', style = {}, precision = 2 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleBlur = () => {
        setIsEditing(false);
        const finalValue = type === 'number' ? parseFloat(tempValue) : tempValue;
        if (finalValue !== value) onSave(finalValue);
    };

    if (isEditing) {
        return (
            <input
                className="input-field"
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleBlur}
                autoFocus
                style={{ ...style, padding: '2px 4px', fontSize: 'inherit' }}
            />
        );
    }

    return (
        <span 
            onClick={() => setIsEditing(true)} 
            style={{ ...style, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}
        >
            {type === 'number' ? (typeof value === 'number' ? value.toFixed(precision) : value) : value}
        </span>
    );
};

EditableCell.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onSave: PropTypes.func.isRequired,
    type: PropTypes.string,
    style: PropTypes.object,
    precision: PropTypes.number,
};

export const WeeklyCard = ({ data, onOpenModal, isFirst }) => {
    const { activeData, updateItem, deleteItem, addOrder, confirmDelivery, registerConsumption } = useAppContext();
    const { getProductList } = useProductList();
    
    // Gebruik de volledige data om de productlijst te genereren
    const products = useMemo(() => getProductList(), [activeData]);

    const { weekId, offset, stats } = data;
    const isCurrent = offset === 0;
    
    const [newOrder, setNewOrder] = useState(null);
    const [newDelivery, setNewDelivery] = useState(null);
    const [newDeptItem, setNewDeptItem] = useState(null);

    // Auto-fill handlers voor nieuwe bestellingen/leveringen
    const handleOrderNameChange = (e) => {
        const name = e.target.value;
        setNewOrder(prev => {
            const newData = { ...prev, name };
            const match = products.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
            console.log(`Auto-fill Zoekopdracht (Bestelling): "${name}"`, match ? `GEVONDEN: €${match.price}` : "NIET GEVONDEN");
            if (match) {
                newData.price = match.price.toString();
                newData.estDuration = parseInt(match.estDuration || 1);
            }
            return newData;
        });
    };

    const handleDeliveryNameChange = (e) => {
        const name = e.target.value;
        setNewDelivery(prev => {
            const newData = { ...prev, name };
            const match = products.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
            console.log(`Auto-fill Zoekopdracht (Levering): "${name}"`, match ? `GEVONDEN: €${match.price}` : "NIET GEVONDEN");
            if (match) {
                newData.price = match.price.toString();
                newData.estDuration = parseInt(match.estDuration || 1);
            }
            return newData;
        });
    };

    const handleDeptNameChange = (e) => {
        const name = e.target.value;
        setNewDeptItem(prev => {
            const newData = { ...prev, name };
            const match = products.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
            if (match) {
                newData.cost = match.price.toString();
                newData.estDuration = parseInt(match.estDuration || 1);
            }
            return newData;
        });
    };

    const consumptionFromDelivery = stats.consumptionInWeek.filter(c => !c.isDepartmentStock && c.weeksSincePurchase <= 1);
    const personalStock = stats.consumptionInWeek.filter(c => !c.isDepartmentStock && c.weeksSincePurchase > 1);
    const departmentStock = stats.consumptionInWeek.filter(c => c.isDepartmentStock);

    const deliveryConsumptionTotal = consumptionFromDelivery.reduce((acc, c) => acc + c.weeklyCost, 0);
    const personalStockTotal = personalStock.reduce((acc, c) => acc + c.weeklyCost, 0);
    const departmentStockTotal = departmentStock.reduce((acc, c) => acc + c.weeklyCost, 0);
    const stockConsumptionTotal = personalStockTotal + departmentStockTotal;

    return (
        <div data-debug-version="4" className={`glass-panel ${isCurrent ? 'current-week' : ''}`} style={{ borderLeft: isCurrent ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)', marginBottom: '0.6rem', padding: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>
                        📅 {getDateOfTuesday(weekId)}
                    </h3>
                    <span className="badge badge-warning" style={{ opacity: 0.8, fontSize: '0.55rem' }}>{weekId}</span>
                    {isCurrent && <span className="badge badge-success" style={{ fontSize: '0.55rem' }}>LIVE</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <div className="stat-card" style={{ padding: '0 0.4rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--warning-color)' }}>€{stats.orderTotal.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.55rem' }}>Besteld</div>
                    </div>
                    <div className="stat-card" style={{ padding: '0 0.4rem', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--success-color)' }}>€{stats.deliveryTotal.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.55rem' }}>Geleverd</div>
                    </div>
                    <div className="stat-card" style={{ padding: '0 0.4rem', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-primary)' }}>€{stats.totalConsumptionCost.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.55rem' }}>Verbruik</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '0.8rem' }}>
                {/* 1. Bestellingen */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>
                            🛒 Bestellingen (€{stats.orderTotal.toFixed(2)})
                        </h4>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => setNewOrder({ name: '', price: '', qty: 1, estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '1px 6px', fontSize: '0.8rem', cursor: 'pointer' }}>+</button>
                        </div>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Q</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>€</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>W</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Sub</th>
                                <th style={{ width: '10%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.orders.length > 0 ? stats.orders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: '500' }}>
                                        <EditableCell value={o.name} onSave={(val) => updateItem('orders', o.id, { name: val })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={o.qty} type="number" onSave={(val) => updateItem('orders', o.id, { qty: val })} precision={0} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={o.price} type="number" onSave={(val) => updateItem('orders', o.id, { price: val })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={o.estDuration || 1} type="number" onSave={(val) => updateItem('orders', o.id, { estDuration: val })} precision={0} />
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600' }}>€{(o.qty * o.price).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button onClick={() => deleteItem('orders', o.id)} style={{ background: 'transparent', color: 'var(--accent-danger)', padding: 0 }}>✕</button>
                                    </td>
                                </tr>
                            )) : !newOrder && <tr><td colSpan="6" className="empty-text">Geen bestellingen</td></tr>}
                            
                            {newOrder && (
                                <tr>
                                    <td>
                                        <input list="product-suggestions" className="input-field" value={newOrder.name} onChange={handleOrderNameChange} autoFocus placeholder="Product..." />
                                        <datalist id="product-suggestions">
                                            {products.map(p => <option key={p.id} value={p.name} />)}
                                        </datalist>
                                    </td>
                                    <td><input className="input-field text-center" type="number" value={newOrder.qty} onChange={e => setNewOrder({...newOrder, qty: parseInt(e.target.value)})} /></td>
                                    <td><input className="input-field text-center" type="number" step="0.01" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} /></td>
                                    <td><input className="input-field text-center" type="number" value={newOrder.estDuration} onChange={e => setNewOrder({...newOrder, estDuration: parseInt(e.target.value)})} /></td>
                                    <td colSpan="2">
                                        <button onClick={() => { addOrder({ ...newOrder, weekId, price: parseFloat(newOrder.price) }); setNewOrder(null); }}>Opslaan</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
                
                {/* 2. Effectieve Leveringen */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', margin: 0, fontSize: '0.8rem' }}>
                            🚚 Leveringen (€{stats.deliveryTotal.toFixed(2)})
                        </h4>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {isFirst && (
                                <button 
                                    onClick={() => onOpenModal('delivery', weekId)} 
                                    style={{ background: 'var(--success-color)', padding: '1px 6px', fontSize: '0.7rem', borderRadius: '4px' }}
                                >
                                    Bevestig
                                </button>
                            )}
                            <button onClick={() => setNewDelivery({ name: '', price: '', qty: 1, estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--success-color)', color: 'var(--accent-success)', padding: '1px 6px', fontSize: '0.8rem', cursor: 'pointer' }}>+</button>
                        </div>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Q</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>€</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>W</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Sub</th>
                                <th style={{ width: '10%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.deliveries.length > 0 ? stats.deliveries.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <EditableCell value={d.name || 'Geleverd'} onSave={(val) => updateItem('deliveries', d.id, { name: val })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={d.qty} type="number" onSave={(val) => updateItem('deliveries', d.id, { qty: val })} precision={0} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={d.price} type="number" onSave={(val) => updateItem('deliveries', d.id, { price: val })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={d.estDuration || 1} type="number" onSave={(val) => updateItem('deliveries', d.id, { estDuration: val })} precision={0} />
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600' }}>€{(d.qty * d.price).toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button onClick={() => deleteItem('deliveries', d.id)} style={{ background: 'transparent', color: 'var(--accent-danger)', padding: 0 }}>✕</button>
                                    </td>
                                </tr>
                            )) : !newDelivery && <tr><td colSpan="6" className="empty-text">Geen leveringen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3a. Verbruik uit Levering */}
                <section>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                        📈 Verbruik Levering (€{deliveryConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Sub</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Kost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionFromDelivery.length > 0 ? consumptionFromDelivery.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: '500' }}>{c.displayName}</td>
                                    <td style={{ textAlign: 'center' }}>€{c.cost.toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {c.weeksSincePurchase} / {c.duration} w
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--accent-primary)' }}>€{c.weeklyCost.toFixed(2)}</td>
                                </tr>
                            )) : <tr><td colSpan="4" className="empty-text">Geen verbruik uit leveringen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3b. Verbruik uit Stock */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-color)', margin: 0, fontSize: '0.8rem' }}>
                            📈 Verbruik Stock (€{stockConsumptionTotal.toFixed(2)})
                        </h4>
                        <button onClick={() => setNewDeptItem({ name: '', cost: '', estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '1px 6px', fontSize: '0.8rem', cursor: 'pointer' }}>+</button>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Naam</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Sub</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Kost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Persoonlijke Stock */}
                            {personalStock.length > 0 ? personalStock.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: '500' }}>{c.displayName}</td>
                                    <td style={{ textAlign: 'center' }}>€{c.cost.toFixed(2)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {c.weeksSincePurchase} / {c.duration} w
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--accent-secondary)' }}>€{c.weeklyCost.toFixed(2)}</td>
                                </tr>
                            )) : personalStock.length === 0 && departmentStock.length === 0 && !newDeptItem && <tr><td colSpan="4" className="empty-text">Geen verbruik uit stock</td></tr>}

                            {/* Afdeling Stock Items */}
                            {departmentStock.map(c => (
                                <tr key={c.id} style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                                    <td style={{ fontWeight: '500', fontStyle: 'italic', color: '#93c5fd' }}>
                                        <EditableCell value={c.displayName} onSave={(val) => updateItem('consumption', c.id, { name: val })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <EditableCell value={c.cost} type="number" onSave={(val) => updateItem('consumption', c.id, { cost: val })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            {c.weeksSincePurchase} / 
                                            <EditableCell value={c.duration} type="number" onSave={(val) => updateItem('consumption', c.id, { estDuration: val })} precision={0} />
                                            w
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600', color: '#93c5fd' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                            €{c.weeklyCost.toFixed(2)}
                                            <button onClick={() => deleteItem('consumption', c.id)} style={{ background: 'transparent', color: 'var(--accent-danger)', padding: 0, fontSize: '0.7rem' }}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Nieuw Afdeling Item Form */}
                            {newDeptItem && (
                                <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                    <td>
                                        <input 
                                            list="product-suggestions-dept"
                                            className="input-field" 
                                            value={newDeptItem.name} 
                                            onChange={handleDeptNameChange} 
                                            autoFocus 
                                            placeholder="Product..." 
                                            style={{ fontSize: '0.75rem' }}
                                        />
                                        <datalist id="product-suggestions-dept">
                                            {products.map(p => <option key={p.id} value={p.name} />)}
                                        </datalist>
                                    </td>
                                    <td>
                                        <input 
                                            className="input-field text-center" 
                                            type="number" 
                                            step="0.01"
                                            value={newDeptItem.cost} 
                                            onChange={e => setNewDeptItem({...newDeptItem, cost: e.target.value})} 
                                            placeholder="€"
                                            style={{ fontSize: '0.75rem' }}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <input 
                                                className="input-field text-center" 
                                                type="number" 
                                                value={newDeptItem.estDuration} 
                                                onChange={e => setNewDeptItem({...newDeptItem, estDuration: parseInt(e.target.value)})} 
                                                style={{ width: '40px', fontSize: '0.75rem' }}
                                            />
                                            <span style={{ fontSize: '0.7rem' }}>w</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => { 
                                                registerConsumption({ 
                                                    name: newDeptItem.name, 
                                                    sourceId: 'department', 
                                                    sourceType: 'department', 
                                                    qty: 1, 
                                                    cost: parseFloat(newDeptItem.cost) || 0, 
                                                    startDate: weekId, 
                                                    estDuration: newDeptItem.estDuration, 
                                                    completed: false 
                                                }); 
                                                setNewDeptItem(null); 
                                            }}
                                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                        >
                                            OK
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

WeeklyCard.propTypes = {
    data: PropTypes.object.isRequired,
    onOpenModal: PropTypes.func,
    isFirst: PropTypes.bool,
};
