import React from 'react';
import { useProductList } from '../hooks/useProductList';

const ProductList = () => {
    const { getProductList } = useProductList();
    const products = getProductList();

    return (
        <div className="product-list">
            <h1>Producten Referentielijst</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Overzicht van alle producten uit eerdere bestellingen en leveringen (gebaseerd op unieke namen).
            </p>

            <div className="glass-panel table-container">
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
                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Geen producten gevonden.</td>
                            </tr>
                        ) : products.map((product, index) => (
                            <tr key={index}>
                                <td style={{ textTransform: 'lowercase' }}><strong>{product.name}</strong></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '16px' }}>🏷️</span>
                                        €{product.price.toFixed(2)}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '16px' }}>🕒</span>
                                        {product.estDuration} {product.estDuration === 1 ? 'week' : 'weken'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;
