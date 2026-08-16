import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { HomeSkeleton, ProductGridSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/StateViews";

export default function Home() {
    const [data, setData] = useState(null);
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(false);

    const load = () => {
        setError(false);
        api.get("/homepage").then(({ data }) => setData(data)).catch(() => setError(true));
        api.get("/videos").then(({ data }) => setVideos(data.items || [])).catch(() => {});
    };
    useEffect(load, []);

    if (error) return <div className="mx-auto max-w-7xl px-4 py-10"><ErrorState message="Unable to load homepage" onRetry={load} /></div>;
    if (!data) return <div className="mx-auto max-w-7xl px-4"><HomeSkeleton /></div>;

    const { banners, sections, categories } = data;
    const hasContent = sections.some((s) => s.items.length > 0) || categories.length > 0;

    return (
        <div className="mx-auto max-w-7xl px-4 pb-24 md:pb-12" data-testid="home-page">
            {/* Hero */}
            <section className="py-6">
                {banners.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {banners.map((b) => (
                            <Link key={b.id} to={b.link || "/products"} data-testid={`hero-banner-${b.id}`}
                                className="group relative overflow-hidden rounded-3xl border border-border">
                                <img src={b.image} alt={b.title} className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 p-6 text-white">
                                    <h2 className="font-display text-2xl font-black md:text-4xl">{b.title}</h2>
                                    {b.subtitle && <p className="mt-1 text-sm text-white/80">{b.subtitle}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-14 text-background dark:bg-card dark:text-card-foreground dark:border dark:border-border md:py-20" data-testid="hero-default">
                        <div className="relative z-10 max-w-xl space-y-4">
                            <span className="sn-chip !bg-primary !text-primary-foreground"><Zap size={12} /> Now live in Bahraich</span>
                            <h1 className="font-display text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
                                Fashion at your door in <span className="text-primary">30–60 minutes</span>
                            </h1>
                            <p className="text-sm text-current/60 md:text-base">Premium styles, hyperlocal delivery, free shipping on every order.</p>
                            <Link to="/products" data-testid="hero-shop-btn" className="sn-btn-primary">Shop Now</Link>
                        </div>
                        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                    </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                        { icon: Zap, t: "30–60 min", s: "Instant delivery" },
                        { icon: Truck, t: "Free Delivery", s: "On every order" },
                        { icon: ShieldCheck, t: "Secure Pay", s: "Razorpay protected" },
                    ].map(({ icon: Icon, t, s }) => (
                        <div key={t} className="sn-card flex items-center gap-3 p-4">
                            <div className="rounded-full bg-primary/15 p-2.5 text-primary"><Icon size={18} /></div>
                            <div><p className="text-sm font-bold">{t}</p><p className="text-xs text-muted-foreground">{s}</p></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-8" data-testid="home-categories">
                    <h2 className="mb-5 font-display text-xl font-bold md:text-2xl">Shop by Category</h2>
                    <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((c) => (
                            <Link key={c.id} to={`/products?category=${c.slug || c.id}`} data-testid={`category-tile-${c.slug || c.id}`} className="group flex shrink-0 flex-col items-center gap-2">
                                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-transparent transition-colors group-hover:border-primary md:h-24 md:w-24">
                                    {c.image ? <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                                        : <div className="flex h-full w-full items-center justify-center bg-primary/15 font-display text-xl font-black text-primary">{c.name[0]}</div>}
                                </div>
                                <span className="text-xs font-bold">{c.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Video clips */}
            {videos.length > 0 && (
                <section className="py-8" data-testid="home-videos">
                    <h2 className="mb-5 font-display text-xl font-bold md:text-2xl">StyleNow Clips</h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {videos.map((v) => (
                            <div key={v.id} className="group relative w-40 shrink-0 overflow-hidden rounded-2xl border border-border md:w-48" data-testid={`home-video-${v.id}`}>
                                <video src={v.video} poster={v.poster || undefined} muted loop playsInline preload="metadata"
                                    className="aspect-[9/16] w-full bg-black object-cover"
                                    onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()}
                                    onClick={(e) => (e.target.paused ? e.target.play() : e.target.pause())} />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <p className="text-xs font-bold text-white">@{v.username}</p>
                                    {v.product && (
                                        <Link to={`/product/${v.product.id}`} data-testid={`home-video-product-${v.id}`}
                                            className="pointer-events-auto mt-1 block truncate rounded-full bg-primary px-2.5 py-1 text-[10px] font-extrabold text-primary-foreground">
                                            {v.product.name} · ₹{v.product.price}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Sections */}
            {sections.map((sec) => (
                sec.items.length > 0 && (
                    <section key={sec.key} className="py-8" data-testid={`home-section-${sec.key}`}>
                        <div className="mb-5 flex items-end justify-between">
                            <h2 className="font-display text-xl font-bold md:text-2xl">{sec.title}</h2>
                            <Link to="/products" className="text-sm font-bold text-primary transition-opacity hover:opacity-70">View all</Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
                            {sec.items.slice(0, 8).map((p) => <ProductCard key={p.card_key || p.id} product={p} />)}
                        </div>
                    </section>
                )
            ))}

            {!hasContent && (
                <div className="py-8">
                    <EmptyState icon={Sparkles} title="Fresh styles dropping soon"
                        message="Our catalog is being curated right now. Check back shortly for premium fashion delivered in 30–60 minutes." />
                </div>
            )}
        </div>
    );
}

export { ProductGridSkeleton };
