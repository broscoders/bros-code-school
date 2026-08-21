import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import FileUpload from "../../components/FileUpload";

const CATEGORIES = ["STUDENT", "PARENT", "TEACHER", "STAFF", "SCHOOL", "CONTRACT", "CERTIFICATE", "REPORT"];

export default function Documents() {
  const user = useAuthStore((s) => s.user);
  const [docs, setDocs] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "SCHOOL", title: "", fileUrl: "", relatedToId: "", expiryDate: "" });

  const load = async () => {
    const params = filterCategory ? `?category=${filterCategory}` : "";
    const res = await api.get(`/documents${params}`);
    setDocs(res.data);
  };

  const loadExpiring = async () => {
    const res = await api.get("/documents/expiring?days=30");
    setExpiring(res.data);
  };

  useEffect(() => {
    load();
    loadExpiring();
  }, [filterCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) return;
    await api.post("/documents", { ...form, relatedToId: form.relatedToId || undefined, expiryDate: form.expiryDate || undefined, uploadedByName: user?.name });
    setShowForm(false);
    setForm({ category: "SCHOOL", title: "", fileUrl: "", relatedToId: "", expiryDate: "" });
    load();
    loadExpiring();
  };

  const removeDoc = async (id: string) => {
    await api.delete(`/documents/${id}`);
    load();
    loadExpiring();
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">Records</p>
          <h1 className="font-display text-2xl font-bold text-ink mt-1">Documents</h1>
          <p className="text-muted mt-1 text-sm">Central store for all school, staff, and student documents.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          {showForm ? "Cancel" : "+ Upload Document"}
        </button>
      </div>

      {expiring.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mt-4">
          <p className="text-warning text-sm font-medium mb-2">{expiring.length} document(s) expiring within 30 days</p>
          <ul className="text-xs text-ink space-y-1">
            {expiring.map((d) => (
              <li key={d._id}>{d.title} - {new Date(d.expiryDate).toLocaleDateString()} {isExpired(d.expiryDate) && <span className="text-danger font-medium">(expired)</span>}</li>
            ))}
          </ul>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-4 grid grid-cols-2 gap-3">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Document Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm col-span-2" required />
          <input placeholder="Related Person ID (optional)" value={form.relatedToId} onChange={(e) => setForm({ ...form, relatedToId: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
          <input type="date" placeholder="Expiry Date (optional)" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="border border-border rounded-lg px-3 py-2 text-sm" />
          <div className="col-span-2">
            <FileUpload folder="bros-code-school/documents" onUploaded={(url) => setForm({ ...form, fileUrl: url })} label="Attach document" />
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium col-span-2 hover:bg-primary-dark transition-colors">Save Document</button>
        </form>
      )}

      <div className="flex gap-2 mt-6">
        <button onClick={() => setFilterCategory("")} className={`text-xs px-3 py-1.5 rounded-full font-medium ${filterCategory === "" ? "bg-primary text-white" : "bg-canvas text-muted"}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCategory(c)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${filterCategory === c ? "bg-primary text-white" : "bg-canvas text-muted"}`}>{c}</button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Version</th>
              <th className="p-3 font-medium">Uploaded By</th>
              <th className="p-3 font-medium">Expiry</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No documents yet.</td></tr>
            ) : (
              docs.map((d) => (
                <tr key={d._id} className="border-t border-border">
                  <td className="p-3"><a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline">{d.title}</a></td>
                  <td className="p-3 text-muted">{d.category}</td>
                  <td className="p-3 text-muted">v{d.version}</td>
                  <td className="p-3 text-muted">{d.uploadedByName}</td>
                  <td className="p-3">
                    {d.expiryDate ? (
                      <span className={isExpired(d.expiryDate) ? "text-danger" : "text-muted"}>{new Date(d.expiryDate).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button onClick={() => removeDoc(d._id)} className="text-danger text-xs underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
