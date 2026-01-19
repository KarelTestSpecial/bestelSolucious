import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Download } from 'lucide-react';
import { groupDataByWeek } from '../utils/historyUtils';
import HistoryWeeklyCard from './HistoryWeeklyCard';

const HistoryView = () => {
    const [data, setData] = useState({ orders: [], deliveries: [], verbruik: [] });
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

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

    useEffect(() => {
        const fetchAllData = async () => {
            const params = new URLSearchParams({
                page: currentPage,
                startDate,
                endDate,
                limit: 50
            });

            try {
                const [ordersRes, deliveriesRes, verbruikRes] = await Promise.all([
                    fetch(`http://localhost:3000/api/history/orders?${params.toString()}`),
                    fetch(`http://localhost:3000/api/history/deliveries?${params.toString()}`),
                    fetch(`http://localhost:3000/api/history/verbruik?${params.toString()}`)
                ]);

                const ordersResult = await ordersRes.json();
                const deliveriesResult = await deliveriesRes.json();
                const verbruikResult = await verbruikRes.json();

                setData({
                    orders: ordersResult.items || [],
                    deliveries: deliveriesResult.items || [],
                    verbruik: verbruikResult.items || []
                });
                
                // Use pagination from the first successful response
                setPagination(ordersResult.pagination || {});
            } catch (error) {
                console.error("Failed to fetch history:", error);
                setData({ orders: [], deliveries: [], verbruik: [] });
                setPagination({});
            }
        };

        if (startDate && endDate) {
            fetchAllData();
        }
    }, [currentPage, startDate, endDate]);

    const handleDownload = () => {
        // Combine all data types for download
        const allItems = [
            ...data.orders.map(item => ({ ...item, type: 'Bestelling' })),
            ...data.deliveries.map(item => ({ ...item, type: 'Levering' })),
            ...data.verbruik.map(item => ({ ...item, type: 'Verbruik' }))
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
                    (data.orders.length > 0 || data.deliveries.length > 0 || data.verbruik.length > 0) ? (
                        Object.entries(groupDataByWeek(data)).map(([weekId, weekData]) => (
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
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1}>Vorige</button>
                <span>Pagina {pagination.page || 1} van {pagination.totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= (pagination.totalPages || 1)}>Volgende</button>
            </footer>
        </div>
    );
};

export default HistoryView;
