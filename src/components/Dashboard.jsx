import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { getDateOfTuesday, getWeekIdFromDate, getISODateOfTuesday, parseWeekId } from '../utils/weekUtils';
import { Plus, ShoppingCart, Truck, TrendingUp, Trash2, RotateCcw, Undo2, Redo2, ArrowUpCircle } from 'lucide-react';
import OrderForm from './OrderForm';
import DeliveryForm from './DeliveryForm';
import ConsumptionForm from './ConsumptionForm';
import PropTypes from 'prop-types';

const Dashboard = () => {
    const { getTimeline } = useWeeklyStats();
    const { undo, redo, canUndo, canRedo } = useAppContext();
    const [activeModal, setActiveModal] = useState(null);

    const timeline = getTimeline();

    return (
        <div className="dashboard">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
               
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', borderRight: '1px solid rgba(255,255,255,0)', paddingRight: '0rem', marginRight: '0rem' }}>
                        <button 
                            onClick={undo} 
                            disabled={!canUndo}
                            style={{ 
                                background: '#6e40c9', 
                                padding: '0.5rem', 
                                opacity: canUndo ? 1 : 0.3, 
                                cursor: canUndo ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Ongedaan maken"
                        >
                            <Undo2 size={16} />
                        </button>
                        <button 
                            onClick={redo} 
                            disabled={!canRedo}
                            style={{ 
                                background: '#6e40c9', 
                                padding: '0.5rem', 
                                opacity: canRedo ? 1 : 0.3, 
                                cursor: canRedo ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Opnieuw uitvoeren"
                        >
                            <Redo2 size={16} />
                        </button>
                    </div>

                    <button onClick={() => setActiveModal('order')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={10} /> Nieuwe Bestelling
                    </button>
                    <button onClick={() => setActiveModal('delivery')} className="badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Levering Bevestigen
                    </button>
                    <button onClick={() => setActiveModal('consumption')} style={{ padding: '5px 17px', fontSize: '0.7rem' }}>+ Ad-hoc / Stock Toevoegen</button>
                </div>
            </header>

            {activeModal === 'order' && <OrderForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'delivery' && <DeliveryForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'consumption' && <ConsumptionForm onClose={() => setActiveModal(null)} />}

            <div className="timeline-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                {timeline.map((item) => (
                    <WeeklyCard key={item.weekId} data={item} onAddAdhoc={() => setActiveModal('consumption')} />
                ))}
            </div>

        </div>
    );
};

const EditableCell = ({ value, onSave, type = 'text', suffix = '', precision = 2 }) => {
    const [isEditing, setIsEditing] = useState(false);
    // For date type, we want to start with a real date string (YYYY-MM-DD)
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

    const displayValue = type === 'date' && value && value.includes('-W') 
        ? parseWeekId(value).week 
        : (type === 'number' && typeof value === 'number' ? value.toFixed(precision) : value);

    return (
        <span onClick={handleStartEdit} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--accent-color)' }}>
            {displayValue}{suffix}
        </span>
    );
};

EditableCell.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onSave: PropTypes.func.isRequired,
    type: PropTypes.string,
    suffix: PropTypes.string,
    precision: PropTypes.number,
};

const WeeklyCard = ({ data }) => {
    const { updateItem, deleteItem, addOrder, confirmDelivery } = useAppContext();
    const { weekId, offset, stats } = data;
    const isCurrent = offset === 0;
    
    const [newOrder, setNewOrder] = useState(null);
    const [newDelivery, setNewDelivery] = useState(null);

    const consumptionFromDelivery = stats.consumptionInWeek.filter(c => c.weeksSincePurchase <= 1);
    const consumptionFromStock = stats.consumptionInWeek.filter(c => c.weeksSincePurchase > 1);

    const deliveryConsumptionTotal = consumptionFromDelivery.reduce((acc, c) => acc + c.weeklyCost, 0);
    const stockConsumptionTotal = consumptionFromStock.reduce((acc, c) => acc + c.weeklyCost, 0);

    return (
        <div className={`glass-panel ${isCurrent ? 'current-week' : ''}`} style={{ padding: '0.5rem', borderLeft: isCurrent ? '4px solid var(--accent-color)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                    Levering: {getDateOfTuesday(weekId)} &nbsp; <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({weekId})</span>
                    {isCurrent && <span className="badge badge-success" style={{ marginLeft: '1rem' }}>HUIDIGE WEEK</span>}
                </h3>
                <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Besteld: <span style={{ color: 'var(--warning-color)' }}>€{stats.orderTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Geleverd: <span style={{ color: 'var(--success-color)' }}>€{stats.deliveryTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Verbruik: <span style={{ color: 'var(--accent-color)' }}>€{stats.totalConsumptionCost.toFixed(2)}</span>
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
                            <ShoppingCart size={16} /> Bestellingen (€{stats.orderTotal.toFixed(2)})
                        </h4>
                        <button onClick={() => setNewOrder({ name: '', price: '', qty: 1, estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '2px 8px', fontSize: '1rem', cursor: 'pointer' }}>+</button>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Aantal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Prijs (p/u)</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Verwachte Duur</th>
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
                                            <Trash2 size={10} />
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
                                            value={newOrder.name}
                                            onChange={e => setNewOrder({ ...newOrder, name: e.target.value })}
                                            autoFocus
                                        />
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
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', margin: 0 }}>
                            <Truck size={16} /> Leveringen (€{stats.deliveryTotal.toFixed(2)})
                        </h4>
                        {isCurrent && <button onClick={() => setNewDelivery({ name: '', price: '', qty: 1, estDuration: 1 })} style={{ background: 'transparent', border: '1px solid var(--success-color)', color: 'var(--success-color)', padding: '2px 8px', fontSize: '1rem', cursor: 'pointer' }}>+</button>}
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Aantal</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Prijs (p/u)</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Verwachte Duur</th>
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
                                            <Trash2 size={11} />
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
                                            value={newDelivery.name}
                                            onChange={e => setNewDelivery({ ...newDelivery, name: e.target.value })}
                                            autoFocus
                                        />
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
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0rem' }}>
                        <TrendingUp size={16} /> Verbruik Levering (€{deliveryConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Subtotaal (aankoop)</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Voortgang</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Kost p/w</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Start Week</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionFromDelivery.map(c => {
                                const isCompleted = c.completed && c.effDuration > 0;
                                return (
                                    <tr key={c.id}>
                                        <td>{c.displayName}</td>
                                        <td style={{ textAlign: 'center' }}>€<EditableCell value={c.cost} type="number" onSave={val => updateItem('consumption', c.id, { cost: val })} /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span>{c.weeksSincePurchase} &nbsp;/&nbsp; </span>
                                                <EditableCell
                                                    value={c.effDuration ?? (c.estDuration || '---')}
                                                    type={c.effDuration ? 'number' : 'text'}
                                                    precision={0}
                                                    suffix=" w"
                                                    onSave={val => {
                                                        const isEmpty = val === '---' || val === '-' || val === '' || val === 0 || val === '0';
                                                        updateItem('consumption', c.id, {
                                                            effDuration: isEmpty ? null : parseFloat(val),
                                                            completed: !isEmpty
                                                        });
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
                <section style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0, marginBottom: '0rem' }}>
                        <TrendingUp size={16} /> Verbruik Stock (€{stockConsumptionTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Naam</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Subtotaal (aankoop)</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Voortgang</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Kost p/w</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Start Week</th>
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
                                                <span>{c.weeksSincePurchase} &nbsp;/&nbsp; </span>
                                                <EditableCell
                                                    value={c.effDuration ?? (c.estDuration || '---')}
                                                    type={c.effDuration ? 'number' : 'text'}
                                                    precision={0}
                                                    suffix=" w"
                                                    onSave={val => {
                                                        const isEmpty = val === '---' || val === '-' || val === '' || val === 0 || val === '0';
                                                        updateItem('consumption', c.id, {
                                                            effDuration: isEmpty ? null : parseFloat(val),
                                                            completed: !isEmpty
                                                        });
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
                                            {isCurrent && (
                                                <>
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
                                                            <RotateCcw size={14} />
                                                        </button>
                                                    )}
                                                </>
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
            inventoryAtStart: PropTypes.array,
            inventoryAtEnd: PropTypes.array,
        }).isRequired,
    }).isRequired,
    
};

export default Dashboard;
