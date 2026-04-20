import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';
import { useProductList } from '../hooks/useProductList';
import PropTypes from 'prop-types';

const OrderForm = ({ onClose }) => {
    const { addOrder, getCurrentWeekId } = useAppContext();
    const { getProductList } = useProductList();
    
    const products = useMemo(() => getProductList(), []);
    
    const getToday = () => new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(getToday());
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        qty: 1,
        estDuration: 1,
        weekId: getCurrentWeekId()
    });

    useEffect(() => {
        if (date) {
            setFormData(prev => ({ ...prev, weekId: getWeekIdFromDate(date) }));
        }
    }, [date]);

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => {
            const newData = { ...prev, name };
            const match = products.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (match) {
                newData.price = match.price.toString();
                newData.estDuration = match.estDuration.toString();
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.qty) return;

        addOrder({
            name: formData.name,
            price: parseFloat(formData.price),
            qty: parseInt(formData.qty),
            estDuration: parseFloat(formData.estDuration),
            weekId: formData.weekId
        });

        onClose();
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>🛒 Nieuwe Bestelling</h2>
                    <button onClick={onClose} className="secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}>✕</button>
                </header>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Product Naam</label>
                        <input
                            className="input-field"
                            placeholder="Zoek of typ product..."
                            list="product-suggestions"
                            value={formData.name}
                            onChange={handleNameChange}
                            required
                            autoFocus
                        />
                        <datalist id="product-suggestions">
                            {products.map((p, i) => (
                                <option key={i} value={p.name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: 0 }}>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Prijs (€)</label>
                            <input
                                className="input-field"
                                type="number" step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Aantal</label>
                            <input
                                className="input-field"
                                type="number"
                                value={formData.qty}
                                onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: 0 }}>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Duur (weken)</label>
                            <input
                                className="input-field"
                                type="number" min="1"
                                value={formData.estDuration}
                                onChange={e => setFormData({ ...formData, estDuration: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Leverdatum</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    className="input-field"
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    onFocus={(e) => e.target.showPicker?.()}
                                    onClick={(e) => e.target.showPicker?.()}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-warning">Target: {formData.weekId}</span>
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '1.2rem', marginTop: '1rem', fontSize: '1.1rem' }}>
                        🚀 Bestelling Bevestigen
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};


OrderForm.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default OrderForm;
