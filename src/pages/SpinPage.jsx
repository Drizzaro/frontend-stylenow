import { useEffect, useState, useCallback } from "react";
import { Sparkles, Coins, Copy, Trophy } from "lucide-react";
import { toast } from "sonner";
import { api, fmtErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton, ListSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/StateViews";
import { Modal } from "@/components/Modal";

const WHEEL_COLORS = ["#BD8EE4", "#141414", "#8b5cc7", "#242424", "#a476d9", "#0f0f0f", "#c9a5ec", "#1c1c1c"];
const SPIN_MS = 4600;

function Confetti() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="absolute h-2 w-1.5 rounded-sm"
                    style={{
                        left: `${(i * 37) % 100}%`, top: "-4%",
                        background: ["#BD8EE4", "#ffffff", "#8b5cc7", "#f5d90a"][i % 4],
                        animation: `sn-confetti ${1.6 + (i % 5) * 0.3}s ease-in ${(i % 6) * 0.12}s both`,
                    }} />
            ))}
            <style>{`@keyframes sn-confetti { 0% { transform: translateY(0) rotate(0); opacity: 1 } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0 } }`}</style>
        </div>
    );
}

export default function SpinPage() {
    const { user, setAuthOpen } = useAuth();
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [history, setHistory] = useState([]);

    const load = useCallback(() => {
        if (!user) return;
        setError(false);
        Promise.all([api.get("/spin"), api.get("/rewards")])
            .then(([s, r]) => { setInfo(s.data); setHistory(r.data.spins || []); })
            .catch(() => setError(true));
    }, [user]);
    useEffect(load, [load]);

    if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState icon={Sparkles} title="Login to Spin & Win" message="Earn StylePoints on every order and spin for coupons, points and freebies." actionLabel="Login" onAction={() => setAuthOpen(true)} testId="spin-login" /></div>;
    if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState icon={Sparkles} title="Spin & Win unavailable" message="Please try again in a moment." actionLabel="Retry" onAction={load} /></div>;
    if (!info) return <div className="mx-auto max-w-3xl px-4 py-10 space-y-6"><Skeleton className="mx-auto h-72 w-72 rounded-full" /><ListSkeleton rows={2} /></div>;
    if (!info.enabled || !info.rewards.length) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState icon={Sparkles} title="Spin & Win is paused" message="The wheel is being restocked with fresh rewards. Check back soon!" /></div>;

    const n = info.rewards.length;
    const seg = 360 / n;

    const spin = async () => {
        if (spinning || !info.can_spin) return;
        setSpinning(true); setResult(null); setShowConfetti(false);
        try {
            const { data } = await api.post("/spin");
            const idx = Math.max(0, info.rewards.findIndex((r) => r.id === data.result.id));
            // land the pointer (top) on the middle of the winning segment
            const jitter = (Math.random() - 0.5) * seg * 0.5;
            setRotation((r) => Math.ceil(r / 360) * 360 + 360 * 6 + (360 - (idx * seg + seg / 2)) + jitter);
            setTimeout(() => {
                setResult(data.result);
                setSpinning(false);
                if (data.result.type !== "none") {
                    setShowConfetti(true);
                    toast.success(`You won: ${data.result.label}`);
                    setTimeout(() => setShowConfetti(false), 3500);
                }
                load();
            }, SPIN_MS + 200);
        } catch (e) {
            setSpinning(false);
            toast.error(fmtErr(e));
        }
    };

    const gradient = `conic-gradient(${info.rewards.map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(", ")})`;

    return (
        <div className="relative mx-auto max-w-3xl px-4 pb-24 md:pb-12" data-testid="spin-page">
            {showConfetti && <Confetti />}
            <div className="py-6 text-center">
                <h1 className="font-display text-3xl font-black">Spin & Win</h1>
                <p className="mt-1 text-sm text-muted-foreground">{info.cost} StylePoints per spin · Results decided securely on our servers</p>
            </div>

            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="absolute -top-3 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[13px] border-t-[22px] border-x-transparent border-t-primary drop-shadow-lg" />
                    <div data-testid="spin-wheel"
                        className="relative h-72 w-72 rounded-full border-[10px] border-primary shadow-[0_0_70px_-10px_hsl(var(--primary)/0.55)] md:h-80 md:w-80"
                        style={{
                            background: gradient,
                            transform: `rotate(${rotation}deg)`,
                            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.15, 1)` : "none",
                        }}>
                        {info.rewards.map((r, i) => (
                            <span key={r.id}
                                className="absolute left-1/2 top-1/2 block w-20 -translate-x-1/2 -translate-y-1/2 text-center text-[9px] font-extrabold uppercase leading-tight tracking-wide"
                                data-testid={`spin-segment-${i}`}
                                style={{
                                    color: i % 2 === 0 ? "#141414" : "#fff",
                                    transform: `translate(-50%, -50%) rotate(${i * seg + seg / 2}deg) translateY(-100px)`,
                                }}>
                                {r.label}
                            </span>
                        ))}
                        <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-primary bg-background shadow-xl">
                            <Sparkles className="text-primary" size={24} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5" data-testid="spin-balance">
                    <Coins size={16} className="text-primary" />
                    <span className="text-sm font-extrabold">{info.balance} StylePoints</span>
                </div>

                <button onClick={spin} disabled={spinning || !info.can_spin} data-testid="spin-btn"
                    className={`sn-btn-primary !px-12 !py-4 text-base ${spinning ? "animate-pulse" : ""}`}>
                    {spinning ? "Spinning…" : info.can_spin ? `SPIN (${info.cost} pts)` : `Need ${info.cost - info.balance} more points`}
                </button>
                {!info.can_spin && <p className="text-xs text-muted-foreground">Earn StylePoints automatically when your orders are delivered.</p>}
            </div>

            <Modal open={!!result} onClose={() => setResult(null)} title="" testId="spin-result-modal">
                {result && (
                    <div className="flex flex-col items-center gap-3 pb-2 text-center" data-testid="spin-result">
                        <div className={`rounded-full p-4 ${result.type === "none" ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                            <Trophy size={30} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{result.type === "none" ? "So close!" : "You won"}</p>
                        <p className="font-display text-3xl font-black text-primary">{result.label}</p>
                        {result.coupon_code && (
                            <button onClick={() => { navigator.clipboard.writeText(result.coupon_code); toast.success("Coupon code copied"); }}
                                data-testid="spin-coupon-code"
                                className="flex items-center gap-2 rounded-xl border border-dashed border-primary/60 bg-primary/10 px-4 py-2.5 font-mono text-sm font-extrabold transition-colors hover:bg-primary/20">
                                {result.coupon_code} <Copy size={14} />
                            </button>
                        )}
                        {result.type === "points" && <p className="text-sm text-muted-foreground">Points added to your StylePoints wallet instantly.</p>}
                        <button onClick={() => setResult(null)} className="sn-btn-primary mt-2 w-full" data-testid="spin-result-close">
                            {info.balance >= info.cost ? "Spin Again" : "Done"}
                        </button>
                    </div>
                )}
            </Modal>

            {history.length > 0 && (
                <div className="mt-10" data-testid="spin-history">
                    <h2 className="mb-3 font-display text-lg font-bold">Recent Spins</h2>
                    <div className="space-y-2">
                        {history.slice(0, 6).map((s) => (
                            <div key={s.id} className="sn-card flex items-center justify-between p-3 text-sm">
                                <span className="font-semibold">{s.reward_label}</span>
                                <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
