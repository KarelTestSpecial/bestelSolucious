import React from 'react';
import { useProductList } from '../hooks/useProductList';
import { Package, TrendingUp, Tag } from 'lucide-react';

const ProductList = () => {
    const { getProductList } = useProductList();
    const products = getProductList();

    return (
        <div className="product-list">
            <h1>Productenlijst</h1>

            <div className="glass-panel table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Huidige Stock</th>
                            <th>Recente Prijs</th>
                            <th>Weken Voorraad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Geen producten gevonden.</td>
                            </tr>
                        ) : products.map(product => (
                            <tr key={product.id}>
                                <td><strong>{product.name}</strong></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={16} color="var(--accent-color)" />
                                        {product.stock} stuks
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Tag size={16} color="var(--text-muted)" />
                                        €{product.price.toFixed(2)}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={16} color={product.weeksOfSupply < 2 ? 'var(--warning-color)' : 'var(--success-color)'} />
                                        {isFinite(product.weeksOfSupply) ? `${product.weeksOfSupply} weken` : 'N/A'}
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
