import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { getWeekIdFromDate } from '../utils/weekUtils';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

const DeliveryForm = ({ onClose }) => {
  const { activeData, confirmBulkDeliveries, getCurrentWeekId } = useAppContext();

  // We zoeken naar openstaande bestellingen die nog niet geleverd zijn
  const pendingOrders = activeData.orders.filter(order => {
    const isDelivered = activeData.deliveries.some(d => d.orderId === order.id);
    return !isDelivered;
  });

  console.log("Active Orders:", activeData.orders);
  console.log("Active Deliveries:", activeData.deliveries);
  console.log("Pending Orders:", pendingOrders);

  const getToday = () => new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(getToday());
  const [weekId, setWeekId] = useState(getCurrentWeekId());

  useEffect(() => {
    if (date) {
        setWeekId(getWeekIdFromDate(date));
    }
  }, [date]);

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
          estDuration: order.estDuration, // Neem over van bestelling
          weekId: weekId
        },
        consumption: {
          sourceId: deliveryId,
          sourceType: 'delivery',
          name: order.name,
          qty: order.qty,
          cost: order.price * order.qty,
          startDate: weekId,
          estDuration: order.estDuration, // Neem over van bestelling
          effDuration: null,
          completed: false
        }
      };
    });

    await confirmBulkDeliveries(deliveryPayload);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'rgba(30, 30, 45, 0.8)', padding: '0.5rem 0', zIndex: 10 }}>
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
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                De volgende <strong>{pendingOrders.length}</strong> artikelen worden bevestigd als geleverd:
            </p>

            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem' }}>
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Product</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Aantal</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Prijs p/u</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingOrders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem' }}>{o.name}</td>
                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>{o.qty}</td>
                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>€ {o.price.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label>Effectieve Leverdatum</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        className="input-field"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        onFocus={(e) => e.target.showPicker?.()}
                        onClick={(e) => e.target.showPicker?.()}
                        required
                        style={{ marginBottom: 0, flex: 1 }}
                    />
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                        Week: {weekId}
                    </span>
                </div>
            </div>

            <div className="alert-info" style={{ marginBottom: '1.5rem', background: 'rgba(52, 152, 219, 0.1)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <CheckCircle2 size={24} color="var(--accent-color)" />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    De verwachte verbruiksduur is overgenomen van de bestelling. Individuele aanpassingen kunnen na bevestiging in het dashboard gedaan worden.
                </p>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                Bevestig Alle {pendingOrders.length} Artikelen
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