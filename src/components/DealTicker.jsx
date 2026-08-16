import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Zap, Gift, Tag } from "lucide-react";
import { api } from "@/lib/api";

const ICONS = { truck: Truck, zap: Zap, gift: Gift, tag: Tag };

export function DealTicker() {
    const [deals, setDeals] = useState(null);

    useEffect(() => {
        api.get("/homepage").then(({ data }) => setDeals(data.ticker || [])).catch(() => setDeals([]));
    }, []);

    if (deals === null) return <div className="h-8 animate-pulse bg-primary/10" data-testid="ticker-skeleton" />;
    if (!deals.length) return null;

    const row = [...deals, ...deals, ...deals];
    return (
        <div className="overflow-hidden bg-foreground py-1.5 text-background dark:bg-primary dark:text-primary-foreground" data-testid="deal-ticker">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-4">
                {row.map((d, i) => {
                    const Icon = ICONS[d.icon] || Tag;
                    const inner = (
                        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em]">
                            <Icon size={13} /> {d.text}
                        </span>
                    );
                    return d.link ? (
                        <Link key={`${d.id}-${i}`} to={d.link} className="transition-opacity hover:opacity-70">{inner}</Link>
                    ) : (
                        <span key={`${d.id}-${i}`}>{inner}</span>
                    );
                })}
            </div>
        </div>
    );
}
