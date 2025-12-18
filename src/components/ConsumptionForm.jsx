import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { X } from 'lucide-react';

const ConsumptionForm = ({ onClose }) => {
    const { registerConsumption, getCurrentWeekId } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        cost: '',
        qty: 1,
        weekId: getCurrentWeekId(),
        source: 'Schenking/Stock'
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        registerConsumption({
            sourceId: crypto.randomUUID(), // Ad-hoc has its own unique ID
            sourceType: 'adhoc',
            name: formData.name,
            qty: parseInt(formData.qty),
            cost: parseFloat(formData.cost),
            startDate: formData.weekId,
            estDuration: 1, // Ad-hoc is usually for the same week
            effDuration: 1,
            completed: true
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
                    <h2>Ad-hoc Verbruik Registreren</h2>
                    <button onClick={onClose} style={{ background: 'transparent', padding: '0.5rem' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>Product / Bron</label>
                    <input
                        className="input-field" placeholder="Bijv. Gift van buren, Stock..."
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Totale Kostprijs</label>
                            <input
                                className="input-field" type="number" step="0.01"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Aantal</label>
                            <input
                                className="input-field" type="number"
                                value={formData.qty}
                                onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <label>Week van Verbruik</label>
                    <input
                        className="input-field"
                        value={formData.weekId}
                        onChange={e => setFormData({ ...formData, weekId: e.target.value })}
                        required
                    />

                    <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>Registreer Verbruik</button>
                </form>
            </div>
        </div>
    );
};

export default ConsumptionForm;
