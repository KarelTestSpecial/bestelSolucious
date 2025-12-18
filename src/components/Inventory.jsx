import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package } from 'lucide-react';

const Inventory = () => {
    const { activeData } = useAppContext();

    // Bereken de voorraad: Geleverd - Verbruikt
    // We groeperen per productnaam/ID
    const inventoryMap = activeData.products.map(product => {
        const totalDelivered = activeData.deliveries
            .filter(d => d.productId === product.id)
            .reduce((sum, d) => sum + d.qty, 0);

        const totalConsumed = activeData.consumption
            .filter(c => {
                // Als de source een delivery is van dit product
                if (c.sourceType === 'delivery') {
                    const del = activeData.deliveries.find(d => d.id === c.sourceId);
                    return del && del.productId === product.id;
                }
                return false;
            })
            .reduce((sum, c) => sum + c.qty, 0);

        return {
            ...product,
            stock: totalDelivered - totalConsumed,
            delivered: totalDelivered,
            consumed: totalConsumed
        };
    });

    return (
        <div className="inventory">
            <h1>Persoonlijke Voorraad</h1>

            <div className="glass-panel table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Status</th>
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
                                    {item.stock <= 0 ? (
                                        <span className="badge badge-danger">OP</span>
                                    ) : item.stock < 2 ? (
                                        <span className="badge badge-warning">LAAG</span>
                                    ) : (
                                        <span className="badge badge-success">OK</span>
                                    )}
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
