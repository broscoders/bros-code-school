import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";
import { Utensils, Plus, Minus } from "lucide-react";

export default function StudentCanteen() {
  const student = useMyStudentRecord();
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await api.get("/canteen/items");
    setItems(res.data);
    if (student?._id) {
      const o = await api.get(`/canteen/orders/mine?studentId=${student._id}`);
      setOrders(o.data);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  const changeQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[itemId] || 0) + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const total = items.reduce((sum, i) => sum + (cart[i._id] || 0) * i.price, 0);

  const placeOrder = async () => {
    const orderItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([itemId, quantity]) => ({ itemId, quantity }));
    if (orderItems.length === 0) {
      setMsg("Add at least one item to your order.");
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    try {
      await api.post("/canteen/orders", { studentId: student._id, items: orderItems });
      setCart({});
      setMsg("Order placed!");
      setTimeout(() => setMsg(""), 2500);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to place order");
    }
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Campus Life</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Utensils size={22} className="text-primary" />
          Canteen
        </h1>
        <p className="text-muted mt-1 text-sm">Order snacks and meals for pickup.</p>
      </div>

      {msg && <p className="text-sm text-primary mb-4">{msg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <p className="text-xs text-muted uppercase tracking-wide">{item.category}</p>
              <p className="font-medium text-ink mt-1">{item.name}</p>
              <p className="text-primary font-display font-bold mt-1">Rs. {item.price}</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => changeQty(item._id, -1)} className="w-7 h-7 rounded-full bg-white/5 border border-border flex items-center justify-center text-ink-soft hover:bg-canvas">
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-sm">{cart[item._id] || 0}</span>
                <button onClick={() => changeQty(item._id, 1)} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark">
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-muted text-sm">No items available today.</p>}
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 h-fit">
          <h2 className="font-display font-semibold text-ink text-sm mb-3">Your Order</h2>
          {total === 0 ? (
            <p className="text-xs text-muted">Cart is empty.</p>
          ) : (
            <>
              <p className="text-lg font-display font-bold text-ink">Rs. {total}</p>
              <button onClick={placeOrder} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium mt-3 hover:bg-primary-dark transition-colors">
                Place Order
              </button>
            </>
          )}

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted mb-2">Recent Orders</p>
            {orders.length === 0 ? (
              <p className="text-xs text-muted">No orders yet.</p>
            ) : (
              <ul className="space-y-2">
                {orders.slice(0, 5).map((o) => (
                  <li key={o._id} className="text-xs flex justify-between border-b border-border pb-2 last:border-0">
                    <span className="text-ink-soft">Rs. {o.totalAmount}</span>
                    <span className="text-muted">{o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
