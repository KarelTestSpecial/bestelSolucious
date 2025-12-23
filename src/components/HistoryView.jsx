import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Download } from 'lucide-react';
import { groupDataByWeek } from '../utils/historyUtils';
import HistoryWeeklyCard from './HistoryWeeklyCard';

const HistoryView = () => {
    const [view, setView] = useState('deliveries');
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    const today = new Date();
    const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3));
    const [startDate, setStartDate] = useState(threeMonthsAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            const endpoint = `/api/history/${view}`;
            const params = new URLSearchParams({
                page: currentPage,
                startDate,
                endDate,
                limit: 10
            });

            try {
                const response = await fetch(`${endpoint}?${params.toString()}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();
                setData(result.items || []);
                setPagination(result.pagination || {});
            } catch (error) {
                console.error("Failed to fetch history:", error);
                setData([]);
                setPagination({});
            }
        };

        if (startDate && endDate) {
            fetchData();
        }
    }, [view, currentPage, startDate, endDate]);

    const handleDownload = () => {
        const headers = {
            orders: ["Datum", "Week", "Product", "Aantal", "Prijs", "Totaal"],
            deliveries: ["Datum", "Week", "Product", "Aantal", "Prijs", "Totaal"],
            verbruik: ["Datum", "Week", "Product", "Wekelijkse Kost", "Totaal Kost"]
        };

        const rows = data.map(item => {
            const date = new Date(item.createdAt).toLocaleDateString('nl-BE');
            switch(view) {
                case 'orders':
                case 'deliveries':
                    return [date, item.weekId, item.name, item.qty, item.price, item.qty * item.price];
                case 'verbruik':
                    return [date, item.weekId, item.name, item.weeklyCost, item.cost];
                default:
                    return [];
            }
        });

        const tsvContent = [
            headers[view].join('\t'),
            ...rows.map(row => row.join('\t'))
        ].join('\n');

        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `historiek_${view}_${startDate}_tot_${endDate}.tsv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="history-view">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Historiek & Archief</h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => { setView('deliveries'); setCurrentPage(1); }} className={view === 'deliveries' ? '' : 'badge-warning'} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Leveringen</button>
                        <button onClick={() => { setView('orders'); setCurrentPage(1); }} className={view === 'orders' ? '' : 'badge-warning'} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Bestellingen</button>
                        <button onClick={() => { setView('verbruik'); setCurrentPage(1); }} className={view === 'verbruik' ? '' : 'badge-warning'} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Effectief Verbruik</button>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} color="var(--text-muted)" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                        <span>-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
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
                    data.length > 0 ? (
                        Object.entries(groupDataByWeek(data)).map(([weekId, weekData]) => (
                            <HistoryWeeklyCard key={weekId} weekId={weekId} weekData={weekData} viewType={view} />
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
