import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function InventoryAssets() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [tab, setTab] = useState<"inventory" | "assets" | "vendors" | "purchase-orders">("inventory");

  const [items, setItems] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({ name: "", category: "", warehouse: "", quantity: "0", lowStockThreshold: "5", unit: "pcs" });

  const [assets, setAssets] = useState<any[]>([]);
  const [assetForm, setAssetForm] = useState({ name: "", category: "", assetTag: "", location: "", assignedTo: "" });

  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorForm, setVendorForm] = useState({ name: "", contact: "", category: "" });

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poForm, setPoForm] = useState({ vendorId: "", itemName: "", quantity: "1", estimatedCost: "" });

  const loadAll = async () => {
    const [i, a, v, p] = await Promise.all([
      api.get(`/assets/items?schoolId=${schoolId}`),
      api.get(`/assets/assets?schoolId=${schoolId}`),
      api.get(`/assets/vendors?schoolId=${schoolId}`),
      api.get(`/assets/purchase-orders?schoolId=${schoolId}`),
    ]);
    setItems(i.data);
    setAssets(a.data);
    setVendors(v.data);
    setPurchaseOrders(p.data);
  };

  useEffect(() => {
    if (schoolId) loadAll();
  }, [schoolId]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/assets/items", { ...itemForm, schoolId, quantity: Number(itemForm.quantity), lowStockThreshold: Number(itemForm.lowStockThreshold) });
    setItemForm({ name: "", category: "", warehouse: "", quantity: "0", lowStockThreshold: "5", unit: "pcs" });
    loadAll();
  };

  const adjustStock = async (itemId: string, change: number) => {
    await api.post("/assets/items/stock", { itemId, change });
    loadAll();
  };

  const addAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/assets/assets", { ...assetForm, schoolId });
    setAssetForm({ name: "", category: "", assetTag: "", location: "", assignedTo: "" });
    loadAll();
  };

  const addVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/assets/vendors", { ...vendorForm, schoolId });
    setVendorForm({ name: "", contact: "", category: "" });
    loadAll();
  };

  const requestPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/assets/purchase-orders", {
      schoolId,
      vendorId: poForm.vendorId || undefined,
      items: [{ itemName: poForm.itemName, quantity: Number(poForm.quantity), estimatedCost: Number(poForm.estimatedCost) }],
      requestedByName: useAuthStore.getState().user?.name,
    });
    setPoForm({ vendorId: "", itemName: "", quantity: "1", estimatedCost: "" });
    loadAll();
  };

  const updatePOStatus = async (id: string, status: string) => {
    await api.put(`/assets/purchase-orders/${id}/status`, { status });
    loadAll();
  };

  const tabs = [
    { id: "inventory", label: "Inventory" },
    { id: "assets", label: "Assets" },
    { id: "vendors", label: "Vendors" },
    { id: "purchase-orders", label: "Purchase Orders" },
  ] as const;

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Resources</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Inventory & Assets</h1>
      <p className="text-muted mt-1 text-sm">Track stock, equipment and vendors.</p>

      <div className="flex gap-1 mt-6 border-b border-black/10">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? "border-primary text-ink" : "border-transparent text-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inventory" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addItem} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <input placeholder="Item Name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Category" value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Warehouse/Location" value={itemForm.warehouse} onChange={(e) => setItemForm({ ...itemForm, warehouse: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Quantity" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Low Stock Alert" value={itemForm.lowStockThreshold} onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">+ Add Item</button>
          </form>
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {items.length === 0 && <li className="py-2 text-muted">No items yet.</li>}
              {items.map((i) => (
                <li key={i._id} className="py-2 flex justify-between items-center">
                  <div>
                    <span>{i.name}</span>
                    {i.quantity <= i.lowStockThreshold && <span className="ml-2 text-[10px] text-danger font-semibold uppercase">Low Stock</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustStock(i._id, -1)} className="text-xs px-2 py-0.5 border border-black/10 rounded">-</button>
                    <span className="text-sm">{i.quantity} {i.unit}</span>
                    <button onClick={() => adjustStock(i._id, 1)} className="text-xs px-2 py-0.5 border border-black/10 rounded">+</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "assets" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addAsset} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <input placeholder="Asset Name" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Category (e.g. Computer, Furniture)" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Asset Tag (unique)" value={assetForm.assetTag} onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Location" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Assigned To" value={assetForm.assignedTo} onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">+ Add Asset</button>
          </form>
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {assets.length === 0 && <li className="py-2 text-muted">No assets yet.</li>}
              {assets.map((a) => (
                <li key={a._id} className="py-2 flex justify-between">
                  <span>{a.name} <span className="text-muted text-xs">({a.assetTag})</span></span>
                  <span className="text-xs text-muted">{a.condition}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "vendors" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={addVendor} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <input placeholder="Vendor Name" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Contact" value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Category" value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">+ Add Vendor</button>
          </form>
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {vendors.length === 0 && <li className="py-2 text-muted">No vendors yet.</li>}
              {vendors.map((v) => (
                <li key={v._id} className="py-2 flex justify-between">
                  <span>{v.name}</span>
                  <span className="text-muted text-xs">{v.contact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {tab === "purchase-orders" && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          <form onSubmit={requestPurchase} className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5 space-y-2 h-fit">
            <select value={poForm.vendorId} onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Vendor (optional)</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
            <input placeholder="Item Name" value={poForm.itemName} onChange={(e) => setPoForm({ ...poForm, itemName: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Quantity" value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
              <input type="number" placeholder="Est. Cost/unit" value={poForm.estimatedCost} onChange={(e) => setPoForm({ ...poForm, estimatedCost: e.target.value })} className="border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">Request Purchase</button>
          </form>
          <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
            <ul className="text-sm divide-y divide-black/5">
              {purchaseOrders.length === 0 && <li className="py-2 text-muted">No purchase requests yet.</li>}
              {purchaseOrders.map((po) => (
                <li key={po._id} className="py-2">
                  <div className="flex justify-between items-center">
                    <span>{po.items?.map((i: any) => `${i.itemName} x${i.quantity}`).join(", ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      po.status === "RECEIVED" ? "bg-green-100 text-green-700" :
                      po.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{po.status}</span>
                  </div>
                  <p className="text-muted text-xs mt-1">Rs. {po.totalEstimatedCost} - by {po.requestedByName}</p>
                  <div className="flex gap-2 mt-1">
                    {po.status === "REQUESTED" && (
                      <>
                        <button onClick={() => updatePOStatus(po._id, "APPROVED")} className="text-success text-xs underline">Approve</button>
                        <button onClick={() => updatePOStatus(po._id, "REJECTED")} className="text-danger text-xs underline">Reject</button>
                      </>
                    )}
                    {po.status === "APPROVED" && (
                      <button onClick={() => updatePOStatus(po._id, "ORDERED")} className="text-primary text-xs underline">Mark Ordered</button>
                    )}
                    {po.status === "ORDERED" && (
                      <button onClick={() => updatePOStatus(po._id, "RECEIVED")} className="text-primary text-xs underline">Mark Received (adds to stock)</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
