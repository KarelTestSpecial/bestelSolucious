import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { getDateOfTuesday, getWeekIdFromDate, getISODateOfTuesday } from '../utils/weekUtils';
import { Plus, ShoppingCart, Truck, TrendingUp, Trash2, RotateCcw, Undo2, Redo2 } from 'lucide-react';
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
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem', marginRight: '0.5rem' }}>
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
                            <Undo2 size={18} />
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
                            <Redo2 size={18} />
                        </button>
                    </div>

                    <button onClick={() => setActiveModal('order')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Nieuwe Bestelling
                    </button>
                    <button onClick={() => setActiveModal('delivery')} className="badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Levering Bevestigen
                    </button>
                </div>
            </header>

            {activeModal === 'order' && <OrderForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'delivery' && <DeliveryForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'consumption' && <ConsumptionForm onClose={() => setActiveModal(null)} />}

            <div className="timeline-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

    return (
        <span onClick={handleStartEdit} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--accent-color)' }}>
            {type === 'number' && typeof value === 'number' ? value.toFixed(precision) : value}{suffix}
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

const WeeklyCard = ({ data, onAddAdhoc }) => {
    const { updateItem, deleteItem } = useAppContext();
    const { weekId, offset, stats } = data;
    const isCurrent = offset === 0;

    return (
        <div className={`glass-panel ${isCurrent ? 'current-week' : ''}`} style={{ padding: '1rem', borderLeft: isCurrent ? '4px solid var(--accent-color)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>
                    Levering: {getDateOfTuesday(weekId)} &nbsp; <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({weekId})</span>
                    {isCurrent && <span className="badge badge-success" style={{ marginLeft: '1rem' }}>HUIDIGE WEEK</span>}
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Geleverd: <span style={{ color: 'var(--success-color)' }}>€{stats.deliveryTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Totaal Verbruik: <span style={{ color: 'var(--accent-color)' }}>€{stats.totalConsumptionCost.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0rem' }}>
                {/* 1. Bestellingen */}
                <section>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0rem' }}>
                        <ShoppingCart size={16} /> Bestellingen (€{stats.orderTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: 'auto' }}>Naam</th>
                                <th style={{ width: '80px' }}>Aantal</th>
                                <th style={{ width: '120px' }}>Prijs (p/u)</th>
                                <th style={{ width: '130px' }}>Verwachte Duur</th>
                                <th style={{ width: '110px' }}>Subtotaal</th>
                                <th style={{ width: '140px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.orders.length > 0 ? stats.orders.map(o => (
                                <tr key={o.id}>
                                    <td><EditableCell value={o.name} onSave={val => updateItem('order', o.id, { name: val })} /></td>
                                    <td><EditableCell value={o.qty} type="number" precision={0} onSave={val => updateItem('order', o.id, { qty: val })} /></td>
                                    <td>€<EditableCell value={o.price} type="number" onSave={val => updateItem('order', o.id, { price: val })} /></td>
                                    <td><EditableCell value={o.estDuration} type="number" precision={0} suffix=" w" onSave={val => updateItem('order', o.id, { estDuration: val })} /></td>
                                    <td><strong>€{(o.qty * o.price).toFixed(2)}</strong></td>
                                    <td>
                                        <button 
                                            onClick={() => deleteItem('order', o.id)}
                                            style={{ background: 'transparent', color: 'var(--danger-color)', padding: '4px' }}
                                            title="Verwijder bestelling"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="6" className="empty-text">Geen bestellingen</td></tr>}
                        </tbody>
                    </table>
                </section>
                
                {/* 2. Effectieve Leveringen */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', margin: 0 }}>
                            <Truck size={16} /> Effectieve Leveringen (€{stats.deliveryTotal.toFixed(2)})
                        </h4>
                        {isCurrent && <button onClick={onAddAdhoc} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>+ Ad-hoc / Stock Toevoegen</button>}
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: 'auto' }}>Naam</th>
                                <th style={{ width: '80px' }}>Aantal</th>
                                <th style={{ width: '120px' }}>Prijs (p/u)</th>
                                <th style={{ width: '130px' }}>Verwachte Duur</th>
                                <th style={{ width: '110px' }}>Subtotaal</th>
                                <th style={{ width: '140px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.deliveries.length > 0 ? stats.deliveries.map(d => (
                                <tr key={d.id}>
                                    <td><EditableCell value={d.name || 'Geleverd Item'} onSave={val => updateItem('delivery', d.id, { name: val })} /></td>
                                    <td><EditableCell value={d.qty} type="number" precision={0} onSave={val => updateItem('delivery', d.id, { qty: val })} /></td>
                                    <td>€<EditableCell value={d.price} type="number" onSave={val => updateItem('delivery', d.id, { price: val })} /></td>
                                    <td><EditableCell value={d.estDuration} type="number" precision={0} suffix=" w" onSave={val => updateItem('delivery', d.id, { estDuration: val })} /></td>
                                    <td><strong>€{(d.qty * d.price).toFixed(2)}</strong></td>
                                    <td>
                                        <button 
                                            onClick={() => deleteItem('delivery', d.id)}
                                            style={{ background: 'transparent', color: 'var(--danger-color)', padding: '4px' }}
                                            title="Verwijder levering"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="6" className="empty-text">Geen leveringen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3. In Effectief Verbruik */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0 }}>
                            <TrendingUp size={16} /> Effectief Verbruik
                        </h4>
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: 'auto' }}>Naam</th>
                                <th style={{ width: '120px' }}>Subtotaal (aankoop)</th>
                                <th style={{ width: '130px' }}>Eff. Duur</th>
                                <th style={{ width: '130px' }}>Voortgang</th>
                                <th style={{ width: '110px' }}>Kost p/w</th>
                                <th style={{ width: '140px' }}>Start Week</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.consumptionInWeek.length > 0 ? stats.consumptionInWeek.map(c => {
                                const isCompleted = c.completed && c.effDuration > 0;
                                const isCarriedOver = c.weeksSincePurchase > 1;
                                return (
                                <tr
                                    key={c.id}
                                    style={{
                                        backgroundColor: isCarriedOver ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                        borderTop: isCarriedOver ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                    }}
                                >
                                    <td>{c.displayName}</td>
                                    <td>
                                        €<EditableCell value={c.cost} type="number" onSave={val => updateItem('consumption', c.id, { cost: val })} />
                                    </td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                                        {!isCompleted ? (
                                            <button
                                                onClick={() => updateItem('consumption', c.id, { completed: true, effDuration: c.duration })}
                                                className="badge badge-danger"
                                                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem' }}
                                            >
                                                OP
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateItem('consumption', c.id, { completed: false, effDuration: null })}
                                                className="badge badge-warning"
                                                title="Heropen item (niet op)"
                                                style={{ border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {c.weeksSincePurchase}/{c.duration} w
                                        </span>
                                    </td>
                                    <td>
                                        <strong>€{c.weeklyCost.toFixed(2)}</strong>
                                    </td>
                                    <td>
                                        <EditableCell 
                                            value={c.startDate} 
                                            type="date"
                                            onSave={val => updateItem('consumption', c.id, { startDate: val })} 
                                        />
                                    </td>
                                </tr>
                            )}) : <tr><td colSpan="6" className="empty-text">Geen verbruik deze week</td></tr>}
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
    onAddAdhoc: PropTypes.func.isRequired,
};

export default Dashboard;
