import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';
import { X, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const DeliveryForm = ({ onClose }) => {
  const { activeData, confirmDelivery, registerConsumption, getCurrentWeekId } = useAppContext();

  // We zoeken naar openstaande bestellingen die nog niet geleverd zijn
  const pendingOrders = activeData.orders.filter(order => {
    return !activeData.deliveries.some(d => d.orderId === order.id);
  });

  const getToday = () => new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(getToday());

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [deliveryData, setDeliveryData] = useState({
    price: '',
    qty: '',
    variant: '',
    estDuration: 1,
    weekId: getCurrentWeekId()
  });

  useEffect(() => {
    if (date) {
        setDeliveryData(prev => ({ ...prev, weekId: getWeekIdFromDate(date) }));
    }
  }, [date]);

  const handleOrderChange = (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) {
      setDeliveryData({
        ...deliveryData,
        price: order.price,
        qty: order.qty,
        variant: ''
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    const order = pendingOrders.find(o => o.id === selectedOrderId);

    // 1. Bevestig de levering
    const deliveryId = crypto.randomUUID();
    confirmDelivery({
      id: deliveryId,
      orderId: selectedOrderId,
      productId: order.productId,
      price: parseFloat(deliveryData.price),
      qty: parseInt(deliveryData.qty),
      variant: deliveryData.variant,
      weekId: deliveryData.weekId
    });

    // 2. Registreer start van verbruik (Spreiding)
    registerConsumption({
      sourceId: deliveryId,
      sourceType: 'delivery',
      qty: parseInt(deliveryData.qty),
      cost: parseFloat(deliveryData.price) * parseInt(deliveryData.qty),
      startDate: deliveryData.weekId,
      estDuration: parseInt(deliveryData.estDuration),
      effDuration: null,
      completed: false
    });

    onClose();
  };

  return createPortal(
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Levering Bevestigen</h2>
          <button onClick={onClose} style={{ background: 'transparent', padding: '0.5rem' }}><X size={20} /></button>
        </div>

        {pendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={48} color="var(--warning-color)" style={{ marginBottom: '1rem' }} />
            <p>Geen openstaande bestellingen gevonden.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Selecteer Bestelling</label>
            <select className="input-field" value={selectedOrderId} onChange={handleOrderChange} required>
              <option value="">-- Kies een bestelling --</option>
              {pendingOrders.map(o => (
                <option key={o.id} value={o.id}>{o.name} ({o.qty} stuks) - {o.weekId}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Geleverde Prijs (p/u)</label>
                <input
                  className="input-field" type="number" step="0.01"
                  value={deliveryData.price}
                  onChange={e => setDeliveryData({ ...deliveryData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Geleverd Aantal</label>
                <input
                  className="input-field" type="number"
                  value={deliveryData.qty}
                  onChange={e => setDeliveryData({ ...deliveryData, qty: e.target.value })}
                  required
                />
              </div>
            </div>

            <label>Variant / Opmerking</label>
            <input
              className="input-field" placeholder="Bijv. Andere verpakking..."
              value={deliveryData.variant}
              onChange={e => setDeliveryData({ ...deliveryData, variant: e.target.value })}
            />

            <label style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Geschat Verbruik (weken)</label>
            <input
              className="input-field" type="number" min="1"
              value={deliveryData.estDuration}
              onChange={e => setDeliveryData({ ...deliveryData, estDuration: e.target.value })}
              required
            />

            <label>Effectieve Leverdatum</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    className="input-field"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{ marginBottom: 0 }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    Week: <strong>{deliveryData.weekId}</strong>
                </span>
            </div>

            <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>Bevestig Levering & Start Verbruik</button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

DeliveryForm.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default DeliveryForm;
