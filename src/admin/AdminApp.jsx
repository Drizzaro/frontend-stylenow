import { useEffect, useState, useCallback } from "react";
import { Sun, Moon, Monitor, LogOut, LayoutDashboard, Package, ShoppingCart, Users, Home as HomeIcon, Ticket, Sparkles, Bike, Star, BarChart3, Settings, ShieldCheck, Clapperboard, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { api, fmtErr } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/context/ThemeContext";
import Dashboard from "@/admin/Dashboard";
import AdminOrders from "@/admin/AdminOrders";
import AdminProducts from "@/admin/AdminProducts";
import AdminCategories from "@/admin/AdminCategories";
import AdminCoupons from "@/admin/AdminCoupons";
import AdminHomepage from "@/admin/AdminHomepage";
import AdminSpin from "@/admin/AdminSpin";
import AdminCustomers from "@/admin/AdminCustomers";
import AdminSettings from "@/admin/AdminSettings";
import AdminOps from "@/admin/AdminOps";
import AdminAnalytics from "@/admin/AdminAnalytics";
import AdminVideos from "@/admin/AdminVideos";
import AdminMedia from "@/admin/AdminMedia";

const NAV = [
    { k: "overview", label: "Overview & KPIs", icon: LayoutDashboard },
    { k: "orders", label: "Order Fulfillment", icon: ShoppingCart },
    { k: "products", label: "Products & Inventory", icon: Package },
    { k: "categories", label: "Categories", icon: Package },
    { k: "customers", label: "Customers & Users", icon: Users },
    { k: "homepage", label: "Homepage", icon: HomeIcon },
    { k: "coupons", label: "Offers & Coupons", icon: Ticket },
    { k: "videos", label: "Videos", icon: Clapperboard },
    { k: "media", label: "Media Library", icon: FolderOpen },
    { k: "spin", label: "Spin Wheel", icon: Sparkles },
    { k: "delivery", label: "Delivery", icon: Bike },
    { k: "ops", label: "Reviews & Returns", icon: Star },
    { k: "analytics", label: "Analytics", icon: BarChart3 },
    { k: "settings", label: "Settings", icon: Settings },
];

const THEME_OPTS = [{ k: "light", icon: Sun }, { k: "dark", icon: Moon }, { k: "system", icon: Monitor }];

export default function AdminApp() {
    const [isDesktop] = useState(() => window.innerWidth >= 1024 && !/Mobi|Android/i.test(navigator.userAgent));
    const [admin, setAdmin] = useState(null);
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState("overview");
    const { mode, setMode } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [orderRefreshKey, setOrderRefreshKey] = useState(0);

    useEffect(() => {
        api.get("/admin/auth/me").then(({ data }) => {
            setAdmin(data.admin);
            if (data.admin?.theme_preference) setMode(data.admin.theme_preference);
        }).catch(() => {}).finally(() => setReady(true));
    }, [setMode]);

    useEffect(() => {
        if (!admin) return;
        const url = `${process.env.REACT_APP_BACKEND_URL}/api/admin/stream`;
        const es = new EventSource(url, { withCredentials: true });
        es.addEventListener("new_order", (e) => {
            try {
                const d = JSON.parse(e.data);
                toast.success(`NEW ORDER ${d.order_id}`, { description: `${d.customer} · ${d.items} items · ₹${d.total} · ${d.payment_status}`, duration: 10000 });
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    ctx.resume?.();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = "sawtooth";
                    o.frequency.value = 880;
                    g.gain.value = 0.12;
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.start();
                    const iv = setInterval(() => { o.frequency.value = o.frequency.value === 880 ? 620 : 880; }, 350);
                    setTimeout(() => { clearInterval(iv); try { o.stop(); ctx.close(); } catch {} }, 15000);
                } catch {}
                if (window.Notification?.permission === "granted") new Notification("StyleNow — New Order", { body: `${d.order_id} · ₹${d.total}` });
                setOrderRefreshKey((k) => k + 1);
            } catch {}
        });
        return () => es.close();
    }, [admin]);

    useEffect(() => {
        if (admin && window.Notification?.permission === "default") window.Notification.requestPermission().catch(() => {});
    }, [admin]);

    const login = async (e) => {
        e.preventDefault();
        setBusy(true); setError("");
        try {
            const { data } = await api.post("/admin/auth/login", { email, password });
            setAdmin(data.admin);
            if (data.admin?.theme_preference) setMode(data.admin.theme_preference);
            toast.success(`Welcome, ${data.admin.name}`);
        } catch (err) { setError(fmtErr(err, "Login failed")); }
        finally { setBusy(false); }
    };

    const logout = async () => {
        try { await api.post("/admin/auth/logout"); } catch {}
        setAdmin(null);
    };

    const changeTheme = async (m) => {
        setMode(m);
        try { await api.put("/admin/auth/me", { theme_preference: m }); } catch {}
    };

    if (!isDesktop) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center" data-testid="admin-mobile-block">
                <Logo className="h-14" linkTo={null} />
                <h1 className="font-display text-xl font-bold">StyleNow Admin Panel is available on desktop only.</h1>
                <p className="max-w-sm text-sm text-muted-foreground">Please open this page on a laptop or desktop computer to manage your store.</p>
            </div>
        );
    }

    if (!ready) return <div className="flex min-h-screen items-center justify-center bg-background"><Logo className="h-16 animate-pulse" linkTo={null} /></div>;

    if (!admin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6" data-testid="admin-login-page">
                <form onSubmit={login} className="sn-card w-full max-w-sm space-y-5 p-8">
                    <div className="flex flex-col items-center gap-3">
                        <Logo className="h-16" linkTo={null} testId="admin-login-logo" />
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"><ShieldCheck size={13} /> Admin Access</p>
                    </div>
                    <div>
                        <label className="sn-label">Email</label>
                        <input className="sn-input" type="email" required value={email} data-testid="admin-email" onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="sn-label">Password</label>
                        <input className="sn-input" type="password" required value={password} data-testid="admin-password" onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="text-sm font-semibold text-destructive" data-testid="admin-login-error">{error}</p>}
                    <button className="sn-btn-primary w-full" disabled={busy} data-testid="admin-login-btn">{busy ? "Verifying…" : "Sign In"}</button>
                </form>
            </div>
        );
    }

    const pages = {
        overview: <Dashboard />,
        orders: <AdminOrders refreshKey={orderRefreshKey} />,
        products: <AdminProducts />,
        categories: <AdminCategories />,
        customers: <AdminCustomers />,
        homepage: <AdminHomepage />,
        coupons: <AdminCoupons />,
        videos: <AdminVideos />,
        media: <AdminMedia />,
        spin: <AdminSpin />,
        delivery: <AdminDelivery />,
        ops: <AdminOps />,
        analytics: <AdminAnalytics />,
        settings: <AdminSettings />,
    };

    return (
        <div className="flex min-h-screen bg-background" data-testid="admin-panel">
            <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border p-5">
                    <Logo className="h-9" linkTo={null} testId="admin-logo" />
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-primary">Admin</span>
                </div>
                <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                    {NAV.map(({ k, label, icon: Icon }) => (
                        <button key={k} onClick={() => setTab(k)} data-testid={`admin-nav-${k}`}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${tab === k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                            <Icon size={17} /> {label}
                        </button>
                    ))}
                </nav>
                <div className="border-t border-border p-4">
                    <div className="mb-3 flex gap-1 rounded-xl bg-secondary p-1" data-testid="admin-theme-selector">
                        {THEME_OPTS.map(({ k, icon: Icon }) => (
                            <button key={k} onClick={() => changeTheme(k)} data-testid={`admin-theme-${k}`} aria-label={k}
                                className={`flex flex-1 items-center justify-center rounded-lg py-2 transition-colors ${mode === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                <Icon size={15} />
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{admin.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{admin.role.replace("_", " ")}</p>
                        </div>
                        <button onClick={logout} data-testid="admin-logout" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
            <main className="ml-64 min-w-0 flex-1 p-6">{pages[tab]}</main>
        </div>
    );
}

function AdminDelivery() {
    const [items, setItems] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "", zone: "" });
    const load = useCallback(() => api.get("/admin/delivery/partners").then(({ data }) => setItems(data.items)).catch(() => setItems([])), []);
    useEffect(() => { load(); }, [load]);
    if (!items) return <div className="py-6 text-sm text-muted-foreground">Loading…</div>;
    return (
        <div className="space-y-6" data-testid="admin-delivery">
            <h1 className="font-display text-2xl font-black">Delivery Partners</h1>
            <form onSubmit={async (e) => { e.preventDefault(); try { await api.post("/admin/delivery/partners", form); toast.success("Partner added"); setForm({ name: "", phone: "", zone: "" }); load(); } catch (err) { toast.error(fmtErr(err)); } }}
                className="sn-card flex flex-wrap items-end gap-3 p-4">
                <div><label className="sn-label">Name</label><input className="sn-input" required value={form.name} data-testid="partner-name" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="sn-label">Phone</label><input className="sn-input" required value={form.phone} data-testid="partner-phone" onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><label className="sn-label">Zone</label><input className="sn-input" value={form.zone} data-testid="partner-zone" onChange={(e) => setForm({ ...form, zone: e.target.value })} /></div>
                <button className="sn-btn-primary" data-testid="partner-add">Add Partner</button>
            </form>
            <div className="sn-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Zone</th><th className="p-3">Status</th><th className="p-3"></th>
                    </tr></thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p.id} className="border-b border-border last:border-0" data-testid={`partner-row-${p.id}`}>
                                <td className="p-3 font-semibold">{p.name}</td>
                                <td className="p-3">{p.phone}</td>
                                <td className="p-3">{p.zone || "—"}</td>
                                <td className="p-3"><span className="sn-chip">{p.active ? "Active" : "Inactive"}</span></td>
                                <td className="p-3 text-right">
                                    <button onClick={async () => { await api.delete(`/admin/delivery/partners/${p.id}`); load(); }} data-testid={`partner-delete-${p.id}`}
                                        className="text-xs font-bold text-destructive hover:underline">Remove</button>
                                </td>
                            </tr>
                        ))}
                        {!items.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No delivery partners yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
