import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { getDateOfTuesday, getWeekIdFromDate, getISODateOfTuesday, parseWeekId } from '../utils/weekUtils';
import { useProductList } from '../hooks/useProductList';
import PropTypes from 'prop-types';

export const EditableCell = ({ value, onSave, type = 'text', suffix = '', precision = 2 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef(null);

    const handleStartEdit = () => {
        if (type === 'date') {
            setTempValue(getISODateOfTuesday(value));
        } else {
            setTempValue(value);
        }
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        let finalValue = tempValue;
        if (type === 'number') finalValue = parseFloat(tempValue);
        if (type === 'date') finalValue = getWeekIdFromDate(tempValue);
        onSave(finalValue);
    };

    useEffect(() => {
        const input = inputRef.current;
        if (isEditing && input && type === 'number') {
            const handleWheel = (e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1 : -1;
                setTempValue(prev => {
                    const num = parseFloat(prev);
                    if (isNaN(num)) return prev;
                    return (num + delta).toString();
                });
            };
            input.addEventListener('wheel', handleWheel, { passive: false });
            return () => input.removeEventListener('wheel', handleWheel);
        }
    }, [isEditing, type]);

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                className="input-field" autoFocus
                style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: type === 'date' ? '150px' : '80px' }}
                type={type} value={tempValue}
                onChange={e => setTempValue(e.target.value)}
                onBlur={handleBlur}
                onFocus={(e) => type === 'date' && e.target.showPicker?.()}
                onClick={(e) => type === 'date' && e.target.showPicker?.()}
                onKeyDown={e => e.key === 'Enter' && handleBlur()}
            />
        );
    }

    const displayValue = type === 'date' && value && value.toString().includes('-W') 
        ? parseWeekId(value).week 
        : (type === 'number' && typeof value === 'number' ? value.toFixed(precision) : value);

    return (
        <span onClick={handleStartEdit} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--accent-color)' }}>
            {displayValue}{suffix}
        </span>
    );
};

EditableCell.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onSave: PropTypes.func.isRequired,
    type: PropTypes.string,
    suffix: PropTypes.string,
    precision: PropTypes.number,
};

export const WeeklyCard = ({ data }) => {
    const { activeData, updateItem, deleteItem, addOrder, confirmDelivery } = useAppContext();
    const { getProductList } = useProductList();
    
    // Gebruik de volledige data om de productlijst te genereren
    const products = useMemo(() => getProductList(), [activeData]);

    const { weekId, offset, stats } = data;
    const isCurrent = offset === 0;
    
    const [newOrder, setNewOrder] = useState(null);
    const [newDelivery, setNewDelivery] = useState(null);

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

    const consumptionFromDelivery = stats.consumptionInWeek.filter(c => c.isOrdered);
    const consumptionFromStock = stats.consumptionInWeek.filter(c => !c.isOrdered);

    const deliveryConsumptionTotal = consumptionFromDelivery.reduce((acc, c) => acc + c.weeklyCost, 0);
    const stockConsumptionTotal = consumptionFromStock.reduce((acc, c) => acc + c.weeklyCost, 0);

    return (
        <div data-debug-version="2" className={`glass-panel ${isCurrent ? 'current-week' : ''}`} style={{ borderLeft: isCurrent ? '6px solid var(--accent-primary)' : '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>
                        📅 {getDateOfTuesday(weekId)}
                    </h3>
                    <span className="badge badge-warning" style={{ opacity: 0.8 }}>{weekId}</span>
                    {isCurrent && <span className="badge badge-success">LIVE</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="stat-card" style={{ padding: '0 1rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--warning-color)' }}>€{stats.orderTotal.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.7rem' }}>Besteld</div>
                    </div>
                    <div className="stat-card" style={{ padding: '0 1rem', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--success-color)' }}>€{stats.deliveryTotal.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.7rem' }}>Geleverd</div>
                    </div>
                    <div className="stat-card" style={{ padding: '0 1rem', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>€{stats.totalConsumptionCost.toFixed(2)}</div>
                        <div className="stat-label" style={{ fontSize: '0.7rem' }}>Verbruik</div>
                    </div>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="secondary"
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '50%' }}
                        title="Scroll naar boven"
                    >
                        ⬆️
                    </button>
                </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '2.5rem' }}>
                {/* 1. Bestellingen */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', margin: 0 }}>
                            🛒 Bestellingen (€{stats.orderTotal.toFixed(2)})
                        </h4>
                        <button onClick={() => setNewOrder({ name: '', price: '', qty: 1, estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '2px 8px', fontSize: '1rem', cursor: 'pointer' }}>+</button>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Aantal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Prijs (p/u)</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Duur</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Subtotaal</th>
                                <th style={{ width: '10%', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.orders.length > 0 ? stats.orders.map(o => (
                                <tr key={o.id}>
                                    <td><EditableCell value={o.name} onSave={val => updateItem('order', o.id, { name: val })} /></td>
                                    <td style={{ textAlign: 'center' }}><EditableCell value={o.qty} type="number" precision={0} onSave={val => updateItem('order', o.id, { qty: val })} /></td>
                                    <td style={{ textAlign: 'center' }}>€<EditableCell value={o.price} type="number" onSave={val => updateItem('order', o.id, { price: val })} /></td>
                                    <td style={{ textAlign: 'center' }}><EditableCell value={o.estDuration} type="number" precision={0} suffix=" w" onSave={val => updateItem('order', o.id, { estDuration: val })} /></td>
                                    <td style={{ textAlign: 'center' }}><strong>€{(o.qty * o.price).toFixed(2)}</strong></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => deleteItem('order', o.id)}
                                            style={{ background: 'transparent', color: 'var(--danger-color)', padding: '4px' }}
                                            title="Verwijder bestelling"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            )) : null}
                            {newOrder && (
                                <tr style={{ backgroundColor: 'rgba(110, 64, 201, 0.1)' }}>
                                    <td>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            placeholder="Product naam"
                                            list={`suggestions-order-${weekId}`}
                                            value={newOrder.name}
                                            onChange={handleOrderNameChange}
                                            autoFocus
                                        />
                                        <datalist id={`suggestions-order-${weekId}`}>
                                            {products.map((p, i) => (
                                                <option key={i} value={p.name} />
                                            ))}
                                        </datalist>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            type="number"
                                            value={newOrder.qty}
                                            onChange={e => setNewOrder({ ...newOrder, qty: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newOrder.price}
                                            onChange={e => setNewOrder({ ...newOrder, price: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            type="number"
                                            value={newOrder.estDuration}
                                            onChange={e => setNewOrder({ ...newOrder, estDuration: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}><strong>€{(newOrder.qty * (parseFloat(newOrder.price) || 0)).toFixed(2)}</strong></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button 
                                                onClick={() => {
                                                    if (newOrder.name && newOrder.price) {
                                                        const productId = crypto.randomUUID();
                                                        addOrder({
                                                            productId,
                                                            name: newOrder.name,
                                                            price: parseFloat(newOrder.price),
                                                            qty: newOrder.qty,
                                                            estDuration: newOrder.estDuration,
                                                            weekId: weekId
                                                        });
                                                        setNewOrder(null);
                                                    }
                                                }}
                                                style={{ background: 'var(--success-color)', color: 'white', padding: '4px', border: 'none', cursor: 'pointer' }}
                                                title="Opslaan"
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                onClick={() => setNewOrder(null)}
                                                style={{ background: 'transparent', color: 'var(--danger-color)', padding: '4px' }}
                                                title="Annuleren"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {stats.orders.length === 0 && !newOrder && <tr><td colSpan="6" className="empty-text">Geen bestellingen</td></tr>}
                        </tbody>
                    </table>
                </section>
                
                {/* 2. Effectieve Leveringen */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', margin: 0 }}>
                            🚚 Leveringen (€{stats.deliveryTotal.toFixed(2)})
                        </h4>
                        <button onClick={() => setNewDelivery({ name: '', price: '', qty: 1, estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '2px 8px', fontSize: '1rem', cursor: 'pointer' }}>+</button>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Aantal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Prijs (p/u)</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Duur</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Subtotaal</th>
                                <th style={{ width: '10%', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.deliveries.length > 0 ? stats.deliveries.map(d => (
                                <tr key={d.id}>
                                    <td><EditableCell value={d.name || 'Geleverd Item'} onSave={val => updateItem('delivery', d.id, { name: val })} /></td>
                                    <td style={{ textAlign: 'center' }}><EditableCell value={d.qty} type="number" precision={0} onSave={val => updateItem('delivery', d.id, { qty: val })} /></td>
                                    <td style={{ textAlign: 'center' }}>€<EditableCell value={d.price} type="number" onSave={val => updateItem('delivery', d.id, { price: val })} /></td>
                                    <td style={{ textAlign: 'center' }}><EditableCell value={d.estDuration} type="number" precision={0} suffix=" w" onSave={val => updateItem('delivery', d.id, { estDuration: val })} /></td>
                                    <td style={{ textAlign: 'center' }}><strong>€{(d.qty * d.price).toFixed(2)}</strong></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => deleteItem('delivery', d.id)}
                                            style={{ background: 'transparent', color: 'var(--danger-color)', padding: '4px' }}
                                            title="Verwijder levering"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            )) : null}
                            {newDelivery && (
                                <tr style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)' }}>
                                    <td>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            placeholder="Product naam"
                                            list={`suggestions-delivery-${weekId}`}
                                            value={newDelivery.name}
                                            onChange={handleDeliveryNameChange}
                                            autoFocus
                                        />
                                        <datalist id={`suggestions-delivery-${weekId}`}>
                                            {products.map((p, i) => (
                                                <option key={i} value={p.name} />
                                            ))}
                                        </datalist>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            type="number"
                                            value={newDelivery.qty}
                                            onChange={e => setNewDelivery({ ...newDelivery, qty: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newDelivery.price}
                                            onChange={e => setNewDelivery({ ...newDelivery, price: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            className="input-field"
                                            style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '100%' }}
                                            type="number"
                                            value={newDelivery.estDuration}
                                            onChange={e => setNewDelivery({ ...newDelivery, estDuration: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}><strong>€{(newDelivery.qty * (parseFloat(newDelivery.price) || 0)).toFixed(2)}</strong></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button 
                                                onClick={() => {
                                                    if (newDelivery.name && newDelivery.price) {
                                                        const productId = crypto.randomUUID();
                                                        confirmDelivery({
                                                            productId,
                                                            name: newDelivery.name,
                                                            price: parseFloat(newDelivery.price),
                                                            qty: newDelivery.qty,
                                                            estDuration: newDelivery.estDuration,
                                                            weekId: weekId
                                                        });
                                                        setNewDelivery(null);
                                                    }
                                                }}
                                                style={{ background: 'var(--success-color)', color: 'white', padding: '4px', border: 'none', cursor: 'pointer' }}
                                                title="Opslaan"
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                onClick={() => setNewDelivery(null)}
                                                style={{ background: 'transparent', color: 'var(--danger-color)', padding: '4px' }}
                                                title="Annuleren"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {stats.deliveries.length === 0 && !newDelivery && <tr><td colSpan="6" className="empty-text">Geen leveringen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3a. Verbruik uit Levering */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0rem' }}>
                        📈 Verbruik Levering (€{deliveryConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Subtotaal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Voortgang</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Kost p/w</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Start</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionFromDelivery.map(c => {
                                return (
                                    <tr key={c.id}>
                                        <td>{c.displayName}</td>
                                        <td style={{ textAlign: 'center' }}>€<EditableCell value={c.cost} type="number" onSave={val => updateItem('consumption', c.id, { cost: val })} /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span>{c.weeksSincePurchase} / </span>
                                                <EditableCell
                                                    value={c.effDuration ?? (c.estDuration || '---')}
                                                    type={c.effDuration ? 'number' : 'text'}
                                                    precision={0}
                                                    suffix=" w"
                                                    onSave={val => {
                                                        const isEmpty = val === '---' || val === '-' || val === '' || val === 0 || val === '0';
                                                        if (c.completed) {
                                                            updateItem('consumption', c.id, {
                                                                effDuration: isEmpty ? null : parseFloat(val),
                                                                completed: !isEmpty
                                                            });
                                                        } else {
                                                            updateItem('consumption', c.id, {
                                                                estDuration: isEmpty ? (c.estDuration || 1) : parseFloat(val),
                                                                completed: false
                                                            });
                                                        }
                                                    }}
                                                />
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}><strong>€{c.weeklyCost.toFixed(2)}</strong></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <EditableCell
                                                value={c.startDate}
                                                type="date"
                                                onSave={val => updateItem('consumption', c.id, { startDate: val })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {consumptionFromDelivery.length === 0 && <tr><td colSpan="5" className="empty-text">Geen verbruik uit levering</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3b. Verbruik uit Stock */}
                <section style={{ flex: 1, minWidth: '300px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0rem' }}>
                        📈 Verbruik Stock (€{stockConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Subtotaal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Voortgang</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Kost p/w</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Start</th>
                                <th style={{ width: '10%', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionFromStock.map(c => {
                                const isCompleted = c.completed && c.effDuration > 0;
                                return (
                                    <tr key={c.id}>
                                        <td>{c.displayName}</td>
                                        <td style={{ textAlign: 'center' }}>€<EditableCell value={c.cost} type="number" onSave={val => updateItem('consumption', c.id, { cost: val })} /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span>{c.weeksSincePurchase} / </span>
                                                <EditableCell
                                                    value={c.effDuration ?? (c.estDuration || '---')}
                                                    type={c.effDuration ? 'number' : 'text'}
                                                    precision={0}
                                                    suffix=" w"
                                                    onSave={val => {
                                                        const isEmpty = val === '---' || val === '-' || val === '' || val === 0 || val === '0';
                                                        if (c.completed) {
                                                            updateItem('consumption', c.id, {
                                                                effDuration: isEmpty ? null : parseFloat(val),
                                                                completed: !isEmpty
                                                            });
                                                        } else {
                                                            updateItem('consumption', c.id, {
                                                                estDuration: isEmpty ? (c.estDuration || 1) : parseFloat(val),
                                                                completed: false
                                                            });
                                                        }
                                                    }}
                                                />
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}><strong>€{c.weeklyCost.toFixed(2)}</strong></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <EditableCell
                                                value={c.startDate}
                                                type="date"
                                                onSave={val => updateItem('consumption', c.id, { startDate: val })}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {!isCompleted ? (
                                                <button
                                                    onClick={() => updateItem('consumption', c.id, { completed: true, effDuration: c.duration })}
                                                    className="badge badge-danger"
                                                    style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}
                                                >
                                                    OP
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateItem('consumption', c.id, { completed: false, effDuration: null })}
                                                    className="badge badge-warning"
                                                    title="Heropen item (niet op)"
                                                    style={{ border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                                >
                                                    🔄
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {consumptionFromStock.length === 0 && <tr><td colSpan="6" className="empty-text">Geen verbruik uit stock</td></tr>}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

WeeklyCard.propTypes = {
    data: PropTypes.shape({
        weekId: PropTypes.string.isRequired,
        offset: PropTypes.number.isRequired,
        stats: PropTypes.shape({
            totalConsumptionCost: PropTypes.number.isRequired,
            orderTotal: PropTypes.number.isRequired,
            orders: PropTypes.array.isRequired,
            deliveryTotal: PropTypes.number.isRequired,
            deliveries: PropTypes.array.isRequired,
            consumptionInWeek: PropTypes.array.isRequired,
        }).isRequired,
    }).isRequired,
};
