import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';
import PropTypes from 'prop-types';

const DeliveryForm = ({ onClose }) => {
  const { activeData, confirmBatchDeliveries, getCurrentWeekId } = useAppContext();

  const getToday = () => new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(getToday());
  const [weekId, setWeekId] = useState(getCurrentWeekId());

  useEffect(() => {
    if (date) {
        setWeekId(getWeekIdFromDate(date));
    }
  }, [date]);

  const pendingOrders = activeData.orders.filter(order => {
    const isDelivered = activeData.deliveries.some(d => d.orderId === order.id);
    const isInSelectedWeek = order.weekId === weekId;
    return !isDelivered && isInSelectedWeek;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pendingOrders.length === 0) return;

    const deliveryPayload = pendingOrders.map(order => {
      const deliveryId = crypto.randomUUID();
      return {
        delivery: {
          id: deliveryId,
          orderId: order.id,
          productId: order.productId,
          name: order.name,
          price: order.price,
          qty: order.qty,
          estDuration: order.estDuration,
          weekId: weekId
        },
        consumption: {
          sourceId: deliveryId,
          sourceType: 'delivery',
          name: order.name,
          qty: order.qty,
          cost: order.price * order.qty,
          startDate: weekId,
          estDuration: order.estDuration,
          effDuration: null,
          completed: false
        }
      };
    });

    await confirmBatchDeliveries(deliveryPayload);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', padding: '2.5rem', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>🚚 Levering Bevestigen</h2>
          <button onClick={onClose} className="secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}>✕</button>
        </header>

        {pendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>📦</span>
            <p className="stat-label">Geen openstaande bestellingen gevonden voor deze week.</p>
            <button onClick={onClose} className="secondary" style={{ marginTop: '2rem' }}>Sluiten</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <p className="stat-label">
                De volgende <strong>{pendingOrders.length}</strong> artikelen worden bevestigd als geleverd:
            </p>

            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '0', overflow: 'hidden' }}>
                <div className="table-container" style={{ maxHeight: '300px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style={{ textAlign: 'center' }}>Aantal</th>
                                <th style={{ textAlign: 'right' }}>Prijs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingOrders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: '600' }}>{o.name}</td>
                                    <td style={{ textAlign: 'center' }}>{o.qty}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="badge badge-success">€{o.price.toFixed(2)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: 0 }}>
                <div>
                    <label className="stat-label" style={{ marginBottom: '0.8rem', display: 'block' }}>Leverdatum</label>
                    <input
                        className="input-field"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        onFocus={(e) => e.target.showPicker?.()}
                        onClick={(e) => e.target.showPicker?.()}
                        required
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.8rem' }}>
                    <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.8rem 1.2rem' }}>
                        Week: {weekId}
                    </span>
                </div>
            </div>

            <div className="glass-panel" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.2rem', alignItems: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <span style={{ fontSize: '1.8rem' }}>ℹ️</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                    Verbruik wordt automatisch gestart vanaf de leverdatum. Je kunt de duur later aanpassen in het dashboard.
                </p>
            </div>

            <button type="submit" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}>
                ✅ Bevestig Alle Artikelen
            </button>
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
