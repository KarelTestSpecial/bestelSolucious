import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import OrderForm from './OrderForm';
import DeliveryForm from './DeliveryForm';
import ConsumptionForm from './ConsumptionForm';
import { WeeklyCard } from './WeeklyCard';

const Dashboard = () => {
    const { getTimeline } = useWeeklyStats();
    const { undo, canUndo, isLoading } = useAppContext();
    const [activeModal, setActiveModal] = useState(null);

    const timeline = getTimeline();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="stat-label">Laden...</div>
            </div>
        );
    }

    return (
        <div className="dashboard animate-slide-up">
            <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button 
                        onClick={undo} 
                        disabled={!canUndo}
                        className="secondary"
                        style={{ padding: '0.6rem 1rem', opacity: canUndo ? 1 : 0.5 }}
                        title="Ongedaan maken"
                    >
                        ↩️ Undo
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => setActiveModal('order')}>
                        ➕ Nieuwe Bestelling
                    </button>
                    <button onClick={() => setActiveModal('delivery')} style={{ background: 'linear-gradient(135deg, var(--accent-secondary), #059669)' }}>
                        🚚 Levering
                    </button>
                    <button onClick={() => setActiveModal('consumption')} className="secondary" style={{ fontSize: '0.8rem' }}>
                        + Ad-hoc
                    </button>
                </div>
            </header>

            {activeModal === 'order' && <OrderForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'delivery' && <DeliveryForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'consumption' && <ConsumptionForm onClose={() => setActiveModal(null)} />}

            <div className="timeline-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {timeline.map((item) => (
                    <WeeklyCard key={item.weekId} data={item} />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;

