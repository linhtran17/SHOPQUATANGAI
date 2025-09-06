import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authApi from "../../services/authService";

export default function RequireAdmin({ children }) {
  const [state, setState] = useState({ checking: true, allow: false });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setState({ checking: false, allow: false });

    (async () => {
      try {
        const me = await authApi.me(); // { _id, email, name, role }
        setState({ checking: false, allow: me?.role === "admin" });
      } catch {
        setState({ checking: false, allow: false });
      }
    })();
  }, []);

  if (state.checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-slate-500">Đang kiểm tra quyền…</div>
      </div>
    );
  }
  if (!state.allow) return <Navigate to="/" replace />;

  return children;
}
