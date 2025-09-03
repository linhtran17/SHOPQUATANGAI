import { useState } from 'react';
import paymentService from '../services/paymentService';

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const capturePayment = async (paymentId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.capture(paymentId);
      setResult(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { capturePayment, loading, error, result };
}
