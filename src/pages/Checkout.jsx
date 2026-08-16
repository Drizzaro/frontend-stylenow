import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Plus, Zap, ShieldCheck, Wallet, Banknote, CreditCard, Coins, Shirt } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Logo } from "@/components/Logo";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/StateViews";

const EMPTY_ADDR = { name: "", phone: "", line1: "", line2: "", landmark: "", city: "Bahraich", pincode: "" };

function loadRazorpay() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

export default function Checkout() {
    const { user, setAuthOpen } = useAuth();
    const { refresh } = useCart();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState(null);
    const [addressId, setAddressId] = useState("");
    const [form, setForm] = useState(EMPTY_ADDR);
    const [showForm, setShowForm] = useState(false);
    const [quote, setQuote] = useState(null);
    const [config, setConfig] = useState(null);
    const [method, setMethod] = useState("online");
    const [redeem, setRedeem] = useState(false);
    const [tryOn, setTryOn] = useState(false);
    const [trySel, setTrySel] = useState({});
    const [busy, setBusy] = useState(false);

    const tryItems = Object.keys(trySel).filter((k) => trySel[k]).slice(0, 2)
        .map((vid) => { const it = (quote?.items || []).find((x) => x.variant_id === vid); return it ? { product_id: it.product_id, variant_id: vid } : null; })
        .filter(Boolean);

    const loadQuote = useCallback(async (redeemFlag, items) => {
        const { data: q } = await api.post("/checkout/quote", { redeem_points: redeemFlag, try_items: items || [] });
        setQuote(q);
    }, []);

    const load = useCallback(async () => {
        try {
            const [{ data: addr }, { data: cfg }] = await Promise.all([api.get("/addresses"), api.get("/config")]);
            setAddresses(addr.items);
            const def = addr.items.find((a) => a.is_default) || addr.items[0];
            if (def) setAddressId(def.id); else setShowForm(true);
            setConfig(cfg);
            await loadQuote(false, []);
        } catch (e) {
            if (e?.response?.status === 401) { setAuthOpen(true); return; }
            toast.error(fmtErr(e));
        }
    }, [setAuthOpen, loadQuote]);

    useEffect(() => { if (user) load(); }, [user, load]);

    const toggleRedeem = async (v) => {
        setRedeem(v);
        try { await loadQuote(v, tryOn ? tryItems : []); } catch (e) { toast.error(fmtErr(e)); }
    };

    const toggleTry = async (v) => {
        setTryOn(v);
        if (!v) setTrySel({});
        try { await loadQuote(redeem, []); } catch (e) { toast.error(fmtErr(e)); }
    };

    const toggleTryItem = async (it) => {
        const next = { ...trySel };
        if (next[it.variant_id]) delete next[it.variant_id];
        else {
            if (Object.keys(next).length >= 2) { toast.error("You can try up to 2 items at your doorstep"); return; }
            next[it.variant_id] = true;
        }
        setTrySel(next);
        const items = Object.keys(next).slice(0, 2)
            .map((vid) => { const x = (quote?.items || []).find((i) => i.variant_id === vid); return x ? { product_id: x.product_id, variant_id: vid } : null; })
            .filter(Boolean);
        try { await loadQuote(redeem, items); } catch (e) { toast.error(fmtErr(e)); }
    };

    if (!user) {
        return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Login required" message="Please log in to checkout." actionLabel="Login" onAction={() => setAuthOpen(true)} testId="checkout-login" /></div>;
    }
    if (!quote || addresses === null) return <div className="mx-auto max-w-5xl px-4 py-6"><ListSkeleton rows={3} /></div>;

    const saveAddress = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("/addresses", form);
            toast.success("Address saved");
            setForm(EMPTY_ADDR); setShowForm(false);
            const { data: addr } = await api.get("/addresses");
            setAddresses(addr.items);
            setAddressId(data.address.id);
        } catch (err) { toast.error(fmtErr(err)); }
    };

    const pay = async () => {
        if (!addressId) { toast.error("Please add a delivery address"); return; }
        setBusy(true);
        try {
            const { data } = await api.post("/orders", {
                address_id: addressId, payment_method: method, redeem_points: redeem,
                try_items: tryOn ? tryItems : [],
            });
            const { order, payment } = data;
            if (payment.mode === "cod") {
                await refresh();
                navigate(`/orders/${order.id}?placed=1`);
                return;
            }
            if (payment.mode === "razorpay") {
                const ok = await loadRazorpay();
                if (!ok) throw new Error("Could not load payment gateway");
                const rzp = new window.Razorpay({
                    key: payment.key_id, amount: payment.amount, currency: payment.currency,
                    name: "StyleNow", description: `Order ${order.id}`, order_id: payment.razorpay_order_id,
                    prefill: { contact: user.phone, name: user.name || "" },
                    theme: { color: "#BD8EE4" },
                    handler: async (resp) => {
                        try {
                            await api.post(`/orders/${order.id}/verify-payment`, {
                                razorpay_payment_id: resp.razorpay_payment_id,
                                razorpay_signature: resp.razorpay_signature,
                            });
                            await refresh();
                            navigate(`/orders/${order.id}?placed=1`);
                        } catch (err) { toast.error(fmtErr(err, "Payment verification failed")); }
                    },
                });
                rzp.open();
            } else {
                await api.post(`/orders/${order.id}/verify-payment`, { simulated: true });
                await refresh();
                navigate(`/orders/${order.id}?placed=1`);
            }
        } catch (err) {
            toast.error(fmtErr(err));
        } finally { setBusy(false); }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 pb-28 md:pb-12" data-testid="checkout-page">
            <div className="flex items-center gap-3 py-6">
                <Logo className="h-8" linkTo={null} />
                <h1 className="font-display text-2xl font-black">Checkout</h1>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">Delivery Address</h2>
                    {addresses.map((a) => (
                        <button key={a.id} onClick={() => setAddressId(a.id)} data-testid={`address-${a.id}`}
                            className={`block w-full rounded-2xl border p-4 text-left transition-colors ${addressId === a.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                            <div className="flex items-center gap-2 font-bold"><MapPin size={14} className="text-primary" /> {a.name} · {a.phone}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} — {a.pincode}</p>
                        </button>
                    ))}
                    {showForm ? (
                        <form onSubmit={saveAddress} className="sn-card space-y-3 p-5" data-testid="address-form">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input className="sn-input" placeholder="Full name" required value={form.name} data-testid="addr-name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                <input className="sn-input" placeholder="Phone" required maxLength={10} value={form.phone} data-testid="addr-phone" onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
                            </div>
                            <input className="sn-input" placeholder="House no, street" required value={form.line1} data-testid="addr-line1" onChange={(e) => setForm({ ...form, line1: e.target.value })} />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input className="sn-input" placeholder="Area / Landmark" value={form.landmark} data-testid="addr-landmark" onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
                                <input className="sn-input" placeholder="Pincode" required maxLength={6} value={form.pincode} data-testid="addr-pincode" onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} />
                            </div>
                            <div className="flex gap-2">
                                <button className="sn-btn-primary" data-testid="addr-save">Save Address</button>
                                {addresses.length > 0 && <button type="button" onClick={() => setShowForm(false)} className="sn-btn-outline">Cancel</button>}
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setShowForm(true)} data-testid="add-address-btn" className="sn-btn-outline"><Plus size={15} /> Add New Address</button>
                    )}

                    <h2 className="pt-2 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">Payment Method</h2>
                    <div className="space-y-2" data-testid="payment-methods">
                        <button onClick={() => setMethod("online")} data-testid="pay-method-online"
                            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${method === "online" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                            <CreditCard size={18} className="text-primary" />
                            <div className="flex-1">
                                <p className="text-sm font-bold">Pay Online</p>
                                <p className="text-xs text-muted-foreground">{config?.payment_mode === "razorpay" ? "UPI, cards & more via Razorpay" : "Secure online payment (test mode)"}</p>
                            </div>
                        </button>
                        <button onClick={() => setMethod("cod")} data-testid="pay-method-cod"
                            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${method === "cod" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                            <Banknote size={18} className="text-primary" />
                            <div className="flex-1">
                                <p className="text-sm font-bold">Cash on Delivery</p>
                                <p className="text-xs text-muted-foreground">Pay when your order arrives in 30–60 min</p>
                            </div>
                        </button>
                    </div>

                    {quote.try_enabled && (
                        <div className={`rounded-2xl border p-4 transition-colors ${tryOn ? "border-primary bg-primary/10" : "border-border bg-card"}`} data-testid="try-doorstep-card">
                            <button onClick={() => toggleTry(!tryOn)} data-testid="try-toggle" className="flex w-full items-center gap-3 text-left">
                                <Shirt size={18} className="text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Try at Doorstep</p>
                                    <p className="text-xs text-muted-foreground">
                                        Pick up to 2 items to try first — you won't be charged for them now · {(quote.subtotal - quote.discount) >= quote.try_threshold ? <span className="font-bold text-success">FREE (order above {inr(quote.try_threshold)})</span> : `${inr(quote.try_fee || config?.try_at_doorstep_fee || 50)} try fee (free above ${inr(quote.try_threshold)})`}
                                    </p>
                                </div>
                                <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${tryOn ? "bg-primary" : "bg-border"}`}>
                                    <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${tryOn ? "translate-x-4" : ""}`} />
                                </span>
                            </button>
                            {tryOn && (
                                <div className="mt-3 space-y-2 border-t border-border pt-3">
                                    <p className="text-xs text-muted-foreground">Try these when the rider arrives. Pay for what you keep — declined items go back with the rider.{quote.try_fee > 0 ? " The try fee applies even if you decline everything." : ""}</p>
                                    {quote.items.map((it) => {
                                        const on = !!trySel[it.variant_id];
                                        return (
                                            <button type="button" key={it.variant_id} onClick={() => toggleTryItem(it)} data-testid={`try-item-${it.variant_id}`}
                                                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${on ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{on ? "✓" : ""}</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-semibold">{it.name}</span>
                                                    <span className="text-xs text-muted-foreground">{[it.color, it.size].filter(Boolean).join(" · ")} × {it.qty}</span>
                                                </span>
                                                {on
                                                    ? <span className="text-xs font-bold text-primary">Pay {inr(it.line_total)} at doorstep if kept</span>
                                                    : <span className="text-xs font-bold">{inr(it.line_total)}</span>}
                                            </button>
                                        );
                                    })}
                                    {(quote.try_items || []).length > 0 && (
                                        <p className="text-xs font-bold" data-testid="try-fee-note">
                                            {quote.try_fee === 0 ? <span className="text-success">Try at Doorstep is FREE for this order</span> : <span className="text-warning">Try at Doorstep fee: {inr(quote.try_fee)} (order below {inr(quote.try_threshold)})</span>}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {quote.points_balance > 0 && (
                        <button onClick={() => toggleRedeem(!redeem)} data-testid="redeem-points-toggle"
                            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${redeem ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}>
                            <Coins size={18} className="text-primary" />
                            <div className="flex-1">
                                <p className="text-sm font-bold">Use StylePoints ({quote.points_balance} available)</p>
                                <p className="text-xs text-muted-foreground">Redeem up to 10% of order value{redeem && quote.points_used > 0 ? ` — using ${quote.points_used} points (−${inr(quote.points_discount)})` : ""}</p>
                            </div>
                            <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${redeem ? "bg-primary" : "bg-border"}`}>
                                <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${redeem ? "translate-x-4" : ""}`} />
                            </span>
                        </button>
                    )}

                    <div className="sn-card flex items-center gap-3 p-4">
                        <Zap size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-bold">Estimated delivery: {quote.eta}</p>
                            <p className="text-xs text-muted-foreground">Hyperlocal fulfillment from StyleNow Bahraich Central</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="sn-card space-y-3 p-5" data-testid="order-summary">
                        <h3 className="font-display font-bold">Order Summary</h3>
                        <div className="max-h-52 space-y-2 overflow-y-auto">
                            {quote.items.filter((it) => !(quote.try_items || []).some((t) => t.variant_id === it.variant_id)).map((it) => (
                                <div key={it.variant_id} className="flex items-center gap-3 text-sm">
                                    <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                                        {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-1 font-semibold">{it.name}</p>
                                        <p className="text-xs text-muted-foreground">{[it.color, it.size].filter(Boolean).join(" · ")} × {it.qty}</p>
                                    </div>
                                    <span className="font-bold">{inr(it.line_total)}</span>
                                </div>
                            ))}
                            {(quote.try_items || []).map((it) => (
                                <div key={`try-${it.variant_id}`} className="flex items-center gap-3 text-sm" data-testid={`summary-try-${it.variant_id}`}>
                                    <div className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-primary/50 bg-surface">
                                        {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <Shirt size={14} className="text-primary" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-1 font-semibold">{it.name}</p>
                                        <p className="text-xs text-primary">Try at doorstep · not billed now</p>
                                    </div>
                                    <span className="text-xs font-bold text-primary">{inr(it.line_total)} if kept</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal{(quote.try_items || []).length > 0 ? " (billed now)" : ""}</span><span>{inr(quote.subtotal)}</span></div>
                            {quote.discount > 0 && <div className="flex justify-between text-success"><span>Coupon {quote.coupon ? `(${quote.coupon.code})` : ""}</span><span>−{inr(quote.discount)}</span></div>}
                            {quote.points_discount > 0 && <div className="flex justify-between text-success" data-testid="points-discount-row"><span>StylePoints ({quote.points_used} pts)</span><span>−{inr(quote.points_discount)}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-bold text-success">FREE</span></div>
                            {(quote.try_items || []).length > 0 && (
                                <div className="flex justify-between" data-testid="try-fee-row">
                                    <span className="text-muted-foreground">Try at Doorstep</span>
                                    {quote.try_fee === 0 ? <span className="font-bold text-success">FREE</span> : <span className="font-bold">+{inr(quote.try_fee)}</span>}
                                </div>
                            )}
                            <div className="flex justify-between border-t border-border pt-2 text-base font-black"><span>Total</span><span data-testid="checkout-total">{inr(quote.total)}</span></div>
                            {(quote.try_items || []).length > 0 && (
                                <p className="text-xs text-muted-foreground" data-testid="try-doorstep-note">Kept try items ({inr(quote.try_total || 0)}) are paid in cash at delivery.</p>
                            )}
                        </div>
                        <button onClick={pay} disabled={busy || !quote.items.length} data-testid="pay-btn" className="sn-btn-primary w-full !py-3">
                            {busy ? "Processing…"
                                : method === "cod" ? `Place Order — Pay ${inr(quote.total)} on Delivery`
                                : config?.payment_mode === "razorpay" ? `Pay ${inr(quote.total)} with Razorpay`
                                : `Pay ${inr(quote.total)} (Test Mode)`}
                        </button>
                        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                            {method === "cod" ? <><Wallet size={13} /> No advance payment needed</> : <><ShieldCheck size={13} /> Payments verified securely on our servers</>}
                        </p>
                    </div>
                    <Link to="/cart" className="block text-center text-sm font-bold text-primary">← Back to cart</Link>
                </div>
            </div>
        </div>
    );
}
