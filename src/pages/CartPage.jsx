import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, Tag, X, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { inr, fmtErr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ListSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/StateViews";

export default function CartPage() {
    const { cart, loading, setQty, remove, applyCoupon, removeCoupon } = useCart();
    const { user, setAuthOpen } = useAuth();
    const [code, setCode] = useState("");
    const navigate = useNavigate();

    if (loading) return <div className="mx-auto max-w-5xl px-4 py-6"><ListSkeleton rows={3} /></div>;

    const items = cart.items || [];
    if (!items.length) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                <EmptyState icon={ShoppingBag} title="Your cart is empty" message="Add some styles and get them delivered in 30–60 minutes."
                    actionLabel="Start Shopping" onAction={() => navigate("/products")} testId="cart-empty" />
            </div>
        );
    }

    const discount = cart.discount || 0;
    const total = Math.max(0, cart.subtotal - discount);

    return (
        <div className="mx-auto max-w-5xl px-4 pb-28 md:pb-12" data-testid="cart-page">
            <h1 className="py-6 font-display text-2xl font-black">Your Cart <span className="text-sm font-semibold text-muted-foreground">({items.length} items)</span></h1>
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-3">
                    {items.map((it) => (
                        <div key={`${it.product_id}:${it.variant_id}`} className="sn-card flex gap-4 p-3" data-testid={`cart-item-${it.variant_id}`}>
                            <Link to={`/product/${it.product_id}`} className="h-28 w-22 shrink-0 overflow-hidden rounded-xl bg-surface">
                                {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : null}
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link to={`/product/${it.product_id}`} className="line-clamp-1 text-sm font-bold">{it.name}</Link>
                                <p className="mt-0.5 text-xs text-muted-foreground">{[it.color, it.size].filter(Boolean).join(" · ")}</p>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="font-extrabold">{inr(it.price)}</span>
                                    {it.mrp > it.price && <span className="text-xs text-muted-foreground line-through">{inr(it.mrp)}</span>}
                                </div>
                                {!it.in_stock && <p className="mt-1 text-xs font-bold text-destructive">{it.out_of_stock ? "Out of stock" : `Only ${it.stock} left — reduce quantity`}</p>}
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="flex items-center rounded-full border border-border">
                                        <button onClick={() => setQty(it.product_id, it.variant_id, it.qty - 1)} data-testid={`cart-minus-${it.variant_id}`} className="p-1.5"><Minus size={13} /></button>
                                        <span className="w-7 text-center text-xs font-bold">{it.qty}</span>
                                        <button onClick={() => setQty(it.product_id, it.variant_id, it.qty + 1)} data-testid={`cart-plus-${it.variant_id}`} className="p-1.5"><Plus size={13} /></button>
                                    </div>
                                    <button onClick={() => remove(it.product_id, it.variant_id)} data-testid={`cart-remove-${it.variant_id}`}
                                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right text-sm font-extrabold">{inr(it.line_total)}</div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="sn-card p-4">
                        {cart.coupon_code ? (
                            <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2.5" data-testid="applied-coupon">
                                <span className="flex items-center gap-2 text-sm font-bold text-success"><Tag size={14} /> {cart.coupon_code}</span>
                                <button onClick={removeCoupon} data-testid="remove-coupon" className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
                            </div>
                        ) : (
                            <form onSubmit={async (e) => { e.preventDefault(); try { await applyCoupon(code); toast.success("Coupon applied"); setCode(""); } catch (err) { toast.error(fmtErr(err)); } }} className="flex gap-2">
                                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" data-testid="coupon-input" className="sn-input !py-2" />
                                <button className="sn-btn-outline !px-4 !py-2" data-testid="apply-coupon-btn" disabled={!code.trim()}>Apply</button>
                            </form>
                        )}
                    </div>
                    <div className="sn-card space-y-2 p-5 text-sm" data-testid="cart-summary">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-bold">{inr(cart.subtotal)}</span></div>
                        {discount > 0 && <div className="flex justify-between text-success"><span>Coupon Discount</span><span className="font-bold">−{inr(discount)}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-bold text-success">FREE</span></div>
                        <div className="border-t border-border pt-3 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black" data-testid="cart-total">{inr(total)}</span></div>
                        <p className="text-xs text-muted-foreground">Delivery in 30–60 minutes across Bahraich</p>
                        <button onClick={() => (user ? navigate("/checkout") : setAuthOpen(true))} data-testid="checkout-btn" className="sn-btn-primary w-full !py-3">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
