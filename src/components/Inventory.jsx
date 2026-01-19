import React from 'react';
import { useInventoryStats } from '../hooks/useInventoryStats';
import { Package } from 'lucide-react';

const Inventory = () => {
    const { getInventory } = useInventoryStats();
    const inventoryMap = getInventory();



    return (
        <div className="inventory">
            <h1>Persoonlijke Voorziene voorraad</h1>

            <div className="glass-panel table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Leveringsweek</th>
                            <th>Geleverd</th>
                            <th>Verbruikt</th>
                            <th>Huidige Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventoryMap.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Geen producten gevonden in de voorraad.</td>
                            </tr>
                        ) : inventoryMap.map(item => (
                            <tr key={item.id}>
                                <td><strong>{item.name}</strong></td>
                                <td>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        {item.deliveryWeek}
                                        {item.weeksSincePurchase && item.estDuration && (
                                            <span style={{ display: 'block', fontSize: '0.8rem' }}>
                                                ({item.weeksSincePurchase}w/{item.estDuration}w)
                                            </span>
                                        )}
                                    </span>
                                </td>
                                <td>{item.delivered}</td>
                                <td>{item.consumed}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={16} color="var(--accent-color)" />
                                        {item.stock} stuks
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default Inventory;
