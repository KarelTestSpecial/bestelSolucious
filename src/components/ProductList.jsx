import React from 'react';
import { useProductList } from '../hooks/useProductList';

const ProductList = () => {
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
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="empty-text" style={{ textAlign: 'center', padding: '2rem' }}>
                                        Geen producten gevonden.
                                    </td>
                                </tr>
                            ) : products.map((product, index) => (
                                <tr key={index}>
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
                                            {product.estDuration} {product.estDuration === 1 ? 'week' : 'weken'}
                                        </div>
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

