import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { api, inr, STATUS_LABELS, STATUS_COLORS, PAYMENT_LABELS } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/StateViews";

export default function OrdersPage() {
    const { user, setAuthOpen } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const load = () => {
        setError(false);
        api.get("/orders").then(({ data }) => setData(data)).catch(() => setError(true));
    };
    useEffect(() => { if (user) load(); }, [user]);

    if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Login required" message="Log in to see your orders." actionLabel="Login" onAction={() => setAuthOpen(true)} /></div>;

    return (
        <div className="mx-auto max-w-4xl px-4 pb-24 md:pb-12" data-testid="orders-page">
            <h1 className="py-6 font-display text-2xl font-black">My Orders</h1>
            {error ? <ErrorState message="Unable to load your orders" onRetry={load} />
                : !data ? <ListSkeleton rows={4} />
                : data.items.length === 0 ? (
                    <EmptyState icon={Package} title="No orders yet" message="Your 30–60 minute fashion deliveries will appear here."
                        actionLabel="Start Shopping" onAction={() => navigate("/products")} testId="orders-empty" />
                ) : (
                    <div className="space-y-3">
                        {data.items.map((o) => (
                            <Link key={o.id} to={`/orders/${o.id}`} data-testid={`order-card-${o.id}`}
                                className="sn-card block p-4 transition-colors hover:border-primary/50">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-display font-bold">{o.id}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_COLORS[o.status] || "bg-secondary"}`} data-testid={`order-status-${o.id}`}>
                                        {STATUS_LABELS[o.status] || o.status}
                                    </span>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${o.payment_status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                                        {PAYMENT_LABELS[o.payment_status] || o.payment_status}
                                    </span>
                                    <span className="ml-auto text-sm font-extrabold">{inr(o.total)}</span>
                                </div>
                                <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                                    {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                            </Link>
                        ))}
                    </div>
                )}
        </div>
    );
}
