import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { useProductList } from '../hooks/useProductList';
import PropTypes from 'prop-types';

const ConsumptionForm = ({ onClose }) => {
    const { addConsumption, getCurrentWeekId } = useAppContext();
    const { getProductList } = useProductList();
    
    // Haal de lijst van bekende producten op
    const products = useMemo(() => getProductList(), []);

    const [formData, setFormData] = useState({
        name: '',
        qty: 1,
        cost: '',
        estDuration: 1,
        startDate: getCurrentWeekId()
    });

    // Automatisch prijs en duur invullen bij bekende productnaam
    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => {
            const newData = { ...prev, name };
            const match = products.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (match) {
                // Bereken totale cost op basis van prijs p/u en het huidige aantal
                newData.cost = (match.price * newData.qty).toFixed(2);
                newData.estDuration = match.estDuration.toString();
            }
            return newData;
        });
    };

    // Update de totale kostprijs als het aantal verandert (voor bekende producten)
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
        <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2>Verbruik uit Stock</h2>
                    <button onClick={onClose} style={{ background: 'transparent', padding: '0.5rem' }}><span style={{ fontSize: '20px' }}>❌</span></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>Product Naam</label>
                    <input
                        className="input-field"
                        placeholder="Bijv. Melk (uit voorraad)..."
                        list="consumption-suggestions"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                    />
                    <datalist id="consumption-suggestions">
                        {products.map((p, i) => (
                            <option key={i} value={p.name} />
                        ))}
                    </datalist>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Aantal</label>
                            <input
                                className="input-field"
                                type="number" step="0.1"
                                value={formData.qty}
                                onChange={handleQtyChange}
                                required
                            />
                        </div>
                        <div>
                            <label>Totale Waarde (€)</label>
                            <input
                                className="input-field"
                                type="number" step="0.01"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Verwachte Duur (w)</label>
                            <input
                                className="input-field"
                                type="number" min="1"
                                value={formData.estDuration}
                                onChange={e => setFormData({ ...formData, estDuration: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Start Week</label>
                            <input
                                className="input-field"
                                value={formData.startDate}
                                disabled
                                style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>

                    <button type="submit" style={{ width: '100%', marginTop: '1.5rem' }}>Verbruik Registreren</button>
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
