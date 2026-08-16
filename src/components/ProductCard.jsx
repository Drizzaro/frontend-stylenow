import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { inr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export function ProductCard({ product, wishlisted = false, onWishlistChange }) {
    const { add } = useCart();
    const { user, setAuthOpen } = useAuth();
    const [wished, setWished] = useState(wishlisted);
    const [adding, setAdding] = useState(false);
    const navigate = useNavigate();

    const toggleWish = async (e) => {
        e.preventDefault();
        if (!user) { setAuthOpen(true); return; }
        try {
            if (wished) { await api.delete(`/wishlist/${product.id}`); setWished(false); }
            else { await api.post("/wishlist", { product_id: product.id }); setWished(true); }
            onWishlistChange?.();
        } catch { toast.error("Could not update wishlist"); }
    };

    const quickAdd = async (e) => {
        e.preventDefault();
        setAdding(true);
        try {
            await add(product.id, product.default_variant_id || product.first_variant_id || "", 1);
            toast.success("Added to cart");
        } catch (err) {
            if (err?.response?.status === 400 || err?.response?.status === 404) {
                navigate(`/product/${product.id}`);
            } else toast.error("Could not add to cart");
        } finally { setAdding(false); }
    };

    return (
        <Link to={product.link || `/product/${product.id}`} data-testid={`product-card-${product.card_key || product.id}`}
            className="group block overflow-hidden rounded-2xl border border-border bg-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs font-semibold">StyleNow</div>
                )}
                <button onClick={toggleWish} data-testid={`wishlist-toggle-${product.card_key || product.id}`} aria-label="Wishlist"
                    className={`absolute right-2 top-2 rounded-full p-2 backdrop-blur-md transition-colors ${wished ? "bg-primary text-primary-foreground" : "bg-background/70 text-foreground hover:bg-background"}`}>
                    <Heart size={15} fill={wished ? "currentColor" : "none"} />
                </button>
                {product.color && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-extrabold capitalize backdrop-blur-md" data-testid={`color-chip-${product.card_key || product.id}`}>
                        {product.color}
                    </span>
                )}
                {product.discount_pct > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-extrabold text-background dark:bg-primary dark:text-primary-foreground">
                        {product.discount_pct}% OFF
                    </span>
                )}
                {product.stock === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-destructive/90 py-1 text-center text-[11px] font-bold text-white">Out of Stock</span>
                )}
            </div>
            <div className="space-y-1.5 p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Zap size={11} className="text-primary" /> 30–60 min
                    {product.rating_count > 0 && (
                        <span className="ml-auto flex items-center gap-1 font-semibold text-foreground">
                            <Star size={11} className="fill-warning text-warning" /> {product.rating_avg}
                        </span>
                    )}
                </div>
                <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold">{inr(product.price)}</span>
                    {product.mrp > product.price && <span className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</span>}
                </div>
                {product.stock > 0 && (
                    <button onClick={quickAdd} disabled={adding} data-testid={`quick-add-${product.card_key || product.id}`}
                        className="mt-1 flex w-full items-center justify-center gap-1 rounded-full border border-primary/60 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50">
                        <Plus size={13} /> {adding ? "Adding…" : "Add"}
                    </button>
                )}
            </div>
        </Link>
    );
}
