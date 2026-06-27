import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useProductList } from '../hooks/useProductList';
import { EditableCell } from './WeeklyCard';

const ProductList = () => {
    const { updateItem, deleteItem } = useAppContext();
    const { getProductList } = useProductList();
    const products = getProductList();

    return (
        <div className="product-list animate-slide-up">
            <header style={{ marginBottom: '2rem' }}>
                <h1>📦 Producten Referentielijst</h1>
                <p className="stat-label">
                    Overzicht van alle producten uit eerdere bestellingen en leveringen.
                </p>
            </header>

            <div className="glass-panel">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Product Naam</th>
                                <th>Laatst Bekende Prijs</th>
                                <th>Geschatte Gebruiksduur</th>
                                <th style={{ width: '40px', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="empty-text" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Geen producten gevonden.
                                    </td>
                                </tr>
                            ) : products.map((product, index) => (
                                <tr key={product.id || index}>
                                    <td>
                                        <div style={{ fontWeight: '600', color: '#fff' }}>{product.name}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="badge badge-success">€{product.price.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                            <span style={{ fontSize: '1.1rem' }}>🕒</span>
                                            <EditableCell 
                                                value={product.estDuration} 
                                                type="number" 
                                                onSave={(val) => updateItem('products', product.id || product.name, { estDuration: val })} 
                                                precision={0} 
                                            />
                                            {product.estDuration === 1 ? 'week' : 'weken'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {product.id ? (
                                            <button onClick={() => deleteItem('products', product.id)} style={{ background: 'transparent', color: 'var(--accent-danger)', padding: 0, border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;

