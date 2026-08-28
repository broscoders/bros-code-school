import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Boxes } from "lucide-react";
import FileUpload from "../../components/FileUpload";

export default function Academy() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [programForm, setProgramForm] = useState({ name: "", description: "" });
  const [batchForm, setBatchForm] = useState({ programId: "", name: "", days: "", startTime: "", endTime: "", teacherId: "" });
  const [productForm, setProductForm] = useState({ title: "", description: "", subjectName: "", className: "", price: "0", isFree: false, fileUrl: "" });

  const loadPrograms = async () => {
    const res = await api.get(`/academy/programs?schoolId=${schoolId}`);
    setPrograms(res.data);
  };

  const loadProducts = async () => {
    const res = await api.get(`/store/store/products?schoolId=${schoolId}`);
    setProducts(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      loadPrograms();
      loadProducts();
      api.get(`/people/teachers?schoolId=${schoolId}`).then((res) => setTeachers(res.data));
    }
  }, [schoolId]);

  useEffect(() => {
    if (batchForm.programId) {
      api.get(`/academy/batches?programId=${batchForm.programId}`).then((res) => setBatches(res.data));
    } else {
      setBatches([]);
    }
  }, [batchForm.programId]);

  const addProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/academy/programs", { ...programForm, schoolId });
    setProgramForm({ name: "", description: "" });
    loadPrograms();
  };

  const addBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/academy/batches", { ...batchForm, schoolId, days: batchForm.days.split(",").map((d) => d.trim()) });
    setBatchForm({ ...batchForm, name: "", days: "", startTime: "", endTime: "", teacherId: "" });
    const res = await api.get(`/academy/batches?programId=${batchForm.programId}`);
    setBatches(res.data);
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.fileUrl) return;
    await api.post("/store/store/products", { ...productForm, schoolId, price: Number(productForm.price) });
    setProductForm({ title: "", description: "", subjectName: "", className: "", price: "0", isFree: false, fileUrl: "" });
    loadProducts();
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Academy</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Boxes size={22} className="text-primary" />Academy Management</h1>
        <p className="text-muted mt-1 text-sm">Configure academy programs, batches and notes store.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Academy Programs</h2>
          <form onSubmit={addProgram} className="space-y-2 mb-4">
            <input placeholder="Program Name (e.g. MDCAT Preparation)" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Description" value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Program</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {programs.length === 0 && <li className="py-2 text-muted">No programs yet.</li>}
            {programs.map((p) => <li key={p._id} className="py-2">{p.name}</li>)}
          </ul>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Academy Batches</h2>
          <form onSubmit={addBatch} className="space-y-2 mb-4">
            <select value={batchForm.programId} onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Program</option>
              {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <input placeholder="Batch Name" value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <input placeholder="Days (comma separated)" value={batchForm.days} onChange={(e) => setBatchForm({ ...batchForm, days: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            <div className="flex gap-2">
              <input placeholder="Start" value={batchForm.startTime} onChange={(e) => setBatchForm({ ...batchForm, startTime: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
              <input placeholder="End" value={batchForm.endTime} onChange={(e) => setBatchForm({ ...batchForm, endTime: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required />
            </div>
            <select value={batchForm.teacherId} onChange={(e) => setBatchForm({ ...batchForm, teacherId: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 text-sm" required>
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.userId?.name}</option>)}
            </select>
            <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium w-full hover:bg-primary-light transition-colors">+ Add Batch</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {batches.length === 0 && <li className="py-2 text-muted">Select a program to see batches.</li>}
            {batches.map((b) => (
              <li key={b._id} className="py-2 flex justify-between">
                <span>{b.name}</span>
                <span className="text-muted text-xs">{b.days?.join(", ")} - {b.startTime}-{b.endTime}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6">
        <h2 className="font-display font-semibold text-primary-dark mb-3">Digital Notes Store</h2>
        <form onSubmit={addProduct} className="grid grid-cols-2 gap-3 mb-4">
          <input placeholder="Title" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required />
          <input placeholder="Subject" value={productForm.subjectName} onChange={(e) => setProductForm({ ...productForm, subjectName: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
          <input placeholder="Class" value={productForm.className} onChange={(e) => setProductForm({ ...productForm, className: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
          <input type="number" placeholder="Price (0 for free)" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={productForm.isFree} onChange={(e) => setProductForm({ ...productForm, isFree: e.target.checked })} />
            Free material
          </label>
          <FileUpload folder="bros-code-school/notes-store" onUploaded={(url) => setProductForm({ ...productForm, fileUrl: url })} label="Attach notes/PDF" />
          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Add to Store</button>
        </form>
        <ul className="text-sm divide-y divide-black/5">
          {products.length === 0 && <li className="py-2 text-muted">No items in store yet.</li>}
          {products.map((p) => (
            <li key={p._id} className="py-2 flex justify-between">
              <span>{p.title}</span>
              <span className="text-muted text-xs">{p.isFree ? "Free" : `Rs. ${p.price}`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
