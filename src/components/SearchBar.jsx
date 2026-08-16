import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

export function SearchBar({ autoFocus = false, className = "" }) {
    const [q, setQ] = useState("");
    const [suggestions, setSuggestions] = useState(null);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const timer = useRef(null);
    const boxRef = useRef(null);

    useEffect(() => {
        const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const onChange = (v) => {
        setQ(v);
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            try {
                const { data } = await api.get("/search/suggestions", { params: { q: v } });
                setSuggestions(data.suggestions || []);
                setOpen(true);
            } catch { setSuggestions([]); }
        }, 250);
    };

    const go = (term) => {
        const t = (term ?? q).trim();
        if (!t) return;
        setOpen(false);
        navigate(`/products?q=${encodeURIComponent(t)}`);
    };

    return (
        <div ref={boxRef} className={`relative ${className}`} data-testid="search-bar">
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-ring">
                <Search size={17} className="shrink-0 text-muted-foreground" />
                <input
                    value={q}
                    autoFocus={autoFocus}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => { if (suggestions?.length) setOpen(true); }}
                    onKeyDown={(e) => e.key === "Enter" && go()}
                    placeholder="Search oversized tees, hoodies, sneakers…"
                    data-testid="search-input"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
            </div>
            {open && suggestions?.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl animate-fade-up" data-testid="search-suggestions">
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => go(s)} data-testid={`search-suggestion-${i}`}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary">
                            <TrendingUp size={14} className="text-primary" /> {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
