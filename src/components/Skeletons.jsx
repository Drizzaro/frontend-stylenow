export function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function ProductCardSkeleton() {
    return (
        <div className="space-y-2" data-testid="product-card-skeleton">
            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
    );
}

export function ProductGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
    );
}

export function HomeSkeleton() {
    return (
        <div className="space-y-10 py-6" data-testid="home-skeleton">
            <Skeleton className="h-44 w-full rounded-3xl md:h-72" />
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-3 w-14" />
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <ProductGridSkeleton count={4} />
            </div>
        </div>
    );
}

export function DetailSkeleton() {
    return (
        <div className="grid gap-8 py-6 md:grid-cols-2" data-testid="detail-skeleton">
            <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-full" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
    return (
        <div className="space-y-3" data-testid="table-skeleton">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-3">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} className="h-10 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function ListSkeleton({ rows = 4 }) {
    return (
        <div className="space-y-4 py-4" data-testid="list-skeleton">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-20 w-16 rounded-xl" />
                    <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}
