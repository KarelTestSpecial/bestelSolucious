import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Search } from 'lucide-react';

const OrderForm = ({ onClose }) => {
    const { addOrder, activeData, getCurrentWeekId } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        qty: 1,
        weekId: getCurrentWeekId()
    });

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

    return (
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

                    <label>Voor Week</label>
                    <input
                        className="input-field"
                        value={formData.weekId}
                        onChange={e => setFormData({ ...formData, weekId: e.target.value })}
                        required
                    />

                    <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>Bestelling Toevoegen</button>
                </form>
            </div>
        </div>
    );
};

export default OrderForm;
