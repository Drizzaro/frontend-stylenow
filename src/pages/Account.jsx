import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, Monitor, Package, Heart, Sparkles, Bell, MapPin, LogOut, Coins, Ticket } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/StateViews";
import { Logo } from "@/components/Logo";

const THEME_OPTIONS = [
    { k: "light", l: "Light", icon: Sun },
    { k: "dark", l: "Dark", icon: Moon },
    { k: "system", l: "System", icon: Monitor },
];

export default function Account() {
    const { user, ready, setAuthOpen, logout, updateProfile } = useAuth();
    const { mode, setMode } = useTheme();
    const [rewards, setRewards] = useState(null);
    const [notifications, setNotifications] = useState(null);
    const [name, setName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        setName(user.name || "");
        api.get("/rewards").then(({ data }) => setRewards(data)).catch(() => setRewards({ wallet: {}, transactions: [], coupons: [] }));
        api.get("/notifications").then(({ data }) => setNotifications(data.items)).catch(() => setNotifications([]));
        api.post("/notifications/read").catch(() => {});
    }, [user]);

    if (!ready) return <div className="mx-auto max-w-3xl px-4 py-6"><ListSkeleton rows={3} /></div>;
    if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Login required" message="Log in with your mobile number to manage your account." actionLabel="Login" onAction={() => setAuthOpen(true)} testId="account-login" /></div>;

    const wallet = rewards?.wallet || {};

    const saveName = async () => {
        try { await updateProfile({ name }); toast.success("Profile updated"); }
        catch (e) { toast.error(fmtErr(e)); }
    };

    const changeTheme = async (m) => {
        setMode(m);
        try { await updateProfile({ theme_preference: m }); } catch {}
    };

    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 md:pb-12" data-testid="account-page">
            <h1 className="py-6 font-display text-2xl font-black">Account</h1>

            <div className="sn-card flex items-center gap-4 p-5" data-testid="profile-card">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-display text-xl font-black text-primary-foreground">
                    {(user.name || user.phone || "S")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex gap-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" data-testid="profile-name-input"
                            className="w-full bg-transparent font-display text-lg font-bold outline-none border-b border-transparent focus:border-primary" />
                        <button onClick={saveName} data-testid="profile-save" className="text-xs font-bold text-primary">Save</button>
                    </div>
                    <p className="text-sm text-muted-foreground">+91 {user.phone}</p>
                </div>
            </div>

            <div className="sn-card mt-4 p-5" data-testid="theme-selector">
                <p className="sn-label">Appearance</p>
                <div className="grid grid-cols-3 gap-2">
                    {THEME_OPTIONS.map(({ k, l, icon: Icon }) => (
                        <button key={k} onClick={() => changeTheme(k)} data-testid={`theme-${k}`}
                            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${mode === k ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                            <Icon size={20} />
                            <span className="text-xs font-bold">{l}</span>
                        </button>
                    ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">System follows your device theme automatically.</p>
            </div>

            <Link to="/spin" className="sn-card mt-4 flex items-center gap-4 p-5 transition-colors hover:border-primary/50" data-testid="wallet-card">
                <div className="rounded-full bg-primary/15 p-3 text-primary"><Coins size={22} /></div>
                <div className="flex-1">
                    <p className="font-display text-lg font-black" data-testid="points-balance">{wallet.balance ?? 0} StylePoints</p>
                    <p className="text-xs text-muted-foreground">Earned {wallet.earned ?? 0} · Used {wallet.used ?? 0} · {rewards?.points_per_spin ?? 50} points = 1 spin · Redeem up to 10% of order value at checkout</p>
                </div>
                <span className="sn-btn-primary !px-4 !py-2 text-xs"><Sparkles size={13} /> Spin & Win</span>
            </Link>

            {(rewards?.coupons?.length > 0) && (
                <div className="sn-card mt-4 p-5" data-testid="my-coupons">
                    <p className="sn-label"><Ticket size={12} className="mr-1 inline" /> My Coupons</p>
                    <div className="flex flex-wrap gap-2">
                        {rewards.coupons.map((c) => (
                            <span key={c.id} className="rounded-xl border border-dashed border-primary/60 bg-primary/10 px-3 py-2 text-sm font-extrabold text-primary" data-testid={`my-coupon-${c.code}`}>
                                {c.code} <span className="text-xs font-semibold text-muted-foreground">{c.type === "percent" ? `${c.value}% off` : c.type === "flat" ? `${inr(c.value)} off` : "Free delivery"}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                    { to: "/orders", icon: Package, label: "My Orders", testId: "account-orders" },
                    { to: "/wishlist", icon: Heart, label: "Wishlist", testId: "account-wishlist" },
                    { to: "/checkout", icon: MapPin, label: "Addresses", testId: "account-addresses" },
                    { to: "/spin", icon: Sparkles, label: "Spin & Win", testId: "account-spin" },
                ].map(({ to, icon: Icon, label, testId }) => (
                    <Link key={to} to={to} data-testid={testId} className="sn-card flex items-center gap-3 p-4 font-semibold transition-colors hover:border-primary/50">
                        <Icon size={18} className="text-primary" /> {label}
                    </Link>
                ))}
            </div>

            <div className="sn-card mt-4 p-5" data-testid="notifications-card">
                <p className="sn-label"><Bell size={12} className="mr-1 inline" /> Notifications</p>
                {notifications === null ? <ListSkeleton rows={2} />
                    : notifications.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p>
                    : (
                        <div className="space-y-3">
                            {notifications.slice(0, 8).map((n) => (
                                <div key={n.id} className="flex gap-3 text-sm" data-testid={`notification-${n.id}`}>
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    <div className="min-w-0">
                                        <p className="font-bold">{n.title}</p>
                                        <p className="text-muted-foreground">{n.message}</p>
                                        <p className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            <button onClick={async () => { await logout(); navigate("/"); }} data-testid="logout-btn"
                className="sn-btn-outline mt-6 w-full !border-destructive/40 !text-destructive hover:!border-destructive">
                <LogOut size={15} /> Logout
            </button>

            <div className="mt-10 flex flex-col items-center gap-2 opacity-70">
                <Logo className="h-10" linkTo={null} />
                <p className="text-xs text-muted-foreground">Instant fashion commerce · Bahraich</p>
            </div>
        </div>
    );
}
