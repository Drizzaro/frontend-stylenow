import { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { IndianRupee, ShoppingCart, Users, AlertTriangle, PackageX, Truck } from "lucide-react";
import { api, inr } from "@/lib/api";
import { TableSkeleton, Skeleton } from "@/components/Skeletons";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        setError(false);
        api.get("/admin/overview").then(({ data }) => setData(data)).catch(() => setError(true));
    }, []);
    useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

    if (error) return <div className="sn-card p-10 text-center"><p className="font-bold">Unable to load dashboard</p><button onClick={load} className="sn-btn-outline mt-3" data-testid="dashboard-retry">Retry</button></div>;
    if (!data) return <div className="space-y-6"><div className="grid grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><TableSkeleton /></div>;

    const kpis = [
        { label: "Orders Today", value: data.today.orders, icon: ShoppingCart },
        { label: "Revenue Today", value: inr(data.today.revenue), icon: IndianRupee },
        { label: "Avg Order Value", value: inr(data.today.aov), icon: IndianRupee },
        { label: "New Customers", value: data.today.new_customers, icon: Users },
        { label: "Pending (Placed)", value: data.today.placed, icon: ShoppingCart },
        { label: "Out for Delivery", value: data.today.out_for_delivery, icon: Truck },
        { label: "Delivered", value: data.today.delivered, icon: ShoppingCart },
        { label: "Cancelled", value: data.today.cancelled, icon: PackageX },
    ];

    return (
        <div className="space-y-6" data-testid="admin-dashboard">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-2xl font-black">Overview</h1>
                    <p className="text-sm text-muted-foreground">Live numbers from your store · auto-refreshes every 30s</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                    <p>All-time: <b className="text-foreground">{data.totals.orders}</b> orders · <b className="text-foreground">{data.totals.customers}</b> customers · <b className="text-foreground">{data.totals.products}</b> products</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="sn-card p-4" data-testid={`kpi-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                            <Icon size={15} className="text-primary" />
                        </div>
                        <p className="mt-2 font-display text-2xl font-black">{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="sn-card p-5 xl:col-span-2" data-testid="revenue-chart">
                    <h3 className="mb-4 font-display font-bold">Revenue & Orders — Last 14 Days</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={data.chart}>
                            <defs>
                                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#BD8EE4" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#BD8EE4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
                            <Area type="monotone" dataKey="revenue" stroke="#BD8EE4" strokeWidth={2.5} fill="url(#rev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="sn-card p-5" data-testid="top-products">
                    <h3 className="mb-4 font-display font-bold">Top Products</h3>
                    {data.top_products.length === 0 ? <p className="text-sm text-muted-foreground">No sales yet.</p> : (
                        <div className="space-y-3">
                            {data.top_products.map((p, i) => (
                                <div key={p.name} className="flex items-center gap-3 text-sm">
                                    <span className="w-5 font-display font-black text-primary">{i + 1}</span>
                                    <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                                    <span className="text-muted-foreground">{p.order_count} sold</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="sn-card p-5" data-testid="low-stock-panel">
                    <h3 className="mb-3 flex items-center gap-2 font-display font-bold"><AlertTriangle size={16} className="text-warning" /> Low Stock ({data.low_stock.length})</h3>
                    {data.low_stock.length === 0 ? <p className="text-sm text-muted-foreground">All variants healthy.</p> : (
                        <div className="max-h-56 space-y-2 overflow-y-auto">
                            {data.low_stock.map((l, i) => (
                                <div key={i} className="flex justify-between rounded-xl bg-warning/10 px-3 py-2 text-sm">
                                    <span className="font-semibold">{l.name} <span className="text-muted-foreground">({l.variant})</span></span>
                                    <span className="font-bold text-warning">{l.stock} left</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="sn-card p-5" data-testid="out-stock-panel">
                    <h3 className="mb-3 flex items-center gap-2 font-display font-bold"><PackageX size={16} className="text-destructive" /> Out of Stock ({data.out_of_stock.length})</h3>
                    {data.out_of_stock.length === 0 ? <p className="text-sm text-muted-foreground">Nothing is out of stock.</p> : (
                        <div className="max-h-56 space-y-2 overflow-y-auto">
                            {data.out_of_stock.map((l, i) => (
                                <div key={i} className="flex justify-between rounded-xl bg-destructive/10 px-3 py-2 text-sm">
                                    <span className="font-semibold">{l.name} <span className="text-muted-foreground">({l.variant})</span></span>
                                    <span className="font-bold text-destructive">0</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
