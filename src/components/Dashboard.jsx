import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import OrderForm from './OrderForm';
import DeliveryForm from './DeliveryForm';
import ConsumptionForm from './ConsumptionForm';
import { WeeklyCard } from './WeeklyCard';

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
                            ↩️
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
                            ↪️
                        </button>
                    </div>

                    <button onClick={() => setActiveModal('order')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ➕ Nieuwe Bestelling
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
                    <WeeklyCard key={item.weekId} data={item} />
                ))}
            </div>

        </div>
    );
};

export default Dashboard;
