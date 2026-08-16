import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, fmtErr } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const { setMode } = useTheme();

    const refresh = useCallback(async () => {
        // OAuth callback carries session_id in the hash — AuthCallback exchanges it first
        if (window.location.hash?.includes("session_id=")) {
            setReady(true);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data.user);
            if (data.user?.theme_preference && data.user.theme_preference !== (localStorage.getItem("sn-theme") || "system")) {
                setMode(data.user.theme_preference);
            }
        } catch {
            setUser(null);
        } finally {
            setReady(true);
        }
    }, [setMode]);

    useEffect(() => { refresh(); }, [refresh]);

    const requestOtp = async (phone) => {
        const { data } = await api.post("/auth/otp/request", { phone });
        return data;
    };

    const verifyOtp = async (phone, otp, name) => {
        const { data } = await api.post("/auth/otp/verify", { phone, otp, name });
        setUser(data.user);
        if (data.user?.theme_preference) setMode(data.user.theme_preference);
        setAuthOpen(false);
        return data;
    };

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch {}
        setUser(null);
    };

    const updateProfile = async (payload) => {
        const { data } = await api.put("/auth/me", payload);
        setUser(data.user);
        return data.user;
    };

    return (
        <AuthContext.Provider value={{ user, ready, authOpen, setAuthOpen, requestOtp, verifyOtp, logout, updateProfile, refresh, fmtErr }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
