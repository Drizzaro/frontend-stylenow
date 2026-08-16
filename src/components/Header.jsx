import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, User, MapPin, Bell, Sun, Moon, Monitor, Check } from "lucide-react";
import { DealTicker } from "@/components/DealTicker";
import { SearchBar } from "@/components/SearchBar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

const THEME_OPTS = [
    { k: "light", label: "Light", icon: Sun },
    { k: "dark", label: "Dark", icon: Moon },
    { k: "system", label: "System", icon: Monitor },
];

export function Header() {
    const { count } = useCart();
    const { user, setAuthOpen, updateProfile } = useAuth();
    const { mode, setMode } = useTheme();
    const [unread, setUnread] = useState(0);
    const [themeOpen, setThemeOpen] = useState(false);
    const themeRef = useRef(null);

    useEffect(() => {
        if (!user) { setUnread(0); return; }
        api.get("/notifications").then(({ data }) => setUnread(data.unread)).catch(() => {});
    }, [user]);

    useEffect(() => {
        const close = (e) => { if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const pickTheme = async (m) => {
        setMode(m);
        setThemeOpen(false);
        if (user) { try { await updateProfile({ theme_preference: m }); } catch {} }
    };

    const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl" data-testid="header">
            <DealTicker />
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                <Link to="/" data-testid="brand-logo" aria-label="StyleNow home"
                    className="font-display text-xl font-black tracking-tight transition-opacity hover:opacity-80">
                    STYLE<span className="text-primary">NOW</span>
                </Link>
                <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold lg:flex" data-testid="delivery-pill">
                    <MapPin size={13} className="text-primary" />
                    Bahraich · 30–60 min
                </div>
                <SearchBar className="hidden flex-1 md:block" />
                <div className="ml-auto flex items-center gap-1">
                    <div ref={themeRef} className="relative">
                        <button onClick={() => setThemeOpen((o) => !o)} data-testid="theme-toggle" aria-label="Theme"
                            className="rounded-full p-2.5 transition-colors hover:bg-secondary">
                            <ThemeIcon size={19} />
                        </button>
                        {themeOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl animate-fade-up" data-testid="theme-menu">
                                {THEME_OPTS.map(({ k, label, icon: Icon }) => (
                                    <button key={k} onClick={() => pickTheme(k)} data-testid={`theme-option-${k}`}
                                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${mode === k ? "bg-primary/15 text-primary" : "hover:bg-secondary"}`}>
                                        <Icon size={15} /> {label}
                                        {mode === k && <Check size={13} className="ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Link to="/wishlist" data-testid="header-wishlist" className="rounded-full p-2.5 transition-colors hover:bg-secondary" aria-label="Wishlist">
                        <Heart size={20} />
                    </Link>
                    <Link to="/cart" data-testid="header-cart" className="relative rounded-full p-2.5 transition-colors hover:bg-secondary" aria-label="Cart">
                        <ShoppingBag size={20} />
                        {count > 0 && (
                            <span data-testid="cart-count" className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                                {count}
                            </span>
                        )}
                    </Link>
                    {user && (
                        <Link to="/account" data-testid="header-notifications" className="relative rounded-full p-2.5 transition-colors hover:bg-secondary" aria-label="Notifications">
                            <Bell size={20} />
                            {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />}
                        </Link>
                    )}
                    {user ? (
                        <Link to="/account" data-testid="header-account" className="ml-1 flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-2 pr-3 text-sm font-semibold transition-colors hover:bg-muted">
                            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                                {user.picture ? <img src={user.picture} alt="" className="h-full w-full object-cover" /> : (user.name || user.phone || "S")[0].toUpperCase()}
                            </span>
                            <span className="hidden sm:block">{user.name || "Account"}</span>
                        </Link>
                    ) : (
                        <button onClick={() => setAuthOpen(true)} data-testid="header-login" className="sn-btn-primary ml-1 !px-4 !py-2">
                            <User size={15} /> Login
                        </button>
                    )}
                </div>
            </div>
            <div className="px-4 pb-3 md:hidden">
                <SearchBar />
            </div>
        </header>
    );
}
