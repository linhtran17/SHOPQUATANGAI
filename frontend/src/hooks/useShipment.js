import { useState, useCallback } from 'react';
import shipmentService from '../services/shipmentService';

export function useShipment() {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShipmentByOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentService.getByOrder(orderId);
      setShipment(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackShipment = useCallback(async (shipmentId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentService.track(shipmentId);
      setShipment(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { shipment, loading, error, fetchShipmentByOrder, trackShipment };
}
