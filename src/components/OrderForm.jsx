import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const OrderForm = ({ onClose }) => {
    const { addOrder, getCurrentWeekId } = useAppContext();
    
    // Helper om standaard datum te zetten (vandaag)
    const getToday = () => new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(getToday());
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        qty: 1,
        weekId: getCurrentWeekId()
    });

    // Update weekId wanneer datum verandert
    useEffect(() => {
        if (date) {
            setFormData(prev => ({ ...prev, weekId: getWeekIdFromDate(date) }));
        }
    }, [date]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.qty) return;

        // In a real app we'd map this to a Product ID
        const productId = crypto.randomUUID();

        addOrder({
            productId,
            name: formData.name, // Temporary: in real app products are separate
            price: parseFloat(formData.price),
            qty: parseInt(formData.qty),
            weekId: formData.weekId
        });

        onClose();
    };

    return createPortal(
        <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2>Nieuwe Bestelling</h2>
                    <button onClick={onClose} style={{ background: 'transparent', padding: '0.5rem' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>Product Naam</label>
                    <input
                        className="input-field"
                        placeholder="Bijv. Melk, Brood..."
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Prijs per eenheid</label>
                            <input
                                className="input-field"
                                type="number" step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Aantal</label>
                            <input
                                className="input-field"
                                type="number"
                                value={formData.qty}
                                onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <label>Leverdatum</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            className="input-field"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            Week: <strong>{formData.weekId}</strong>
                        </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        De bestelling wordt gekoppeld aan week {formData.weekId}.
                    </p>

                    <button type="submit" style={{ width: '100%', marginTop: '1.5rem' }}>Bestelling Toevoegen</button>
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
