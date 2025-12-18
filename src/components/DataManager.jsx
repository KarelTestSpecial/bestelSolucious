import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';
import { Download, Trash2, Database, FileText, Info } from 'lucide-react';

const DataManager = () => {
    const { exportData, importData, activeData, addBulkOrders, clearDatabase } = useAppContext();
    const [bulkText, setBulkText] = useState('');
    
    // Standaard datum: vandaag
    const getToday = () => new Date().toISOString().split('T')[0];
    const [targetDate, setTargetDate] = useState(getToday());
    const [targetWeek, setTargetWeek] = useState(getWeekIdFromDate(getToday()));

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if(targetDate) {
            setTargetWeek(getWeekIdFromDate(targetDate));
        }
    }, [targetDate]);

    const handleBulkImport = async () => {
        if (!bulkText.trim()) return;
        setIsProcessing(true);

        try {
            const lines = bulkText.split('\n');
            const ordersToImport = [];

            lines.forEach(line => {
                if (!line.trim()) return;
                
                // Probeer puntkomma of tab als separator
                let parts = line.split(';');
                if (parts.length < 2) parts = line.split('\t'); // Fallback naar TSV (excel copy-paste)
                if (parts.length < 2) parts = line.split(','); // Fallback naar CSV

                // Verwacht formaat: Naam ; Aantal ; Prijs (optioneel)
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
                        productId: crypto.randomUUID() // Genereer een ID voor de backend om te gebruiken
                    });
                }
            });

            if (ordersToImport.length === 0) {
                alert("Geen geldige regels gevonden. Controleer het formaat.");
                setIsProcessing(false);
                return;
            }

            if (confirm(`${ordersToImport.length} bestellingen importeren voor week ${targetWeek}?`)) {
                await addBulkOrders(targetWeek, ordersToImport);
                setBulkText('');
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
        reader.onload = (e) => setBulkText(e.target.result);
        reader.readAsText(file);
        
        // Reset input value om opnieuw laden van hetzelfde bestand mogelijk te maken
        e.target.value = null;
    };

    const handleJSONUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (confirm("Wil je deze backup samenvoegen met je huidige data?\n\n- Bestaande items worden bijgewerkt.\n- Nieuwe items worden toegevoegd.\n- Items die niet in de backup staan, blijven behouden.")) {
                    const success = await importData(jsonData);
                    if (success) alert("Data succesvol samengevoegd!");
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
        <div className="data-manager">
            <h1>Data Beheer</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* 1. BULK IMPORT SECTIE (GROOT) */}
                <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
                            <FileText /> Bulk Import Bestellingen
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Kopieer gegevens uit Excel of upload een CSV-bestand om snel meerdere bestellingen toe te voegen.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>1. Voor welke leverdatum?</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    value={targetDate} 
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    onFocus={(e) => e.target.showPicker?.()}
                                    onClick={(e) => e.target.showPicker?.()}
                                    style={{ maxWidth: '200px', marginBottom: 0 }}
                                />
                                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                    Week {targetWeek}
                                </span>
                            </div>
                            
                            <div className="detail-section" style={{ marginTop: '1rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={14}/> Instructies</h4>
                                <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                                    <li>Zorg dat elke regel 1 product is.</li>
                                    <li>Gebruik puntkomma (;), tab of komma als scheidingsteken.</li>
                                    <li>Kolom volgorde: <strong>Naam</strong> ; <strong>Aantal</strong> ; <strong>Prijs (optioneel)</strong></li>
                                    <li>Prijs en aantal mogen komma&apos;s gebruiken voor decimalen.</li>
                                </ul>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    Voorbeeld:<br/>
                                    Halfvolle Melk; 6; 0,95<br/>
                                    Brood Bruin; 2; 2,20<br/>
                                    Koffie; 1
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>2. Plak data of upload bestand</label>
                            <textarea
                                className="input-field"
                                style={{ flex: 1, minHeight: '200px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder="Plak hier je Excel data..."
                            />
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="file"
                                        accept=".csv,.txt,.tsv"
                                        onChange={handleFileUpload}
                                        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                                    />
                                    <button className="badge-warning" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={16} /> Kies Bestand
                                    </button>
                                </div>
                                <button 
                                    onClick={handleBulkImport} 
                                    disabled={!bulkText.trim() || isProcessing}
                                    style={{ flex: 2, opacity: (!bulkText.trim() || isProcessing) ? 0.5 : 1 }}
                                >
                                    {isProcessing ? 'Bezig...' : 'Importeer Bestellingen'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. OVERIGE FUNCTIES (KLEINER) */}
                <section className="glass-panel">
                    <h3><Database size={18} /> Statistieken</h3>
                    <div style={{ marginTop: '1rem' }}>
                        <p>Actieve Bestellingen: {activeData.orders.length}</p>
                        <p>Actieve Leveringen: {activeData.deliveries.length}</p>
                        <p>Items in Verbruik: {activeData.consumption.length}</p>
                    </div>
                </section>

                <section className="glass-panel">
                    <h3><Download size={18} /> Backup / Restore</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Backup downloaden of een eerdere backup herstellen.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button onClick={exportData} style={{ width: '100%' }}>
                            Exporteer JSON
                        </button>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleJSONUpload}
                                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%' }}
                            />
                            <button className="badge-success" style={{ width: '100%' }}>
                                Herstel JSON (Restore)
                            </button>
                        </div>
                    </div>
                </section>

                <section className="glass-panel" style={{ border: '1px solid var(--danger-color)' }}>
                    <h3><Trash2 size={18} color="var(--danger-color)" /> Reset</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '1rem 0' }}>
                        Wis alle data in de database permanent.
                    </p>
                    <button onClick={clearData} className="badge-danger" style={{ width: '100%' }}>Wis alle data</button>
                </section>
            </div>
        </div>
    );
};

export default DataManager;