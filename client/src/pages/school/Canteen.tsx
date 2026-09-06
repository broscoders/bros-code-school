import { useEffect, useState } from "react";
import api from "../../services/api";
import { Utensils } from "lucide-react";

const STATUS_FLOW: Record<string, string> = { PLACED: "PREPARING", PREPARING: "READY", READY: "COLLECTED" };
const STATUS_COLORS: Record<string, string> = {
  PLACED: "bg-white/5 text-muted",
  PREPARING: "bg-accent-soft text-accent",
  READY: "bg-success/10 text-success",
  COLLECTED: "bg-success text-white",
  CANCELLED: "bg-danger/10 text-danger",
};

export default function Canteen() {
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", category: "SNACK", price: "" });
  const [tab, setTab] = useState<"orders" | "menu">("orders");

  const load = async () => {
    const [i, o] = await Promise.all([api.get("/canteen/items"), api.get("/canteen/orders")]);
    setItems(i.data);
    setOrders(o.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/canteen/items", { ...form, price: Number(form.price) });
    setForm({ name: "", category: "SNACK", price: "" });
    load();
  };

  const toggleItem = async (id: string) => {
    await api.put(`/canteen/items/${id}/toggle`);
    load();
  };

  const advanceStatus = async (order: any) => {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    await api.put(`/canteen/orders/${order._id}/status`, { status: next });
    load();
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Operations</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Utensils size={22} className="text-primary" />
          Canteen
        </h1>
        <p className="text-muted mt-1 text-sm">Manage the menu and track orders.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("orders")} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${tab === "orders" ? "bg-primary text-white border-primary" : "bg-surface text-ink-soft border-border"}`}>Orders</button>
        <button onClick={() => setTab("menu")} className={`px-3 py-1.5 rounded-md text-xs font-medium border ${tab === "menu" ? "bg-primary text-white border-primary" : "bg-surface text-ink-soft border-border"}`}>Menu</button>
      </div>

      {tab === "orders" && (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-ink text-left">
              <tr><th className="p-3 font-medium">Student</th><th className="p-3 font-medium">Items</th><th className="p-3 font-medium">Total</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Action</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted">No orders yet.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="border-t border-border">
                    <td className="p-3">{o.studentId?.userId?.name}</td>
                    <td className="p-3 text-xs text-muted">{o.items.map((i: any) => `${i.itemName} x${i.quantity}`).join(", ")}</td>
                    <td className="p-3">Rs. {o.totalAmount}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="p-3">
                      {STATUS_FLOW[o.status] && (
                        <button onClick={() => advanceStatus(o)} className="text-primary text-xs underline">Mark {STATUS_FLOW[o.status]}</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "menu" && (
        <>
          <form onSubmit={addItem} className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-wrap gap-2 items-end">
            <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm flex-1 min-w-[160px]" required />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm">
              <option value="MEAL">Meal</option>
              <option value="SNACK">Snack</option>
              <option value="BEVERAGE">Beverage</option>
              <option value="OTHER">Other</option>
            </select>
            <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm w-28" required />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors">+ Add Item</button>
          </form>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {items.map((item) => (
              <div key={item._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
                <p className="text-xs text-muted uppercase">{item.category}</p>
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-primary font-display font-bold">Rs. {item.price}</p>
                <button onClick={() => toggleItem(item._id)} className="text-xs text-muted underline mt-2">
                  {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
