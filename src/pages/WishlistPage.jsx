import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { EmptyState, ErrorState } from "@/components/StateViews";

export default function WishlistPage() {
    const { user, setAuthOpen } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const load = useCallback(() => {
        setError(false);
        api.get("/wishlist").then(({ data }) => setData(data)).catch(() => setError(true));
    }, []);
    useEffect(() => { if (user) load(); }, [user, load]);

    if (!user) return <div className="mx-auto max-3xl px-4 py-10"><EmptyState icon={Heart} title="Login required" message="Log in to view your wishlist." actionLabel="Login" onAction={() => setAuthOpen(true)} /></div>;

    return (
        <div className="mx-auto max-w-7xl px-4 pb-24 md:pb-12" data-testid="wishlist-page">
            <h1 className="py-6 font-display text-2xl font-black">Wishlist</h1>
            {error ? <ErrorState message="Unable to load your wishlist" onRetry={load} />
                : !data ? <ProductGridSkeleton count={4} />
                : data.items.length === 0 ? (
                    <EmptyState icon={Heart} title="Your wishlist is empty" message="Tap the heart on any product to save it here."
                        actionLabel="Discover Styles" onAction={() => navigate("/products")} testId="wishlist-empty" />
                ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
                        {data.items.map((p) => <ProductCard key={p.id} product={p} wishlisted onWishlistChange={load} />)}
                    </div>
                )}
        </div>
    );
}
