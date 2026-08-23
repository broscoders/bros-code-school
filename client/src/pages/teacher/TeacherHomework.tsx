import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { ClipboardCheck } from "lucide-react";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";

export default function TeacherHomework() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const teacher = useMyTeacherRecord();
  const [sections, setSections] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ classId: "", sectionId: "", subjectId: "", title: "", description: "", dueDate: "" });

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/sections?classId=${form.classId}`).then((res) => setSections(res.data));
      api.get(`/ops/homework?classId=${form.classId}`).then((res) => setList(res.data));
    }
  }, [form.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/ops/homework", { ...form, schoolId, teacherId: teacher._id });
    setForm({ ...form, title: "", description: "", dueDate: "" });
    const res = await api.get(`/ops/homework?classId=${form.classId}`);
    setList(res.data);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Teaching</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><ClipboardCheck size={22} className="text-primary" />Homework</h1>
      <p className="text-muted mt-1 text-sm">Assign homework to your classes.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "" })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Class</option>
          {teacher?.assignedClasses?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required disabled={!form.classId}>
          <option value="">Select Section</option>
          {sections.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required>
          <option value="">Select Subject</option>
          {teacher?.subjects?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" rows={2} />
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Assign Homework</button>
      </form>

      <div className="space-y-3 mt-6">
        {list.length === 0 && <p className="text-muted text-sm">Select a class to see homework.</p>}
        {list.map((h) => (
          <div key={h._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-display font-semibold text-primary-dark">{h.title}</h3>
              <span className="text-xs text-muted">Due {new Date(h.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted mt-1">{h.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
