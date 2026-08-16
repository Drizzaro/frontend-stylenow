import { useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";
import { AuthModal } from "@/components/AuthModal";
import { guestId, api, fmtErr } from "@/lib/api";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/CartPage";
import Checkout from "@/pages/Checkout";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetail from "@/pages/OrderDetail";
import WishlistPage from "@/pages/WishlistPage";
import Account from "@/pages/Account";
import SpinPage from "@/pages/SpinPage";
import CategoriesPage from "@/pages/CategoriesPage";
import AdminApp from "@/admin/AdminApp";

function CustomerLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
            <BottomNav />
            <AuthModal />
        </div>
    );
}

function AdminEntryShortcut() {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        const onKey = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (e.shiftKey && (e.key === "A" || e.key === "a") && !location.pathname.startsWith("/admin")) {
                navigate("/admin");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [navigate, location.pathname]);
    return null;
}

function ThemedToaster() {
    const { resolved } = useTheme();
    return <Toaster theme={resolved} position="top-center" richColors />;
}

function AuthCallback() {
    const { refresh } = useAuth();
    const processed = useRef(false);
    const location = useLocation();
    useEffect(() => {
        if (processed.current) return;
        processed.current = true;
        const m = location.hash.match(/session_id=([^&]+)/);
        (async () => {
            try {
                if (m) await api.post("/auth/google/session", { session_id: m[1] });
                await refresh();
                toast.success("Signed in with Google");
            } catch (e) {
                toast.error(fmtErr(e, "Google sign-in failed"));
            }
            window.location.href = "/";
        })();
    }, [location, refresh]);
    return (
        <div className="flex min-h-screen items-center justify-center bg-background" data-testid="auth-callback">
            <Logo className="h-16 animate-pulse" linkTo={null} />
        </div>
    );
}

function AppRoutes() {
    const location = useLocation();
    // Detect OAuth session_id synchronously during render to avoid race conditions
    if (location.hash?.includes("session_id=")) return <AuthCallback />;
    return (
        <Routes>
            <Route path="/admin" element={<AdminApp />} />
            <Route element={<CustomerLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/account" element={<Account />} />
                <Route path="/spin" element={<SpinPage />} />
            </Route>
        </Routes>
    );
}

function App() {
    useEffect(() => { guestId(); }, []);
    return (
        <div className="App">
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <BrowserRouter>
                            <AdminEntryShortcut />
                            <ThemedToaster />
                            <AppRoutes />
                        </BrowserRouter>
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </div>
    );
}

export default App;
