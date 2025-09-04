import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authApi from '../../services/authService';

export default function RequireAdmin({ children }) {
  const [state, setState] = useState({ checking: true, ok: false });

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    if (!token) { setState({ checking: false, ok: false }); return; }

    (async () => {
      try {
        const me = await authApi.me(); // { _id, email, name, role }
        if (!mounted) return;
        setState({ checking: false, ok: me?.role === 'admin' });
      } catch {
        if (!mounted) return;
        setState({ checking: false, ok: false });
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (state.checking) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!state.ok) return <Navigate to="/" replace />;

  return children;
}
