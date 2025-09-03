import { useState, useCallback } from 'react';
import discountService from '../services/discountService';

export function useDiscount() {
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateDiscount = useCallback(async (code, total) => {
    setLoading(true);
    setError(null);
    try {
      const res = await discountService.validate(code, total);
      setDiscount(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discountService.getAll();
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { discount, loading, error, validateDiscount, fetchAllDiscounts };
}
