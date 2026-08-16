import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState({ items: [], subtotal: 0, coupon_code: null });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/cart");
            setCart(data);
        } catch {
            setCart({ items: [], subtotal: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh, user?.id]);

    const add = async (product_id, variant_id, qty = 1) => {
        const { data } = await api.post("/cart/items", { product_id, variant_id, qty });
        setCart(data);
        return data;
    };

    const setQty = async (product_id, variant_id, qty) => {
        const { data } = await api.put(`/cart/items/${product_id}/${variant_id}`, { qty });
        setCart(data);
    };

    const remove = async (product_id, variant_id) => {
        const { data } = await api.delete(`/cart/items/${product_id}/${variant_id}`);
        setCart(data);
    };

    const applyCoupon = async (code) => {
        const { data } = await api.post("/cart/coupon", { code });
        setCart((c) => ({ ...c, ...data }));
        return data;
    };

    const removeCoupon = async () => {
        const { data } = await api.delete("/cart/coupon");
        setCart(data);
    };

    const count = (cart.items || []).reduce((n, i) => n + i.qty, 0);

    return (
        <CartContext.Provider value={{ cart, count, loading, refresh, add, setQty, remove, applyCoupon, removeCoupon }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
