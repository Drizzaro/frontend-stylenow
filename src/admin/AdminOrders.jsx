import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api, inr, fmtErr, STATUS_LABELS, STATUS_COLORS } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeletons";
import { Modal } from "@/components/Modal";

const TABS = ["", "placed", "confirmed", "preparing", "packed", "out_for_delivery", "delivered", "cancelled", "returned", "refunded"];
const NEXT = { placed: "confirmed", confirmed: "preparing", preparing: "packed", packed: "out_for_delivery", out_for_delivery: "delivered" };

export default function AdminOrders({ refreshKey = 0 }) {
    const [tab, setTab] = useState("");
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(null);
    const [note, setNote] = useState("");
    const [rider, setRider] = useState({ name: "", phone: "" });

    const load = useCallback(() => {
        setError(false);
        api.get("/admin/orders", { params: { status: tab, limit: 50 } })
            .then(({ data }) => setData(data)).catch(() => setError(true));
    }, [tab]);
    useEffect(() => { load(); }, [load, refreshKey]);

    const setStatus = async (id, status) => {
        try {
            await api.put(`/admin/orders/${id}/status`, { status });
            toast.success(`Order ${id} → ${STATUS_LABELS[status]}`);
            load();
            if (open?.id === id) {
                const { data } = await api.get(`/admin/orders/${id}`);
                setOpen(data.order);
            }
        } catch (e) { toast.error(fmtErr(e)); }
    };

    return (
        <div className="space-y-5" data-testid="admin-orders">
            <h1 className="font-display text-2xl font-black">Order Fulfillment</h1>
            <div className="flex flex-wrap gap-1 border-b border-border" data-testid="order-tabs">
                {TABS.map((t) => (
                    <button key={t || "all"} onClick={() => setTab(t)} data-testid={`order-tab-${t || "all"}`}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        {t ? STATUS_LABELS[t] : "All Orders"}
                        {data && t && <span className="ml-1 rounded-full bg-secondary px-1.5 text-[10px] font-bold">{data.counts?.[t] ?? 0}</span>}
                        {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />}
                    </button>
                ))}
            </div>
            {error ? <div className="sn-card p-10 text-center"><p className="font-bold">Unable to load orders</p><button onClick={load} className="sn-btn-outline mt-3">Retry</button></div>
                : !data ? <TableSkeleton rows={6} cols={6} />
                : data.items.length === 0 ? <div className="sn-card p-10 text-center text-sm text-muted-foreground" data-testid="orders-empty">No orders in this state.</div>
                : (
                    <div className="sn-card overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3">Placed</th><th className="p-3"></th>
                            </tr></thead>
                            <tbody>
                                {data.items.map((o) => (
                                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface" data-testid={`order-row-${o.id}`}>
                                        <td className="p-3 font-bold">{o.id}</td>
                                        <td className="p-3">{o.customer?.name}<br /><span className="text-xs text-muted-foreground">{o.customer?.phone}</span></td>
                                        <td className="p-3">{o.items?.length}</td>
                                        <td className="p-3 font-bold">{inr(o.total)}</td>
                                        <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${o.payment_status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{o.payment_status}</span></td>
                                        <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_COLORS[o.status] || "bg-secondary"}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                                        <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                                        <td className="p-3 text-right">
                                            <button onClick={async () => { const { data } = await api.get(`/admin/orders/${o.id}`); setOpen(data.order); }} data-testid={`order-open-${o.id}`}
                                                className="text-xs font-bold text-primary hover:underline">Open</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `Order ${open.id}` : ""} testId="order-detail-modal" wide>
                {open && (
                    <div className="space-y-5 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="sn-label">Customer</p>
                                <p className="font-bold">{open.customer?.name} · {open.customer?.phone}</p>
                                <p className="mt-1 text-muted-foreground">{open.address?.line1}{open.address?.line2 ? `, ${open.address.line2}` : ""}, {open.address?.city} — {open.address?.pincode}</p>
                            </div>
                            <div>
                                <p className="sn-label">Payment</p>
                                <p className="font-bold capitalize">{open.payment_status} · {open.payment_method}</p>
                                {open.payment_id && <p className="text-xs text-muted-foreground">{open.payment_id}</p>}
                                {open.refund_method && (
                                    <p className="mt-1 rounded-lg bg-warning/10 px-2 py-1.5 text-xs font-semibold text-warning" data-testid="order-refund-info">
                                        Refund to: {open.refund_method === "upi" ? `UPI ${open.refund_details?.upi_id}` : `Bank ${open.refund_details?.account_holder} · ${open.refund_details?.account_number} · ${open.refund_details?.ifsc}`}
                                        {open.refund_status === "pending" && " (pending)"}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="sn-label">Items</p>
                            <div className="space-y-2">
                                {open.items.map((it) => (
                                    <div key={it.variant_id} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2">
                                        <a href={`/product/${it.product_id}`} target="_blank" rel="noopener noreferrer" data-testid={`order-item-link-${it.variant_id}`}
                                            className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75">
                                            <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
                                                {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-primary underline-offset-2 hover:underline">{it.name}</span>
                                                <span className="text-xs text-muted-foreground">{[it.color, it.size].filter(Boolean).join(" · ")} × {it.qty}</span>
                                            </span>
                                        </a>
                                        <span className="font-bold">{inr(it.line_total)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-1 font-black"><span>Total</span><span>{inr(open.total)}</span></div>
                            </div>
                        </div>
                        {open.try_at_doorstep?.enabled && (
                            <div data-testid="admin-try-items">
                                <p className="sn-label">Try at Doorstep ({open.try_at_doorstep.fee > 0 ? `fee ${inr(open.try_at_doorstep.fee)}` : "free"})</p>
                                <div className="space-y-2">
                                    {open.try_at_doorstep.items.map((t) => (
                                        <div key={t.variant_id} className="flex items-center justify-between rounded-xl border border-dashed border-primary/40 px-3 py-2">
                                            <span className="flex items-center gap-3">
                                                <span className="h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-card">{t.image && <img src={t.image} alt="" className="h-full w-full object-cover" />}</span>
                                                <span>{t.name} <span className="text-muted-foreground">({[t.color, t.size].filter(Boolean).join(" · ")})</span></span>
                                            </span>
                                            <span className="text-xs font-bold text-primary">TRY</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="sn-label">Timeline</p>
                            <div className="max-h-40 space-y-2 overflow-y-auto">
                                {[...(open.timeline || [])].reverse().map((t, i) => (
                                    <div key={i} className="flex gap-2 text-xs">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span className="font-semibold capitalize">{STATUS_LABELS[t.status] || t.status}</span>
                                        <span className="text-muted-foreground">{new Date(t.at).toLocaleString("en-IN")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {NEXT[open.status] && (
                                <button onClick={() => setStatus(open.id, NEXT[open.status])} data-testid="order-advance-btn" className="sn-btn-primary !py-2 text-xs">
                                    Mark {STATUS_LABELS[NEXT[open.status]]}
                                </button>
                            )}
                            {!["cancelled", "delivered", "refunded", "returned"].includes(open.status) && (
                                <button onClick={() => setStatus(open.id, "cancelled")} data-testid="order-cancel-btn" className="sn-btn-outline !border-destructive/40 !py-2 text-xs !text-destructive">Cancel Order</button>
                            )}
                            {open.status === "delivered" && open.payment_status === "paid" && (
                                <button onClick={() => setStatus(open.id, "refunded")} data-testid="order-refund-btn" className="sn-btn-outline !py-2 text-xs">Mark Refunded</button>
                            )}
                            {open.status === "cancelled" && open.payment_status === "paid" && (
                                <button onClick={() => setStatus(open.id, "refunded")} data-testid="order-refund-cancelled-btn" className="sn-btn-outline !py-2 text-xs !border-warning/50 !text-warning">Process Refund</button>
                            )}
                        </div>
                        <form onSubmit={async (e) => { e.preventDefault(); try { await api.post(`/admin/orders/${open.id}/rider`, rider); toast.success("Rider assigned"); const { data } = await api.get(`/admin/orders/${open.id}`); setOpen(data.order); } catch (err) { toast.error(fmtErr(err)); } }} className="flex flex-wrap items-end gap-2">
                            <div><label className="sn-label">Rider Name</label><input className="sn-input !py-2" value={rider.name} data-testid="rider-name" onChange={(e) => setRider({ ...rider, name: e.target.value })} required /></div>
                            <div><label className="sn-label">Rider Phone</label><input className="sn-input !py-2" value={rider.phone} data-testid="rider-phone" onChange={(e) => setRider({ ...rider, phone: e.target.value })} required /></div>
                            <button className="sn-btn-outline !py-2 text-xs" data-testid="rider-assign-btn">Assign Rider</button>
                        </form>
                        <form onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await api.post(`/admin/orders/${open.id}/notes`, { note }); setNote(""); toast.success("Note added"); }} className="flex gap-2">
                            <input className="sn-input !py-2" placeholder="Internal note…" value={note} data-testid="order-note-input" onChange={(e) => setNote(e.target.value)} />
                            <button className="sn-btn-outline !py-2 text-xs" data-testid="order-note-btn">Add Note</button>
                        </form>
                    </div>
                )}
            </Modal>
        </div>
    );
}
