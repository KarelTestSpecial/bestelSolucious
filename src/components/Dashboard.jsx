import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { getDateOfTuesday } from '../utils/weekUtils';
import { Plus, ShoppingCart, Truck, TrendingUp } from 'lucide-react';
import OrderForm from './OrderForm';
import DeliveryForm from './DeliveryForm';
import ConsumptionForm from './ConsumptionForm';
import PropTypes from 'prop-types';

const Dashboard = () => {
    const { getTimeline } = useWeeklyStats();
    const [activeModal, setActiveModal] = useState(null);

    const timeline = getTimeline();

    return (
        <div className="dashboard">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Wekelijks Gedetailleerd Overzicht</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
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

            <div className="timeline-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {timeline.map((item) => (
                    <WeeklyCard key={item.weekId} data={item} onAddAdhoc={() => setActiveModal('consumption')} />
                ))}
            </div>
        </div>
    );
};

const EditableCell = ({ value, onSave, type = 'text', suffix = '' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleBlur = () => {
        setIsEditing(false);
        onSave(type === 'number' ? parseFloat(tempValue) : tempValue);
    };

    if (isEditing) {
        return (
            <input
                className="input-field" autoFocus
                style={{ margin: 0, padding: '2px 5px', fontSize: '0.9rem', width: '80px' }}
                type={type} value={tempValue}
                onChange={e => setTempValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={e => e.key === 'Enter' && handleBlur()}
            />
        );
    }

    return (
        <span onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', borderBottom: '1px dashed var(--accent-color)' }}>
            {type === 'number' && typeof value === 'number' ? value.toFixed(2) : value}{suffix}
        </span>
    );
};

EditableCell.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onSave: PropTypes.func.isRequired,
    type: PropTypes.string,
    suffix: PropTypes.string,
};

const WeeklyCard = ({ data, onAddAdhoc }) => {
    const { updateItem } = useAppContext();
    const { weekId, offset, stats } = data;
    const isCurrent = offset === 0;

    return (
        <div className={`glass-panel ${isCurrent ? 'current-week' : ''}`} style={{ padding: '1.5rem', borderLeft: isCurrent ? '4px solid var(--accent-color)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <h2 style={{ margin: 0 }}>
                    Week {weekId} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Levering: {getDateOfTuesday(weekId)})</span>
                    {isCurrent && <span className="badge badge-success" style={{ marginLeft: '1rem' }}>HUIDIGE WEEK</span>}
                </h2>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Totaal Verbruik: <span style={{ color: 'var(--accent-color)' }}>€{stats.totalConsumptionCost.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 1. Bestellingen */}
                <section>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        <ShoppingCart size={16} /> Bestellingen (€{stats.orderTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Aantal</th>
                                <th>Prijs (p/u)</th>
                                <th>Subtotaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.orders.length > 0 ? stats.orders.map(o => (
                                <tr key={o.id}>
                                    <td><EditableCell value={o.name} onSave={val => updateItem('order', o.id, { name: val })} /></td>
                                    <td><EditableCell value={o.qty} type="number" onSave={val => updateItem('order', o.id, { qty: val })} /></td>
                                    <td>€<EditableCell value={o.price} type="number" onSave={val => updateItem('order', o.id, { price: val })} /></td>
                                    <td><strong>€{(o.qty * o.price).toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="4" className="empty-text">Geen bestellingen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 2. Leveringen */}
                <section>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', marginBottom: '0.5rem' }}>
                        <Truck size={16} /> Leveringen (€{stats.deliveryTotal.toFixed(2)})
                    </h4>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Aantal</th>
                                <th>Prijs (p/u)</th>
                                <th>Subtotaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.deliveries.length > 0 ? stats.deliveries.map(d => (
                                <tr key={d.id}>
                                    <td><EditableCell value={d.name || 'Geleverd Item'} onSave={val => updateItem('delivery', d.id, { name: val })} /></td>
                                    <td><EditableCell value={d.qty} type="number" onSave={val => updateItem('delivery', d.id, { qty: val })} /></td>
                                    <td>€<EditableCell value={d.price} type="number" onSave={val => updateItem('delivery', d.id, { price: val })} /></td>
                                    <td><strong>€{(d.qty * d.price).toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="4" className="empty-text">Geen leveringen</td></tr>}
                        </tbody>
                    </table>
                </section>

                {/* 3. In Verbruik & Ad-hoc */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', margin: 0 }}>
                            <TrendingUp size={16} /> Verbruik & Ad-hoc
                        </h4>
                        {isCurrent && <button onClick={onAddAdhoc} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>+ Ad-hoc Toevoegen</button>}
                    </div>
                    <table className="formal-table">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Herkomst</th>
                                <th>Totaal Kost</th>
                                <th>Gevraagd/Eff. Duur</th>
                                <th>Kost p/w</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.consumptionInWeek.length > 0 ? stats.consumptionInWeek.map(c => (
                                <tr key={c.id}>
                                    <td>{c.displayName}</td>
                                    <td>
                                        <span className={`badge ${c.sourceType === 'adhoc' ? 'badge-warning' : 'badge-success'}`}>
                                            {c.sourceType === 'delivery' ? 'Levering' : 'Ad-hoc / Gift'}
                                        </span>
                                    </td>
                                    <td>€<EditableCell value={c.cost} type="number" onSave={val => updateItem('consumption', c.id, { cost: val })} /></td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <EditableCell value={c.estDuration} type="number" onSave={val => updateItem('consumption', c.id, { estDuration: val })} />
                                        {" / "}
                                        <EditableCell
                                            value={c.effDuration ?? '-'}
                                            type={c.effDuration ? 'number' : 'text'}
                                            onSave={val => updateItem('consumption', c.id, { effDuration: val === '-' ? null : parseFloat(val), completed: val !== '-' })}
                                        /> w
                                        {!c.completed && (
                                            <button
                                                onClick={() => updateItem('consumption', c.id, { completed: true, effDuration: c.duration })}
                                                className="badge badge-danger"
                                                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem' }}
                                            >
                                                MELD OP
                                            </button>
                                        )}
                                    </td>
                                    <td><strong>€{c.weeklyCost.toFixed(2)}</strong></td>
                                </tr>
                            )) : <tr><td colSpan="5" className="empty-text">Geen verbruik deze week</td></tr>}
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
    onAddAdhoc: PropTypes.func.isRequired,
};

export default Dashboard;
