import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';

const DataManager = () => {
    const { exportData, importData, activeData, addBatchOrders, clearDatabase } = useAppContext();
    const [batchText, setBatchText] = useState('');
    
    const getToday = () => new Date().toISOString().split('T')[0];
    const [targetDate, setTargetDate] = useState(getToday());
    const [targetWeek, setTargetWeek] = useState(getWeekIdFromDate(getToday()));

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if(targetDate) {
            setTargetWeek(getWeekIdFromDate(targetDate));
        }
    }, [targetDate]);

    const handleBatchImport = async () => {
        if (!batchText.trim()) return;
        setIsProcessing(true);

        try {
            const lines = batchText.split('\n');
            const ordersToImport = [];

            lines.forEach(line => {
                if (!line.trim()) return;
                
                let parts = line.split(';');
                if (parts.length < 2) parts = line.split('\t');
                if (parts.length < 2) parts = line.split(',');

                const name = parts[0]?.trim();
                if (!name) return;

                const qtyStr = parts[1]?.trim().replace(',', '.');
                const priceStr = parts[2]?.trim().replace('€', '').replace(',', '.');

                const qty = parseFloat(qtyStr);
                const price = parseFloat(priceStr);

                if (name && !isNaN(qty)) {
                    ordersToImport.push({
                        name,
                        qty,
                        price: isNaN(price) ? 0 : price,
                    });
                }
            });

            if (ordersToImport.length === 0) {
                alert("Geen geldige regels gevonden. Controleer het formaat.");
                setIsProcessing(false);
                return;
            }

            if (confirm(`${ordersToImport.length} bestellingen importeren voor week ${targetWeek}?`)) {
                await addBatchOrders(targetWeek, ordersToImport);
                setBatchText('');
                alert("Bestellingen succesvol geïmporteerd!");
            }

        } catch (error) {
            console.error(error);
            alert("Er is iets misgegaan tijdens het importeren.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => setBatchText(e.target.result);
        reader.readAsText(file);
        e.target.value = null;
    };

    const handleJSONUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (confirm("Wil je deze backup herstellen?\n\n- Bestaande data wordt gewist.\n- Backup data wordt ingeladen.")) {
                    const success = await importData(jsonData);
                    if (success) alert("Data succesvol hersteld!");
                }
            } catch (err) {
                alert("Ongeldig JSON bestand: " + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const clearData = async () => {
        if (confirm("Weet je zeker dat je alle data wilt wissen? Dit kan niet ongedaan worden gemaakt.")) {
            const success = await clearDatabase();
            if (success) alert("Database is nu leeg.");
        }
    };

    return (
        <div className="data-manager animate-slide-up">
            <header style={{ marginBottom: '2rem' }}>
                <h1>⚙️ Data Beheer</h1>
                <p className="stat-label">Beheer je gegevens, importeer bestellingen en maak backups.</p>
            </header>

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                
                <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>📄 Batch Import Bestellingen</h2>
                        <span className="badge badge-warning">Week {targetWeek}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem' }}>
                        <div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>
                                    1. Selecteer Leverdatum
                                </label>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    value={targetDate} 
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    onFocus={(e) => e.target.showPicker?.()}
                                    onClick={(e) => e.target.showPicker?.()}
                                />
                            </div>
                            
                            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '16px' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    💡 Instructies
                                </h4>
                                <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>Kopieer direct vanuit Excel/Google Sheets.</li>
                                    <li>Kolommen: <strong>Naam</strong> | <strong>Aantal</strong> | <strong>Prijs</strong></li>
                                    <li>Gebruik puntkomma (;) of tab als scheidingsteken.</li>
                                </ul>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginTop: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    Halfvolle Melk; 6; 0,95<br/>
                                    Brood Bruin; 2; 2,20
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)' }}>
                                2. Plak data of upload TSV/CSV
                            </label>
                            <textarea
                                className="input-field"
                                style={{ flex: 1, minHeight: '250px', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1.5rem' }}
                                value={batchText}
                                onChange={(e) => setBatchText(e.target.value)}
                                placeholder="Plak hier je data..."
                            />
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="file"
                                        accept=".csv,.txt,.tsv"
                                        onChange={handleFileUpload}
                                        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 2 }}
                                    />
                                    <button className="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                        📂 Bestand
                                    </button>
                                </div>
                                <button 
                                    onClick={handleBatchImport} 
                                    disabled={!batchText.trim() || isProcessing}
                                    style={{ flex: 2, justifyContent: 'center' }}
                                >
                                    {isProcessing ? 'Verwerken...' : '🚀 Importeer Alles'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem' }}>📊 Systeem Status</h3>
                    <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 0 }}>
                        <div className="stat-card glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{activeData.orders.length}</div>
                            <div className="stat-label">Bestellingen</div>
                        </div>
                        <div className="stat-card glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{activeData.deliveries.length}</div>
                            <div className="stat-label">Leveringen</div>
                        </div>
                    </div>
                </section>

                <section className="glass-panel">
                    <h3 style={{ marginBottom: '1.5rem' }}>📥 Backup & Herstel</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button onClick={exportData} style={{ width: '100%', justifyContent: 'center' }}>
                            📥 Download Backup (JSON)
                        </button>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleJSONUpload}
                                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%', zIndex: 2 }}
                            />
                            <button className="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                📤 Herstel Backup
                            </button>
                        </div>
                    </div>
                </section>

                <section className="glass-panel" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h3 style={{ color: 'var(--danger-color)', marginBottom: '1.5rem' }}>⚠️ Gevaarlijke Zone</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Dit wist alle data permanent uit je cloud-database.
                    </p>
                    <button onClick={clearData} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', width: '100%', justifyContent: 'center' }}>
                        🗑️ Reset Database
                    </button>
                </section>
            </div>
        </div>
    );
};

export default DataManager;

