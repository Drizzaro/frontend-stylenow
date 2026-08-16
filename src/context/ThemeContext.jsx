import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(null);

function resolve(mode) {
    if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return mode;
}

export function ThemeProvider({ children }) {
    const [mode, setModeState] = useState(() => localStorage.getItem("sn-theme") || "system");
    const [resolved, setResolved] = useState(() => resolve(localStorage.getItem("sn-theme") || "system"));

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const apply = () => {
            const r = resolve(mode);
            setResolved(r);
            document.documentElement.classList.toggle("dark", r === "dark");
            document.documentElement.style.colorScheme = r;
        };
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, [mode]);

    const setMode = useCallback((m) => {
        localStorage.setItem("sn-theme", m);
        setModeState(m);
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, resolved, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
