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
    const [modalWeekId, setModalWeekId] = useState(null);

    const handleOpenModal = (type, weekId = null) => {
        setActiveModal(type);
        setModalWeekId(weekId);
    };

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
            {activeModal === 'order' && <OrderForm onClose={() => setActiveModal(null)} />}
            {activeModal === 'delivery' && (
                <DeliveryForm 
                    onClose={() => setActiveModal(null)} 
                    initialWeekId={modalWeekId}
                />
            )}
            {activeModal === 'consumption' && <ConsumptionForm onClose={() => setActiveModal(null)} />}

            <div className="timeline-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {timeline.map((item, index) => (
                    <WeeklyCard 
                        key={item.weekId} 
                        data={item} 
                        onOpenModal={handleOpenModal}
                        isFirst={index === 0}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;

