import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Check, Bike, RotateCcw, XCircle, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr, ORDER_STEPS, STATUS_LABELS, PAYMENT_LABELS } from "@/lib/api";
import { ListSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/StateViews";
import { Modal } from "@/components/Modal";
import { Logo } from "@/components/Logo";

const STEP_ICONS = { placed: Check, confirmed: Check, preparing: Check, packed: Check, out_for_delivery: Bike, delivered: Check };

export default function OrderDetail() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [refundMethod, setRefundMethod] = useState("cash");
    const [refundDetails, setRefundDetails] = useState({ upi_id: "", account_holder: "", account_number: "", ifsc: "" });
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelMethod, setCancelMethod] = useState("upi");
    const [cancelDetails, setCancelDetails] = useState({ upi_id: "", account_holder: "", account_number: "", ifsc: "" });

    const load = useCallback(() => {
        setError(false);
        api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(() => setError(true));
    }, [id]);

    useEffect(() => {
        load();
        const t = setInterval(() => {
            setOrder((o) => {
                if (o && !["delivered", "cancelled", "refunded", "returned"].includes(o.status)) load();
                return o;
            });
        }, 15000);
        return () => clearInterval(t);
    }, [load]);

    if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message="Unable to load this order" onRetry={load} /></div>;
    if (!order) return <div className="mx-auto max-w-3xl px-4 py-6"><ListSkeleton rows={3} /></div>;

    const currentStep = ORDER_STEPS.indexOf(order.status);
    const cancelled = ["cancelled", "returned", "refunded"].includes(order.status);

    const needsRefundDetails = order.payment_method === "online" && order.payment_status === "paid";

    const cancel = async (withDetails = false) => {
        try {
            await api.post(`/orders/${id}/cancel`, withDetails ? { refund_method: cancelMethod, refund_details: cancelDetails } : {});
            toast.success("Order cancelled" + (withDetails ? " — refund will be processed to your given details" : ""));
            setCancelOpen(false);
            load();
        }
        catch (e) { toast.error(fmtErr(e)); }
    };

    const submitReturn = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/orders/${id}/return`, { reason, refund_method: refundMethod, refund_details: refundDetails });
            toast.success("Return requested"); setReturnOpen(false); load();
        }
        catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 md:pb-12" data-testid="order-detail-page">
            {params.get("placed") && (
                <div className="mt-6 flex items-center gap-4 rounded-3xl border border-success/30 bg-success/10 p-5 animate-fade-up" data-testid="order-success-banner">
                    <div className="rounded-full bg-success p-2.5 text-white"><PartyPopper size={20} /></div>
                    <div>
                        <h2 className="font-display text-lg font-black text-success">Order Confirmed!</h2>
                        <p className="text-sm text-muted-foreground">Estimated delivery: {order.eta}</p>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between py-6">
                <div>
                    <h1 className="font-display text-2xl font-black" data-testid="order-id">Order {order.id}</h1>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("en-IN")}</p>
                </div>
                <Logo className="h-8" linkTo={null} />
            </div>

            {!cancelled ? (
                <div className="sn-card p-6" data-testid="order-tracker">
                    <div className="flex items-center justify-between">
                        {ORDER_STEPS.map((s, i) => {
                            const Icon = STEP_ICONS[s];
                            const done = currentStep >= i;
                            return (
                                <div key={s} className="flex flex-1 items-center last:flex-none">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                                            <Icon size={15} />
                                        </div>
                                        <span className={`text-center text-[9px] font-bold leading-tight ${done ? "text-primary" : "text-muted-foreground"}`}>{STATUS_LABELS[s]}</span>
                                    </div>
                                    {i < ORDER_STEPS.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 rounded ${currentStep > i ? "bg-primary" : "bg-border"}`} />}
                                </div>
                            );
                        })}
                    </div>
                    {order.rider && (
                        <p className="mt-4 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold" data-testid="rider-info">
                            <Bike size={14} className="mr-1 inline text-primary" /> Rider: {order.rider.name} · {order.rider.phone}
                        </p>
                    )}
                    <p className="mt-3 text-sm text-muted-foreground">Estimated arrival: <span className="font-bold text-foreground">{order.eta}</span></p>
                </div>
            ) : (
                <div className="sn-card border-destructive/30 p-5 text-center" data-testid="order-cancelled-banner">
                    <XCircle size={22} className="mx-auto text-destructive" />
                    <p className="mt-2 font-bold capitalize">{STATUS_LABELS[order.status]}</p>
                </div>
            )}

            <div className="sn-card mt-4 space-y-3 p-5">
                <h3 className="font-display font-bold">Items</h3>
                {order.items.map((it) => (
                    <div key={it.variant_id} className="flex items-center gap-3 text-sm">
                        <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                            {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-semibold">{it.name}</p>
                            <p className="text-xs text-muted-foreground">{[it.color, it.size].filter(Boolean).join(" · ")} × {it.qty}</p>
                        </div>
                        <span className="font-bold">{inr(it.line_total)}</span>
                    </div>
                ))}
                <div className="space-y-1 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
                    {order.discount > 0 && <div className="flex justify-between text-success"><span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span><span>−{inr(order.discount)}</span></div>}
                    <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="font-bold text-success">FREE</span></div>
                    <div className="flex justify-between pt-1 text-base font-black"><span>Total</span><span>{inr(order.total)}</span></div>
                    <p className="text-xs text-muted-foreground">Payment: {PAYMENT_LABELS[order.payment_status] || order.payment_status}</p>
                </div>
            </div>

            {order.try_at_doorstep?.enabled && (
                <div className="sn-card mt-4 p-5" data-testid="try-items-card">
                    <h3 className="mb-2 font-display font-bold">Try at Doorstep</h3>
                    <p className="mb-2 text-xs text-muted-foreground">You were not charged for these items. Try them when the rider arrives — pay in cash for what you keep{order.try_at_doorstep.fee > 0 ? `; the ${inr(order.try_at_doorstep.fee)} try fee applies even if you decline everything` : ""}.</p>
                    <div className="space-y-2">
                        {order.try_at_doorstep.items.map((t) => (
                            <div key={t.variant_id} className="flex items-center gap-3 text-sm" data-testid={`try-item-${t.variant_id}`}>
                                <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                                    {t.image && <img src={t.image} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-1 font-semibold">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{[t.color, t.size].filter(Boolean).join(" · ")}{t.qty ? ` × ${t.qty}` : ""}</p>
                                </div>
                                {t.outcome === "kept" ? <span className="text-xs font-bold text-success" data-testid={`try-outcome-${t.variant_id}`}>Kept · paid {inr(t.line_total || 0)}</span>
                                    : t.outcome === "declined" ? <span className="text-xs font-bold text-muted-foreground" data-testid={`try-outcome-${t.variant_id}`}>Returned with rider</span>
                                    : t.line_total != null ? <span className="text-xs font-bold text-primary" data-testid={`try-outcome-${t.variant_id}`}>Pay {inr(t.line_total)} if kept</span> : null}
                            </div>
                        ))}
                        <p className="pt-1 text-xs font-bold">{order.try_at_doorstep.fee > 0 ? `Try fee: ${inr(order.try_at_doorstep.fee)}` : "Free with this order"}</p>
                    </div>
                </div>
            )}

            <div className="sn-card mt-4 p-5">
                <h3 className="mb-2 font-display font-bold">Delivery Address</h3>
                <p className="text-sm font-semibold">{order.address.name} · {order.address.phone}</p>
                <p className="text-sm text-muted-foreground">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city} — {order.address.pincode}</p>
            </div>

            <div className="sn-card mt-4 p-5" data-testid="order-timeline">
                <h3 className="mb-3 font-display font-bold">Timeline</h3>
                <div className="space-y-3">
                    {[...(order.timeline || [])].reverse().map((t, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <div>
                                <p className="font-semibold capitalize">{STATUS_LABELS[t.status] || t.status}{t.note ? ` — ${t.note}` : ""}</p>
                                <p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                {["placed", "confirmed"].includes(order.status) && (
                    <button onClick={() => (needsRefundDetails ? setCancelOpen(true) : cancel(false))} data-testid="cancel-order-btn" className="sn-btn-outline !border-destructive/40 !text-destructive hover:!border-destructive">Cancel Order</button>
                )}
                {order.status === "delivered" && (
                    <button onClick={() => setReturnOpen(true)} data-testid="return-order-btn" className="sn-btn-outline"><RotateCcw size={14} /> Request Return</button>
                )}
                <Link to="/products" className="sn-btn-primary">Shop Again</Link>
            </div>

            <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Request Return" testId="return-modal">
                <form onSubmit={submitReturn} className="space-y-4">
                    <textarea className="sn-input" rows={3} required placeholder="Why are you returning this order?" value={reason}
                        data-testid="return-reason" onChange={(e) => setReason(e.target.value)} />
                    <div>
                        <p className="sn-label">Refund Method</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[["cash", "Cash"], ["upi", "UPI"], ["bank", "Bank Transfer"]].map(([k, l]) => (
                                <button type="button" key={k} onClick={() => setRefundMethod(k)} data-testid={`refund-method-${k}`}
                                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${refundMethod === k ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        {refundMethod === "cash" && <p className="mt-2 text-xs text-muted-foreground">Get cash back when the rider picks up your return. Nothing else needed.</p>}
                        {refundMethod === "upi" && (
                            <input className="sn-input mt-3" placeholder="yourname@upi" value={refundDetails.upi_id} required
                                data-testid="refund-upi" onChange={(e) => setRefundDetails({ ...refundDetails, upi_id: e.target.value })} />
                        )}
                        {refundMethod === "bank" && (
                            <div className="mt-3 space-y-2">
                                <input className="sn-input" placeholder="Account holder name" value={refundDetails.account_holder} required
                                    data-testid="refund-ac-holder" onChange={(e) => setRefundDetails({ ...refundDetails, account_holder: e.target.value })} />
                                <input className="sn-input" placeholder="Account number" value={refundDetails.account_number} required
                                    data-testid="refund-ac-number" onChange={(e) => setRefundDetails({ ...refundDetails, account_number: e.target.value.replace(/\D/g, "") })} />
                                <input className="sn-input" placeholder="IFSC code" value={refundDetails.ifsc} required
                                    data-testid="refund-ifsc" onChange={(e) => setRefundDetails({ ...refundDetails, ifsc: e.target.value.toUpperCase() })} />
                            </div>
                        )}
                    </div>
                    <button className="sn-btn-primary w-full" data-testid="return-submit">Submit Return Request</button>
                </form>
            </Modal>

            <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order & Refund" testId="cancel-modal">
                <form onSubmit={(e) => { e.preventDefault(); cancel(true); }} className="space-y-4">
                    <p className="text-sm text-muted-foreground">You paid <span className="font-bold text-foreground">{inr(order.total)}</span> online. Tell us where to send your refund.</p>
                    <div>
                        <p className="sn-label">Refund Method</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[["upi", "UPI"], ["bank", "Bank / Netbanking"]].map(([k, l]) => (
                                <button type="button" key={k} onClick={() => setCancelMethod(k)} data-testid={`cancel-refund-${k}`}
                                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${cancelMethod === k ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        {cancelMethod === "upi" && (
                            <input className="sn-input mt-3" placeholder="yourname@upi" value={cancelDetails.upi_id} required
                                data-testid="cancel-refund-upi" onChange={(e) => setCancelDetails({ ...cancelDetails, upi_id: e.target.value })} />
                        )}
                        {cancelMethod === "bank" && (
                            <div className="mt-3 space-y-2">
                                <input className="sn-input" placeholder="Account holder name" value={cancelDetails.account_holder} required
                                    data-testid="cancel-refund-ac-holder" onChange={(e) => setCancelDetails({ ...cancelDetails, account_holder: e.target.value })} />
                                <input className="sn-input" placeholder="Account number" value={cancelDetails.account_number} required
                                    data-testid="cancel-refund-ac-number" onChange={(e) => setCancelDetails({ ...cancelDetails, account_number: e.target.value.replace(/\D/g, "") })} />
                                <input className="sn-input" placeholder="IFSC code" value={cancelDetails.ifsc} required
                                    data-testid="cancel-refund-ifsc" onChange={(e) => setCancelDetails({ ...cancelDetails, ifsc: e.target.value.toUpperCase() })} />
                            </div>
                        )}
                    </div>
                    <button className="sn-btn-primary w-full !bg-destructive" data-testid="cancel-confirm-btn">Cancel Order & Request Refund</button>
                </form>
            </Modal>
        </div>
    );
}
