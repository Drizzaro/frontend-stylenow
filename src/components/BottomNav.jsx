import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, Search, Heart, User } from "lucide-react";

const ITEMS = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/categories", label: "Categories", icon: LayoutGrid },
    { to: "/products?focus=1", label: "Search", icon: Search },
    { to: "/wishlist", label: "Wishlist", icon: Heart },
    { to: "/account", label: "Account", icon: User },
];

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl md:hidden" data-testid="bottom-nav">
            <div className="grid grid-cols-5">
                {ITEMS.map(({ to, label, icon: Icon, end }) => (
                    <NavLink key={to} to={to} end={end} data-testid={`nav-${label.toLowerCase()}`}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`
                        }>
                        <Icon size={20} />
                        {label}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
