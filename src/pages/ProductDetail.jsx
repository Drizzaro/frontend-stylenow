import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useRef } from "react";
import { Heart, Star, Zap, Truck, RotateCcw, ShieldCheck, Minus, Plus, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { api, inr, fmtErr, uploadUserFile } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { DetailSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/StateViews";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { add } = useCart();
    const { user, setAuthOpen } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [qty, setQty] = useState(1);
    const [imgIdx, setImgIdx] = useState(0);
    const [wished, setWished] = useState(false);
    const [searchParams] = useSearchParams();
    const [review, setReview] = useState({ rating: 5, comment: "" });
    const [reviewImages, setReviewImages] = useState([]);
    const [uploadingImg, setUploadingImg] = useState(false);
    const reviewFileRef = useRef(null);

    const onReviewImage = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (reviewImages.length >= 4) { toast.error("Max 4 photos per review"); return; }
        setUploadingImg(true);
        try {
            const { url } = await uploadUserFile(f);
            setReviewImages((imgs) => [...imgs, url]);
        } catch (err) { toast.error(fmtErr(err, "Upload failed")); }
        finally { setUploadingImg(false); }
    };

    const load = () => {
        setError(false);
        api.get(`/products/${id}`).then(({ data }) => {
            setData(data);
            const vs = data.product.variants || [];
            const pre = (searchParams.get("color") || "").toLowerCase();
            const preV = pre ? vs.find((v) => (v.color || "").toLowerCase() === pre) : null;
            const first = preV || vs.find((v) => v.stock > 0) || vs[0];
            if (first) { setColor(first.color || ""); setSize(first.size || ""); }
        }).catch(() => setError(true));
    };
    useEffect(() => { setData(null); load(); window.scrollTo(0, 0); }, [id]);

    useEffect(() => {
        if (user) api.get("/wishlist").then(({ data }) => setWished(data.items.some((i) => i.id === id))).catch(() => {});
    }, [user, id]);

    const product = data?.product;
    const variants = product?.variants || [];
    const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))], [variants]);
    const sizesForColor = useMemo(() => variants.filter((v) => !color || v.color === color), [variants, color]);
    const selected = variants.find((v) => (v.color || "") === color && (v.size || "") === size) || sizesForColor[0];
    const images = useMemo(() => {
        const byColor = variants.filter((v) => v.color === color).flatMap((v) => v.images || []);
        const all = [...byColor, ...(product?.images || [])];
        return [...new Set(all.filter(Boolean))];
    }, [variants, color, product]);

    if (error) return <div className="mx-auto max-w-7xl px-4 py-10"><ErrorState message="Unable to load this product" onRetry={load} /></div>;
    if (!product) return <div className="mx-auto max-w-7xl px-4"><DetailSkeleton /></div>;

    const discount = selected?.mrp > selected?.price ? Math.round(((selected.mrp - selected.price) / selected.mrp) * 100) : 0;

    const addToCart = async (buyNow = false) => {
        if (!selected) return;
        try {
            await add(product.id, selected.id, qty);
            toast.success("Added to cart");
            if (buyNow) navigate("/checkout");
        } catch (e) { toast.error(fmtErr(e, "Could not add to cart")); }
    };

    const toggleWish = async () => {
        if (!user) { setAuthOpen(true); return; }
        try {
            if (wished) { await api.delete(`/wishlist/${id}`); setWished(false); }
            else { await api.post("/wishlist", { product_id: id }); setWished(true); toast.success("Saved to wishlist"); }
        } catch { toast.error("Could not update wishlist"); }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/products/${id}/reviews`, { ...review, images: reviewImages });
            toast.success("Review submitted");
            setReview({ rating: 5, comment: "" });
            setReviewImages([]);
            load();
        } catch (err) { toast.error(fmtErr(err)); }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 pb-24 md:pb-12" data-testid="product-page">
            <div className="grid gap-8 py-6 lg:grid-cols-2">
                <div>
                    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
                        {images[imgIdx] ? (
                            <img key={images[imgIdx]} src={images[imgIdx]} alt={product.name} className="sn-fade aspect-[3/4] w-full object-cover" data-testid="product-image" />
                        ) : (
                            <div className="flex aspect-[3/4] items-center justify-center text-muted-foreground">StyleNow</div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                            {images.map((im, i) => (
                                <button key={i} onClick={() => setImgIdx(i)} onMouseEnter={() => setImgIdx(i)} data-testid={`thumb-${i}`}
                                    className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${i === imgIdx ? "border-primary" : "border-border"}`}>
                                    <img src={im} alt="" className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                    <div>
                        {product.brand && <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{product.brand}</p>}
                        <h1 className="mt-1 font-display text-2xl font-black tracking-tight md:text-3xl" data-testid="product-name">{product.name}</h1>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                            {data.summary.rating_count > 0 && (
                                <span className="flex items-center gap-1 font-bold"><Star size={14} className="fill-warning text-warning" /> {data.summary.rating_avg} <span className="font-normal text-muted-foreground">({data.summary.rating_count})</span></span>
                            )}
                            <span className="sn-chip"><Zap size={11} className="text-primary" /> 30–60 min delivery</span>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black" data-testid="product-price">{inr(selected?.price)}</span>
                        {discount > 0 && <><span className="text-lg text-muted-foreground line-through">{inr(selected?.mrp)}</span>
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-extrabold text-success">{discount}% OFF</span></>}
                    </div>
                    <p className="text-xs text-muted-foreground">Inclusive of all taxes · Free delivery</p>

                    {colors.length > 0 && (
                        <div>
                            <p className="sn-label">Color — {color}</p>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <button key={c} onClick={() => { setColor(c); setImgIdx(0); const vs = variants.filter((v) => v.color === c); if (!vs.some((v) => v.size === size)) setSize(vs[0]?.size || ""); }}
                                        data-testid={`color-${c}`}
                                        className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-colors ${color === c ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {sizesForColor.length > 0 && (
                        <div>
                            <p className="sn-label">Size</p>
                            <div className="flex flex-wrap gap-2">
                                {sizesForColor.map((v) => (
                                    <button key={v.id} onClick={() => setSize(v.size)} disabled={v.stock <= 0 || v.out_of_stock} data-testid={`size-${v.size}`}
                                        className={`min-w-12 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${size === v.size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"} disabled:opacity-30 disabled:line-through`}>
                                        {v.size}
                                    </button>
                                ))}
                            </div>
                            {selected && !selected.out_of_stock && selected.stock > 0 && selected.stock <= 5 && (
                                <p className="mt-2 text-xs font-bold text-warning" data-testid="low-stock-note">Only {selected.stock} left in stock</p>
                            )}
                            {selected && (selected.stock <= 0 || selected.out_of_stock) && <p className="mt-2 text-xs font-bold text-destructive" data-testid="oos-note">Out of stock</p>}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-border">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-minus" className="p-2.5"><Minus size={14} /></button>
                            <span className="w-8 text-center text-sm font-bold" data-testid="qty-value">{qty}</span>
                            <button onClick={() => setQty(Math.min(10, qty + 1))} data-testid="qty-plus" className="p-2.5"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => addToCart(false)} disabled={!selected || selected.stock <= 0 || selected.out_of_stock} data-testid="add-to-cart-btn" className="sn-btn-outline flex-1">Add to Cart</button>
                        <button onClick={() => addToCart(true)} disabled={!selected || selected.stock <= 0 || selected.out_of_stock} data-testid="buy-now-btn" className="sn-btn-primary flex-1">Buy Now</button>
                        <button onClick={toggleWish} data-testid="detail-wishlist-btn" aria-label="Wishlist"
                            className={`rounded-full border p-3 transition-colors ${wished ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                            <Heart size={18} fill={wished ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        {[{ icon: Zap, t: "30–60 min" }, { icon: Truck, t: "Free Delivery" }, { icon: RotateCcw, t: "Easy Returns" }].map(({ icon: Icon, t }) => (
                            <div key={t} className="sn-card flex flex-col items-center gap-1 p-3 text-xs font-semibold">
                                <Icon size={16} className="text-primary" /> {t}
                            </div>
                        ))}
                    </div>

                    {product.description && (
                        <div className="sn-card p-5">
                            <p className="sn-label">Description</p>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                            {(product.material || product.fabric) && (
                                <p className="mt-3 text-xs text-muted-foreground">{[product.material, product.fabric].filter(Boolean).join(" · ")}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Videos */}
            {(data.videos || []).length > 0 && (
                <section className="py-8" data-testid="product-videos">
                    <h2 className="mb-4 font-display text-xl font-bold">Video Reviews</h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {data.videos.map((v) => (
                            <div key={v.id} className="relative w-40 shrink-0 overflow-hidden rounded-2xl border border-border md:w-48" data-testid={`product-video-${v.id}`}>
                                <video src={v.video} muted loop playsInline preload="metadata" controls
                                    className="aspect-[9/16] w-full bg-black object-cover" />
                                <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-3">
                                    <p className="text-xs font-bold text-white">@{v.username}</p>
                                    {v.caption && <p className="line-clamp-2 text-[10px] text-white/80">{v.caption}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Reviews */}
            <section className="py-8" data-testid="reviews-section">
                <h2 className="mb-4 font-display text-xl font-bold">Reviews</h2>
                {data.reviews.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground">No reviews yet. Verified buyers can share the first one.</p>
                ) : (
                    <div className="space-y-3">
                        {data.reviews.map((r) => (
                            <div key={r.id} className="sn-card p-4" data-testid={`review-${r.id}`}>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={13} className={i < r.rating ? "fill-warning text-warning" : "text-border"} />))}</span>
                                    <span className="text-sm font-bold">{r.user_name}</span>
                                    <span className="sn-chip !py-0.5 text-[10px]"><ShieldCheck size={10} /> Verified Buyer</span>
                                </div>
                                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                                {(r.images || []).length > 0 && (
                                    <div className="mt-2 flex gap-2">
                                        {r.images.map((im, i) => (
                                            <img key={i} src={im} alt="Review" loading="lazy" className="h-16 w-16 rounded-xl border border-border object-cover" />
                                        ))}
                                    </div>
                                )}
                                {user && r.user_id === user.id && (
                                    <button onClick={async () => { try { await api.delete(`/products/${id}/reviews/${r.id}`); toast.success("Review deleted"); load(); } catch (err) { toast.error(fmtErr(err)); } }}
                                        data-testid={`review-delete-${r.id}`} className="mt-2 text-xs font-bold text-destructive hover:underline">
                                        Delete my review
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {user && (
                    <form onSubmit={submitReview} className="sn-card mt-4 space-y-3 p-5" data-testid="review-form">
                        <p className="text-sm font-bold">Write a review (verified buyers)</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button type="button" key={n} onClick={() => setReview({ ...review, rating: n })} data-testid={`review-star-${n}`}>
                                    <Star size={22} className={n <= review.rating ? "fill-warning text-warning" : "text-border"} />
                                </button>
                            ))}
                        </div>
                        <textarea className="sn-input" rows={3} placeholder="How was the fit, fabric, delivery?" value={review.comment}
                            data-testid="review-comment" onChange={(e) => setReview({ ...review, comment: e.target.value })} />
                        <div className="flex flex-wrap items-center gap-2">
                            {reviewImages.map((im, i) => (
                                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
                                    <img src={im} alt="" className="h-full w-full object-cover" />
                                    <button type="button" onClick={() => setReviewImages(reviewImages.filter((_, j) => j !== i))}
                                        className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"><X size={10} /></button>
                                </div>
                            ))}
                            {reviewImages.length < 4 && (
                                <button type="button" onClick={() => reviewFileRef.current?.click()} disabled={uploadingImg} data-testid="review-photo-btn"
                                    className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                                    <Camera size={16} /><span className="text-[9px] font-bold">{uploadingImg ? "…" : "Photo"}</span>
                                </button>
                            )}
                            <input ref={reviewFileRef} type="file" accept="image/*" className="hidden" onChange={onReviewImage} data-testid="review-photo-input" />
                            <span className="text-[10px] text-muted-foreground">Photos are auto-compressed to under 1MB</span>
                        </div>
                        <button className="sn-btn-primary" data-testid="review-submit">Submit Review</button>
                    </form>
                )}
            </section>

            {data.similar.length > 0 && (
                <section className="py-8" data-testid="similar-section">
                    <h2 className="mb-5 font-display text-xl font-bold">You may also like</h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
                        {data.similar.map((p) => <ProductCard key={p.card_key || p.id} product={p} />)}
                    </div>
                </section>
            )}
            <div className="py-4 text-center"><Link to="/products" className="text-sm font-bold text-primary">← Continue shopping</Link></div>
        </div>
    );
}
