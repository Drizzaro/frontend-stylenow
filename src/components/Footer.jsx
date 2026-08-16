import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";

const ICON_PATHS = {
    instagram: "M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 3.1a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4Zm0 11a4.4 4.4 0 1 1 0-8.7 4.4 4.4 0 0 1 0 8.7Zm6.9-11.4a1.6 1.6 0 1 0 0 3.1 1.6 1.6 0 0 0 0-3.1Z",
    facebook: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z",
    x: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z",
    pinterest: "M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.17-.11-.95-.2-2.4.04-3.44l1.4-5.96s-.36-.72-.36-1.78c0-1.66.97-2.9 2.17-2.9 1.02 0 1.51.77 1.51 1.69 0 1.03-.66 2.57-1 4-.28 1.18.6 2.14 1.76 2.14 2.12 0 3.74-2.23 3.74-5.45 0-2.85-2.05-4.84-4.98-4.84-3.39 0-5.38 2.54-5.38 5.17 0 1.02.4 2.12.89 2.72.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.4.16-1.49-.69-2.42-2.88-2.42-4.63 0-3.77 2.74-7.23 7.9-7.23 4.15 0 7.37 2.95 7.37 6.9 0 4.12-2.6 7.44-6.2 7.44-1.21 0-2.35-.63-2.74-1.37l-.75 2.84c-.27 1.04-1 2.35-1.49 3.14 1.12.35 2.31.53 3.55.53 6.63 0 12-5.37 12-12S18.63 0 12 0Z",
    whatsapp: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.1 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.45 9.87-9.9 9.87Zm8.42-18.29A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.07 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.44h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.48-8.4Z",
    youtube: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z",
};

const SOCIALS = [
    { k: "instagram", label: "Instagram" },
    { k: "facebook", label: "Facebook" },
    { k: "x", label: "X" },
    { k: "pinterest", label: "Pinterest" },
    { k: "whatsapp", label: "WhatsApp" },
];

function BrandIcon({ name, size = 15 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={ICON_PATHS[name]} />
        </svg>
    );
}

const TRENDING_FALLBACK = ["Oversized T-Shirt", "Hoodies", "Sneakers", "Bottoms", "Streetwear"];

export function Footer() {
    const [cfg, setCfg] = useState(null);
    const [cats, setCats] = useState([]);
    const [trending, setTrending] = useState([]);
    const [callOpen, setCallOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);

    useEffect(() => {
        api.get("/config").then(({ data }) => setCfg(data)).catch(() => setCfg({ social_links: {}, contact_phones: [] }));
        api.get("/categories").then(({ data }) => setCats(data.items || [])).catch(() => {});
        api.get("/search/suggestions").then(({ data }) => setTrending(data.suggestions || [])).catch(() => {});
    }, []);

    const links = cfg?.social_links || {};
    const phones = cfg?.contact_phones || [];
    const trend = trending.length ? trending : TRENDING_FALLBACK;
    const firstPhoneDigits = (phones[0]?.number || "").replace(/\D/g, "");

    const socialHref = (k) => {
        const url = (links[k] || "").trim();
        if (url) return url.startsWith("http") ? url : `https://${url}`;
        if (k === "whatsapp" && firstPhoneDigits) return `https://wa.me/${firstPhoneDigits}`;
        return null;
    };

    return (
        <footer className="bg-neutral-950 pb-24 pt-12 text-white md:pb-12" data-testid="footer">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                <div>
                    <Link to="/" data-testid="footer-brand" className="font-display text-4xl font-black leading-none tracking-tight">
                        STYLE<br /><span className="text-primary">NOW</span>
                    </Link>
                    <p className="mt-4 max-w-xs text-sm text-white/50">Premium fashion delivered in 30–60 minutes · Bahraich, India</p>
                    <div className="mt-5 flex flex-wrap items-center gap-2" data-testid="footer-socials">
                        {SOCIALS.map(({ k, label }) => {
                            const href = socialHref(k);
                            const cls = "rounded-full border border-white/15 p-2.5 text-white/70 transition-colors hover:border-primary hover:text-primary";
                            return href ? (
                                <a key={k} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} data-testid={`social-${k}`} className={cls}>
                                    <BrandIcon name={k} />
                                </a>
                            ) : (
                                <button key={k} onClick={() => setCallOpen(true)} aria-label={label} data-testid={`social-${k}`} className={cls}>
                                    <BrandIcon name={k} />
                                </button>
                            );
                        })}
                        <button onClick={() => setCallOpen(true)} aria-label="Call us" data-testid="social-call"
                            className="rounded-full border border-white/15 p-2.5 text-white/70 transition-colors hover:border-primary hover:text-primary">
                            <Phone size={16} />
                        </button>
                    </div>
                </div>

                <div>
                    <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-white/40">Shop</p>
                    <ul className="space-y-2.5 text-sm">
                        <li><Link to="/products" className="text-white/75 transition-colors hover:text-primary" data-testid="footer-shop-all">All Products</Link></li>
                        <li><Link to="/products?sort=newest" className="text-white/75 transition-colors hover:text-primary">New Arrivals</Link></li>
                        <li><Link to="/products?sort=popular" className="text-white/75 transition-colors hover:text-primary">Best Sellers</Link></li>
                        {cats.slice(0, 5).map((c) => (
                            <li key={c.id}><Link to={`/products?category=${c.slug || c.id}`} className="text-white/75 transition-colors hover:text-primary" data-testid={`footer-cat-${c.slug || c.id}`}>{c.name}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-white/40">Trending</p>
                    <ul className="space-y-2.5 text-sm">
                        {trend.slice(0, 6).map((t) => (
                            <li key={t}><Link to={`/products?q=${encodeURIComponent(t)}`} className="text-white/75 capitalize transition-colors hover:text-primary" data-testid={`footer-trend-${t}`}>{t}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-white/40">Info</p>
                    <ul className="space-y-2.5 text-sm">
                        <li><button onClick={() => setCallOpen(true)} className="text-white/75 transition-colors hover:text-primary" data-testid="footer-contact">Contact Us</button></li>
                        <li><Link to="/orders" className="text-white/75 transition-colors hover:text-primary">Track Order</Link></li>
                        <li><Link to="/products" className="text-white/75 transition-colors hover:text-primary">Offers & Deals</Link></li>
                        <li><Link to="/spin" className="text-white/75 transition-colors hover:text-primary">Spin & Win</Link></li>
                        <li><button onClick={() => setFaqOpen(true)} className="text-white/75 transition-colors hover:text-primary" data-testid="footer-faq">FAQs</button></li>
                    </ul>
                </div>
            </div>
            <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-5">
                <p className="text-[11px] text-white/40">© {new Date().getFullYear()} StyleNow · stylenow.fit · All prices in INR</p>
            </div>

            <Modal open={callOpen} onClose={() => setCallOpen(false)} title="Contact StyleNow" testId="call-modal">
                {phones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No contact numbers configured yet.</p>
                ) : (
                    <div className="space-y-2">
                        {phones.map((p, i) => (
                            <a key={i} href={`tel:${(p.number || "").replace(/\s/g, "")}`} data-testid={`call-number-${i}`}
                                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50">
                                <span className="rounded-full bg-primary/15 p-2.5 text-primary"><Phone size={16} /></span>
                                <span>
                                    <span className="block text-sm font-bold">{p.label}</span>
                                    <span className="block text-sm text-muted-foreground">{p.number}</span>
                                </span>
                            </a>
                        ))}
                        <p className="pt-1 text-center text-xs text-muted-foreground">Available 9 AM – 11 PM, every day</p>
                    </div>
                )}
            </Modal>

            <Modal open={faqOpen} onClose={() => setFaqOpen(false)} title="FAQs" testId="faq-modal">
                <div className="space-y-4 text-sm">
                    {[
                        ["How fast is delivery?", "We deliver across Bahraich in 30–60 minutes from our local store."],
                        ["Is delivery free?", "Yes — delivery is free on every order."],
                        ["How do I pay?", "Pay online securely via Razorpay, or choose Cash on Delivery."],
                        ["Can I return items?", "Yes. Open your delivered order and tap Request Return. Our team reviews it quickly."],
                        ["What are StylePoints?", "You earn StylePoints on every delivered order. Redeem them for up to 10% off or spin the wheel for rewards."],
                    ].map(([q, a]) => (
                        <div key={q}>
                            <p className="font-bold">{q}</p>
                            <p className="mt-0.5 text-muted-foreground">{a}</p>
                        </div>
                    ))}
                </div>
            </Modal>
        </footer>
    );
}
