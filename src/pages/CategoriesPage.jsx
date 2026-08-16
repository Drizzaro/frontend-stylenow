import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/StateViews";

export default function CategoriesPage() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const load = () => {
        setError(false);
        api.get("/categories").then(({ data }) => setItems(data.items)).catch(() => setError(true));
    };
    useEffect(load, []);

    return (
        <div className="mx-auto max-w-7xl px-4 pb-24 md:pb-12" data-testid="categories-page">
            <h1 className="py-6 font-display text-2xl font-black">Categories</h1>
            {error ? <ErrorState message="Unable to load categories" onRetry={load} />
                : !items ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState icon={LayoutGrid} title="No categories yet" message="Categories will appear here once the catalog is ready." />
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {items.map((c) => (
                            <Link key={c.id} to={`/products?category=${c.slug || c.id}`} data-testid={`category-card-${c.slug || c.id}`}
                                className="group relative overflow-hidden rounded-3xl border border-border">
                                {c.image ? <img src={c.image} alt={c.name} loading="lazy" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    : <div className="flex h-48 items-center justify-center bg-primary/10 font-display text-4xl font-black text-primary">{c.name[0]}</div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <p className="absolute bottom-3 left-4 font-display text-lg font-bold text-white">{c.name}</p>
                            </Link>
                        ))}
                    </div>
                )}
        </div>
    );
}
