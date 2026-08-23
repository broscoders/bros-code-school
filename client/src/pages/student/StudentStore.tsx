import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { ShoppingBag } from "lucide-react";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function StudentStore() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const student = useMyStudentRecord();
  const [products, setProducts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const load = async () => {
    const res = await api.get(`/store/store/products?schoolId=${schoolId}`);
    setProducts(res.data);
    if (student?._id) {
      const p = await api.get(`/store/store/my-purchases?studentId=${student._id}`);
      setPurchases(p.data);
    }
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId, student]);

  const isPurchased = (productId: string) => purchases.some((p) => p.productId?._id === productId);

  const buy = async (productId: string) => {
    await api.post("/store/store/purchase", { schoolId, productId, studentId: student._id });
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Academy</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><ShoppingBag size={22} className="text-primary" />Notes Store</h1>
      <p className="text-muted mt-1 text-sm">Browse and access study material from the academy.</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {products.length === 0 && <p className="text-muted text-sm">No material available yet.</p>}
        {products.map((p) => {
          const owned = p.isFree || isPurchased(p._id);
          return (
            <div key={p._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-display font-semibold text-primary-dark">{p.title}</h3>
                <span className="text-xs font-semibold text-accent">{p.isFree ? "Free" : `Rs. ${p.price}`}</span>
              </div>
              <p className="text-xs text-muted mt-1">{p.subjectName} {p.className && `Â· ${p.className}`}</p>
              {owned ? (
                <a href={p.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-xs underline mt-3 inline-block">Open Material</a>
              ) : (
                <button onClick={() => buy(p._id)} className="bg-primary text-white text-xs px-3 py-1.5 rounded-md mt-3 hover:bg-primary-light transition-colors">Get Access</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
