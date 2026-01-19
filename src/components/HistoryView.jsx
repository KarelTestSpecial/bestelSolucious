import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Download } from 'lucide-react';
import { groupDataByWeek } from '../utils/historyUtils';
import HistoryWeeklyCard from './HistoryWeeklyCard';

const ITEMS_PER_PAGE = 10; // Aantal weken per pagina

const HistoryView = () => {
    const { activeData } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);

    const today = new Date();
    const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3));

    const [startDate, setStartDate] = useState(
        localStorage.getItem('historyStartDate') || threeMonthsAgo.toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        localStorage.getItem('historyEndDate') || today.toISOString().split('T')[0]
    );

    useEffect(() => {
        localStorage.setItem('historyStartDate', startDate);
        localStorage.setItem('historyEndDate', endDate);
    }, [startDate, endDate]);

    // Filter en pagineer de data lokaal
    const paginatedData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Zorg ervoor dat de einddatum inclusief is

        const filterByDate = (item) => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= start && itemDate <= end;
        };

        const filtered = {
            orders: activeData.orders.filter(filterByDate),
            deliveries: activeData.deliveries.filter(filterByDate),
            verbruik: activeData.consumption.filter(filterByDate),
        };

        const groupedByWeek = groupDataByWeek(filtered);
        const sortedWeeks = Object.entries(groupedByWeek).sort(([a], [b]) => b.localeCompare(a));

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        const paginatedWeeks = sortedWeeks.slice(startIndex, endIndex);

        return {
            weeks: paginatedWeeks,
            totalPages: Math.ceil(sortedWeeks.length / ITEMS_PER_PAGE),
        };
    }, [activeData, currentPage, startDate, endDate]);

    const handleDownload = () => {
        const allItems = [
            ...activeData.orders.map(item => ({ ...item, type: 'Bestelling' })),
            ...activeData.deliveries.map(item => ({ ...item, type: 'Levering' })),
            ...activeData.consumption.map(item => ({ ...item, type: 'Verbruik' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const headers = ["Type", "Datum", "Week", "Product", "Details", "Totaal"];
        
        const rows = allItems.map(item => {
            const date = new Date(item.createdAt).toLocaleDateString('nl-BE');
            let details = '';
            let total = '';
            
            if (item.type === 'Bestelling' || item.type === 'Levering') {
                details = `${item.qty} x €${(item.price || 0).toFixed(2)}`;
                total = `€${(item.qty * (item.price || 0)).toFixed(2)}`;
            } else if (item.type === 'Verbruik') {
                details = `Kost per week: €${(item.weeklyCost || 0).toFixed(2)}`;
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
                        <Calendar size={18} color="var(--text-muted)" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onWheel={(e) => e.target.blur()} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', colorScheme: 'dark' }} />
                        <span>-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} onWheel={(e) => e.target.blur()} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', colorScheme: 'dark' }} />
                    </div>
                    <div style={{ flexGrow: 1 }}></div>
                    <div className="glass-panel" style={{ padding: '0.5rem' }}>
                        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} />
                            Download (TSV)
                        </button>
                    </div>
                </div>
            </header>
            <div className="history-content">
                {
                    paginatedData.weeks.length > 0 ? (
                        paginatedData.weeks.map(([weekId, weekData]) => (
                            <HistoryWeeklyCard key={weekId} weekId={weekId} weekData={weekData} />
                        ))
                    ) : (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Geen gegevens gevonden voor de geselecteerde periode.
                        </div>
                    )
                }
            </div>
            <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Vorige</button>
                <span>Pagina {currentPage} van {paginatedData.totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(paginatedData.totalPages, p + 1))} disabled={currentPage >= paginatedData.totalPages}>Volgende</button>
            </footer>
        </div>
    );
};

export default HistoryView;
