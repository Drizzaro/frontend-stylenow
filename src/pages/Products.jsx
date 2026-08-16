import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/StateViews";

const SORTS = [
    { k: "newest", l: "Newest" }, { k: "popular", l: "Popular" },
    { k: "price_low", l: "Price: Low to High" }, { k: "price_high", l: "Price: High to Low" },
    { k: "discount", l: "Discount" },
];
const GENDERS = ["men", "women", "kids", "unisex"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function Products() {
    const [params, setParams] = useSearchParams();
    const q = params.get("q") || "";
    const [data, setData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const category = params.get("category") || "";
    const gender = params.get("gender") || "";
    const size = params.get("size") || "";
    const sort = params.get("sort") || "newest";

    const setParam = (k, v) => {
        const next = new URLSearchParams(params);
        if (v) next.set(k, v); else next.delete(k);
        setParams(next, { replace: true });
    };

    const load = useCallback(async () => {
        setError(false); setData(null);
        try {
            if (q) {
                const { data } = await api.get("/search", { params: { q, limit: 48 } });
                setData(data);
            } else {
                const { data } = await api.get("/products", { params: { category, gender, size, sort, limit: 48 } });
                setData(data);
            }
        } catch { setError(true); }
    }, [q, category, gender, size, sort]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { api.get("/categories").then(({ data }) => setCategories(data.items)).catch(() => {}); }, []);

    const filters = (
        <div className="space-y-6" data-testid="filters-panel">
            <div>
                <p className="sn-label">Category</p>
                <div className="space-y-1">
                    <button onClick={() => setParam("category", "")} className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${!category ? "bg-primary/15 font-bold text-primary" : "hover:bg-secondary"}`}>All</button>
                    {categories.map((c) => (
                        <button key={c.id} onClick={() => setParam("category", c.slug || c.id)} data-testid={`filter-category-${c.slug}`}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${category === (c.slug || c.id) ? "bg-primary/15 font-bold text-primary" : "hover:bg-secondary"}`}>
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className="sn-label">Gender</p>
                <div className="flex flex-wrap gap-2">
                    {GENDERS.map((g) => (
                        <button key={g} onClick={() => setParam("gender", gender === g ? "" : g)} data-testid={`filter-gender-${g}`}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition-colors ${gender === g ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                            {g}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className="sn-label">Size</p>
                <div className="flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                        <button key={s} onClick={() => setParam("size", size === s ? "" : s)} data-testid={`filter-size-${s}`}
                            className={`h-9 w-11 rounded-lg border text-xs font-bold transition-colors ${size === s ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/50"}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className="sn-label">Sort By</p>
                <div className="space-y-1">
                    {SORTS.map((s) => (
                        <button key={s.k} onClick={() => setParam("sort", s.k)} data-testid={`sort-${s.k}`}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${sort === s.k ? "bg-primary/15 font-bold text-primary" : "hover:bg-secondary"}`}>
                            {s.l}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl px-4 pb-24 md:pb-12" data-testid="products-page">
            <div className="flex items-center gap-3 py-5">
                <div className="min-w-0 flex-1">
                    <h1 className="font-display text-xl font-bold md:text-2xl">
                        {q ? <>Results for “<span className="text-primary">{q}</span>”</> : "All Styles"}
                    </h1>
                    {data && <p className="text-xs text-muted-foreground" data-testid="results-count">{data.total} products</p>}
                </div>
                <button onClick={() => setFiltersOpen(true)} data-testid="filters-open-btn" className="sn-btn-outline !px-4 !py-2 md:hidden">
                    <SlidersHorizontal size={15} /> Filters
                </button>
            </div>
            {q && <div className="mb-4 md:hidden"><SearchBar autoFocus={params.get("focus") === "1"} /></div>}
            <div className="flex gap-8">
                <aside className="hidden w-56 shrink-0 md:block"><div className="sticky top-32">{filters}</div></aside>
                <div className="min-w-0 flex-1">
                    {error ? <ErrorState message={q ? "Search is unavailable right now" : "Unable to load products"} onRetry={load} />
                        : !data ? <ProductGridSkeleton count={8} />
                        : data.items.length === 0 ? (
                            <EmptyState title={q ? `No results for “${q}”` : "No products found"}
                                message={q ? "Try a different keyword, or check the spelling." : "Products will appear here soon."} />
                        ) : (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-6" data-testid="products-grid">
                                {data.items.map((p) => <ProductCard key={p.card_key || p.id} product={p} />)}
                            </div>
                        )}
                </div>
            </div>
            {filtersOpen && (
                <div className="fixed inset-0 z-[80] md:hidden" data-testid="filters-sheet">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-6 animate-fade-up">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-display font-bold">Filters</h3>
                            <button onClick={() => setFiltersOpen(false)} data-testid="filters-close" className="rounded-full p-2 hover:bg-secondary"><X size={18} /></button>
                        </div>
                        {filters}
                        <button onClick={() => setFiltersOpen(false)} data-testid="filters-apply" className="sn-btn-primary mt-6 w-full">Show Results</button>
                    </div>
                </div>
            )}
        </div>
    );
}
