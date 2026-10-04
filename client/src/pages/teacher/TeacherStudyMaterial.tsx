import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import FileUpload from "../../components/FileUpload";
import { FolderOpen } from "lucide-react";

export default function TeacherStudyMaterial() {
  const teacher = useMyTeacherRecord();
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", chapter: "", fileUrl: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<any[]>([]);

  const assigned: any[] = teacher?.assignedClasses || [];

  // one class -> auto-select it; several -> teacher picks
  useEffect(() => {
    if (assigned.length === 1 && !form.classId) setForm((f) => ({ ...f, classId: assigned[0]._id }));
  }, [teacher]);

  const loadList = (classId: string) =>
    api.get(`/comm/study-material?classId=${classId}`).then((res) => setList(res.data)).catch(() => setList([]));

  useEffect(() => {
    if (form.classId) loadList(form.classId);
    else setList([]);
  }, [form.classId]);

  const classSubjects = (teacher?.subjects || []).filter((s: any) => (s.classId?._id || s.classId) === form.classId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!form.fileUrl) return setMsg({ type: "err", text: "Please attach a file first." });
    setSaving(true);
    try {
      await api.post("/comm/study-material", form);
      setForm({ ...form, subjectId: "", title: "", chapter: "", fileUrl: "" });
      setMsg({ type: "ok", text: "Study material uploaded." });
      loadList(form.classId);
    } catch (err: any) {
      setMsg({ type: "err", text: err?.response?.data?.message || "Upload failed. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this material? Students will no longer see it.")) return;
    try {
      await api.delete(`/comm/study-material/${id}`);
      setMsg(null);
      loadList(form.classId);
    } catch (err: any) {
      setMsg({ type: "err", text: err?.response?.data?.message || "Could not delete." });
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Teaching</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><FolderOpen size={22} className="text-primary" />Study Material</h1>
        <p className="text-muted mt-1 text-sm">Upload notes, PDFs and resources for your classes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {msg && <p className={`${msg.type === "ok" ? "text-success" : "text-danger"} text-sm sm:col-span-2`}>{msg.text}</p>}
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Class</option>
          {assigned.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Subject</option>
          {classSubjects.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm sm:col-span-2" required />
        <input placeholder="Chapter / Topic" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm sm:col-span-2" />
        <FileUpload folder="bros-code-school/study-material" onUploaded={(url) => setForm({ ...form, fileUrl: url })} label="Attach PDF or file" />
        <button disabled={saving} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium sm:col-span-2 hover:bg-primary-light transition-colors disabled:opacity-60">
          {saving ? "Uploading..." : "+ Upload Material"}
        </button>
      </form>

      {form.classId && (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
          <h2 className="font-display font-semibold text-primary-dark mb-3">Uploaded for this class</h2>
          <ul className="text-sm divide-y divide-black/5">
            {list.length === 0 && <li className="py-2 text-muted">Nothing uploaded yet.</li>}
            {list.map((m) => (
              <li key={m._id} className="py-2 flex justify-between gap-3">
                <span>{m.title}{m.chapter ? ` - ${m.chapter}` : ""} <span className="text-muted text-xs">({m.subjectId?.name})</span></span>
                <span className="flex gap-3 shrink-0">
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-xs">Open</a>
                  <button type="button" onClick={() => remove(m._id)} className="text-danger text-xs">Delete</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
