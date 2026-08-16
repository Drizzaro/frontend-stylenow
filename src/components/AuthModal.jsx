import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import { fmtErr } from "@/lib/api";

export function AuthModal() {
    const { authOpen, setAuthOpen, requestOtp, verifyOtp } = useAuth();
    const [step, setStep] = useState("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [devOtp, setDevOtp] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const close = () => { setAuthOpen(false); setStep("phone"); setError(""); setOtp(""); };

    const sendOtp = async (e) => {
        e?.preventDefault();
        setBusy(true); setError("");
        try {
            const data = await requestOtp(phone);
            setDevOtp(data.dev_otp || "");
            setStep("otp");
            toast.success("OTP sent");
        } catch (err) { setError(fmtErr(err)); }
        finally { setBusy(false); }
    };

    const verify = async (e) => {
        e?.preventDefault();
        setBusy(true); setError("");
        try {
            const data = await verifyOtp(phone, otp, name || undefined);
            toast.success(data.is_new ? "Welcome to StyleNow!" : "Welcome back!");
            close();
        } catch (err) { setError(fmtErr(err)); }
        finally { setBusy(false); }
    };

    const googleLogin = () => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + "/";
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    return (
        <Modal open={authOpen} onClose={close} title="" testId="auth-modal">
            <div className="flex flex-col items-center gap-2 pb-2">
                <Logo className="h-16" linkTo={null} testId="auth-logo" />
                <p className="text-sm text-muted-foreground">Fashion delivered in 30–60 minutes</p>
            </div>
            <button onClick={googleLogin} data-testid="google-login-btn"
                className="sn-btn-outline w-full !py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z"/><path fill="#EA4335" d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1c.95-2.85 3.6-4.96 6.73-4.96Z"/></svg>
                Continue with Google
            </button>
            <div className="my-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or continue with mobile <span className="h-px flex-1 bg-border" />
            </div>
            {step === "phone" ? (
                <form onSubmit={sendOtp} className="space-y-4">
                    <div>
                        <label className="sn-label" htmlFor="phone-input">Mobile Number</label>
                        <div className="flex items-center gap-2">
                            <span className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-bold">+91</span>
                            <input id="phone-input" data-testid="phone-input" className="sn-input" placeholder="98765 43210"
                                value={phone} maxLength={10} inputMode="numeric"
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
                        </div>
                    </div>
                    {error && <p className="text-sm font-semibold text-destructive" data-testid="auth-error">{error}</p>}
                    <button type="submit" disabled={busy || phone.length !== 10} data-testid="send-otp-btn" className="sn-btn-primary w-full">
                        {busy ? "Sending…" : "Send OTP"}
                    </button>
                </form>
            ) : (
                <form onSubmit={verify} className="space-y-4">
                    <div>
                        <label className="sn-label" htmlFor="otp-input">Enter OTP sent to +91 {phone}</label>
                        <input id="otp-input" data-testid="otp-input" className="sn-input text-center text-lg tracking-[0.5em]" placeholder="••••••"
                            value={otp} maxLength={6} inputMode="numeric" onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                        {devOtp && (
                            <p className="mt-2 rounded-xl bg-primary/10 px-3 py-2 text-center text-xs font-bold text-primary" data-testid="dev-otp-hint">
                                Dev mode OTP: {devOtp}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="sn-label" htmlFor="name-input">Your Name (new users)</label>
                        <input id="name-input" data-testid="name-input" className="sn-input" placeholder="Optional for existing users"
                            value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {error && <p className="text-sm font-semibold text-destructive" data-testid="auth-error">{error}</p>}
                    <button type="submit" disabled={busy || otp.length !== 6} data-testid="verify-otp-btn" className="sn-btn-primary w-full">
                        {busy ? "Verifying…" : "Verify & Continue"}
                    </button>
                    <button type="button" onClick={sendOtp} disabled={busy} data-testid="resend-otp-btn"
                        className="w-full text-center text-xs font-bold text-primary transition-opacity hover:opacity-70">
                        Resend OTP
                    </button>
                </form>
            )}
        </Modal>
    );
}
