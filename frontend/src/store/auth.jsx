import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authService";

const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [booted, setBooted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { setBooted(true); return; }
        authApi.me().then(u => setUser(u)).catch(() => {
            localStorage.removeItem('token');
            setUser(null);
        }).finally(() => setBooted(true));

    }, []);

    const value = useMemo(() => ({
        user,
        booted,
        async login({ email, password }) {
            const { token, user } = await authApi.login({ email, password });
            localStorage.setItem('token', token);
            setUser(user);
            return user;
        },
        async register({ email, password, name }) {
            const { token, user } = await authApi.register({ email, password, name });
            localStorage.setItem('token', token);
            setUser(user);
            return user;
        },
        logout() {
            localStorage.removeItem('token');
            setUser(null);
        }
    }), [user, booted]);
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export function useAuth() {
    return useContext(AuthCtx);
}