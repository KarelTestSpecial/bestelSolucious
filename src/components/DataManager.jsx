import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Upload, Trash2, Database, FileSpreadsheet } from 'lucide-react';
import { parseSpreadsheetTSV } from '../utils/dataParser';

const DataManager = () => {
    const { exportData, importData, activeData, archive, addBulkData } = useAppContext();
    const [bulkText, setBulkText] = useState('');
    const [importMode, setImportMode] = useState('delivery'); // 'order' or 'delivery'

    const handleBulkImport = () => {
        if (!bulkText.trim()) return;
        const imported = parseSpreadsheetTSV(bulkText, importMode);
        addBulkData(imported);
        setBulkText('');
        alert(`${importMode === 'order' ? 'Bestellingen' : 'Leveringen'} succesvol geïmporteerd!`);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => importData(e.target.result);
        reader.readAsText(file);
    };

    const clearData = () => {
        if (confirm("Weet je zeker dat je alle data wilt wissen? Dit kan niet ongedaan worden gemaakt.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="data-manager">
            <h1>Data Beheer & Instellingen</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <section className="glass-panel">
                    <h3><Database size={18} /> Statistieken</h3>
                    <div style={{ marginTop: '1rem' }}>
                        <p>Actieve Items: {activeData.orders.length + activeData.deliveries.length + activeData.consumption.length}</p>
                        <p>Gearchiveerde Items: {archive.length}</p>
                    </div>
                </section>

                <section className="glass-panel">
                    <h3><Download size={18} /> Export / Import</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                        <button onClick={exportData} style={{ width: '100%' }}>
                            Exporteer naar JSON
                        </button>

                        <div style={{ position: 'relative' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                            />
                            <button className="badge-warning" style={{ width: '100%' }}>Importeer JSON</button>
                        </div>
                    </div>
                </section>

                <section className="glass-panel">
                    <h3><FileSpreadsheet size={18} /> Bulk Import (Spreadsheet)</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.4rem' }}>Import type:</label>
                        <select
                            className="input-field"
                            style={{ marginBottom: '0.5rem' }}
                            value={importMode}
                            onChange={(e) => setImportMode(e.target.value)}
                        >
                            <option value="delivery">Geleverde Data (Historisch)</option>
                            <option value="order">Bestel Data (Toekomstig)</option>
                        </select>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                        Plak hier de gegevens uit je spreadsheet (TSV formaat).
                    </p>
                    <textarea
                        className="input-field"
                        style={{ height: '100px', resize: 'vertical', fontSize: '0.8rem' }}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="30/12  22,47&#10;  Product  2  1,84  3,68..."
                    />
                    <button onClick={handleBulkImport} style={{ width: '100%' }}>Importeer Bulk</button>
                </section>

                <section className="glass-panel" style={{ border: '1px solid var(--danger-color)' }}>
                    <h3><Trash2 size={18} color="var(--danger-color)" /> Gevaarlijke Zone</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '1rem 0' }}>
                        Wis de volledige database en begin opnieuw.
                    </p>
                    <button onClick={clearData} className="badge-danger" style={{ width: '100%' }}>Wis alle data</button>
                </section>
            </div>
        </div>
    );
};

export default DataManager;
