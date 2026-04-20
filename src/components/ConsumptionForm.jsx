import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { useProductList } from '../hooks/useProductList';
import PropTypes from 'prop-types';

const ConsumptionForm = ({ onClose }) => {
    const { addConsumption, getCurrentWeekId } = useAppContext();
    const { getProductList } = useProductList();
    
    const products = useMemo(() => getProductList(), []);

    const [formData, setFormData] = useState({
        name: '',
        qty: 1,
        cost: '',
        estDuration: 1,
        startDate: getCurrentWeekId()
    });

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => {
            const newData = { ...prev, name };
            const match = products.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (match) {
                newData.cost = (match.price * newData.qty).toFixed(2);
                newData.estDuration = match.estDuration.toString();
            }
            return newData;
        });
    };

    const handleQtyChange = (e) => {
        const qty = parseFloat(e.target.value || 0);
        setFormData(prev => {
            const newData = { ...prev, qty };
            const match = products.find(p => p.name.toLowerCase() === prev.name.toLowerCase());
            if (match) {
                newData.cost = (match.price * qty).toFixed(2);
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.cost || !formData.qty) return;

        addConsumption({
            ...formData,
            sourceId: 'manual-stock',
            sourceType: 'stock',
            cost: parseFloat(formData.cost),
            qty: parseFloat(formData.qty),
            estDuration: parseFloat(formData.estDuration),
            completed: false
        });

        onClose();
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>📦 Ad-hoc / Stock Toevoegen</h2>
                    <button onClick={onClose} className="secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}>✕</button>
                </header>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Product Naam</label>
                        <input
                            className="input-field"
                            placeholder="Bijv. Melk (uit voorraad)..."
                            list="consumption-suggestions"
                            value={formData.name}
                            onChange={handleNameChange}
                            required
                            autoFocus
                        />
                        <datalist id="consumption-suggestions">
                            {products.map((p, i) => (
                                <option key={i} value={p.name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: 0 }}>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Aantal</label>
                            <input
                                className="input-field"
                                type="number" step="0.1"
                                value={formData.qty}
                                onChange={handleQtyChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Totale Waarde (€)</label>
                            <input
                                className="input-field"
                                type="number" step="0.01"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: 0 }}>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Verwachte Duur (w)</label>
                            <input
                                className="input-field"
                                type="number" min="1"
                                value={formData.estDuration}
                                onChange={e => setFormData({ ...formData, estDuration: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Start Week</label>
                            <input
                                className="input-field"
                                value={formData.startDate}
                                disabled
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '1.2rem', marginTop: '1rem', fontSize: '1.1rem' }}>
                        📥 Verbruik Registreren
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};


ConsumptionForm.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default ConsumptionForm;
