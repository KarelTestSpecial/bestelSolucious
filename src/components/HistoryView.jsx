import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { getWeekIdsInRange } from '../utils/weekUtils';
import HistoryWeeklyCard from './HistoryWeeklyCard';
import DeliveryForm from './DeliveryForm';

const HistoryView = () => {
    const { activeData } = useAppContext();
    const { getStatsForWeek } = useWeeklyStats();
    const [currentPage, setCurrentPage] = useState(1);
    const [activeModal, setActiveModal] = useState(null);
    const itemsPerPage = 10;

    const today = new Date();
    const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3));

    const [startDate, setStartDate] = useState(
        localStorage.getItem('historyStartDate') || threeMonthsAgo.toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        localStorage.getItem('historyEndDate') || today.toISOString().split('T')[0]
    );

    // Save date changes to localStorage
    useEffect(() => {
        localStorage.setItem('historyStartDate', startDate);
        localStorage.setItem('historyEndDate', endDate);
    }, [startDate, endDate]);

    const weekIds = useMemo(() => {
        if (!startDate || !endDate) return [];
        return getWeekIdsInRange(startDate, endDate);
    }, [startDate, endDate]);

    const paginatedWeeks = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return weekIds.slice(start, start + itemsPerPage);
    }, [weekIds, currentPage]);

    const totalPages = Math.ceil(weekIds.length / itemsPerPage);

    const handleDownload = () => {
        // Logic for download remains similar but could be updated to use processed stats
        // For now keeping it based on activeData for simplicity or refactoring later
        const allItems = [
            ...activeData.orders.map(item => ({ ...item, type: 'Bestelling' })),
            ...activeData.deliveries.map(item => ({ ...item, type: 'Levering' })),
            ...activeData.consumption.map(item => ({ ...item, type: 'Verbruik', weekId: item.startDate }))
        ].filter(item => {
            const date = new Date(item.createdAt);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const headers = ["Type", "Datum", "Week", "Product", "Details", "Totaal"];
        
        const rows = allItems.map(item => {
            const date = new Date(item.createdAt).toLocaleDateString('nl-BE');
            let details = '';
            let total = '';
            
            if (item.type === 'Bestelling' || item.type === 'Levering') {
                details = `${item.qty} x €${(item.price || 0).toFixed(2)}`;
                total = `€${(item.qty * (item.price || 0)).toFixed(2)}`;
            } else if (item.type === 'Verbruik') {
                details = `Kost per week: €${(item.cost / (item.effDuration || item.estDuration || 1)).toFixed(2)}`;
                total = `€${(item.cost || 0).toFixed(2)}`;
            }
            
            return [item.type, date, item.weekId, item.name, details, total];
        });

        const tsvContent = [
            headers.join('\t'),
            ...rows.map(row => row.join('\t'))
        ].join('\n');

        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `historiek_${startDate}_tot_${endDate}.tsv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="history-view">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Historiek & Archief</h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '18px' }}>📅</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onWheel={(e) => e.target.blur()} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', colorScheme: 'dark' }} />
                        <span>-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} onWheel={(e) => e.target.blur()} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', colorScheme: 'dark' }} />
                    </div>
                    <div style={{ flexGrow: 1 }}></div>
                    <div className="glass-panel" style={{ padding: '0.5rem' }}>
                        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '18px' }}>📥</span>
                            Download (TSV)
                        </button>
                    </div>
                </div>
            </header>
            
            {activeModal === 'delivery' && <DeliveryForm onClose={() => setActiveModal(null)} />}

            <div className="history-content">
                {
                    paginatedWeeks.length > 0 ? (
                        paginatedWeeks.map(weekId => {
                            const stats = getStatsForWeek(weekId);
                            // Transform stats to the format expected by HistoryWeeklyCard
                            const weekData = {
                                orders: stats.orders,
                                deliveries: stats.deliveries,
                                verbruik: stats.consumptionInWeek,
                                totals: {
                                    orders: stats.orderTotal,
                                    deliveries: stats.deliveryTotal,
                                    verbruik: stats.totalConsumptionCost,
                                    grandTotal: stats.totalConsumptionCost
                                }
                            };
                            return <HistoryWeeklyCard 
                                key={weekId} 
                                weekId={weekId} 
                                weekData={weekData} 
                                onOpenModal={setActiveModal}
                            />;
                        })
                    ) : (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Geen gegevens gevonden voor de geselecteerde periode.
                        </div>
                    )
                }
            </div>
            <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Vorige</button>
                <span>Pagina {currentPage} van {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Volgende</button>
            </footer>
        </div>
    );
};


export default HistoryView;
